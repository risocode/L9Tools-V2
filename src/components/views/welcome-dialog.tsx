
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
    imgSrc: "/tutorial/step1.png",
  },
  {
    icon: MapPin,
    title: "View the Map",
    description: "Click the Map Pin icon to see a full-screen map showing the boss's exact location.",
    imgSrc: "/tutorial/step2.png",
  },
  {
    icon: Send,
    title: "Send Discord Reports",
    description: "Click the 'Send Report' button to generate a schedule of upcoming bosses. You can send this directly to your Discord server using a webhook URL.",
    imgSrc: "/tutorial/step3.png",
  },
];

interface WelcomeDialogProps {
  isOpen: boolean;
  onClose: (dontShowAgain: boolean) => void;
}

export function WelcomeDialog({ isOpen, onClose }: WelcomeDialogProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

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
        <div className="bg-[#181818] m-1 rounded-[28px] p-6 relative z-10 flex flex-col max-h-[90vh]">
          <DialogHeader className="text-center items-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                  <Swords className="h-6 w-6 text-primary" />
              </div>
            <DialogTitle className="text-2xl font-cinzel">Welcome to L9 Tools!</DialogTitle>
            <DialogDescription>
              Here’s a quick guide to get you started.
            </DialogDescription>
          </DialogHeader>

          <Carousel className="w-full max-w-sm mx-auto mt-4">
            <CarouselContent>
              {tutorialSteps.map((step, index) => (
                <CarouselItem key={index}>
                  <div className="p-1 text-center">
                      <div className="flex flex-col items-center justify-center p-6 space-y-4">
                          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                              <step.icon className="w-8 h-8 text-primary" />
                          </div>
                          <h3 className="text-xl font-semibold">{step.title}</h3>
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="-left-4" />
            <CarouselNext className="-right-4" />
          </Carousel>

          <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between items-center w-full pt-4">
              <div className="flex items-center space-x-2">
                  <Checkbox 
                      id="dont-show-again" 
                      checked={dontShowAgain}
                      onCheckedChange={(checked) => setDontShowAgain(!!checked)}
                  />
                  <Label htmlFor="dont-show-again" className="text-sm font-normal">
                      Don&apos;t show this again
                  </Label>
              </div>
              <Button onClick={handleClose}>
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
