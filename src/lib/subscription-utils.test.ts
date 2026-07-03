import { describe, expect, it } from 'vitest';
import {
  getBaseEffectiveTier,
  getEffectiveSubscription,
  getEffectiveSubscriptionTier,
  hasActiveProSubscription,
  isJulyFreeAccessActive,
  isJulyFreeAccessBannerVisible,
  JULY_FREE_ACCESS_END_MS,
  JULY_FREE_ACCESS_START_MS,
  NO_CAMPAIGN,
  shouldShowJulyFreeAccessBanner,
} from './subscription-utils';

const beforeStart = new Date('2026-06-15T12:00:00.000Z');
const julyStartExact = new Date(JULY_FREE_ACCESS_START_MS);
const beforeEnd = new Date('2026-07-15T12:00:00.000Z');
const afterCampaign = new Date('2026-08-01T00:00:00.000Z');
const campaignEndExact = new Date(JULY_FREE_ACCESS_END_MS);

const freeProfile = {
  subscription_tier: 'free' as const,
  subscription_expires_at: null,
  is_admin: false,
};

describe('isJulyFreeAccessActive (Pro access)', () => {
  it('is inactive before July 1 Manila', () => {
    expect(isJulyFreeAccessActive(beforeStart)).toBe(false);
  });

  it('is active at July 1 start', () => {
    expect(isJulyFreeAccessActive(julyStartExact)).toBe(true);
  });

  it('is active mid-July', () => {
    expect(isJulyFreeAccessActive(beforeEnd)).toBe(true);
  });

  it('is inactive at exactly campaign end', () => {
    expect(isJulyFreeAccessActive(campaignEndExact)).toBe(false);
  });

  it('is inactive after campaign end', () => {
    expect(isJulyFreeAccessActive(afterCampaign)).toBe(false);
  });
});

describe('isJulyFreeAccessBannerVisible', () => {
  it('is visible before July 1 (pre-announcement)', () => {
    expect(isJulyFreeAccessBannerVisible(beforeStart)).toBe(true);
  });

  it('is visible during July', () => {
    expect(isJulyFreeAccessBannerVisible(beforeEnd)).toBe(true);
  });

  it('is hidden at campaign end', () => {
    expect(isJulyFreeAccessBannerVisible(campaignEndExact)).toBe(false);
  });
});

describe('July free-access campaign', () => {
  it('free user before July 1 sees banner window but stays Free', () => {
    expect(isJulyFreeAccessBannerVisible(beforeStart)).toBe(true);
    expect(isJulyFreeAccessActive(beforeStart)).toBe(false);
    const status = getEffectiveSubscription(freeProfile, { now: beforeStart });
    expect(status.effectiveTier).toBe('free');
    expect(status.isJulyPromoActive).toBe(false);
  });

  it('free user during July gets Pro effective access', () => {
    const status = getEffectiveSubscription(freeProfile, { now: beforeEnd });
    expect(status.effectiveTier).toBe('pro');
    expect(hasActiveProSubscription('free', null, false, { now: beforeEnd })).toBe(true);
    expect(status.isJulyPromoActive).toBe(true);
  });

  it('at exactly 2026-07-31T16:00:00.000Z access ends', () => {
    expect(isJulyFreeAccessActive(campaignEndExact)).toBe(false);
    const status = getEffectiveSubscription(freeProfile, { now: campaignEndExact });
    expect(status.effectiveTier).toBe('free');
  });

  it('after end time free users return to Free', () => {
    const status = getEffectiveSubscription(freeProfile, { now: afterCampaign });
    expect(status.effectiveTier).toBe('free');
    expect(hasActiveProSubscription('free', null, false, { now: afterCampaign })).toBe(false);
  });

  it('paid Pro user is unaffected during July', () => {
    const expires = '2026-12-31T00:00:00.000Z';
    const status = getEffectiveSubscription(
      { subscription_tier: 'pro', subscription_expires_at: expires, is_admin: false },
      { now: beforeEnd }
    );
    expect(status.effectiveTier).toBe('pro');
    expect(status.isJulyPromoActive).toBe(false);
  });

  it('admin remains unlimited during July', () => {
    expect(hasActiveProSubscription('free', null, true, { now: beforeEnd })).toBe(true);
    expect(getEffectiveSubscriptionTier('free', null, true, { now: beforeEnd })).toBe('free');
  });

  it('subscription fields are not mutated', () => {
    const profile = {
      subscription_tier: 'free' as const,
      subscription_expires_at: null as string | null,
      is_admin: false,
    };
    getEffectiveSubscription(profile, { now: beforeEnd });
    expect(profile.subscription_tier).toBe('free');
    expect(profile.subscription_expires_at).toBeNull();
  });

  it('billing paths with includeCampaign false ignore promo', () => {
    expect(
      getEffectiveSubscriptionTier('free', null, false, { now: beforeEnd, ...NO_CAMPAIGN })
    ).toBe('free');
  });
});

describe('shouldShowJulyFreeAccessBanner', () => {
  it('shows on boss-hunt before July 1', () => {
    expect(shouldShowJulyFreeAccessBanner('/boss-hunt', beforeStart)).toBe(true);
  });

  it('shows on boss-hunt during July', () => {
    expect(shouldShowJulyFreeAccessBanner('/boss-hunt', beforeEnd)).toBe(true);
  });

  it('hides after campaign end', () => {
    expect(shouldShowJulyFreeAccessBanner('/boss-hunt', afterCampaign)).toBe(false);
  });

  it('hides on admin, auth, subscribe, and payment paths', () => {
    expect(shouldShowJulyFreeAccessBanner('/admin', beforeStart)).toBe(false);
    expect(shouldShowJulyFreeAccessBanner('/auth/callback', beforeStart)).toBe(false);
    expect(shouldShowJulyFreeAccessBanner('/subscribe', beforeStart)).toBe(false);
  });
});
