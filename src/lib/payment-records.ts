import type { AdminSupabaseClient } from '@/lib/admin-session';

export interface RecordPaymentInput {
  userId?: string | null;
  paymongoPaymentId: string;
  paymongoPaymentIntentId?: string | null;
  amountCents: number;
  plan: string;
  months?: number;
  userEmail?: string | null;
  paidAt?: string;
}

/** Idempotent insert by paymongo_payment_id (service role only). */
export async function recordPayment(
  admin: AdminSupabaseClient,
  input: RecordPaymentInput
): Promise<{ ok: boolean; duplicate?: boolean; error?: string }> {
  if (!input.paymongoPaymentId || input.amountCents <= 0) {
    return { ok: false, error: 'Invalid payment record' };
  }

  const { data: existing } = await admin
    .from('payment_records')
    .select('id')
    .eq('paymongo_payment_id', input.paymongoPaymentId)
    .maybeSingle();

  if (existing) {
    return { ok: true, duplicate: true };
  }

  const { error } = await admin.from('payment_records').insert({
    user_id: input.userId ?? null,
    paymongo_payment_id: input.paymongoPaymentId,
    paymongo_payment_intent_id: input.paymongoPaymentIntentId ?? null,
    amount_cents: input.amountCents,
    currency: 'PHP',
    plan: input.plan,
    months: input.months ?? 1,
    status: 'paid',
    source: 'paymongo',
    user_email: input.userEmail ?? null,
    paid_at: input.paidAt ?? new Date().toISOString(),
  });

  if (error) {
    console.error('[Payment Records] Failed to record payment:', error.message);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
