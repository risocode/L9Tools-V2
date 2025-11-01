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
  User as SupabaseUser,
  RealtimeChannel,
} from "@supabase/supabase-js";
import type { Profile } from "@/types";
import { signInWithGoogle } from "@/app/actions/auth";
import { useRouter } from "next/navigation";
import PageLoader from "@/components/ui/page-loader";
import { useLoading } from "./loading-context";

// The final User object is a combination of Supabase's User and our Profile table.
export type User = SupabaseUser & Profile;

interface LogoutOptions {
  reason?: "inactive" | "user_initiated";
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

/**
 * Combines Supabase session user and the matching profile row.
 */
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

    // Fallback user if no profile exists
    const fallbackUser: User = {
      ...sessionUser,
      id: sessionUser.id ?? "",
      email: sessionUser.email ?? "",
      created_at: sessionUser.created_at ?? "",
      last_sign_in_at: sessionUser.last_sign_in_at ?? null,
      updated_at: sessionUser.updated_at ?? null,
      custom_logo_url: null,
      discord_webhook_url: null,
      display_name: null,
      is_admin: false,
      notifications_enabled: true,
      online_status: null,
      short_id: null,
      subscription_expires_at: null,
      subscription_tier: "free",
      user_photo_url: null,
      username: null,
    };
    return fallbackUser;
  }

  // Merge Supabase user + profile safely
  const mergedUser: User = {
    ...profile,
    ...sessionUser,
    id: sessionUser.id,
    email: sessionUser.email ?? "",
    created_at: profile.created_at ?? sessionUser.created_at ?? "",
    last_sign_in_at: sessionUser.last_sign_in_at ?? profile.last_sign_in_at ?? null,
    updated_at: sessionUser.updated_at ?? profile.updated_at ?? null,
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
  const { showLoader } = useLoading();

  const logout = useCallback(
    async (options: LogoutOptions = {}) => {
      const { reason = "user_initiated", redirectPath = "/" } = options;

      if (channel) {
        await supabase.removeChannel(channel);
        setChannel(null);
      }

      await supabase.auth.signOut();
      setUser(null);

      const title = reason === "inactive" ? "Session Expired" : "Logged Out";
      const description =
        reason === "inactive"
          ? "You have been logged out due to inactivity."
          : "You have been successfully logged out.";

      toast({ title, description });
      router.replace(redirectPath);
      router.refresh();
    },
    [router, toast, channel]
  );

  const refreshUser = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    const sessionUser = data.user;
    if (sessionUser) {
      const fullUser = await updateUserWithProfile(sessionUser);
      setUser(fullUser);
    } else {
      setUser(null);
    }
  }, []);

  const updatePresence = async (status: "online" | "offline", userId: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({
        online_status: status,
        last_sign_in_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      console.error(`Error updating presence to ${status}:`, error.message);
    }
  };

  useEffect(() => {
    const setupPresence = (currentUser: User) => {
      if (channel) return channel; // Avoid duplicates
      const presenceChannel = supabase.channel(`presence:${currentUser.id}`);

      presenceChannel.on("presence", { event: "sync" }, () => {
        presenceChannel.track({ online_at: new Date().toISOString() });
      });

      presenceChannel.subscribe(async (status) => {
        if (status !== "SUBSCRIBED") return;
        await updatePresence("online", currentUser.id);
        await presenceChannel.track({ online_at: new Date().toISOString() });
      });

      setChannel(presenceChannel);
      return presenceChannel;
    };

    const handleVisibilityChange = () => {
      if (user) {
        updatePresence(
          document.visibilityState === "hidden" ? "offline" : "online",
          user.id
        );
      }
    };

    const beforeUnloadHandler = () => {
      if (user) updatePresence("offline", user.id);
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", beforeUnloadHandler);

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const sessionUser = session?.user ?? null;

        if (isInitialLoading) setIsInitialLoading(false);

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
      listener.subscription.unsubscribe();
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", beforeUnloadHandler);
      if (channel) supabase.removeChannel(channel);
    };
  }, [isInitialLoading, channel, router, user]);

  const openAuthDialog = () => setIsAuthDialogOpen(true);
  const closeAuthDialog = () => setIsAuthDialogOpen(false);

  const login = async () => {
    showLoader(async () => {
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
    });
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
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
