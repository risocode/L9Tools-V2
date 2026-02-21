
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
import { Star, CheckCircle } from "lucide-react";
import { useLoading } from "@/context/loading-context";
import { useRouter } from "next/navigation";

const proPerks = [
    "Save your boss timers across all devices",
    "Send unlimited boss reports to Discord",
    "Completely Ad-Free experience",
    "Access to future Pro features and priority support"
];


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
        <div className="bg-gradient-to-br from-purple-950 via-slate-900 to-black flex flex-col items-center justify-center p-6 text-center text-white">
            <Star className="h-12 w-12 text-yellow-400 animate-pulse" style={{ filter: 'drop-shadow(0 0 10px #facc15)'}} />
            <h3 className="font-cinzel text-2xl font-bold mt-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600">
                Upgrade to Pro!
            </h3>
            <ul className="space-y-2 text-sm text-slate-300 mt-4 text-left max-w-xs mx-auto">
                {proPerks.map((perk, index) => (
                    <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span>{perk}</span>
                    </li>
                ))}
            </ul>
            <Button
                onClick={handleUpgradeClick}
                className="mt-6 bg-yellow-500 hover:bg-yellow-400 text-black font-bold"
            >
                View Plans
            </Button>
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
