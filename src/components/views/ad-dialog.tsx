
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Loader from "../ui/loader";
import { useAd } from "@/context/ad-context";

export function AdDialog() {
  const { ad, closeAdDialog } = useAd();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (ad.isOpen) {
      setCountdown(5); // Reset countdown when dialog opens
      const timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [ad.isOpen]);

  return (
    <Dialog open={ad.isOpen} onOpenChange={(open) => !open && closeAdDialog()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <div className="aspect-video bg-muted flex items-center justify-center">
            {/* Placeholder for a video ad */}
            <div className="text-center text-muted-foreground">
                <Loader className="w-12 h-12 mb-4" />
                <p>Advertisement Placeholder</p>
            </div>
        </div>
        <div className="absolute top-2 right-2">
            <Button
                variant="secondary"
                size="sm"
                onClick={closeAdDialog}
                disabled={countdown > 0}
            >
                {countdown > 0 ? `Skip in ${countdown}` : "Skip Ad"}
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
