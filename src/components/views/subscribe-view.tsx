
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Star, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { PaymentMethodDialog } from "./payment-method-dialog";
import { useAuth } from "@/context/auth-context";
import {
  SUBSCRIPTION_PLANS,
  type SubscriptionPlanId,
} from "@/lib/subscription-plans";

const proPerks = [
  "Save your boss timers across all devices",
  "Send unlimited boss reports to Discord",
  "Completely Ad-Free experience",
  "Access to future Pro features and priority support",
];

function PlanPrice({
  salePrice,
  originalPrice,
  saleClassName,
}: {
  salePrice: number;
  originalPrice: number;
  saleClassName: string;
}) {
  return (
    <div className="flex items-baseline justify-center gap-2">
      <p className={`text-4xl font-bold ${saleClassName}`}>₱{salePrice}</p>
      <p className="text-xl font-bold text-muted-foreground line-through">₱{originalPrice}</p>
    </div>
  );
}

export function SubscribeView() {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanId>("lifetime");
  const [isPaymentMethodDialogOpen, setIsPaymentMethodDialogOpen] = useState(false);
  const router = useRouter();
  const { user, openAuthDialog } = useAuth();

  const handleSubscribeClick = () => {
    if (!user) {
      openAuthDialog();
      return;
    }
    setIsPaymentMethodDialogOpen(true);
  };

  const handlePaymentMethodSelect = (method: "gcash" | "usdt") => {
    const plan = SUBSCRIPTION_PLANS[selectedPlan];
    const months = plan.months;
    const price = plan.pricePhp;

    if (method === "gcash") {
      router.push(`/subscribe/qrph?plan=${plan.id}&price=${price}&months=${months}`);
    } else {
      router.push(
        `/subscribe/${method}?plan=${plan.id}&price=${price}&months=${months}&usdt=${plan.usdtPrice}`
      );
    }
    setIsPaymentMethodDialogOpen(false);
  };

  const monthPlan = SUBSCRIPTION_PLANS.monthly;
  const yearPlan = SUBSCRIPTION_PLANS.yearly;
  const lifetimePlan = SUBSCRIPTION_PLANS.lifetime;

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
                selectedPlan === "monthly" && "ring-2 ring-orange-500"
              )}
              onClick={() => setSelectedPlan("monthly")}
            >
              <div className="absolute top-0 left-0 bg-red-600 text-white text-sm font-bold px-3 py-1 flex items-center gap-1 rounded-br-lg z-10">
                <Flame className="h-4 w-4" /> 50% Off
              </div>
              <CardHeader>
                <CardTitle className="font-cinzel text-orange-400">{monthPlan.label}</CardTitle>
                <PlanPrice
                  salePrice={monthPlan.pricePhp}
                  originalPrice={monthPlan.originalPricePhp}
                  saleClassName="text-orange-400"
                />
                <CardDescription className="font-sans">
                  Approx. {monthPlan.usdtPrice} USDT
                  <br />
                  per month · choose duration at checkout
                </CardDescription>
              </CardHeader>
            </Card>

            <Card
              className={cn(
                "border-red-500/50 flex flex-col relative overflow-hidden cursor-pointer transition-all bg-gradient-to-br from-red-950/20 via-background/50 to-background/50",
                selectedPlan === "yearly" && "ring-2 ring-red-500"
              )}
              onClick={() => setSelectedPlan("yearly")}
            >
              <div className="absolute top-0 left-0 bg-red-600 text-white text-sm font-bold px-3 py-1 flex items-center gap-1 rounded-br-lg z-10">
                <Flame className="h-4 w-4" /> 50% Off
              </div>
              <div className="absolute top-0 right-0 bg-red-600/90 text-white text-xs font-bold px-2 py-1 rounded-bl-lg z-10 flex items-center gap-1">
                <Star className="h-3 w-3" /> Popular
              </div>
              <CardHeader>
                <CardTitle className="font-cinzel text-red-400">{yearPlan.label}</CardTitle>
                <PlanPrice
                  salePrice={yearPlan.pricePhp}
                  originalPrice={yearPlan.originalPricePhp}
                  saleClassName="text-red-400"
                />
                <CardDescription className="font-sans">
                  Approx. {yearPlan.usdtPrice} USDT
                  <br />
                  12 months of Pro access
                </CardDescription>
              </CardHeader>
            </Card>

            <Card
              className={cn(
                "border-amber-500/50 flex flex-col relative overflow-hidden cursor-pointer transition-all bg-gradient-to-br from-amber-950/20 via-background/50 to-background/50",
                selectedPlan === "lifetime" && "ring-2 ring-amber-500"
              )}
              onClick={() => setSelectedPlan("lifetime")}
            >
              <div className="absolute top-0 left-0 bg-red-600 text-white text-sm font-bold px-3 py-1 flex items-center gap-1 rounded-br-lg z-10">
                <Flame className="h-4 w-4" /> 50% Off
              </div>
              <div className="absolute top-0 right-0 bg-amber-500 text-black text-xs font-bold px-2 py-1 rounded-bl-lg z-10 flex items-center gap-1">
                <Star className="h-3 w-3" /> Best Value
              </div>
              <CardHeader>
                <CardTitle className="font-cinzel text-amber-400">{lifetimePlan.label}</CardTitle>
                <PlanPrice
                  salePrice={lifetimePlan.pricePhp}
                  originalPrice={lifetimePlan.originalPricePhp}
                  saleClassName="text-amber-400"
                />
                <CardDescription className="font-sans">
                  One-time payment · Approx. {lifetimePlan.usdtPrice} USDT
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
