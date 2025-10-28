
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Users, Code, Heart } from 'lucide-react';
import { cn } from "@/lib/utils";

interface AboutDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutDialog({ isOpen, onClose }: AboutDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={cn(
            "glowing-card sm:max-w-xl bg-transparent border-0 shadow-none p-0",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-90 data-[state=open]:slide-in-from-bottom-24"
        )}
      >
        <div className="bg-[#181818] m-1 rounded-[28px] p-6 relative z-10 flex flex-col">
            <DialogHeader className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                    <Users className="h-8 w-8 text-primary" />
                </div>
                <DialogTitle className="text-3xl text-primary font-cinzel">About L9 Tools</DialogTitle>
                <DialogDescription className="text-lg font-sans">
                    Your Ultimate Companion for Lord Nine
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 text-center max-w-2xl mx-auto py-6">
                <div className="space-y-4">
                    <h3 className="font-cinzel text-xl font-bold text-golden flex items-center justify-center gap-2"><Code className="h-5 w-5" /> Our Mission</h3>
                    <p className="text-muted-foreground">
                        L9 Tools was created by a passionate player with a single goal: to provide the Lord Nine community with the best possible tools to enhance their gaming experience. We focus on creating accurate, easy-to-use, and reliable timers and trackers to help you conquer the game&apos;s biggest challenges.
                    </p>
                </div>
                <div className="space-y-4">
                    <h3 className="font-cinzel text-xl font-bold text-golden flex items-center justify-center gap-2"><Heart className="h-5 w-5" /> Community Focused</h3>
                    <p className="text-muted-foreground">
                        This is a fan-made project, built for the community, by the community. We are not affiliated with the official developers of Lord Nine. All game assets, trademarks, and copyrights are the property of their respective owners. Our aim is simply to support and grow with the player base.
                    </p>
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
