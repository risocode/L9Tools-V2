
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
import { useLoading } from "./loading-context";

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
    // Return the session user even if profile fetch fails
    return sessionUser as User;
  }
  
  return { ...sessionUser, ...profile };
}


export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { showLoader } = useLoading();

  const logout = useCallback(async (options: LogoutOptions = {}) => {
    const { reason = 'user_initiated', redirectPath = '/' } = options;

    showLoader(async () => {
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
    });
  }, [showLoader, router, toast, channel]);

  const refreshUser = useCallback(async () => {
    const { data: { user: sessionUser } } = await supabase.auth.getUser();
    if (sessionUser) {
      const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', sessionUser.id).single();
      if (error) {
        console.error("Error fetching profile on manual refresh:", error.message);
        setUser(sessionUser as User);
      } else {
        setUser({ ...sessionUser, ...profile });
      }
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
          
            if (session?.user && (!user || session.user.id !== user.id)) {
                 const fullUser = await updateUserWithProfile(session.user);
                 if (fullUser) {
                    setUser(fullUser);
                    setupPresence(fullUser);
                    if (event === "SIGNED_IN") closeAuthDialog();
                 }
            } else if (!session?.user) {
                if (channel) {
                    supabase.removeChannel(channel);
                    setChannel(null);
                }
                setUser(null);
            }
            setIsInitialLoading(false);
        }
    );

    return () => {
      if (channel) {
          supabase.removeChannel(channel);
      }
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);


  const openAuthDialog = () => setIsAuthDialogOpen(true);
  const closeAuthDialog = () => setIsAuthDialogOpen(false);

  const login = async () => {
    showLoader(() => {}); 
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
