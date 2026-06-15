import type { AdminSupabaseClient } from '@/lib/admin-session';
import { recordPayment, type RecordPaymentInput } from '@/lib/payment-records';
import { isSubscriptionPlanId } from '@/lib/subscription-plans';

export interface FulfillSubscriptionInput {
  userId: string;
  plan: string;
  months: number;
  paymongoPaymentId: string;
  paymongoPaymentIntentId?: string | null;
  amountCents: number;
  userEmail?: string | null;
  paidAt?: string;
}

export type FulfillSubscriptionResult =
  | { ok: true; alreadyFulfilled: true }
  | { ok: true; alreadyFulfilled: false }
  | { ok: false; error: string };

async function activateSubscription(
  admin: AdminSupabaseClient,
  userId: string,
  plan: string,
  months: number
): Promise<void> {
  const subscriptionTier = plan === 'lifetime' ? 'lifetime' : 'pro';
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + months);

  const { data: existingProfile, error: fetchError } = await admin
    .from('profiles')
    .select('id, subscription_tier, subscription_expires_at')
    .eq('id', userId)
    .single();

  if (fetchError || !existingProfile) {
    throw new Error(`User profile not found: ${fetchError?.message ?? userId}`);
  }

  if (existingProfile.subscription_tier === 'lifetime' && subscriptionTier === 'pro') {
    return;
  }

  const { error } = await admin
    .from('profiles')
    .update({
      subscription_tier: subscriptionTier,
      subscription_expires_at: plan === 'lifetime' ? null : expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    throw error;
  }
}

/**
 * Idempotent payment → subscription fulfillment.
 * Skips when subscription_fulfilled_at is already set for this PayMongo payment.
 */
export async function fulfillSubscriptionFromPayment(
  admin: AdminSupabaseClient,
  input: FulfillSubscriptionInput
): Promise<FulfillSubscriptionResult> {
  if (!input.paymongoPaymentId || !input.userId) {
    return { ok: false, error: 'Missing payment or user id' };
  }

  if (!isSubscriptionPlanId(input.plan)) {
    return { ok: false, error: 'Invalid subscription plan' };
  }

  const { data: existingRecord } = await admin
    .from('payment_records')
    .select('id, subscription_fulfilled_at')
    .eq('paymongo_payment_id', input.paymongoPaymentId)
    .maybeSingle();

  if (existingRecord?.subscription_fulfilled_at) {
    return { ok: true, alreadyFulfilled: true };
  }

  if (existingRecord) {
    try {
      await activateSubscription(admin, input.userId, input.plan, input.months);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Activation failed';
      return { ok: false, error: message };
    }

    const fulfilledAt = new Date().toISOString();
    await admin
      .from('payment_records')
      .update({ subscription_fulfilled_at: fulfilledAt })
      .eq('paymongo_payment_id', input.paymongoPaymentId);

    return { ok: true, alreadyFulfilled: false };
  }

  const recordInput: RecordPaymentInput = {
    userId: input.userId,
    paymongoPaymentId: input.paymongoPaymentId,
    paymongoPaymentIntentId: input.paymongoPaymentIntentId,
    amountCents: input.amountCents,
    plan: input.plan,
    months: input.months,
    userEmail: input.userEmail,
    paidAt: input.paidAt,
  };

  const recordResult = await recordPayment(admin, recordInput);
  if (!recordResult.ok) {
    return { ok: false, error: recordResult.error ?? 'Failed to record payment' };
  }

  try {
    await activateSubscription(admin, input.userId, input.plan, input.months);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Activation failed';
    return { ok: false, error: message };
  }

  const fulfilledAt = new Date().toISOString();
  const { error: markError } = await admin
    .from('payment_records')
    .update({ subscription_fulfilled_at: fulfilledAt })
    .eq('paymongo_payment_id', input.paymongoPaymentId);

  if (markError) {
    console.error('[Subscription Fulfillment] Failed to mark fulfilled:', markError.message);
  }

  return { ok: true, alreadyFulfilled: false };
}
