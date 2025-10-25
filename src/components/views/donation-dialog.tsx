
"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Copy, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

interface DonationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const usdtWalletAddress = "0xdc6852d5f99844142cfef79e28cb4bf4b7bcc1b0";

type WalletTab = "gcash" | "usdt";

export function DonationDialog({ isOpen, onClose }: DonationDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<WalletTab>("gcash");

  const handleCopy = (value: string, type: string) => {
    navigator.clipboard.writeText(value).then(() => {
      toast({
        title: "Copied to Clipboard ⚡",
        description: `${type} has been copied.`,
        variant: "success",
      });
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glowing-card sm:max-w-md bg-transparent border-0 shadow-none overflow-hidden p-0">
        <div className="relative z-10 flex flex-col justify-center items-center bg-[#181818] m-1 rounded-[28px] p-6">
            <DialogClose asChild>
                <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2 z-20 h-8 w-8 rounded-full"
                >
                    <X className="h-5 w-5" />
                </Button>
            </DialogClose>
          <DialogHeader className="text-center pt-2">
            <DialogTitle className="sr-only">Support Our Quest</DialogTitle>
             <h2 className="font-cinzel text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 text-center">
              Support Our Quest
            </h2>
            <p className="text-center text-sm text-silver/80 pt-2 pb-4 max-w-sm mx-auto">
                Your generosity fuels our mission to provide the best tools for our community. Every contribution helps us maintain and improve the site.
            </p>
          </DialogHeader>

          <div className="w-full flex flex-col items-center">
            {/* Tab Emblems */}
            <div className="flex items-center justify-center gap-6 mb-4">
                <button onClick={() => setActiveTab("gcash")} className="relative">
                    <Image src="/wallet/gcash.png" alt="GCash" width={64} height={64} className={cn("rounded-full transition-all duration-300", activeTab !== 'gcash' && 'opacity-50 scale-90 grayscale')}/>
                    <div className={cn("fantasy-emblem-glow", activeTab === 'gcash' ? 'opacity-100' : 'opacity-0')} style={{'--glow-color': '#0070f3'} as React.CSSProperties}></div>
                </button>
                  <button onClick={() => setActiveTab("usdt")} className="relative">
                    <Image src="/wallet/usdt.png" alt="USDT" width={64} height={64} className={cn("rounded-full transition-all duration-300", activeTab !== 'usdt' && 'opacity-50 scale-90 grayscale')}/>
                    <div className={cn("fantasy-emblem-glow", activeTab === 'usdt' ? 'opacity-100' : 'opacity-0')} style={{'--glow-color': '#26A17B'} as React.CSSProperties}></div>
                </button>
            </div>
            
            <div className="w-full h-[300px] relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="w-full h-full flex flex-col items-center justify-center"
                    >
                        {activeTab === 'gcash' && (
                            <div className="flex flex-col items-center gap-4 text-center">
                                <h3 className="font-cinzel text-xl font-bold">GCash</h3>
                                <div className="qr-frame">
                                    <Image src="/wallet/gcashqr.jpg" alt="GCash QR Code" width={180} height={180} />
                                </div>
                            </div>
                        )}

                        {activeTab === 'usdt' && (
                            <div className="flex flex-col items-center gap-4 text-center">
                                <h3 className="font-cinzel text-xl font-bold">USDT (KAIA Network)</h3>
                                <div className="qr-frame">
                                    <Image src="/wallet/dappqr.png" alt="USDT QR Code" width={180} height={180} />
                                </div>
                                <button 
                                    className="stone-button group" 
                                    onClick={() => handleCopy(usdtWalletAddress, 'USDT Address')}
                                >
                                    <Copy className="mr-2 h-4 w-4" />
                                    <span className="font-mono text-xs truncate max-w-[150px] sm:max-w-none">
                                        {usdtWalletAddress}
                                    </span>
                                </button>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
