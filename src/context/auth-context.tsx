
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

type User = SupabaseUser & Partial<Profile>;

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

  if (error) {
    console.error("Error fetching profile:", error.message);
    return sessionUser as User;
  }
  
  // The profile object's email (string | null) can conflict with SupabaseUser's email (string | undefined).
  // By spreading profile first, we ensure sessionUser's more restrictive type takes precedence, satisfying TypeScript.
  return { 
    ...profile,
    ...sessionUser,
  };
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
      router.refresh(); 
    }
  }, [router]);
  
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
        if (document.visibilityState === 'hidden' && user) {
            updatePresence('offline', user.id);
        } else if (document.visibilityState === 'visible' && user) {
            updatePresence('online', user.id);
        }
    };

    const handleBeforeUnload = () => {
        if (user) {
            updatePresence('offline', user.id);
        }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event: AuthChangeEvent, session: Session | null) => {
            const sessionUser = session?.user ?? null;
            setIsInitialLoading(false);
            
            if (sessionUser) {
              const fullUser = await updateUserWithProfile(sessionUser);
              setUser(fullUser);
              if (!channel && fullUser) {
                  setupPresence(fullUser);
              }
            } else {
              setUser(null);
              if (channel) {
                  supabase.removeChannel(channel);
                  setChannel(null);
              }
            }
            
            if (event === "SIGNED_IN") {
                closeAuthDialog();
            }
        }
    );

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user, channel]);

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
  
  // Render a full-page loader during the initial auth check
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
