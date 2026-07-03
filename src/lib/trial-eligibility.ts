import { createHash } from 'crypto';

/** Signup trial length — must match auth callback grant duration. */
export const TRIAL_DURATION_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * SHA-256 hex digest of lowercase trimmed email.
 * Must match public.claim_trial_if_eligible() in trial-history-migration.sql.
 */
export function hashEmailForTrial(email: string): string {
  const normalized = email.trim().toLowerCase();
  return createHash('sha256').update(normalized).digest('hex');
}

export function resolveOAuthProvider(
  appMetadata: Record<string, unknown> | undefined
): string {
  const provider = appMetadata?.provider;
  if (typeof provider === 'string' && provider.trim()) {
    return provider.trim();
  }
  return 'google';
}

export type TrialSubscriptionDefaults = {
  subscription_tier: 'free' | 'pro';
  subscription_expires_at: string | null;
};

/**
 * Maps server-side trial eligibility result to profile subscription defaults.
 */
export function resolveTrialSubscription(
  grantTrial: boolean,
  nowMs: number = Date.now()
): TrialSubscriptionDefaults {
  if (grantTrial) {
    return {
      subscription_tier: 'pro',
      subscription_expires_at: new Date(nowMs + TRIAL_DURATION_MS).toISOString(),
    };
  }

  return {
    subscription_tier: 'free',
    subscription_expires_at: null,
  };
}

export type TrialHistoryRecord = {
  auth_user_id: string;
  email_hash: string;
  provider: string;
  first_trial_at: string;
};

/**
 * In-memory trial ledger mirroring claim_trial_if_eligible DB semantics.
 * Used by unit tests to prove delete + recreate cannot re-grant trials.
 */
export class TrialHistoryStore {
  private readonly byAuthUserId = new Map<string, TrialHistoryRecord>();
  private readonly byEmailHash = new Map<string, TrialHistoryRecord>();

  claimTrialIfEligible(
    authUserId: string,
    email: string,
    provider: string = 'google',
    nowMs: number = Date.now()
  ): boolean {
    if (!authUserId || !email.trim()) {
      return false;
    }

    const emailHash = hashEmailForTrial(email);

    if (this.byAuthUserId.has(authUserId) || this.byEmailHash.has(emailHash)) {
      return false;
    }

    const record: TrialHistoryRecord = {
      auth_user_id: authUserId,
      email_hash: emailHash,
      provider,
      first_trial_at: new Date(nowMs).toISOString(),
    };

    this.byAuthUserId.set(authUserId, record);
    this.byEmailHash.set(emailHash, record);
    return true;
  }

  /** Simulates account deletion — trial history must remain. */
  deleteAccount(authUserId: string): void {
    this.byAuthUserId.delete(authUserId);
  }

  hasEmailConsumedTrial(email: string): boolean {
    return this.byEmailHash.has(hashEmailForTrial(email));
  }
}
