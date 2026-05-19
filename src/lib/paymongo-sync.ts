import type { AdminSupabaseClient } from '@/lib/admin-session';
import { recordPayment } from '@/lib/payment-records';

interface PayMongoPaymentResource {
  id: string;
  attributes: {
    amount: number;
    status: string;
    paid_at?: number;
    payment_intent_id?: string;
    description?: string;
  };
  relationships?: {
    payment_intent?: { data?: { id?: string } };
  };
}

interface PaymentIntentDetails {
  userId?: string;
  plan?: string;
  months: number;
  email?: string;
  description?: string;
}

function payMongoAuthHeader(secretKey: string): string {
  return `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`;
}

function payMongoHeaders(secretKey: string): HeadersInit {
  return {
    Authorization: payMongoAuthHeader(secretKey),
    'Content-Type': 'application/json',
  };
}

export function parseSubscriptionFromDescription(description?: string): {
  plan: string;
  months: number;
} | null {
  if (!description) return null;
  const match = description.match(/L9 Tools (\w+) subscription\s*-\s*(\d+)\s*month/i);
  if (!match) return null;
  return {
    plan: match[1].toLowerCase(),
    months: parseInt(match[2], 10) || 1,
  };
}

async function fetchPaidPaymentsPage(
  secretKey: string,
  after?: string
): Promise<{ payments: PayMongoPaymentResource[]; hasMore: boolean; lastId?: string }> {
  const url = new URL('https://api.paymongo.com/v1/payments');
  url.searchParams.set('limit', '100');
  if (after) url.searchParams.set('after', after);

  const response = await fetch(url.toString(), { headers: payMongoHeaders(secretKey) });

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

async function fetchPaymentResource(
  secretKey: string,
  paymentId: string
): Promise<PayMongoPaymentResource | null> {
  const response = await fetch(`https://api.paymongo.com/v1/payments/${paymentId}`, {
    headers: payMongoHeaders(secretKey),
  });
  if (!response.ok) return null;
  const body = await response.json();
  return (body.data ?? null) as PayMongoPaymentResource | null;
}

async function resolvePaymentIntentId(
  secretKey: string,
  payment: PayMongoPaymentResource
): Promise<string | undefined> {
  const fromRelationship = payment.relationships?.payment_intent?.data?.id;
  if (fromRelationship) return fromRelationship;

  const fromAttributes = payment.attributes?.payment_intent_id;
  if (fromAttributes) return fromAttributes;

  const full = await fetchPaymentResource(secretKey, payment.id);
  if (!full) return undefined;

  return (
    full.relationships?.payment_intent?.data?.id ??
    full.attributes?.payment_intent_id ??
    undefined
  );
}

async function fetchPaymentIntentDetails(
  secretKey: string,
  paymentIntentId: string
): Promise<PaymentIntentDetails> {
  const response = await fetch(`https://api.paymongo.com/v1/payment_intents/${paymentIntentId}`, {
    headers: payMongoHeaders(secretKey),
  });

  if (!response.ok) {
    return { months: 1 };
  }

  const body = await response.json();
  const attributes = body.data?.attributes ?? {};
  const metadata = attributes.metadata ?? {};
  const description = attributes.description as string | undefined;
  const parsed = parseSubscriptionFromDescription(description);

  return {
    userId: metadata.user_id as string | undefined,
    plan: (metadata.plan as string | undefined) ?? parsed?.plan,
    months: parseInt(String(metadata.months ?? parsed?.months ?? '1'), 10) || 1,
    email: metadata.email as string | undefined,
    description,
  };
}

async function resolveUserIdByEmail(
  admin: AdminSupabaseClient,
  email?: string
): Promise<string | null> {
  if (!email) return null;
  const { data } = await admin.from('profiles').select('id').eq('email', email).maybeSingle();
  return data?.id ?? null;
}

export interface PayMongoBackfillResult {
  imported: number;
  alreadySynced: number;
  skipped: number;
  errors: number;
}

/** Import historical paid PayMongo payments into payment_records (admin only). */
export async function backfillPaymentsFromPayMongo(
  admin: AdminSupabaseClient,
  secretKey: string
): Promise<PayMongoBackfillResult> {
  const result: PayMongoBackfillResult = {
    imported: 0,
    alreadySynced: 0,
    skipped: 0,
    errors: 0,
  };
  let after: string | undefined;
  let hasMore = true;
  const intentCache = new Map<string, PaymentIntentDetails>();

  while (hasMore) {
    const page = await fetchPaidPaymentsPage(secretKey, after);
    if (page.payments.length === 0) break;

    for (const payment of page.payments) {
      const paymentIntentId = await resolvePaymentIntentId(secretKey, payment);
      if (!paymentIntentId) {
        result.skipped++;
        continue;
      }

      let details = intentCache.get(paymentIntentId);
      if (!details) {
        details = await fetchPaymentIntentDetails(secretKey, paymentIntentId);
        intentCache.set(paymentIntentId, details);
      }

      const parsed =
        parseSubscriptionFromDescription(details.description) ??
        parseSubscriptionFromDescription(payment.attributes?.description);

      const plan = details.plan ?? parsed?.plan ?? 'unknown';
      const months = details.months ?? parsed?.months ?? 1;
      let userId = details.userId ?? null;

      if (!userId) {
        userId = await resolveUserIdByEmail(admin, details.email);
      }

      const paidAt =
        payment.attributes.paid_at != null
          ? new Date(payment.attributes.paid_at * 1000).toISOString()
          : new Date().toISOString();

      const recordResult = await recordPayment(admin, {
        userId,
        paymongoPaymentId: payment.id,
        paymongoPaymentIntentId: paymentIntentId,
        amountCents: payment.attributes.amount,
        plan,
        months,
        userEmail: details.email ?? null,
        paidAt,
      });

      if (recordResult.duplicate) result.alreadySynced++;
      else if (recordResult.ok) result.imported++;
      else if (recordResult.error) result.errors++;
      else result.skipped++;
    }

    after = page.lastId;
    hasMore = page.hasMore;
  }

  return result;
}
