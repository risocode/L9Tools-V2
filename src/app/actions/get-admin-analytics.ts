'use server';

import { isOkAdminSession, requireAdminSession } from '@/lib/admin-session';
import { queryAdminAnalytics } from '@/lib/admin-data';

export interface AdminAnalytics {
  signupsLast7Days: number;
  proExpiringNext7Days: number;
}

export async function getAdminAnalytics(): Promise<{ data: AdminAnalytics | null; error: string | null }> {
  const session = await requireAdminSession();

  if (!isOkAdminSession(session)) {
    return { data: null, error: session.error ?? 'Unauthorized' };
  }

  const data = await queryAdminAnalytics(session.admin);
  return { data, error: null };
}
