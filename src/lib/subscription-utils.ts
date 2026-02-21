/**
 * Subscription validation utilities
 * Checks if subscriptions are expired and provides effective tier
 */

export type SubscriptionTier = 'free' | 'pro' | 'lifetime';

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  expiresAt: string | null;
  isExpired: boolean;
  effectiveTier: SubscriptionTier; // The actual tier considering expiration
}

/**
 * Validates if a subscription is expired based on expiration date
 * @param expiresAt - ISO date string or null
 * @returns true if subscription is expired, false otherwise
 */
export function isSubscriptionExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) {
    return false; // No expiration means not expired (for lifetime/admin)
  }
  
  const expirationDate = new Date(expiresAt);
  const now = new Date();
  
  // Check if expiration date is in the past
  return now > expirationDate;
}

/**
 * Gets the effective subscription tier considering expiration
 * If subscription is expired, downgrades 'pro' to 'free'
 * @param tier - Current subscription tier
 * @param expiresAt - ISO date string or null
 * @param isAdmin - Whether user is an admin (admin never expires)
 * @returns The effective tier considering expiration
 */
export function getEffectiveSubscriptionTier(
  tier: SubscriptionTier | null | undefined,
  expiresAt: string | null | undefined,
  isAdmin: boolean = false
): SubscriptionTier {
  // Admin and lifetime never expire
  if (isAdmin || tier === 'lifetime') {
    return tier || 'free';
  }
  
  // Free tier is always free
  if (tier === 'free' || !tier) {
    return 'free';
  }
  
  // Pro tier - check if expired
  if (tier === 'pro') {
    if (isSubscriptionExpired(expiresAt)) {
      return 'free'; // Downgrade to free if expired
    }
    return 'pro';
  }
  
  // Fallback
  return 'free';
}

/**
 * Validates subscription status and returns effective tier
 * @param tier - Current subscription tier
 * @param expiresAt - ISO date string or null
 * @param isAdmin - Whether user is an admin
 * @returns SubscriptionStatus object
 */
export function validateSubscription(
  tier: SubscriptionTier | null | undefined,
  expiresAt: string | null | undefined,
  isAdmin: boolean = false
): SubscriptionStatus {
  const isExpired = isSubscriptionExpired(expiresAt);
  const effectiveTier = getEffectiveSubscriptionTier(tier, expiresAt, isAdmin);
  
  return {
    tier: tier || 'free',
    expiresAt: expiresAt || null,
    isExpired,
    effectiveTier,
  };
}

/**
 * Checks if a user has active Pro or Lifetime subscription
 * @param tier - Current subscription tier
 * @param expiresAt - ISO date string or null
 * @param isAdmin - Whether user is an admin
 * @returns true if user has active Pro/Lifetime subscription
 */
export function hasActiveProSubscription(
  tier: SubscriptionTier | null | undefined,
  expiresAt: string | null | undefined,
  isAdmin: boolean = false
): boolean {
  const effectiveTier = getEffectiveSubscriptionTier(tier, expiresAt, isAdmin);
  return effectiveTier === 'pro' || effectiveTier === 'lifetime' || isAdmin;
}
