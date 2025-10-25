
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ResetConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  bossName: string;
}

export function ResetConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  bossName,
}: ResetConfirmationDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={cn(
          "glowing-card max-w-md bg-transparent border-0 shadow-none p-0",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-90 data-[state=open]:slide-in-from-bottom-24"
        )}
      >
        <div className="bg-[#181818] m-1 rounded-[28px] p-6 relative z-10">
            <DialogHeader className="text-center">
                <DialogTitle className="text-2xl">Are you sure?</DialogTitle>
                <DialogDescription>
                  This action will reset the timer for <span className="font-bold text-primary">{bossName}</span> and cannot be undone.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter className="pt-6">
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button variant="destructive" onClick={onConfirm}>
                    Reset Timer
                </Button>
            </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
