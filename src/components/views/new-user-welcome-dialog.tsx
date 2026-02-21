"use client";

import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { Star, CheckCircle, X, Crown, Clock, MapPin, Send } from "lucide-react";

const proBenefits = [
  "Save your boss timers across all devices",
  "Send unlimited boss reports to Discord",
  "Completely Ad-Free experience",
  "Access to future Pro features and priority support"
];

const websiteFeatures = [
  {
    icon: Clock,
    title: "Boss Hunt",
    description: "Track boss spawn times and never miss a boss again"
  },
  {
    icon: Send,
    title: "Discord Integration",
    description: "Send boss reports directly to your Discord server"
  },
  {
    icon: MapPin,
    title: "Cross-Device Sync",
    description: "Access your timers from anywhere, on any device"
  }
];

interface NewUserWelcomeDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewUserWelcomeDialog({ isOpen, onClose }: NewUserWelcomeDialogProps) {
  const { user } = useAuth();

  // Calculate expiration date
  const expirationDate = user?.subscription_expires_at 
    ? format(new Date(user.subscription_expires_at), 'MMMM d, yyyy')
    : null;

  const displayName = user?.display_name || user?.email?.split('@')[0] || 'Adventurer';

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
          <DialogTitle>Welcome to L9 Tools</DialogTitle>
          <DialogDescription>
            Welcome message for new users with Pro trial information and website features.
          </DialogDescription>
        </DialogHeader>
        <div className="bg-gradient-to-br from-purple-950 via-slate-900 to-black flex flex-col items-center justify-center p-6 text-center text-white relative max-h-[90vh] overflow-y-auto">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-2 right-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full h-8 w-8 z-10"
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Star icon with pulse animation */}
          <Star 
            className="h-16 w-16 text-yellow-400 animate-pulse" 
            style={{ filter: 'drop-shadow(0 0 10px #facc15)'}} 
          />
          
          {/* Welcome message */}
          <h2 className="font-cinzel text-3xl font-bold mt-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600">
            Welcome to L9 Tools, {displayName}!
          </h2>

          {/* Pro Trial Badge */}
          <div className="mt-4 px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-yellow-400/20 border border-yellow-400/50 rounded-full flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-400" />
            <span className="text-yellow-300 font-semibold text-sm">
              3-Day Pro Trial Active
            </span>
          </div>

          {expirationDate && (
            <p className="text-xs text-slate-400 mt-2">
              Expires on {expirationDate}
            </p>
          )}

          {/* Pro Benefits Section */}
          <div className="mt-6 w-full">
            <h3 className="text-lg font-semibold text-yellow-300 mb-3">
              Your Pro Benefits
            </h3>
            <ul className="space-y-2 text-sm text-slate-300 text-left max-w-xs mx-auto">
              {proBenefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Website Features Section */}
          <div className="mt-6 w-full">
            <h3 className="text-lg font-semibold text-slate-200 mb-3">
              Explore the Features
            </h3>
            <div className="space-y-3 text-left max-w-xs mx-auto">
              {websiteFeatures.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <div key={index} className="flex items-start gap-3 p-2 rounded-lg bg-white/5">
                    <IconComponent className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-slate-200 text-sm">{feature.title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CTA Button */}
          <Button
            onClick={onClose}
            className="mt-6 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-8"
            size="lg"
          >
            Start Exploring
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}