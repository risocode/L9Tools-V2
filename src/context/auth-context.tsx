"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
  useCallback,
} from "react";
import { supabase } from "@/lib/supabase-client";
import { useToast } from "@/hooks/use-toast";
import type { User as SupabaseUser, AuthChangeEvent, Session } from "@supabase/supabase-js";
import type { Profile } from "@/types";
import { signInWithGoogle } from "@/app/actions/auth";
import { useRouter } from "next/navigation";
import PageLoader from "@/components/ui/page-loader";
import { usePresence } from "@/hooks/use-presence";

// Combined User type: Supabase user + Profile
export type User = Omit<SupabaseUser, 'last_sign_in_at' | 'updated_at' | 'created_at' | 'email'> &
  Profile & {
    email: string;
  };

interface AuthContextState {
  user: User | null;
  isInitialLoading: boolean;
  isAuthDialogOpen: boolean;
  openAuthDialog: () => void;
  closeAuthDialog: () => void;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextState | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// localStorage key for storing profile data
const PROFILE_STORAGE_KEY = 'l9_user_profile';
const PROFILE_STORAGE_TIMESTAMP_KEY = 'l9_user_profile_timestamp';

// Profile fetch cache - in-memory cache for current session (faster than localStorage)
const profileFetchCache = new Map<string, { user: User; timestamp: number }>();

// Track in-flight profile fetches to prevent duplicate simultaneous requests
const inFlightFetches = new Map<string, Promise<User | null>>();

/**
 * Creates a minimal user object from Supabase user metadata.
 * Only used as last resort fallback when profile fetch fails.
 */
function createMinimalUser(sessionUser: SupabaseUser): User {
  return {
    ...sessionUser,
    id: sessionUser.id ?? "",
    email: sessionUser.email ?? "",
    created_at: sessionUser.created_at ?? new Date().toISOString(),
    last_sign_in_at: null,
    updated_at: null,
    custom_logo_url: null,
    discord_webhook_url: null,
    display_name: sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || null,
    is_admin: false,
    notifications_enabled: true,
    online_status: null,
    short_id: null,
    subscription_expires_at: null,
    subscription_tier: "free",
    user_photo_url: sessionUser.user_metadata?.avatar_url || sessionUser.user_metadata?.picture || null,
    username: null,
  } as User;
}

/**
 * Stores profile data in localStorage with timestamp.
 * This allows profile to persist across page reloads without fetching again.
 */
function storeProfileInLocalStorage(user: User): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem(PROFILE_STORAGE_TIMESTAMP_KEY, Date.now().toString());
    }
  } catch (error) {
    // Silently fail - localStorage might be disabled or full
  }
}

/**
 * Reads profile data from localStorage.
 * Returns null if not found or if data is invalid.
 */
function readProfileFromLocalStorage(userId: string): User | null {
  try {
    if (typeof window === 'undefined') {
      return null;
    }

    const storedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
    const storedTimestamp = localStorage.getItem(PROFILE_STORAGE_TIMESTAMP_KEY);

    if (!storedProfile || !storedTimestamp) {
      return null;
    }

    const profile: User = JSON.parse(storedProfile);
    
    // Verify the stored profile belongs to the current user
    if (profile.id !== userId) {
      clearProfileFromLocalStorage();
      return null;
    }

    return profile;
  } catch (error) {
    clearProfileFromLocalStorage();
    return null;
  }
}

/**
 * Clears profile data from localStorage.
 */
function clearProfileFromLocalStorage(): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(PROFILE_STORAGE_KEY);
      localStorage.removeItem(PROFILE_STORAGE_TIMESTAMP_KEY);
    }
  } catch (error) {
    // Silently fail - localStorage might be disabled
  }
}

/**
 * Clears both in-memory cache and localStorage for a specific user.
 */
export function clearProfileCache(userId: string) {
  profileFetchCache.delete(userId);
  inFlightFetches.delete(userId);
  clearProfileFromLocalStorage();
}

/**
 * Fetches profile data for a Supabase user and merges with Google account data.
 * 
 * SIMPLIFIED: Single fetch with basic timeout, no complex Promise.race logic.
 * - Returns only full profile or null, NEVER minimal users
 * - Checks in-flight fetches to prevent duplicates
 * - Prioritizes Google account data (display_name, user_photo_url) over profile data
 * 
 * @param sessionUser The Supabase user object
 * @param forceRefresh If true, bypass cache and in-flight checks
 * @returns Full merged User object or null if fetch fails
 */
async function updateUserWithProfile(
  sessionUser: SupabaseUser | null,
  forceRefresh: boolean = false
): Promise<User | null> {
  if (!sessionUser) {
    return null;
  }

  // Check in-memory cache first (unless forcing refresh)
  if (!forceRefresh) {
    const cached = profileFetchCache.get(sessionUser.id);
    if (cached?.user) {
      return cached.user;
    }

    // Check for in-flight fetch to prevent duplicates
    const existingFetch = inFlightFetches.get(sessionUser.id);
    if (existingFetch) {
      return existingFetch;
    }
  } else {
    // Force refresh: clear any in-flight fetches
    inFlightFetches.delete(sessionUser.id);
  }

  // Create fetch promise with basic timeout (3 seconds)
  const fetchPromise = (async (): Promise<User | null> => {
    const SAFETY_TIMEOUT_MS = 3000; // 3 seconds safety timeout
    
    try {
      // Create timeout promise
      const timeoutPromise = new Promise<User | null>((resolve) => {
        setTimeout(() => {
          resolve(null);
        }, SAFETY_TIMEOUT_MS);
      });

      // Execute query with timeout
      const queryPromise = (async () => {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", sessionUser.id)
          .maybeSingle();

        if (error) {
          return null;
        }

        if (!profile) {
          return null;
        }

        // Merge Supabase user with profile, prioritizing Google account data
        const googleDisplayName = sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name;
        const googlePhotoUrl = sessionUser.user_metadata?.avatar_url || sessionUser.user_metadata?.picture;

        // Validate subscription and auto-downgrade if expired
        const { getEffectiveSubscriptionTier } = await import('@/lib/subscription-utils');
        const effectiveTier = getEffectiveSubscriptionTier(
          profile.subscription_tier as any,
          profile.subscription_expires_at,
          profile.is_admin
        );

        const mergedUser: User = {
          ...sessionUser,
          ...profile,
          id: sessionUser.id,
          email: sessionUser.email ?? profile.email ?? "",
          // Prioritize Google account data over profile data
          display_name: googleDisplayName || profile.display_name || null,
          user_photo_url: googlePhotoUrl || profile.user_photo_url || null,
          created_at: profile.created_at ?? sessionUser.created_at,
          last_sign_in_at: profile.last_sign_in_at ?? null,
          updated_at: profile.updated_at ?? null,
          // Use effective tier (handles expired subscriptions)
          subscription_tier: effectiveTier,
        };

        // Cache in memory for current session
        profileFetchCache.set(sessionUser.id, { user: mergedUser, timestamp: Date.now() });
        
        return mergedUser;
      })();

      // Race query against timeout
      const result = await Promise.race([
        queryPromise as Promise<User | null>,
        timeoutPromise
      ]);
      return result;
    } catch (err: any) {
      return null;
    }
  })();

  // Track in-flight fetch
  if (!forceRefresh) {
    inFlightFetches.set(sessionUser.id, fetchPromise);
    fetchPromise.finally(() => {
      inFlightFetches.delete(sessionUser.id);
    });
  }

  return fetchPromise;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const mountedRef = useRef(true);

  // Initialize presence tracking for authenticated users
  usePresence({
    userId: user?.id || null,
    displayName: user?.display_name || null,
    enabled: !!user && !isInitialLoading,
  });

  const refreshUser = useCallback(async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      return;
    }

    if (!data.user) {
      setUser(null);
      clearProfileFromLocalStorage();
      return;
    }

    // Check for in-flight fetch first
    const existingFetch = inFlightFetches.get(data.user.id);
    if (existingFetch) {
      const fullUser = await existingFetch;
      if (fullUser) {
        setUser(fullUser);
        storeProfileInLocalStorage(fullUser);
      }
      return;
    }

    // Clear all caches and force fresh fetch
    clearProfileCache(data.user.id);
    const fullUser = await updateUserWithProfile(data.user, true);
    
    if (fullUser) {
      setUser(fullUser);
      storeProfileInLocalStorage(fullUser);
    } else {
      // Fetch failed/timeout - preserve existing user if it has privileges
      // Don't overwrite admin/pro/lifetime status on refresh failure
      setUser((currentUser) => {
        if (currentUser && (
          currentUser.is_admin || 
          currentUser.subscription_tier === 'pro' || 
          currentUser.subscription_tier === 'lifetime'
        )) {
          return currentUser; // Preserve privileged user
        }
        // If no privileged user exists, current state remains (don't force minimal user)
        return currentUser;
      });
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    clearProfileFromLocalStorage();
    router.refresh();
  }, [router]);

  const login = useCallback(async () => {
    try {
      await signInWithGoogle();
      // signInWithGoogle redirects, so this won't execute normally
    } catch (error: any) {
      // Handle redirect errors (expected) vs actual errors
      if (error?.digest?.includes('NEXT_REDIRECT')) {
        throw error; // Re-throw redirect errors
      }
      toast({
        variant: "destructive",
        title: "Sign In Failed",
        description: error.message || "Could not start sign-in process",
      });
      throw error;
    }
  }, [toast]);

  useEffect(() => {
    mountedRef.current = true;

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (!mountedRef.current) {
        return;
      }

      // Handle INITIAL_SESSION - trust localStorage/cache, only fetch if missing
      // Profile is only fetched fresh on SIGNED_IN (new login)
      // This prevents unnecessary network requests on every page reload
      if (event === 'INITIAL_SESSION') {
        if (session?.user) {
          // Try localStorage first (fastest, no network call)
          const storedProfile = readProfileFromLocalStorage(session.user.id);
          
          if (storedProfile) {
            // Use stored profile - trust it, no background fetch
            setUser(storedProfile);
            profileFetchCache.set(session.user.id, { user: storedProfile, timestamp: Date.now() });
            setIsInitialLoading(false);
            return;
          }
          
          // No stored profile - check in-memory cache
          const cached = profileFetchCache.get(session.user.id);
          if (cached?.user) {
            // Use cached profile and store in localStorage for next time
            setUser(cached.user);
            storeProfileInLocalStorage(cached.user);
            setIsInitialLoading(false);
            return;
          }
          
          // No cache at all - immediately unblock UI with minimal user, fetch profile in background
          const minimalUser = createMinimalUser(session.user);
          setUser(minimalUser);
          setIsInitialLoading(false);
          
          // Fetch profile in background (non-blocking)
          updateUserWithProfile(session.user, false).then((fullUser) => {
            if (!mountedRef.current) {
              return;
            }
            
            if (fullUser) {
              storeProfileInLocalStorage(fullUser);
              setUser(fullUser);
              profileFetchCache.set(session.user.id, { user: fullUser, timestamp: Date.now() });
            }
            // If fetch fails/timeout, keep minimal user (already set)
          });
        } else {
          // No session = not authenticated
          setIsInitialLoading(false);
          setUser(null);
        }
        return;
      }

      // Handle SIGNED_IN event - fetch fresh profile from database (new login)
      // This is the ONLY time we fetch profiles - stores in localStorage for future reloads
      if (event === 'SIGNED_IN' && session?.user) {
        // Clear all caches to ensure fresh fetch
        clearProfileCache(session.user.id);
        
        // Update last_sign_in_at as backup (in case callback update failed)
        try {
          const { updateLastSignIn } = await import('@/app/actions/update-last-sign-in');
          await updateLastSignIn(session.user.id);
          // Silent fail - don't block authentication if this fails
        } catch (err) {
          // Silent fail - trigger or callback will handle it
        }
        
        try {
          const fullUser = await updateUserWithProfile(session.user, true);
          
          if (!mountedRef.current) {
            setIsInitialLoading(false);
            return;
          }
          
          if (fullUser) {
            // Full profile successfully fetched - store in localStorage and commit to state
            storeProfileInLocalStorage(fullUser);
            setUser(fullUser);
            setIsInitialLoading(false);
            setIsAuthDialogOpen(false);
          } else {
            // Profile fetch failed - for SIGNED_IN, minimal user is acceptable since it's a new sign-in
            // But we should still try to preserve any existing user state if available
            setUser((currentUser) => {
              // Preserve existing user if it has privileges (shouldn't happen on SIGNED_IN, but safety check)
              if (currentUser && (
                currentUser.is_admin || 
                currentUser.subscription_tier === 'pro' || 
                currentUser.subscription_tier === 'lifetime'
              )) {
                return currentUser;
              }
              return createMinimalUser(session.user);
            });
            setIsInitialLoading(false);
            setIsAuthDialogOpen(false);
            // NOTE: Minimal user is NOT stored in localStorage - will be replaced on next successful fetch
          }
        } catch (err: any) {
          // Unexpected error - preserve existing user if it has privileges
          if (mountedRef.current && session.user) {
            setUser((currentUser) => {
              // Preserve existing privileged user on unexpected errors
              if (currentUser && (
                currentUser.is_admin || 
                currentUser.subscription_tier === 'pro' || 
                currentUser.subscription_tier === 'lifetime'
              )) {
                return currentUser;
              }
              return createMinimalUser(session.user);
            });
            setIsInitialLoading(false);
            setIsAuthDialogOpen(false);
          } else {
            setIsInitialLoading(false);
          }
        }
        return;
      }

      // Handle SIGNED_OUT event
      if (event === 'SIGNED_OUT') {
        clearProfileCache(session?.user?.id || '');
        setIsInitialLoading(false);
        setUser(null);
        return;
      }

      // Handle TOKEN_REFRESHED
      if (event === 'TOKEN_REFRESHED') {
        // Token refresh doesn't change profile data, keep existing state
        return;
      }

      // Handle other events (USER_UPDATED, PASSWORD_RECOVERY, etc.)
      // Don't modify user state - just ensure loading is false
      if (!session?.user) {
        setIsInitialLoading(false);
        setUser(null);
      } else {
        // Session exists but event is unhandled - preserve current user state
        // Don't reset user on unknown events as this could cause privilege loss
        setIsInitialLoading(false);
        // Optionally: fetch fresh profile in background for unknown events, but don't reset user
        // This is a safety measure to prevent privilege loss on unexpected events
      }
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
    // Note: We intentionally exclude 'user' from dependencies to avoid re-running the effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, toast]);

  const value: AuthContextState = {
    user,
    isInitialLoading,
    isAuthDialogOpen,
    openAuthDialog: () => setIsAuthDialogOpen(true),
    closeAuthDialog: () => setIsAuthDialogOpen(false),
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
