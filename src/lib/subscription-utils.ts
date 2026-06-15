/**
 * Subscription validation utilities
 * Checks if subscriptions are expired and provides effective tier
 */

export type SubscriptionTier = 'free' | 'pro' | 'lifetime';

export interface SubscriptionProfile {
  subscription_tier: SubscriptionTier | string | null | undefined;
  subscription_expires_at: string | null | undefined;
  is_admin?: boolean | null;
}

export interface SubscriptionOptions {
  /** Defaults to current time. Must be a Date with valid UTC instant. */
  now?: Date;
  /** When false, skips July promotional Pro access. Default true. */
  includeCampaign?: boolean;
}

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  expiresAt: string | null;
  isExpired: boolean;
  effectiveTier: SubscriptionTier;
  isJulyPromoActive: boolean;
}

/** July 1 2026 00:00 Asia/Manila (UTC+8), inclusive start for Pro access */
export const JULY_FREE_ACCESS_START_MS = Date.parse('2026-06-30T16:00:00.000Z');

/** August 1 2026 00:00 Asia/Manila (UTC+8), exclusive end */
export const JULY_FREE_ACCESS_END_MS = Date.parse('2026-07-31T16:00:00.000Z');

export const NO_CAMPAIGN: SubscriptionOptions = { includeCampaign: false };

/**
 * True when free users receive effective Pro access (July 1–31 Manila only).
 */
export function isJulyFreeAccessActive(now: Date = new Date()): boolean {
  const t = now.getTime();
  return t >= JULY_FREE_ACCESS_START_MS && t < JULY_FREE_ACCESS_END_MS;
}

/**
 * True when the promo banner should display (from deploy through July 31 Manila).
 */
export function isJulyFreeAccessBannerVisible(now: Date = new Date()): boolean {
  return now.getTime() < JULY_FREE_ACCESS_END_MS;
}

/**
 * Validates if a subscription is expired based on expiration date
 */
export function isSubscriptionExpired(
  expiresAt: string | null | undefined,
  now: Date = new Date()
): boolean {
  if (!expiresAt) {
    return false;
  }

  const expirationDate = new Date(expiresAt);
  return now.getTime() > expirationDate.getTime();
}

/**
 * Base effective tier: stored tier with expiration applied. No promotional campaign.
 */
export function getBaseEffectiveTier(
  tier: SubscriptionTier | null | undefined,
  expiresAt: string | null | undefined,
  isAdmin: boolean = false,
  now: Date = new Date()
): SubscriptionTier {
  if (isAdmin || tier === 'lifetime') {
    return tier || 'free';
  }

  if (tier === 'free' || !tier) {
    return 'free';
  }

  if (tier === 'pro') {
    if (isSubscriptionExpired(expiresAt, now)) {
      return 'free';
    }
    return 'pro';
  }

  return 'free';
}

/**
 * Effective tier including optional July campaign boost for base-free users.
 */
export function getEffectiveSubscriptionTier(
  tier: SubscriptionTier | null | undefined,
  expiresAt: string | null | undefined,
  isAdmin: boolean = false,
  options: SubscriptionOptions = {}
): SubscriptionTier {
  const now = options.now ?? new Date();
  const includeCampaign = options.includeCampaign !== false;
  const baseTier = getBaseEffectiveTier(tier, expiresAt, isAdmin, now);

  if (
    includeCampaign &&
    !isAdmin &&
    baseTier === 'free' &&
    isJulyFreeAccessActive(now)
  ) {
    return 'pro';
  }

  return baseTier;
}

/**
 * Profile-based subscription status with effective tier for access control.
 */
export function getEffectiveSubscription(
  profile: SubscriptionProfile,
  options: SubscriptionOptions = {}
): SubscriptionStatus {
  const now = options.now ?? new Date();
  const tier = (profile.subscription_tier as SubscriptionTier) || 'free';
  const expiresAt = profile.subscription_expires_at ?? null;
  const isAdmin = Boolean(profile.is_admin);
  const isExpired = isSubscriptionExpired(expiresAt, now);
  const includeCampaign = options.includeCampaign !== false;
  const isJulyPromoActive =
    includeCampaign &&
    !isAdmin &&
    getBaseEffectiveTier(tier, expiresAt, isAdmin, now) === 'free' &&
    isJulyFreeAccessActive(now);
  const effectiveTier = getEffectiveSubscriptionTier(
    tier,
    expiresAt,
    isAdmin,
    { now, includeCampaign }
  );

  return {
    tier,
    expiresAt,
    isExpired,
    effectiveTier,
    isJulyPromoActive,
  };
}

/**
 * Validates subscription status and returns effective tier
 */
export function validateSubscription(
  tier: SubscriptionTier | null | undefined,
  expiresAt: string | null | undefined,
  isAdmin: boolean = false,
  options: SubscriptionOptions = {}
): SubscriptionStatus {
  return getEffectiveSubscription(
    { subscription_tier: tier, subscription_expires_at: expiresAt, is_admin: isAdmin },
    options
  );
}

/**
 * Checks if a user has active Pro or Lifetime subscription (campaign-aware by default)
 */
export function hasActiveProSubscription(
  tier: SubscriptionTier | null | undefined,
  expiresAt: string | null | undefined,
  isAdmin: boolean = false,
  options: SubscriptionOptions = {}
): boolean {
  const effectiveTier = getEffectiveSubscriptionTier(
    tier,
    expiresAt,
    isAdmin,
    options
  );
  return effectiveTier === 'pro' || effectiveTier === 'lifetime' || isAdmin;
}

/**
 * Whether the pathname allows the July banner (excluding admin/billing/auth).
 */
export function isJulyFreeAccessBannerPath(pathname: string): boolean {
  if (pathname.startsWith('/admin')) return false;
  if (pathname.startsWith('/auth')) return false;
  if (pathname.startsWith('/subscribe')) return false;
  if (pathname.startsWith('/api/payments')) return false;
  return true;
}

/**
 * Whether the July banner should render for the current pathname.
 */
export function shouldShowJulyFreeAccessBanner(
  pathname: string,
  now: Date = new Date()
): boolean {
  return isJulyFreeAccessBannerPath(pathname) && isJulyFreeAccessBannerVisible(now);
}
