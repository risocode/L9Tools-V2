
"use client";

import { useState }from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Star, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { PaymentMethodDialog } from "./payment-method-dialog";
import { useAuth } from "@/context/auth-context";

const proPerks = [
    "Save your boss timers across all devices",
    "Send unlimited boss reports to Discord",
    "Completely Ad-Free experience",
    "Access to future Pro features and priority support"
];

type Plan = "monthly" | "yearly" | "lifetime";

export function SubscribeView() {
  const [selectedPlan, setSelectedPlan] = useState<Plan>("lifetime");
  const [isPaymentMethodDialogOpen, setIsPaymentMethodDialogOpen] = useState(false);
  const router = useRouter();
  const { user, openAuthDialog } = useAuth();

  const showPromo = true; // Assuming promo is always on

  const planDetails = {
    monthly: {
      name: "monthly",
      price: 39,
      originalPrice: 115,
      usdtPrice: 0.68, // Approx ₱39 = ~$0.68
    },
    yearly: {
      name: "yearly",
      price: 299,
      originalPrice: 1380, // 12 months * 115
      usdtPrice: 5, // Approx ₱299 = ~$5.43
    },
    lifetime: {
      name: "lifetime",
      price: 499,
      originalPrice: 1499,
      usdtPrice: 9, // Approx ₱499 = ~$9 (assuming ₱55-56 per USD)
    }
  }

  const handleSubscribeClick = () => {
    if (!user) {
      openAuthDialog();
      return;
    }
    
    setIsPaymentMethodDialogOpen(true);
  };
  
  const handlePaymentMethodSelect = (method: 'gcash' | 'usdt') => {
    // Only support QRPh for now (PayMongo integration)
    if (method === 'gcash') {
      const planInfo = planDetails[selectedPlan];
      // Redirect to payment confirmation page
      let url = `/subscribe/qrph?plan=${planInfo.name}&price=${planInfo.price}`;
      if (selectedPlan === 'monthly') {
        url += `&months=1`;
      } else if (selectedPlan === 'yearly') {
        url += `&months=12`;
      }
      router.push(url);
      setIsPaymentMethodDialogOpen(false);
    } else {
      // USDT - redirect to old page for now
      const planInfo = planDetails[selectedPlan];
      let url = `/subscribe/${method}?plan=${planInfo.name}&price=${planInfo.price}`;
      if (selectedPlan === 'yearly') {
        url += `&months=12`;
      }
      url += `&usdt=${planInfo.usdtPrice}`;
      router.push(url);
      setIsPaymentMethodDialogOpen(false);
    }
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
            <div className="grid md:grid-cols-3 gap-6 text-center">
                <Card 
                    className={cn(
                        "border-orange-500/50 flex flex-col relative overflow-hidden cursor-pointer transition-all bg-gradient-to-br from-orange-950/20 via-background/50 to-background/50",
                        selectedPlan === 'monthly' && "ring-2 ring-orange-500"
                    )}
                    onClick={() => setSelectedPlan('monthly')}
                >
                    {showPromo && (
                    <div className="absolute top-0 left-0 bg-red-600 text-white text-sm font-bold px-3 py-1 flex items-center gap-1 rounded-br-lg z-10">
                        <Flame className="h-4 w-4" /> 50% Off
                    </div>
                    )}
                    <CardHeader>
                        <CardTitle className="font-cinzel text-orange-400">Pro Plan</CardTitle>
                        <div className="flex items-baseline justify-center gap-2">
                            <p className="text-4xl font-bold text-orange-400">₱{planDetails.monthly.price}</p>
                            {showPromo && <p className="text-xl font-bold text-muted-foreground line-through">₱{planDetails.monthly.originalPrice}</p>}
                        </div>
                        <CardDescription className="font-sans">
                            {showPromo ? `(Approx. ${planDetails.monthly.usdtPrice} USDT)` : `Approx. ${planDetails.monthly.usdtPrice} USDT`}
                            <br />
                            Renews at ₱{planDetails.monthly.price}/month.
                        </CardDescription>
                    </CardHeader>
                </Card>

                <Card 
                    className={cn(
                        "border-red-500/50 flex flex-col relative overflow-hidden cursor-pointer transition-all bg-gradient-to-br from-red-950/20 via-background/50 to-background/50",
                        selectedPlan === 'yearly' && "ring-2 ring-red-500"
                    )}
                    onClick={() => setSelectedPlan('yearly')}
                >
                    <div className="absolute top-0 left-0 bg-red-600 text-white text-sm font-bold px-3 py-1 flex items-center gap-1 rounded-br-lg z-10">
                        <Star className="h-4 w-4" /> Most Popular
                    </div>
                    <CardHeader>
                        <CardTitle className="font-cinzel text-red-400">Yearly Plan</CardTitle>
                        <div className="flex items-baseline justify-center gap-2">
                            <p className="text-4xl font-bold text-red-400">₱{planDetails.yearly.price}</p>
                            {showPromo && <p className="text-xl font-bold text-muted-foreground line-through">₱{planDetails.yearly.originalPrice}</p>}
                        </div>
                        <CardDescription className="font-sans">
                            {showPromo ? `(Approx. ${planDetails.yearly.usdtPrice} USDT)` : `Approx. ${planDetails.yearly.usdtPrice} USDT`}
                            <br />
                            ₱{Math.round(planDetails.yearly.price / 12)}/month • 12 months
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
            <Button 
              onClick={handleSubscribeClick} 
              className="w-full max-w-sm mx-auto" 
              size="lg"
            >
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
