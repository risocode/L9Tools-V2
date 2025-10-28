
"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import PaymentLayout from "../payment-layout";
import Link from "next/link";
import { Mail } from "lucide-react";

function GCashPaymentContent() {
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan') || 'N/A';
  const price = searchParams.get('price'); // Keep as string or null

  const isDonation = plan === 'donation';

  const handleContactClick = () => {
    window.open('https://discord.gg/PKw3zBsU2Q', '_blank');
  };

  return (
    <PaymentLayout
      backHref={isDonation ? "/boss-hunt" : "/subscribe"}
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
          {!isDonation && price && (
              <div className="rounded-lg border-2 border-primary/20 bg-black/30 p-4 text-center">
                  <p className="font-bold text-lg">Plan: <span className="text-primary capitalize">{plan}</span></p>
                  <p className="font-bold text-2xl">Amount to Pay: <span className="text-primary">₱{price}</span></p>
              </div>
          )}

          <div className="rounded-lg border-2 border-primary/20 bg-black/30 p-6 text-center space-y-4">
              <p className="font-cinzel font-bold text-xl text-primary">Step 1: Pay with GCash</p>
              <p className="text-muted-foreground">
                  {isDonation 
                      ? "Scan the QR code to send your desired donation amount." 
                      : "Scan the QR code below or use the mobile number to send the payment."
                  }
              </p>
              <div className="flex justify-center pt-2">
                  <div className="p-2 bg-white rounded-lg">
                    <Image src="/wallet/gcashqr.jpg" alt="GCash QR Code" width={250} height={250} className="rounded-md" />
                  </div>
              </div>
          </div>

          <div className="rounded-lg border-2 border-primary/20 bg-black/30 p-6 text-center space-y-4">
              <p className="font-cinzel font-bold text-xl text-primary">Step 2: Manual Verification</p>
              <p className="text-muted-foreground">
                  After payment, please send a screenshot of your proof of payment along with your User ID to our payment email. Your User ID can be found in the profile menu (top-right corner).
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Link href="mailto:payment@l9tools.online" className="text-sm text-primary hover:underline">payment@l9tools.online</Link>
              </div>
              <p className="text-xs text-muted-foreground pt-2">Alternatively, you can join our Discord and submit in the <a href="https://discord.gg/PKw3zBsU2Q" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">#proof-of-payment</a> channel.</p>
          </div>
          
          {!isDonation && (
              <div className="rounded-lg border-2 border-primary/20 bg-black/30 p-6 text-center space-y-4">
                  <p className="font-cinzel font-bold text-xl text-primary">Step 3: Activation</p>
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


export default function GCashPaymentPage() {
    return (
        <GCashPaymentContent />
    )
}
