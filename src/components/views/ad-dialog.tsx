
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAd } from "@/context/ad-context";
import { useAuth } from "@/context/auth-context";
import { isUserAdmin } from "@/lib/supabase-admin";
import { hasActiveProSubscription } from "@/lib/subscription-utils";
import { useLoading } from "@/context/loading-context";
import { useRouter } from "next/navigation";

/** Ad zone URL - shows when free/guest users use Timer, Map, or Reset on Boss Hunt */
const AD_ZONE_URL = "https://omg10.com/4/10637732";

export function AdDialog() {
  const { ad, closeAdDialog } = useAd();
  const { user } = useAuth();
  const [countdown, setCountdown] = useState(3);
  const { showLoader } = useLoading();
  const router = useRouter();

  // Check if user is admin, pro, or lifetime - don't show dialog for these users
  const isProUser = user ? hasActiveProSubscription(
    user.subscription_tier as any,
    user.subscription_expires_at,
    isUserAdmin(user)
  ) : false;

  // Close dialog if it opens for pro/admin/lifetime users
  useEffect(() => {
    if (ad.isOpen && isProUser) {
      closeAdDialog();
    }
  }, [ad.isOpen, isProUser, closeAdDialog]);

  useEffect(() => {
    if (ad.isOpen && !isProUser) {
      setCountdown(3); // Reset countdown when dialog opens
      const timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [ad.isOpen, isProUser]);

  const handleUpgradeClick = () => {
    closeAdDialog();
    showLoader(() => router.push('/subscribe'));
  };

  // Don't render dialog for pro/admin/lifetime users
  if (isProUser) {
    return null;
  }

  return (
    <Dialog open={ad.isOpen && !isProUser} onOpenChange={(open) => !open && countdown === 0 && closeAdDialog()}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-primary/50" hideCloseButton>
        <DialogHeader className="sr-only">
          <DialogTitle>Upgrade to Pro</DialogTitle>
          <DialogDescription>
            An advertisement for the Pro subscription. Unlock unlimited reports, an ad-free experience, and more.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col min-h-[320px]">
          <div className="flex-1 min-h-[280px] w-full bg-black/80">
            <iframe
              src={AD_ZONE_URL}
              title="Advertisement"
              className="w-full h-full min-h-[280px] border-0"
              sandbox="allow-scripts allow-same-origin allow-popups"
            />
          </div>
          <div className="bg-gradient-to-br from-purple-950 via-slate-900 to-black flex flex-col items-center justify-center p-4 text-center text-white border-t border-white/10">
            <h3 className="font-cinzel text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600">
              Upgrade to Pro for an ad-free experience
            </h3>
            <Button
              onClick={handleUpgradeClick}
              className="mt-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm"
            >
              View Plans
            </Button>
          </div>
        </div>
        <div className="absolute top-2 right-2">
            <Button
                variant="secondary"
                size="sm"
                onClick={closeAdDialog}
                disabled={countdown > 0}
                className="bg-black/50 hover:bg-black/80"
            >
                {countdown > 0 ? `Skip in ${countdown}` : "Skip"}
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
