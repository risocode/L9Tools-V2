'use server';

import { isOkAdminSession, requireAdminSession } from '@/lib/admin-session';
import { queryPaymentPage, queryPaymentSummary, type AdminPaymentRow, type AdminPaymentSummary } from '@/lib/admin-data';

export type { AdminPaymentRow, AdminPaymentSummary };

export async function getAdminPaymentSummary(): Promise<{
  data: AdminPaymentSummary | null;
  error: string | null;
}> {
  const session = await requireAdminSession();
  if (!isOkAdminSession(session)) {
    return { data: null, error: session.error ?? 'Unauthorized' };
  }

  try {
    const data = await queryPaymentSummary(session.admin);
    return { data, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load payment summary';
    return { data: null, error: message };
  }
}

export async function getAdminPayments(
  page: number,
  pageSize: number
): Promise<{ payments: AdminPaymentRow[]; count: number; error: string | null }> {
  const session = await requireAdminSession();
  if (!isOkAdminSession(session)) {
    return { payments: [], count: 0, error: session.error ?? 'Unauthorized' };
  }

  return queryPaymentPage(session.admin, page, pageSize);
}
