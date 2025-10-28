
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

const INACTIVITY_TIMEOUT_HOURS = 12;

async function updateUserWithProfile(
  sessionUser: SupabaseUser | null
): Promise<User | null> {
  if (!sessionUser) return null;

  // First, update the last_sign_in_at timestamp.
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ last_sign_in_at: new Date().toISOString() })
    .eq('id', sessionUser.id);
  
  if (updateError) {
      console.error("Error updating last_sign_in_at on profile fetch:", updateError.message);
      // Continue even if this fails, but the profile data will be fresh
  }

  // Then, fetch the complete profile data.
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", sessionUser.id)
    .single();

  if (error) {
    console.error("Error fetching profile after sign-in update:", error.message);
    // Return the session user and a potentially stale profile from before the update
    return { ...sessionUser, ...profile };
  }
  
  return { ...sessionUser, ...profile };
}


export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { showLoader } = useLoading();

  const logout = useCallback(async (options: LogoutOptions = {}) => {
    const { reason = 'user_initiated', redirectPath = '/' } = options;

    showLoader(async () => {
        await supabase.auth.signOut();
        setUser(null);

        let title = "Logged Out";
        let description = "You have been successfully logged out.";

        if (reason === 'inactive') {
            title = "Session Expired";
            description = `You have been logged out due to ${INACTIVITY_TIMEOUT_HOURS} hours of inactivity.`;
        }

        toast({ title, description });
        router.replace(redirectPath);
        router.refresh();
    });
  }, [showLoader, router, toast]);

  const refreshUser = useCallback(async () => {
    const { data: { user: sessionUser } } = await supabase.auth.getUser();
    if (sessionUser) {
      // When manually refreshing, we are just fetching the latest state, not necessarily "signing in"
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

  useEffect(() => {
    let isMounted = true;

    async function getInitialSession() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (isMounted) {
        if (session?.user) {
          // On initial load, just get the profile without forcing a timestamp update
          const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
          const fullUser = { ...session.user, ...profile };

          if (fullUser?.last_sign_in_at) {
              const lastSeen = new Date(fullUser.last_sign_in_at);
              const now = new Date();
              const hoursSinceLastSeen = (now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60);

              if (hoursSinceLastSeen > INACTIVITY_TIMEOUT_HOURS) {
                  logout({ reason: 'inactive' });
                  setIsInitialLoading(false);
                  return; // Don't set user, logout will handle it
              }
          }
          setUser(fullUser as User);
        }
        setIsInitialLoading(false);
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event: AuthChangeEvent, session: Session | null) => {
          if (!isMounted) return;

          if (event === "SIGNED_IN") {
            const fullUser = await updateUserWithProfile(session?.user ?? null);
            setUser(fullUser);
            closeAuthDialog();
            router.refresh();
          } else if (event === "SIGNED_OUT") {
            setUser(null);
          } else if (event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
            if(session?.user) {
               // On background refresh, just get latest data without forcing timestamp update
               const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
               if (!error) {
                  setUser({ ...session.user, ...profile });
               }
            }
          }
        }
      );

      return () => {
        isMounted = false;
        subscription.unsubscribe();
      };
    }

    getInitialSession();

  }, [router, logout]);

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
