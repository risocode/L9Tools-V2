
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

interface PaymentMethodDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMethod: (method: 'gcash' | 'usdt') => void;
}

export function PaymentMethodDialog({ isOpen, onClose, onSelectMethod }: PaymentMethodDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Choose Payment Method</DialogTitle>
          <DialogDescription>
            Select how you'd like to complete your subscription.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col space-y-4 pt-4">
          <Button
            variant="outline"
            className="justify-start h-16 text-lg"
            onClick={() => onSelectMethod('gcash')}
          >
            <Image src="/wallet/gcash.png" alt="GCash" width={40} height={40} className="mr-4 rounded-full"/>
            Pay with GCash
          </Button>
          <Button
            variant="outline"
            className="justify-start h-16 text-lg"
            onClick={() => onSelectMethod('usdt')}
          >
             <Image src="/wallet/usdt.png" alt="USDT" width={40} height={40} className="mr-4 rounded-full"/>
            Pay with USDT
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
