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
import { useAuth } from "@/context/auth-context";
import { Star, CheckCircle, X } from "lucide-react";

const trialBenefits = [
  "Save your boss timers across all devices",
  "Send unlimited boss reports to Discord",
  "Completely Ad-Free experience",
  "Access to future Pro features and priority support"
];

interface TrialPromoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSignUp: () => void;
}

export function TrialPromoDialog({ isOpen, onClose, onSignUp }: TrialPromoDialogProps) {
  const handleSignUpClick = () => {
    onClose();
    onSignUp();
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent 
        className="sm:max-w-lg p-0 overflow-hidden border-primary/50 animate-in fade-in-0 zoom-in-95 duration-200"
        hideCloseButton
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Claim Your 3-Day Free Pro Trial</DialogTitle>
          <DialogDescription>
            Sign up now to get Pro features for 3 days completely free.
          </DialogDescription>
        </DialogHeader>
        <div className="bg-gradient-to-br from-purple-950 via-slate-900 to-black flex flex-col items-center justify-center p-6 text-center text-white relative">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-2 right-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Star icon with simple pulse animation */}
          <Star 
            className="h-12 w-12 text-yellow-400 animate-pulse" 
            style={{ filter: 'drop-shadow(0 0 10px #facc15)'}} 
          />
          
          {/* Title */}
          <h3 className="font-cinzel text-2xl font-bold mt-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600">
            Claim Your 3-Day Free Pro Trial!
          </h3>
          
          {/* Subtitle */}
          <p className="text-sm text-slate-300 mt-2 mb-4">
            Sign up now and unlock all Pro features for 3 days - no credit card required
          </p>

          {/* Benefits list */}
          <ul className="space-y-2 text-sm text-slate-300 mt-2 text-left max-w-xs mx-auto">
            {trialBenefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>

          {/* CTA Button */}
          <Button
            onClick={handleSignUpClick}
            className="mt-6 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-8"
            size="lg"
          >
            Sign Up with Google
          </Button>

          {/* Maybe Later link */}
          <button
            onClick={onClose}
            className="mt-3 text-sm text-slate-400 hover:text-slate-300 underline"
          >
            Maybe Later
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
