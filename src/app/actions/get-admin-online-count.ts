'use server';

import { isOkAdminSession, requireAdminSession } from '@/lib/admin-session';
import { queryOnlineCount } from '@/lib/admin-data';

export async function getAdminOnlineCount(): Promise<{ count: number; error: string | null }> {
  const session = await requireAdminSession();

  if (!isOkAdminSession(session)) {
    return { count: 0, error: session.error ?? 'Unauthorized' };
  }

  const count = await queryOnlineCount(session.admin);
  return { count, error: null };
}
