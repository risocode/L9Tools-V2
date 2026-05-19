'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getSupabaseAdmin, verifyAdminStatus } from '@/lib/supabase-admin';
import { getEffectiveSubscriptionTier } from '@/lib/subscription-utils';

export async function getCachedUserStats(): Promise<{ data: { total_users: number, pro_users: number, lifetime_users: number, free_users: number } | null; error: string | null; }> {
  
  const supabaseUserClient = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabaseUserClient.auth.getUser();

  if (authError || !authData?.user) {
    return { data: null, error: 'You must be logged in.' };
  }
  
  const user = authData.user;
  const isAdmin = await verifyAdminStatus(user);
  
  if (!isAdmin) {
    return { data: null, error: 'You are not authorized to perform this action.' };
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return { data: null, error: 'Could not create admin database client.' };
  }

  try {
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('get_cached_user_stats');

    if (!rpcError && rpcData) {
      const row = Array.isArray(rpcData) ? rpcData[0] : rpcData;
      if (row && typeof row === 'object' && 'total_users' in row) {
        const stats = row as { total_users: number; pro_users: number; lifetime_users: number; free_users: number };
        return {
          data: {
            total_users: stats.total_users,
            pro_users: stats.pro_users,
            lifetime_users: stats.lifetime_users,
            free_users: stats.free_users < 0 ? 0 : stats.free_users,
          },
          error: null,
        };
      }
    }

    if (rpcError) {
      console.warn('[Admin Action] get_cached_user_stats RPC failed, using fallback:', rpcError.message);
    }

    const { data: allProfiles, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('id, subscription_tier, subscription_expires_at, is_admin');

    if (fetchError) {
      console.error('[Admin Action] Error fetching profiles:', fetchError);
      return { data: null, error: 'Database error: Could not fetch user profiles.' };
    }

    if (!allProfiles || allProfiles.length === 0) {
      return {
        data: { total_users: 0, pro_users: 0, lifetime_users: 0, free_users: 0 },
        error: null,
      };
    }

    let proUsers = 0;
    let lifetimeUsers = 0;
    let freeUsers = 0;

    for (const profile of allProfiles) {
      const effectiveTier = getEffectiveSubscriptionTier(
        profile.subscription_tier as 'free' | 'pro' | 'lifetime' | null,
        profile.subscription_expires_at,
        profile.is_admin
      );

      if (effectiveTier === 'pro') proUsers++;
      else if (effectiveTier === 'lifetime') lifetimeUsers++;
      else freeUsers++;
    }

    return {
      data: {
        total_users: allProfiles.length,
        pro_users: proUsers,
        lifetime_users: lifetimeUsers,
        free_users: freeUsers < 0 ? 0 : freeUsers,
      },
      error: null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Admin Action] Unexpected exception in getCachedUserStats:', message);
    return { data: null, error: 'An unexpected server error occurred while fetching user stats.' };
  }
}
