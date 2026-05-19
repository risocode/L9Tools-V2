'use server';

import { ADMIN_PAGE_SIZE } from '@/lib/admin-constants';
import { isOkAdminSession, requireAdminSession } from '@/lib/admin-session';
import {
  queryAdminAnalytics,
  queryOnlineCount,
  queryPaymentSummary,
  queryProfilePage,
  queryUserStats,
  type AdminPaymentSummary,
} from '@/lib/admin-data';
import type { Profile } from '@/types';

export interface AdminDashboardPayload {
  stats: {
    total_users: number;
    pro_users: number;
    lifetime_users: number;
    free_users: number;
  } | null;
  profiles: Profile[];
  totalCount: number;
  analytics: {
    signupsLast7Days: number;
    proExpiringNext7Days: number;
  } | null;
  onlineCount: number;
  paymentSummary: AdminPaymentSummary | null;
  error: string | null;
}

/** One round-trip: single auth check, parallel DB reads for initial admin load. */
export async function loadAdminDashboard(): Promise<AdminDashboardPayload> {
  const session = await requireAdminSession();

  if (!isOkAdminSession(session)) {
    return {
      stats: null,
      profiles: [],
      totalCount: 0,
      analytics: null,
      onlineCount: 0,
      paymentSummary: null,
      error: session.error ?? 'Unauthorized',
    };
  }

  try {
    const [stats, profileResult, analytics, onlineCount, paymentSummary] = await Promise.all([
      queryUserStats(session.admin),
      queryProfilePage(session.admin, {
        page: 1,
        pageSize: ADMIN_PAGE_SIZE,
        tier: 'all',
        extraFilter: 'none',
      }),
      queryAdminAnalytics(session.admin),
      queryOnlineCount(session.admin),
      queryPaymentSummary(session.admin),
    ]);

    if (profileResult.error) {
      return {
        stats,
        profiles: [],
        totalCount: 0,
        analytics,
        onlineCount,
        paymentSummary,
        error: profileResult.error,
      };
    }

    return {
      stats,
      profiles: profileResult.profiles,
      totalCount: profileResult.count,
      analytics,
      onlineCount,
      paymentSummary,
      error: null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load admin dashboard';
    console.error('[Admin] loadAdminDashboard:', message);
    return {
      stats: null,
      profiles: [],
      totalCount: 0,
      analytics: null,
      onlineCount: 0,
      paymentSummary: null,
      error: message,
    };
  }
}
