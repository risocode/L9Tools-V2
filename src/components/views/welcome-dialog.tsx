
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Swords, Clock, MapPin, Send, ArrowRight } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

const tutorialSteps = [
  {
    icon: Clock,
    title: "Set a Timer",
    description: "Click the Clock icon on any boss row to open the time picker. Enter the time the boss was defeated to start its respawn timer.",
    accent: "from-amber-500/20 to-orange-600/20",
    iconRing: "ring-amber-500/40",
    iconColor: "text-amber-400",
  },
  {
    icon: MapPin,
    title: "View the Map",
    description: "Click the Map Pin icon to see a full-screen map showing the boss's exact location.",
    accent: "from-cyan-500/20 to-blue-600/20",
    iconRing: "ring-cyan-500/40",
    iconColor: "text-cyan-400",
  },
  {
    icon: Send,
    title: "Send Discord Reports",
    description: "Click the 'Send Report' button to generate a schedule of upcoming bosses. You can send this directly to your Discord server using a webhook URL.",
    accent: "from-emerald-500/20 to-green-600/20",
    iconRing: "ring-emerald-500/40",
    iconColor: "text-emerald-400",
  },
];

function WelcomeCarouselDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex justify-center gap-2 mt-3">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "h-2 rounded-full transition-all duration-300",
            i === current
              ? "w-6 bg-gradient-to-r from-primary to-cyan-500"
              : "w-2 bg-white/20"
          )}
        />
      ))}
    </div>
  );
}

interface WelcomeDialogProps {
  isOpen: boolean;
  onClose: (dontShowAgain: boolean) => void;
}

export function WelcomeDialog({ isOpen, onClose }: WelcomeDialogProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const handleClose = () => {
    onClose(dontShowAgain);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className={cn(
          "glowing-card sm:max-w-lg bg-transparent border-0 shadow-none p-0",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-90 data-[state=open]:slide-in-from-bottom-24"
        )}
      >
        <div
          className="m-1 rounded-[28px] p-6 relative z-10 flex flex-col max-h-[90vh] overflow-hidden"
          style={{
            background: "linear-gradient(165deg, #0f0f14 0%, #1a1a24 40%, #15151d 100%)",
            boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.04)",
          }}
        >
          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 rounded-[28px] opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)`,
              backgroundSize: "24px 24px",
            }}
          />

          <DialogHeader className="text-center items-center relative">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full mb-4 ring-2 ring-primary/30 ring-offset-2 ring-offset-[#0f0f14] bg-gradient-to-br from-primary/20 to-cyan-500/10 shadow-[0_0_24px_rgba(0,212,255,0.15)]">
              <Swords className="h-7 w-7 text-primary drop-shadow-[0_0_8px_rgba(0,212,255,0.5)]" />
            </div>
            <DialogTitle className="text-2xl sm:text-3xl font-cinzel font-bold tracking-wide">
              <span className="bg-gradient-to-r from-white via-primary/90 to-cyan-400 bg-clip-text text-transparent">
                Welcome to L9 Tools!
              </span>
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-400 mt-1.5">
              Here’s a quick guide to get you started.
            </DialogDescription>
          </DialogHeader>

          <Carousel
            className="w-full max-w-sm mx-auto mt-2"
            setApi={(api) => {
              api?.on("select", () => setCurrentStep(api.selectedScrollSnap()));
            }}
          >
            <CarouselContent>
              {tutorialSteps.map((step, index) => (
                <CarouselItem key={index}>
                  <div className="p-1 text-center">
                    <div
                      className={cn(
                        "flex flex-col items-center justify-center p-6 rounded-2xl border border-white/5 bg-gradient-to-b",
                        step.accent
                      )}
                    >
                      <div
                        className={cn(
                          "flex items-center justify-center w-16 h-16 rounded-full ring-2 ring-offset-2 ring-offset-transparent bg-black/30",
                          step.iconRing,
                          step.iconColor
                        )}
                      >
                        <step.icon className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mt-4 tracking-tight">
                        {step.title}
                      </h3>
                      <p className="text-sm text-slate-400 mt-2 leading-relaxed max-w-[280px]">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="-left-4 border-white/10 bg-black/50 text-white hover:bg-white/10 hover:text-white" />
            <CarouselNext className="-right-4 border-white/10 bg-black/50 text-white hover:bg-white/10 hover:text-white" />
            <WelcomeCarouselDots current={currentStep} total={tutorialSteps.length} />
          </Carousel>

          <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between items-center w-full pt-5 gap-4 relative">
            <div className="flex items-center space-x-2 cursor-pointer group">
              <Checkbox
                id="dont-show-again"
                checked={dontShowAgain}
                onCheckedChange={(checked) => setDontShowAgain(!!checked)}
                className="border-slate-500 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <Label
                htmlFor="dont-show-again"
                className="text-sm text-slate-400 group-hover:text-slate-300 cursor-pointer transition-colors"
              >
                Don&apos;t show this again
              </Label>
            </div>
            <Button
              onClick={handleClose}
              className="bg-gradient-to-r from-primary to-cyan-600 hover:from-primary/90 hover:to-cyan-500 text-white font-semibold shadow-[0_0_20px_rgba(0,212,255,0.3)] hover:shadow-[0_0_24px_rgba(0,212,255,0.45)] transition-all duration-300"
            >
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
