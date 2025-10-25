
"use client";

import { useState }from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Star, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { PaymentMethodDialog } from "./payment-method-dialog";

const proPerks = [
    "Save your boss timers across all devices",
    "Send unlimited boss reports to Discord",
    "Completely Ad-Free experience",
    "Upload a custom logo to display on the sidebar",
    "Access to future Pro features and priority support"
];

type Plan = "monthly" | "lifetime";

export function SubscribeView() {
  const [selectedPlan, setSelectedPlan] = useState<Plan>("lifetime");
  const [isPaymentMethodDialogOpen, setIsPaymentMethodDialogOpen] = useState(false);
  const router = useRouter();

  const showPromo = true; // Assuming promo is always on

  const planDetails = {
    monthly: {
      name: "monthly",
      price: showPromo ? 60 : 115,
      originalPrice: 115,
      usdtPrice: showPromo ? 1 : 2,
    },
    lifetime: {
      name: "lifetime",
      price: showPromo ? 399 : 599,
      originalPrice: 599,
      usdtPrice: showPromo ? 7 : 10,
    }
  }

  const handleSubscribeClick = () => {
    setIsPaymentMethodDialogOpen(true);
  };
  
  const handlePaymentMethodSelect = (method: 'gcash' | 'usdt') => {
    const planInfo = planDetails[selectedPlan];
    let url = `/subscribe/${method}?plan=${planInfo.name}&price=${planInfo.price}`;
    if (method === 'usdt') {
        url += `&usdt=${planInfo.usdtPrice}`;
    }
    router.push(url);
    setIsPaymentMethodDialogOpen(false);
  }

  return (
    <div className="w-full flex flex-col items-center p-4">
      <Card className="w-full max-w-4xl bg-card/80 backdrop-blur-sm border-primary/20 shadow-lg shadow-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl text-purple-400">Upgrade your Account</CardTitle>
          <CardDescription className="text-lg font-sans">
            Support the development of L9 Tools and unlock exclusive perks.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
            <div className="grid md:grid-cols-2 gap-6 text-center">
                <Card 
                    className={cn(
                        "border-purple-500/50 flex flex-col relative overflow-hidden cursor-pointer transition-all bg-gradient-to-br from-purple-950/20 via-background/50 to-background/50",
                        selectedPlan === 'monthly' && "ring-2 ring-primary"
                    )}
                    onClick={() => setSelectedPlan('monthly')}
                >
                    {showPromo && (
                    <div className="absolute top-0 left-0 bg-red-600 text-white text-sm font-bold px-3 py-1 flex items-center gap-1 rounded-br-lg z-10">
                        <Flame className="h-4 w-4" /> 50% Off
                    </div>
                    )}
                    <CardHeader>
                        <CardTitle className="font-cinzel text-purple-400">Pro Plan</CardTitle>
                        <div className="flex items-baseline justify-center gap-2">
                            <p className="text-4xl font-bold text-purple-400">₱{planDetails.monthly.price}</p>
                            {showPromo && <p className="text-xl font-bold text-muted-foreground line-through">₱{planDetails.monthly.originalPrice}</p>}
                        </div>
                        <CardDescription className="font-sans">
                            {showPromo ? `(Approx. ${planDetails.monthly.usdtPrice} USDT)` : `Approx. ${planDetails.monthly.usdtPrice} USDT`}
                            <br />
                            Renews at ₱115/month.
                        </CardDescription>
                    </CardHeader>
                </Card>

                <Card 
                    className={cn(
                        "border-amber-500/50 flex flex-col relative overflow-hidden cursor-pointer transition-all bg-gradient-to-br from-amber-950/20 via-background/50 to-background/50",
                        selectedPlan === 'lifetime' && "ring-2 ring-amber-500"
                    )}
                    onClick={() => setSelectedPlan('lifetime')}
                >
                    <div className="absolute top-0 left-0 bg-amber-500 text-black text-sm font-bold px-3 py-1 flex items-center gap-1 rounded-br-lg z-10">
                        <Star className="h-4 w-4" /> Lifetime
                    </div>
                    <CardHeader>
                        <CardTitle className="font-cinzel text-amber-400">Lifetime Plan</CardTitle>
                        <div className="flex items-baseline justify-center gap-2">
                            <p className="text-4xl font-bold text-amber-400">₱{planDetails.lifetime.price}</p>
                            {showPromo && <p className="text-xl font-bold text-muted-foreground line-through">₱{planDetails.lifetime.originalPrice}</p>}
                        </div>
                        <CardDescription className="font-sans">
                            One-Time Payment
                            <br />
                            (Approx. {showPromo ? planDetails.lifetime.usdtPrice : planDetails.lifetime.usdtPrice} USDT)
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
            
            <div>
                <h3 className="text-xl font-semibold mb-4 text-center">Pro Tier Perks</h3>
                <ul className="space-y-3 max-w-md mx-auto font-sans">
                {proPerks.map((perk, index) => (
                    <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>{perk}</span>
                    </li>
                ))}
                </ul>
            </div>
        </CardContent>

        <CardFooter>
            <Button onClick={handleSubscribeClick} className="w-full max-w-sm mx-auto" size="lg">
                Proceed to Payment
            </Button>
        </CardFooter>
      </Card>

      <PaymentMethodDialog
        isOpen={isPaymentMethodDialogOpen}
        onClose={() => setIsPaymentMethodDialogOpen(false)}
        onSelectMethod={handlePaymentMethodSelect}
      />
    </div>
  );
}
