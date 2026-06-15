'use server';

import { getSupabaseAdmin, verifyAdminStatus } from '@/lib/supabase-admin';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getEffectiveSubscriptionTier, NO_CAMPAIGN } from '@/lib/subscription-utils';
import { logAdminAction } from '@/lib/admin-audit';

/**
 * Validates all subscriptions and auto-downgrades expired Pro subscriptions to Free
 * Admin-only action
 */
export async function validateExpiredSubscriptions(): Promise<{ 
  success: boolean; 
  downgraded: number;
  error: string | null;
}> {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { 
        success: false, 
        downgraded: 0,
        error: 'Authentication required' 
      };
    }
    
    const isAdmin = await verifyAdminStatus(user);
    if (!isAdmin) {
      return { 
        success: false, 
        downgraded: 0,
        error: 'Admin access required' 
      };
    }

    // Get admin client
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return {
        success: false,
        downgraded: 0,
        error: 'Could not create admin database client'
      };
    }

    // Get all Pro users
    const { data: proUsers, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('id, subscription_tier, subscription_expires_at, is_admin')
      .eq('subscription_tier', 'pro');

    if (fetchError) {
      return {
        success: false,
        downgraded: 0,
        error: `Failed to fetch Pro users: ${fetchError.message}`
      };
    }

    if (!proUsers || proUsers.length === 0) {
      return {
        success: true,
        downgraded: 0,
        error: null
      };
    }

    // Find expired subscriptions
    const now = new Date();
    const expiredUserIds: string[] = [];

    for (const profile of proUsers) {
      // Skip admins and lifetime users
      if (profile.is_admin) {
        continue;
      }

      // Check if expired
      const effectiveTier = getEffectiveSubscriptionTier(
        profile.subscription_tier as any,
        profile.subscription_expires_at,
        profile.is_admin,
        NO_CAMPAIGN
      );

      if (effectiveTier === 'free') {
        expiredUserIds.push(profile.id);
      }
    }

    if (expiredUserIds.length === 0) {
      return {
        success: true,
        downgraded: 0,
        error: null
      };
    }

    // Downgrade expired subscriptions
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        subscription_tier: 'free',
        updated_at: new Date().toISOString(),
      })
      .in('id', expiredUserIds);

    if (updateError) {
      return {
        success: false,
        downgraded: 0,
        error: `Failed to downgrade subscriptions: ${updateError.message}`
      };
    }

    await logAdminAction({
      adminId: user.id,
      action: 'validate_expired_subscriptions',
      metadata: { downgraded: expiredUserIds.length },
    });

    return {
      success: true,
      downgraded: expiredUserIds.length,
      error: null
    };
  } catch (error: any) {
    return {
      success: false,
      downgraded: 0,
      error: error.message || 'Failed to validate expired subscriptions'
    };
  }
}
