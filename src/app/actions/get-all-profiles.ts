
'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getSupabaseAdmin, verifyAdminStatus } from '@/lib/supabase-admin';
import { getEffectiveSubscriptionTier } from '@/lib/subscription-utils';
import type { Profile } from '@/types'

type SubscriptionTier = 'all' | 'free' | 'pro' | 'lifetime';

interface GetAllProfilesParams {
  page: number;
  pageSize: number;
  query?: string;
  tier?: SubscriptionTier;
}

export async function getAllProfiles({ page, pageSize, query, tier = 'all' }: GetAllProfilesParams): Promise<{ profiles: Profile[] | null; count: number | null; error: string | null; }> {
  
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

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let queryBuilder = supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact' });

  // Apply tier filter
  if (tier && tier !== 'all') {
      if (tier === 'free') {
          // Free tier includes: free, null, AND expired pro users
          // We'll filter expired pro users in post-processing
          queryBuilder = queryBuilder.or('subscription_tier.eq.free,subscription_tier.is.null,subscription_tier.eq.pro');
      } else if (tier === 'pro') {
          // Pro tier: only active (non-expired) pro users
          // subscription_tier = 'pro' AND (subscription_expires_at IS NULL OR subscription_expires_at > now())
          const now = new Date().toISOString();
          queryBuilder = queryBuilder
            .eq('subscription_tier', 'pro')
            .or(`subscription_expires_at.is.null,subscription_expires_at.gt.${now}`);
      } else {
          // Lifetime tier: just filter by subscription_tier
          queryBuilder = queryBuilder.eq('subscription_tier', tier);
      }
  }

  // Apply search query if it exists
  if (query) {
    const searchPattern = `%${query}%`;
    queryBuilder = queryBuilder.or(
      `email.ilike.${searchPattern},display_name.ilike.${searchPattern},short_id.ilike.${searchPattern}`
    );
  }

  // Apply ordering and pagination
  queryBuilder = queryBuilder
    .order('last_sign_in_at', { ascending: false, nullsFirst: false }) // Online/recently active first
    .order('created_at', { ascending: false }) // Then by creation date
    .range(from, to);

  // Execute the query
  const { data: paginatedProfiles, error: profilesError, count } = await queryBuilder;

  if (profilesError) {
    console.error('[Admin Action] Supabase error fetching paginated profiles with admin client:', profilesError.message);
    return { profiles: null, count: null, error: 'Database error: Could not fetch profiles.' };
  }

  // Post-process for free tier filter: filter out active pro users, keep expired pro users
  let filteredProfiles = paginatedProfiles || [];
  let finalCount = count;
  
  if (tier === 'free' && paginatedProfiles) {
    // Filter to only show free tier users (including expired pro users)
    filteredProfiles = paginatedProfiles.filter(profile => {
      const effectiveTier = getEffectiveSubscriptionTier(
        profile.subscription_tier as 'free' | 'pro' | 'lifetime' | null,
        profile.subscription_expires_at,
        profile.is_admin
      );
      return effectiveTier === 'free';
    });

    // Recalculate count for free tier: need to count all free users (including expired pro)
    // Fetch all profiles matching search query (if any) to get accurate count
    const countQueryBuilder = supabaseAdmin
      .from('profiles')
      .select('id, subscription_tier, subscription_expires_at, is_admin');
    
    if (query) {
      const searchPattern = `%${query}%`;
      countQueryBuilder.or(
        `email.ilike.${searchPattern},display_name.ilike.${searchPattern},short_id.ilike.${searchPattern}`
      );
    }

    const { data: allMatchingProfiles } = await countQueryBuilder;
    
    if (allMatchingProfiles) {
      // Count all users with effective tier = 'free'
      const freeCount = allMatchingProfiles.filter(profile => {
        const effectiveTier = getEffectiveSubscriptionTier(
          profile.subscription_tier as 'free' | 'pro' | 'lifetime' | null,
          profile.subscription_expires_at,
          profile.is_admin
        );
        return effectiveTier === 'free';
      }).length;
      finalCount = freeCount;
    }
  }

  return { profiles: filteredProfiles, count: finalCount, error: null };
}
