'use server';

import { isOkAdminSession, requireAdminSession } from '@/lib/admin-session';
import { backfillPaymentsFromPayMongo } from '@/lib/paymongo-sync';

export async function backfillPayMongoPayments(): Promise<{
  success: boolean;
  imported?: number;
  alreadySynced?: number;
  skipped?: number;
  errors?: number;
  error?: string;
}> {
  const session = await requireAdminSession();
  if (!isOkAdminSession(session)) {
    return { success: false, error: session.error ?? 'Unauthorized' };
  }

  const secretKey = process.env.PAYMONGO_SECRET_KEY;
  if (!secretKey) {
    return { success: false, error: 'PAYMONGO_SECRET_KEY is not configured.' };
  }

  try {
    const result = await backfillPaymentsFromPayMongo(session.admin, secretKey);
    return { success: true, ...result };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'PayMongo import failed';
    console.error('[Admin] backfillPayMongoPayments:', message);
    return { success: false, error: message };
  }
}
