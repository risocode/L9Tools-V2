
"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import PaymentLayout from "../payment-layout";
import Link from "next/link";
import { Mail } from "lucide-react";

const DiscordIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 640 512"
        className="w-7 h-7 fill-current text-indigo-400 group-hover:text-indigo-300 transition-all duration-300 group-hover:scale-110 drop-shadow-lg"
        {...props}
    >
        <path
        d="M524.531 69.836a1.5 1.5 0 0 0-.764-.7A485.065 485.065 0 0 0 404.081 32.03a1.816 1.816 0 0 0-1.923.91 337.461 337.461 0 0 0-14.9 30.6 447.848 447.848 0 0 0-134.426 0 309.541 309.541 0 0 0-15.135-30.6 1.89 1.89 0 0 0-1.924-.91 483.689 483.689 0 0 0-119.688 37.107 1.712 1.712 0 0 0-.788.676C39.068 183.651 18.186 294.69 28.43 404.354a2.016 2.016 0 0 0 .765 1.375 487.666 487.666 0 0 0 146.825 74.189 1.9 1.9 0 0 0 2.063-.676A348.2 348.2 0 0 0 208.12 430.4a1.86 1.86 0 0 0-1.019-2.588 321.173 321.173 0 0 1-45.868-21.853 1.885 1.885 0 0 1-.185-3.126 251.047 251.047 0 0 0 9.109-7.137 1.819 1.819 0 0 1 1.9-.256c96.229 43.917 200.41 43.917 295.5 0a1.812 1.812 0 0 1 1.924.233 234.533 234.533 0 0 0 9.132 7.16 1.884 1.884 0 0 1-.162 3.126 301.407 301.407 0 0 1-45.89 21.83 1.875 1.875 0 0 0-1 2.611 391.055 391.055 0 0 0 30.014 48.815 1.864 1.864 0 0 0 2.063.7A486.048 486.048 0 0 0 610.7 405.729a1.882 1.882 0 0 0 .765-1.352c12.264-126.783-20.532-236.912-86.934-334.541zM222.491 337.58c-28.972 0-52.844-26.587-52.844-59.239s23.409-59.241 52.844-59.241c29.665 0 53.306 26.82 52.843 59.239 0 32.654-23.41 59.241-52.843 59.241zm195.38 0c-28.971 0-52.843-26.587-52.843-59.239s23.409-59.241 52.843-59.241c29.667 0 53.307 26.820 52.844 59.239 0 32.654-23.177 59.241-52.844 59.241z"
        ></path>
    </svg>
);


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
                  After payment, please join our Discord and submit a screenshot of your proof of payment in the <a href="https://discord.gg/PKw3zBsU2Q" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">#proof-of-payment</a> channel, along with your User ID. Your User ID can be found in the profile menu.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                   <p className="text-xs text-muted-foreground">Alternatively, you can email it to:</p>
              </div>
               <div className="flex items-center justify-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Link href="mailto:payment@l9tools.online" className="text-sm text-primary hover:underline">payment@l9tools.online</Link>
              </div>
          </div>
          
          {!isDonation && (
              <div className="rounded-lg border-2 border-primary/20 bg-black/30 p-6 text-center space-y-4">
                  <p className="font-cinzel font-bold text-xl text-primary">Step 3: Activation</p>
                  <p className="text-muted-foreground">
                      Your Pro Tier status will be activated manually once the payment is confirmed. Please allow some time for verification.
                  </p>
              </div>
          )}
          
          <button
              onClick={handleContactClick}
              className="group w-full relative p-4 rounded-2xl backdrop-blur-xl border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-900/40 via-black-900/60 to-black/80 shadow-2xl hover:shadow-indigo-500/30 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1 active:scale-95 transition-all duration-500 ease-out cursor-pointer hover:border-indigo-400/60 overflow-hidden"
          >
              <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"
              ></div>

              <div
              className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-indigo-400/20 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              ></div>

              <div className="relative z-10 flex items-center gap-4">
              <div
                  className="p-3 rounded-lg bg-gradient-to-br from-indigo-500/30 to-indigo-600/10 backdrop-blur-sm group-hover:from-indigo-400/40 group-hover:to-indigo-500/20 transition-all duration-300"
              >
                  <DiscordIcon />
              </div>
              <div className="flex-1 text-left">
                  <p
                  className="text-indigo-400 font-bold text-lg group-hover:text-indigo-300 transition-colors duration-300 drop-shadow-sm"
                  >
                  Discord
                  </p>
                  <p
                  className="text-indigo-300/60 text-sm group-hover:text-indigo-200/80 transition-colors duration-300"
                  >
                  Join for support
                  </p>
              </div>
              <div
                  className="opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300"
              >
                  <svg
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  fill="none"
                  className="w-5 h-5 text-indigo-400"
                  >
                  <path
                      d="M9 5l7 7-7 7"
                      strokeWidth="2"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                  ></path>
                  </svg>
              </div>
              </div>
          </button>
      </div>
    </PaymentLayout>
  );
}


export default function GCashPaymentPage() {
    return (
        <GCashPaymentContent />
    )
}
