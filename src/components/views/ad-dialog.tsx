
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
import { Star, CheckCircle } from "lucide-react";

/** quge5 ad zone - loads via tag.min.js in layout, can render into #quge5-ad-container */
const QUGE5_ZONE_ID = "213198";

/** omg10 ad zones - shown when free/guest users use Timer, Map, or Reset */
const AD_ZONE_URLS = [
  "https://omg10.com/4/10637732",
  "https://omg10.com/4/10637737",
];

const PRO_PERKS = [
  "Save your boss timers across all devices",
  "Send unlimited boss reports to Discord",
  "Completely Ad-Free experience",
  "Access to future Pro features and priority support",
];

type AdPhase = "monetag" | "own";

export function AdDialog() {
  const { ad, closeAdDialog } = useAd();
  const { user } = useAuth();
  const [phase, setPhase] = useState<AdPhase>("monetag");
  const [countdown, setCountdown] = useState(3);
  const [continueCountdown, setContinueCountdown] = useState(5);
  const { showLoader } = useLoading();
  const router = useRouter();

  const isProUser = user ? hasActiveProSubscription(
    user.subscription_tier as any,
    user.subscription_expires_at,
    isUserAdmin(user)
  ) : false;

  useEffect(() => {
    if (ad.isOpen && isProUser) {
      closeAdDialog();
    }
  }, [ad.isOpen, isProUser, closeAdDialog]);

  // When dialog opens: start on Monetag, reset phase and countdowns
  useEffect(() => {
    if (ad.isOpen && !isProUser) {
      setPhase("monetag");
      setContinueCountdown(5);
    }
  }, [ad.isOpen, isProUser]);

  // 5-second countdown on Monetag before Continue/Skip are enabled
  useEffect(() => {
    if (ad.isOpen && !isProUser && phase === "monetag") {
      const timer = setInterval(() => {
        setContinueCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [ad.isOpen, isProUser, phase]);

  // 3-second Skip countdown only on "own ads" phase
  useEffect(() => {
    if (ad.isOpen && !isProUser && phase === "own") {
      setCountdown(3);
      const timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [ad.isOpen, isProUser, phase]);

  const handleContinueFromMonetag = () => {
    setPhase("own");
  };

  const handleUpgradeClick = () => {
    closeAdDialog();
    showLoader(() => router.push("/subscribe"));
  };

  const canClose = (phase === "monetag" && continueCountdown === 0) || (phase === "own" && countdown === 0);

  if (isProUser) {
    return null;
  }

  return (
    <Dialog
      open={ad.isOpen && !isProUser}
      onOpenChange={(open) => !open && canClose && closeAdDialog()}
    >
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-primary/50" hideCloseButton>
        <DialogHeader className="sr-only">
          <DialogTitle>Advertisement</DialogTitle>
          <DialogDescription>
            Ad and upgrade to Pro. Unlock unlimited reports and an ad-free experience.
          </DialogDescription>
        </DialogHeader>

        {phase === "monetag" && (
          <div className="flex flex-col min-h-[320px]">
            <div className="flex-1 min-h-[280px] w-full bg-black/80 flex flex-col gap-1 p-1 overflow-auto">
              <div
                id="quge5-ad-container"
                data-zone={QUGE5_ZONE_ID}
                className="w-full min-h-[140px] rounded overflow-hidden"
              />
              {AD_ZONE_URLS.map((url, i) => (
                <iframe
                  key={i}
                  src={url}
                  title={`Advertisement ${i + 1}`}
                  className="w-full min-h-[200px] flex-1 border-0 rounded"
                  sandbox="allow-scripts allow-same-origin allow-popups"
                />
              ))}
            </div>
            <div className="p-4 border-t border-white/10 bg-slate-900/80 flex justify-center">
              <Button
                onClick={handleContinueFromMonetag}
                disabled={continueCountdown > 0}
                className="bg-primary text-primary-foreground"
              >
                {continueCountdown > 0 ? `Continue in ${continueCountdown}` : "Continue"}
              </Button>
            </div>
            <div className="absolute top-2 right-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={closeAdDialog}
                disabled={continueCountdown > 0}
                className="bg-black/50 hover:bg-black/80"
              >
                {continueCountdown > 0 ? `Skip in ${continueCountdown}` : "Skip"}
              </Button>
            </div>
          </div>
        )}

        {phase === "own" && (
          <>
            <div className="bg-gradient-to-br from-purple-950 via-slate-900 to-black flex flex-col items-center justify-center p-6 text-center text-white">
              <Star className="h-12 w-12 text-yellow-400 animate-pulse" style={{ filter: "drop-shadow(0 0 10px #facc15)" }} />
              <h3 className="font-cinzel text-2xl font-bold mt-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600">
                Upgrade to Pro!
              </h3>
              <ul className="space-y-2 text-sm text-slate-300 mt-4 text-left max-w-xs mx-auto">
                {PRO_PERKS.map((perk, index) => (
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
