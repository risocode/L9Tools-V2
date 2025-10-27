
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
import { Star } from "lucide-react";
import { useLoading } from "@/context/loading-context";
import { useRouter } from "next/navigation";

export function AdDialog() {
  const { ad, closeAdDialog } = useAd();
  const [countdown, setCountdown] = useState(3);
  const { showLoader } = useLoading();
  const router = useRouter();


  useEffect(() => {
    if (ad.isOpen) {
      setCountdown(3); // Reset countdown when dialog opens
      const timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [ad.isOpen]);

  const handleUpgradeClick = () => {
    closeAdDialog();
    showLoader(() => router.push('/subscribe'));
  };

  return (
    <Dialog open={ad.isOpen} onOpenChange={(open) => !open && countdown === 0 && closeAdDialog()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-primary/50" hideCloseButton>
        <DialogHeader className="sr-only">
          <DialogTitle>Upgrade to Pro</DialogTitle>
          <DialogDescription>
            An advertisement for the Pro subscription. Unlock unlimited reports, an ad-free experience, and more.
          </DialogDescription>
        </DialogHeader>
        <div className="aspect-video bg-gradient-to-br from-purple-950 via-slate-900 to-black flex flex-col items-center justify-center p-6 text-center text-white">
            <Star className="h-12 w-12 text-yellow-400 animate-pulse" style={{ filter: 'drop-shadow(0 0 10px #facc15)'}} />
            <h3 className="font-cinzel text-2xl font-bold mt-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600">
                Upgrade to Pro!
            </h3>
            <p className="mt-2 text-sm text-slate-300">
                Unlock unlimited reports, an ad-free experience, and more.
            </p>
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
