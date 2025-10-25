
"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy, Mail } from "lucide-react";
import PaymentLayout from "../payment-layout";
import { PaymentPageSkeleton } from "@/components/views/payment-page-skeleton";
import Link from "next/link";

const usdtWalletAddress = "0xdc6852d5f99844142cfef79e28cb4bf4b7bcc1b0";

function UsdtPaymentContent() {
    const searchParams = useSearchParams();
    const plan = searchParams.get('plan') || 'N/A';
    const usdt = searchParams.get('usdt'); // Keep as string or null
    const { toast } = useToast();
  
    const isDonation = plan === 'donation';

    const handleCopy = () => {
      navigator.clipboard.writeText(usdtWalletAddress).then(() => {
          toast({
              title: "Copied!",
              description: "USDT wallet address copied to clipboard.",
              variant: "success",
          });
      });
    };
  
    const handleContactClick = () => {
      window.open('https://discord.gg/qFUAMc3b6n', '_blank');
    };

    return (
        <PaymentLayout
            backHref={isDonation ? "/" : "/subscribe"}
            backText={isDonation ? "Back to Home" : "Back to Plans"}
            title={isDonation ? "Thank You for Your Support!" : "Subscription Payment"}
            description={
                isDonation
                ? "Please follow the instructions to make a donation."
                : "Follow the instructions below to complete your subscription."
            }
            titleIcon={isDonation ? "heart" : undefined}
        >
            <div className="space-y-6">
                {!isDonation && usdt && (
                    <div className="rounded-lg border bg-background p-4 text-center">
                        <p className="font-bold text-lg">Plan: <span className="text-primary capitalize">{plan}</span></p>
                        <p className="font-bold text-2xl">Amount to Pay: <span className="text-primary">{usdt} USDT</span></p>
                    </div>
                )}

                <div className="text-center space-y-2">
                    <p className="font-semibold text-lg">Step 1: Pay with USDT (Dapp Portal)</p>
                    <p className="text-muted-foreground">
                        {isDonation
                            ? "Scan the QR code or copy the address to send your desired donation amount."
                            : "Scan the QR code or copy the wallet address to send the payment."
                        }
                    </p>
                    <div className="flex flex-col items-center justify-center gap-2 pt-2">
                        <Image src="/wallet/dappqr.png" alt="USDT Wallet QR Code" width={250} height={250} className="rounded-md" />
                        <button 
                            onClick={handleCopy} 
                            className="group mt-2 flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                            <span className="truncate max-w-[200px] md:max-w-full">{usdtWalletAddress}</span>
                            <Copy className="h-4 w-4 opacity-70 group-hover:opacity-100" />
                        </button>
                    </div>
                </div>

                <div className="rounded-lg border bg-background p-4 space-y-2 text-center">
                    <p className="font-bold text-lg">Step 2: Manual Verification</p>
                    <p className="text-muted-foreground">
                        After payment, please send a screenshot of your proof of payment along with your User ID to our payment email. Your User ID can be found in the profile menu (top-right corner).
                    </p>
                    <div className="flex items-center justify-center gap-2 pt-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <Link href="mailto:payment@l9tools.online" className="text-sm text-primary hover:underline">payment@l9tools.online</Link>
                    </div>
                    <p className="text-xs text-muted-foreground pt-2">Alternatively, you can join our Discord and submit in the <a href="https://discord.gg/qFUAMc3b6n" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">#proof-of-payment</a> channel.</p>
                </div>
                
                {!isDonation && (
                    <div className="rounded-lg border bg-background p-4 space-y-2">
                        <p className="font-bold text-lg text-center">Step 3: Activation</p>
                        <p className="text-muted-foreground">
                            Your Pro Tier status will be activated manually once the payment is confirmed. Please allow some time for verification.
                        </p>
                    </div>
                )}
                
                <Button onClick={handleContactClick} className="w-full">
                    Join Discord for Support
                </Button>
            </div>
        </PaymentLayout>
    );
}

export default function UsdtPaymentPage() {
    return (
        <UsdtPaymentContent />
    )
}
