
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/context/auth-context";
import { SigninForm } from "./signin-form";
import { LegalDialog } from "./legal-dialog";
import { cn } from "@/lib/utils";


export function AuthDialog() {
  const { isAuthDialogOpen, closeAuthDialog } = useAuth();
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [legalType, setLegalType] = useState<'terms' | 'privacy' | 'disclaimer' | 'cookie'>('terms');

  const openLegalDialog = (type: 'terms' | 'privacy' | 'disclaimer' | 'cookie') => {
    setLegalType(type);
    setIsLegalOpen(true);
  }
  
  return (
    <>
      <Dialog open={isAuthDialogOpen} onOpenChange={closeAuthDialog}>
        <DialogContent 
          className={cn(
            "grid-rows-[auto_1fr] p-0 sm:max-w-md max-h-[90vh]",
            "bg-card/80 backdrop-blur-sm border-primary/20 shadow-lg shadow-primary/20",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-90 data-[state=open]:slide-in-from-bottom-24"
          )}
        >
          <DialogHeader className="text-center p-6 pb-0">
            <DialogTitle className="text-2xl text-center font-cinzel">Welcome!</DialogTitle>
            <DialogDescription className="text-center">
              Continue with Google to save your timers and access your account.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-full">
            <div className="p-6 pt-2">
              <SigninForm onOpenLegal={openLegalDialog} />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
      <LegalDialog 
        isOpen={isLegalOpen} 
        onClose={() => setIsLegalOpen(false)} 
        type={legalType} 
      />
    </>
  );
}
