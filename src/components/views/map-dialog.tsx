
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Boss } from "@/types";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { InteractiveMap } from "./interactive-map";

interface MapDialogProps {
  isOpen: boolean;
  onClose: () => void;
  boss: Boss | null;
}

export function MapDialog({ isOpen, onClose, boss }: MapDialogProps) {
  if (!boss) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={cn(
          "glowing-card w-[95vw] sm:max-w-4xl bg-transparent border-0 shadow-none p-0",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-90"
        )}
      >
        <div className="relative z-10 bg-[#0d1117] m-0.5 rounded-[28px] flex flex-col max-h-[85vh] sm:max-h-[90vh] overflow-hidden">
            <DialogHeader className="p-4 flex-shrink-0 border-b border-cyan-300/20 text-center items-center">
              <DialogTitle className="font-cinzel text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-400">{boss.name}</DialogTitle>
              <DialogDescription className="text-sm sm:text-base text-silver/80 !mt-1">
                {boss.location}
              </DialogDescription>
            </DialogHeader>
            <DialogClose asChild>
                <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2 z-20 h-8 w-8 rounded-full"
                >
                    <X className="h-5 w-5" />
                </Button>
            </DialogClose>
            <div className="relative flex-1 w-full h-full p-2 min-h-[300px]">
                <InteractiveMap boss={boss} />
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
