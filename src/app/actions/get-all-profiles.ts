'use server'

import { isOkAdminSession, requireAdminSession } from '@/lib/admin-session';
import { queryProfilePage } from '@/lib/admin-data';
import type { Profile } from '@/types'
import type { AdminExtraFilter, SubscriptionTierFilter } from '@/lib/admin-constants';

interface GetAllProfilesParams {
  page: number;
  pageSize: number;
  query?: string;
  tier?: SubscriptionTierFilter;
  extraFilter?: AdminExtraFilter;
}

export async function getAllProfiles({
  page,
  pageSize,
  query,
  tier = 'all',
  extraFilter = 'none',
}: GetAllProfilesParams): Promise<{ profiles: Profile[] | null; count: number | null; error: string | null; }> {
  const session = await requireAdminSession();

  if (!isOkAdminSession(session)) {
    return { profiles: null, count: null, error: session.error ?? 'Unauthorized' };
  }

  const result = await queryProfilePage(session.admin, { page, pageSize, query, tier, extraFilter });

  if (result.error) {
    return { profiles: null, count: null, error: result.error };
  }

  return { profiles: result.profiles, count: result.count, error: null };
}
