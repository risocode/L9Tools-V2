
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

interface AuthContextState {
  user: User | null;
  isInitialLoading: boolean;
  isAuthDialogOpen: boolean;
  openAuthDialog: () => void;
  closeAuthDialog: () => void;
  login: () => Promise<void>;
  logout: () => Promise<void>;
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
  const { toast } = useToast();
  const router = useRouter();
  const { showLoader } = useLoading();

  useEffect(() => {
    let isMounted = true;

    async function getInitialSession() {
      // First, get the session on component mount
      const {
        data: { session },
      } = await supabase.auth.getSession();
      
      if (isMounted) {
        if (session) {
          const fullUser = await updateUserWithProfile(session.user);
          setUser(fullUser);
        }
        setIsInitialLoading(false);
      }

      // Then, subscribe to auth state changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(
        async (event: AuthChangeEvent, session: Session | null) => {
          if (!isMounted) return;

          const fullUser = await updateUserWithProfile(session?.user ?? null);
          setUser(fullUser);

          // On sign in, refresh router to refetch server components with new auth state
          if (event === "SIGNED_IN") {
            closeAuthDialog();
            router.refresh();
          }
        }
      );

      return () => {
        isMounted = false;
        subscription.unsubscribe();
      };
    }

    getInitialSession();

  }, [router]);

  const openAuthDialog = () => setIsAuthDialogOpen(true);
  const closeAuthDialog = () => setIsAuthDialogOpen(false);

  const login = async () => {
    // Show loader immediately, but don't wait as this action causes a page redirect.
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

  const logout = useCallback(async () => {
    showLoader(async () => {
        await supabase.auth.signOut();
        setUser(null);
        toast({
            title: "Logged Out",
            description: "You have been successfully logged out.",
        });
        // Use replace to avoid back button issues, then refresh for clean state.
        router.replace("/");
        router.refresh();
    });
  }, [showLoader, router, toast]);

  const value: AuthContextState = {
    user,
    isInitialLoading,
    isAuthDialogOpen,
    openAuthDialog,
    closeAuthDialog,
    login,
    logout,
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
