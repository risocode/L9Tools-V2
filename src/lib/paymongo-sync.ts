import type { AdminSupabaseClient } from '@/lib/admin-session';
import { recordPayment } from '@/lib/payment-records';

interface PayMongoPaymentResource {
  id: string;
  attributes: {
    amount: number;
    status: string;
    paid_at?: number;
  };
  relationships?: {
    payment_intent?: { data?: { id?: string } };
  };
}

function payMongoAuthHeader(secretKey: string): string {
  return `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`;
}

async function fetchPaidPaymentsPage(
  secretKey: string,
  after?: string
): Promise<{ payments: PayMongoPaymentResource[]; hasMore: boolean; lastId?: string }> {
  const url = new URL('https://api.paymongo.com/v1/payments');
  url.searchParams.set('limit', '100');
  if (after) url.searchParams.set('after', after);

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: payMongoAuthHeader(secretKey),
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      (err as { errors?: { detail?: string }[] })?.errors?.[0]?.detail ?? 'Failed to list PayMongo payments'
    );
  }

  const body = await response.json();
  const payments = (body.data ?? []) as PayMongoPaymentResource[];
  const paid = payments.filter((p) => p.attributes?.status === 'paid');
  const hasMore = Boolean(body.has_more) && payments.length > 0;
  const lastId = payments.length > 0 ? payments[payments.length - 1].id : undefined;

  return { payments: paid, hasMore, lastId };
}

async function fetchPaymentIntentMetadata(
  secretKey: string,
  paymentIntentId: string
): Promise<{ userId?: string; plan?: string; months: number; email?: string }> {
  const response = await fetch(`https://api.paymongo.com/v1/payment_intents/${paymentIntentId}`, {
    headers: {
      Authorization: payMongoAuthHeader(secretKey),
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    return { months: 1 };
  }

  const body = await response.json();
  const metadata = body.data?.attributes?.metadata ?? {};
  return {
    userId: metadata.user_id as string | undefined,
    plan: metadata.plan as string | undefined,
    months: parseInt(String(metadata.months ?? '1'), 10) || 1,
    email: metadata.email as string | undefined,
  };
}

export interface PayMongoBackfillResult {
  imported: number;
  skipped: number;
  errors: number;
}

/** Import historical paid PayMongo payments into payment_records (admin only). */
export async function backfillPaymentsFromPayMongo(
  admin: AdminSupabaseClient,
  secretKey: string
): Promise<PayMongoBackfillResult> {
  const result: PayMongoBackfillResult = { imported: 0, skipped: 0, errors: 0 };
  let after: string | undefined;
  let hasMore = true;
  const intentCache = new Map<string, Awaited<ReturnType<typeof fetchPaymentIntentMetadata>>>();

  while (hasMore) {
    const page = await fetchPaidPaymentsPage(secretKey, after);
    if (page.payments.length === 0) break;

    for (const payment of page.payments) {
      const paymentIntentId = payment.relationships?.payment_intent?.data?.id;
      if (!paymentIntentId) {
        result.skipped++;
        continue;
      }

      let meta = intentCache.get(paymentIntentId);
      if (!meta) {
        meta = await fetchPaymentIntentMetadata(secretKey, paymentIntentId);
        intentCache.set(paymentIntentId, meta);
      }

      if (!meta.userId || !meta.plan) {
        result.skipped++;
        continue;
      }

      const paidAt =
        payment.attributes.paid_at != null
          ? new Date(payment.attributes.paid_at * 1000).toISOString()
          : new Date().toISOString();

      const { ok } = await recordPayment(admin, {
        userId: meta.userId,
        paymongoPaymentId: payment.id,
        paymongoPaymentIntentId: paymentIntentId,
        amountCents: payment.attributes.amount,
        plan: meta.plan,
        months: meta.months,
        userEmail: meta.email,
        paidAt,
      });

      if (ok) result.imported++;
      else result.errors++;
    }

    after = page.lastId;
    hasMore = page.hasMore;
  }

  return result;
}
