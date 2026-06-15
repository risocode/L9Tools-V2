/** Internal plan keys (PayMongo metadata, activation). */
export type SubscriptionPlanId = 'monthly' | 'yearly' | 'lifetime';

export interface SubscriptionPlanConfig {
  id: SubscriptionPlanId;
  /** User-facing label */
  label: string;
  /** Sale price (50% off promo) in PHP */
  pricePhp: number;
  /** Full price before 50% discount — shown slashed in UI */
  originalPricePhp: number;
  months: number;
  usdtPrice: number;
  originalUsdtPrice: number;
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanId, SubscriptionPlanConfig> = {
  monthly: {
    id: 'monthly',
    label: '1 Month',
    pricePhp: 59,
    originalPricePhp: 118,
    months: 1,
    usdtPrice: 1.07,
    originalUsdtPrice: 2.15,
  },
  yearly: {
    id: 'yearly',
    label: '1 Year',
    pricePhp: 399,
    originalPricePhp: 798,
    months: 12,
    usdtPrice: 7.25,
    originalUsdtPrice: 14.5,
  },
  lifetime: {
    id: 'lifetime',
    label: 'Lifetime',
    pricePhp: 1199,
    originalPricePhp: 2398,
    months: 1,
    usdtPrice: 21.8,
    originalUsdtPrice: 43.6,
  },
};

/** Total sale amount for checkout (monthly × selected months). */
export function getCheckoutTotalPhp(planId: SubscriptionPlanId, months: number): number {
  const plan = SUBSCRIPTION_PLANS[planId];
  if (planId === 'monthly') {
    return plan.pricePhp * Math.max(1, months);
  }
  return plan.pricePhp;
}

/** Server-side checkout resolution — ignores client-supplied amount (C1). */
export function resolveCheckoutRequest(
  plan: string | null | undefined,
  clientMonths: number | null | undefined
): { planId: SubscriptionPlanId; months: number; amountPhp: number } | null {
  if (!isSubscriptionPlanId(plan)) {
    return null;
  }

  const months =
    plan === 'monthly'
      ? Math.max(1, Math.min(120, Math.floor(Number(clientMonths) || 1)))
      : SUBSCRIPTION_PLANS[plan].months;

  return {
    planId: plan,
    months,
    amountPhp: getCheckoutTotalPhp(plan, months),
  };
}

export function getExpectedAmountCents(plan: string, months: number): number | null {
  if (!isSubscriptionPlanId(plan)) {
    return null;
  }
  return Math.round(getCheckoutTotalPhp(plan, months) * 100);
}

export function getCheckoutOriginalTotalPhp(planId: SubscriptionPlanId, months: number): number {
  const plan = SUBSCRIPTION_PLANS[planId];
  if (planId === 'monthly') {
    return plan.originalPricePhp * Math.max(1, months);
  }
  return plan.originalPricePhp;
}

export function isSubscriptionPlanId(value: string | null | undefined): value is SubscriptionPlanId {
  return value === 'monthly' || value === 'yearly' || value === 'lifetime';
}

export function getPlanConfig(planId: string | null | undefined): SubscriptionPlanConfig | null {
  if (!isSubscriptionPlanId(planId)) return null;
  return SUBSCRIPTION_PLANS[planId];
}

export function getPlanLabel(planId: string | null | undefined): string {
  return getPlanConfig(planId)?.label ?? planId ?? 'Plan';
}

/** PayMongo / receipt description */
export function getPaymentDescription(planId: SubscriptionPlanId): string {
  const plan = SUBSCRIPTION_PLANS[planId];
  if (planId === 'lifetime') {
    return `L9 Tools ${plan.label}`;
  }
  if (planId === 'yearly') {
    return `L9 Tools ${plan.label}`;
  }
  return `L9 Tools ${plan.label}`;
}

export function getSuccessPlanTitle(planId: string, months?: number): string {
  const config = getPlanConfig(planId);
  if (config) {
    return `${config.label} Unlocked`;
  }
  if (planId === 'monthly' && months && months > 1) {
    return `${months} Months Unlocked`;
  }
  return 'Plan Unlocked';
}
