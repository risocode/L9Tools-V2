
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
            "glowing-card sm:max-w-md bg-transparent border-0 shadow-none p-0",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-90 data-[state=open]:slide-in-from-bottom-24"
          )}
        >
          <div className="bg-[#181818] m-1 rounded-[28px] p-6 relative z-10 flex flex-col max-h-[90vh]">
            <DialogHeader className="text-center">
              <DialogTitle className="text-2xl text-center font-cinzel">Welcome!</DialogTitle>
              <DialogDescription className="text-center">
                Continue with Google to save your timers and access your account.
              </DialogDescription>
            </DialogHeader>
            <div className="pt-2 flex-1 min-h-0">
                <SigninForm onOpenLegal={openLegalDialog} />
            </div>
          </div>
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
