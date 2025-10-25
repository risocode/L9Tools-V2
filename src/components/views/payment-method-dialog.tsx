
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
            Select how you&apos;d like to pay for your subscription.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col space-y-4 pt-4">
          <Button
            variant="outline"
            className="justify-center h-16 text-lg"
            onClick={() => onSelectMethod('gcash')}
          >
            Pay with GCash
          </Button>
          <Button
            variant="outline"
            className="justify-center h-16 text-lg"
            onClick={() => onSelectMethod('usdt')}
          >
            Pay with USDT
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
