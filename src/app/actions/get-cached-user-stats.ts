'use server'

import { isOkAdminSession, requireAdminSession } from '@/lib/admin-session';
import { queryUserStats } from '@/lib/admin-data';

export async function getCachedUserStats(): Promise<{ data: { total_users: number, pro_users: number, lifetime_users: number, free_users: number } | null; error: string | null; }> {
  const session = await requireAdminSession();

  if (!isOkAdminSession(session)) {
    return { data: null, error: session.error ?? 'Unauthorized' };
  }

  try {
    const stats = await queryUserStats(session.admin);
    return { data: stats, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Admin Action] getCachedUserStats:', message);
    return { data: null, error: 'An unexpected server error occurred while fetching user stats.' };
  }
}
