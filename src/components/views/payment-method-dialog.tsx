
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface PaymentMethodDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMethod: (method: 'gcash' | 'usdt') => void;
}

export function PaymentMethodDialog({ isOpen, onClose, onSelectMethod }: PaymentMethodDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={cn(
            "glowing-card sm:max-w-md bg-transparent border-0 shadow-none p-0",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-90 data-[state=open]:slide-in-from-bottom-24"
        )}
      >
        <div className="bg-[#181818] m-1 rounded-[28px] p-6 relative z-10">
            <DialogHeader className="text-center">
              <DialogTitle className="font-cinzel text-2xl text-purple-400">Choose Payment Method</DialogTitle>
              <DialogDescription>
                Select how you&apos;d like to complete your subscription.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col space-y-4 pt-6">
              <Button
                variant="outline"
                className="justify-start h-16 text-lg border-primary/20 hover:bg-primary/10 hover:text-white"
                onClick={() => onSelectMethod('gcash')}
              >
                <Image src="/wallet/gcash.png" alt="GCash" width={40} height={40} className="mr-4 rounded-full"/>
                Pay with GCash
              </Button>
              <Button
                variant="outline"
                className="justify-start h-16 text-lg border-primary/20 hover:bg-primary/10 hover:text-white"
                onClick={() => onSelectMethod('usdt')}
              >
                 <Image src="/wallet/usdt.png" alt="USDT" width={40} height={40} className="mr-4 rounded-full"/>
                Pay with USDT
              </Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
