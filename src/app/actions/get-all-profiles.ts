
'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getSupabaseAdmin, verifyAdminStatus } from '@/lib/supabase-admin';
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
          queryBuilder = queryBuilder.or('subscription_tier.eq.free,subscription_tier.is.null');
      } else {
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
    .order('created_at', { ascending: false })
    .range(from, to);

  // Execute the query
  const { data: paginatedProfiles, error: profilesError, count } = await queryBuilder;

  if (profilesError) {
    console.error('[Admin Action] Supabase error fetching paginated profiles with admin client:', profilesError.message);
    return { profiles: null, count: null, error: 'Database error: Could not fetch profiles.' };
  }

  return { profiles: paginatedProfiles, count, error: null };
}
