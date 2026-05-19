'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getSupabaseAdmin, verifyAdminStatus } from '@/lib/supabase-admin';
import { getEffectiveSubscriptionTier } from '@/lib/subscription-utils';
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
  
  const supabaseUserClient = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabaseUserClient.auth.getUser();

  if (authError || !authData?.user) {
    return { profiles: null, count: null, error: 'You must be logged in to view profiles.' };
  }
  
  const user = authData.user;
  const isAdmin = await verifyAdminStatus(user);
  
  if (!isAdmin) {
    return { profiles: null, count: null, error: 'You are not authorized to perform this action.' };
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return { profiles: null, count: null, error: 'Could not create admin database client.' };
  }

  const search = query?.trim() || null;
  const extra = extraFilter === 'none' ? null : extraFilter;

  const { data: rpcRows, error: rpcError } = await supabaseAdmin.rpc('get_admin_profiles', {
    p_page: page,
    p_page_size: pageSize,
    p_search: search,
    p_tier_filter: tier,
    p_extra_filter: extra,
  });

  if (!rpcError && rpcRows && rpcRows.length > 0) {
    const row = rpcRows[0] as { profiles: Profile[] | string; total_count: number };
    const profilesRaw = row.profiles;
    const profiles = (typeof profilesRaw === 'string' ? JSON.parse(profilesRaw) : profilesRaw) as Profile[];
    return {
      profiles: Array.isArray(profiles) ? profiles : [],
      count: Number(row.total_count) ?? 0,
      error: null,
    };
  }

  if (rpcError) {
    console.warn('[Admin Action] get_admin_profiles RPC failed, using fallback:', rpcError.message);
  }

  return getAllProfilesFallback(supabaseAdmin, { page, pageSize, query: search ?? undefined, tier });
}

async function getAllProfilesFallback(
  supabaseAdmin: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  { page, pageSize, query, tier }: { page: number; pageSize: number; query?: string; tier: SubscriptionTierFilter }
): Promise<{ profiles: Profile[] | null; count: number | null; error: string | null; }> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let queryBuilder = supabaseAdmin.from('profiles').select('*', { count: 'exact' });

  if (tier && tier !== 'all') {
    if (tier === 'free') {
      queryBuilder = queryBuilder.or('subscription_tier.eq.free,subscription_tier.is.null,subscription_tier.eq.pro');
    } else if (tier === 'pro') {
      const now = new Date().toISOString();
      queryBuilder = queryBuilder
        .eq('subscription_tier', 'pro')
        .or(`subscription_expires_at.is.null,subscription_expires_at.gt.${now}`);
    } else {
      queryBuilder = queryBuilder.eq('subscription_tier', tier);
    }
  }

  if (query) {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidPattern.test(query)) {
      queryBuilder = queryBuilder.eq('id', query);
    } else {
      const searchPattern = `%${query}%`;
      queryBuilder = queryBuilder.or(
        `email.ilike.${searchPattern},display_name.ilike.${searchPattern},short_id.ilike.${searchPattern}`
      );
    }
  }

  queryBuilder = queryBuilder
    .order('last_sign_in_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(from, to);

  const { data: paginatedProfiles, error: profilesError, count } = await queryBuilder;

  if (profilesError) {
    console.error('[Admin Action] Supabase error fetching paginated profiles:', profilesError.message);
    return { profiles: null, count: null, error: 'Database error: Could not fetch profiles.' };
  }

  let filteredProfiles = paginatedProfiles || [];
  let finalCount = count;

  if (tier === 'free' && paginatedProfiles) {
    filteredProfiles = paginatedProfiles.filter((profile) => {
      const effectiveTier = getEffectiveSubscriptionTier(
        profile.subscription_tier as 'free' | 'pro' | 'lifetime' | null,
        profile.subscription_expires_at,
        profile.is_admin
      );
      return effectiveTier === 'free';
    });

    const countQueryBuilder = supabaseAdmin
      .from('profiles')
      .select('id, subscription_tier, subscription_expires_at, is_admin');

    if (query) {
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidPattern.test(query)) {
        countQueryBuilder.eq('id', query);
      } else {
        const searchPattern = `%${query}%`;
        countQueryBuilder.or(
          `email.ilike.${searchPattern},display_name.ilike.${searchPattern},short_id.ilike.${searchPattern}`
        );
      }
    }

    const { data: allMatchingProfiles } = await countQueryBuilder;

    if (allMatchingProfiles) {
      finalCount = allMatchingProfiles.filter((profile) => {
        const effectiveTier = getEffectiveSubscriptionTier(
          profile.subscription_tier as 'free' | 'pro' | 'lifetime' | null,
          profile.subscription_expires_at,
          profile.is_admin
        );
        return effectiveTier === 'free';
      }).length;
    }
  }

  return { profiles: filteredProfiles, count: finalCount, error: null };
}
