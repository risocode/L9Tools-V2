import { describe, expect, it } from 'vitest';
import {
  TrialHistoryStore,
  hashEmailForTrial,
  resolveOAuthProvider,
  resolveTrialSubscription,
  TRIAL_DURATION_MS,
} from './trial-eligibility';

describe('hashEmailForTrial', () => {
  it('normalizes email to lowercase trimmed SHA-256 hex', () => {
    const hash = hashEmailForTrial('  User@Example.COM  ');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).toBe(hashEmailForTrial('user@example.com'));
  });
});

describe('resolveTrialSubscription', () => {
  it('grants 3-day pro trial when eligible', () => {
    const now = Date.parse('2026-06-15T12:00:00.000Z');
    const result = resolveTrialSubscription(true, now);

    expect(result.subscription_tier).toBe('pro');
    expect(result.subscription_expires_at).toBe(
      new Date(now + TRIAL_DURATION_MS).toISOString()
    );
  });

  it('defaults to free when not eligible', () => {
    const result = resolveTrialSubscription(false);

    expect(result.subscription_tier).toBe('free');
    expect(result.subscription_expires_at).toBeNull();
  });
});

describe('resolveOAuthProvider', () => {
  it('uses app_metadata provider when present', () => {
    expect(resolveOAuthProvider({ provider: 'google' })).toBe('google');
  });

  it('falls back to google', () => {
    expect(resolveOAuthProvider(undefined)).toBe('google');
  });
});

describe('TrialHistoryStore', () => {
  it('grants trial on first sign-in', () => {
    const store = new TrialHistoryStore();
    expect(store.claimTrialIfEligible('user-1', 'alice@example.com')).toBe(true);
  });

  it('does not grant trial on sign out/sign in with same auth user', () => {
    const store = new TrialHistoryStore();
    expect(store.claimTrialIfEligible('user-1', 'alice@example.com')).toBe(true);
    expect(store.claimTrialIfEligible('user-1', 'alice@example.com')).toBe(false);
  });

  it('does not grant trial when profile would be recreated for same email', () => {
    const store = new TrialHistoryStore();
    expect(store.claimTrialIfEligible('user-1', 'alice@example.com')).toBe(true);

    store.deleteAccount('user-1');

    expect(store.hasEmailConsumedTrial('alice@example.com')).toBe(true);
    expect(store.claimTrialIfEligible('user-2', 'alice@example.com')).toBe(false);
  });

  it('allows unrelated accounts to receive their own trial', () => {
    const store = new TrialHistoryStore();
    expect(store.claimTrialIfEligible('user-1', 'alice@example.com')).toBe(true);
    expect(store.claimTrialIfEligible('user-2', 'bob@example.com')).toBe(true);
  });

  it('rejects empty email', () => {
    const store = new TrialHistoryStore();
    expect(store.claimTrialIfEligible('user-1', '   ')).toBe(false);
  });
});
