"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { hasActiveProSubscription } from "@/lib/subscription-utils";
import { isUserAdmin } from "@/lib/supabase-admin";

/** In-Page Push (nap5k) – injects script only for guest/free users; no ads for Pro/Lifetime/Admin */
export function InPagePushScript() {
  const { user, isInitialLoading } = useAuth();

  const isProUser = user
    ? hasActiveProSubscription(
        user.subscription_tier as "free" | "pro" | "lifetime",
        user.subscription_expires_at,
        isUserAdmin(user)
      )
    : false;

  useEffect(() => {
    if (typeof document === "undefined" || isInitialLoading || isProUser) return;
    const existing = document.querySelector('script[src="https://nap5k.com/tag.min.js"]');
    if (existing) return;
    const script = document.createElement("script");
    script.dataset.zone = "10637976";
    script.src = "https://nap5k.com/tag.min.js";
    script.async = true;
    (document.head || document.body).appendChild(script);
  }, [isInitialLoading, isProUser]);
  return null;
}
