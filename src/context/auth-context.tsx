
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { supabase } from "@/lib/supabase-client";
import { useToast } from "@/hooks/use-toast";
import type {
  AuthChangeEvent,
  Session,
  User as SupabaseUser,
  RealtimeChannel,
} from "@supabase/supabase-js";
import type { Profile } from "@/types";
import { signInWithGoogle } from "@/app/actions/auth";
import { useRouter } from "next/navigation";
import PageLoader from "@/components/ui/page-loader";

// The final User object is a combination of Supabase's User and our Profile table.
export type User = SupabaseUser & Profile;

interface LogoutOptions {
  reason?: 'inactive' | 'user_initiated';
  redirectPath?: string;
}

interface AuthContextState {
  user: User | null;
  isInitialLoading: boolean;
  isAuthDialogOpen: boolean;
  openAuthDialog: () => void;
  closeAuthDialog: () => void;
  login: () => Promise<void>;
  logout: (options?: LogoutOptions) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextState | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

async function updateUserWithProfile(
  sessionUser: SupabaseUser | null
): Promise<User | null> {
  if (!sessionUser) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", sessionUser.id)
    .single();

  if (error || !profile) {
    console.error("Error fetching profile or profile not found:", error?.message);
    // Return the session user as a base object if the profile is missing.
    // The DB trigger should have created it, but this is a fallback.
    return sessionUser as User;
  }
  
  // Explicitly construct the User object to satisfy TypeScript's strict checks.
  // This resolves the conflict between `string | null` (from profile) and `string | undefined` (from sessionUser).
  const mergedUser: User = {
    // Start with all properties from the authoritative session user
    ...sessionUser,
    // Add all properties from the profile, which might be null
    ...profile,
    // Re-assert the properties from sessionUser that have conflicting types
    // to ensure the final object matches the `User` type.
    id: sessionUser.id,
    email: sessionUser.email,
    created_at: sessionUser.created_at,
    last_sign_in_at: sessionUser.last_sign_in_at,
    updated_at: sessionUser.updated_at,
  };
  
  return mergedUser;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const logout = useCallback(async (options: LogoutOptions = {}) => {
    const { reason = 'user_initiated', redirectPath = '/' } = options;
    
    if (channel) {
        await supabase.removeChannel(channel);
        setChannel(null);
    }
    await supabase.auth.signOut();
    setUser(null);

    let title = "Logged Out";
    let description = "You have been successfully logged out.";

    if (reason === 'inactive') {
        title = "Session Expired";
        description = `You have been logged out due to inactivity.`;
    }

    toast({ title, description });
    router.replace(redirectPath);
    router.refresh();
  }, [router, toast, channel]);


  const refreshUser = useCallback(async () => {
    const { data: { user: sessionUser } } = await supabase.auth.getUser();
    if (sessionUser) {
      const fullUser = await updateUserWithProfile(sessionUser);
      setUser(fullUser);
    } else {
      setUser(null);
    }
  }, []);
  
  const updatePresence = async (status: 'online' | 'offline', userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ 
            online_status: status,
            last_sign_in_at: new Date().toISOString() 
        })
        .eq('id', userId);
        
      if (error) {
          console.error(`Error updating presence to ${status}:`, error.message);
      }
  };

  useEffect(() => {
    const setupPresence = (currentUser: User) => {
        if (channel) return channel; // Avoid creating duplicate channels
        const presenceChannel = supabase.channel(`presence:${currentUser.id}`);

        presenceChannel.on('presence', { event: 'sync' }, () => {
            presenceChannel.track({ online_at: new Date().toISOString() });
        });

        presenceChannel.subscribe(async (status) => {
            if (status !== 'SUBSCRIBED') {
                return;
            }
            await updatePresence('online', currentUser.id);
            await presenceChannel.track({ online_at: new Date().toISOString() });
        });

        setChannel(presenceChannel);
        return presenceChannel;
    };

    const handleVisibilityChange = () => {
        if (user) {
            updatePresence(document.visibilityState === 'hidden' ? 'offline' : 'online', user.id);
        }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', () => user && updatePresence('offline', user.id));
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const sessionUser = session?.user ?? null;
        
        // This is the crucial fix: End the initial loading state as soon as
        // the first auth check is complete, before any async profile fetching.
        if (isInitialLoading) {
            setIsInitialLoading(false);
        }

        const fullUser = await updateUserWithProfile(sessionUser);
        setUser(fullUser);

        if (event === "SIGNED_IN" && fullUser) {
          closeAuthDialog();
          setupPresence(fullUser);
          router.refresh();
        } else if (event === "SIGNED_OUT") {
          if (channel) {
            supabase.removeChannel(channel);
            setChannel(null);
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', () => user && updatePresence('offline', user.id));
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
    // The dependency array is intentionally kept minimal to only run this setup once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAuthDialog = () => setIsAuthDialogOpen(true);
  const closeAuthDialog = () => setIsAuthDialogOpen(false);

  const login = async () => {
    try {
        await signInWithGoogle();
    } catch (error) {
        console.error("Sign in failed:", error);
        toast({
            variant: "destructive",
            title: "Sign In Failed",
            description: "Could not start the sign-in process.",
        });
    }
  };

  const value: AuthContextState = {
    user,
    isInitialLoading,
    isAuthDialogOpen,
    openAuthDialog,
    closeAuthDialog,
    login,
    logout,
    refreshUser,
  };
  
  if (isInitialLoading) {
    return (
        <div className="page-loader-overlay">
            <PageLoader />
        </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
