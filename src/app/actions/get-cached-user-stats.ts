
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
    // Fetch ALL profiles to calculate effective tiers (including expired subscriptions)
    // NO online status filtering - count ALL users regardless of online_status
    const { data: allProfiles, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('id, subscription_tier, subscription_expires_at, is_admin');

    if (fetchError) {
      console.error('[Admin Action] Error fetching profiles:', fetchError);
      return { data: null, error: 'Database error: Could not fetch user profiles.' };
    }

    if (!allProfiles || allProfiles.length === 0) {
      return {
        data: {
          total_users: 0,
          pro_users: 0,
          lifetime_users: 0,
          free_users: 0,
        },
        error: null
      };
    }

    // Count users by effective tier (considering expired subscriptions)
    let totalUsers = 0;
    let proUsers = 0;
    let lifetimeUsers = 0;
    let freeUsers = 0;

    for (const profile of allProfiles) {
      totalUsers++;
      
      const effectiveTier = getEffectiveSubscriptionTier(
        profile.subscription_tier as 'free' | 'pro' | 'lifetime' | null,
        profile.subscription_expires_at,
        profile.is_admin
      );

      if (effectiveTier === 'pro') {
        proUsers++;
      } else if (effectiveTier === 'lifetime') {
        lifetimeUsers++;
      } else {
        // Free tier includes: free, null, expired pro, and any other value
        freeUsers++;
      }
    }

    return { 
      data: {
        total_users: totalUsers,
        pro_users: proUsers,
        lifetime_users: lifetimeUsers,
        free_users: freeUsers < 0 ? 0 : freeUsers, // Ensure free users isn't negative
      },
      error: null 
    };

  } catch (err: any) {
    console.error('[Admin Action] Unexpected exception in getCachedUserStats:', err.message);
    return { data: null, error: 'An unexpected server error occurred while fetching user stats.' };
  }
}
