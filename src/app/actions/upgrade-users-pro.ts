'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getSupabaseAdmin, verifyAdminStatus } from '@/lib/supabase-admin';
import { getEffectiveSubscriptionTier } from '@/lib/subscription-utils';
import { logAdminAction } from '@/lib/admin-audit';

interface UpgradeUsersOptions {
  durationMonths?: number;
  upgradeAll?: boolean;
  userIds?: string[];
}

export async function upgradeUsersToPro(options: UpgradeUsersOptions = {}) {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, message: 'Authentication required', upgraded: 0, totalEligible: 0, skipped: 0 };
    }

    const isAdmin = await verifyAdminStatus(user);
    
    if (!isAdmin) {
      return { success: false, message: 'Admin access required', upgraded: 0, totalEligible: 0, skipped: 0 };
    }

    const { durationMonths = 1, upgradeAll = false, userIds = [] } = options;
    
    const expirationDate = new Date();
    expirationDate.setMonth(expirationDate.getMonth() + durationMonths);

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return { success: false, message: 'Admin API credentials not configured', upgraded: 0, totalEligible: 0, skipped: 0 };
    }

    let targetUserIds: string[] = [];

    if (upgradeAll) {
      const { data: allProfiles, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select('id, subscription_tier, subscription_expires_at, is_admin');

      if (fetchError) {
        return {
          success: false,
          message: `Failed to fetch users: ${fetchError.message}`,
          upgraded: 0,
          totalEligible: 0,
          skipped: 0,
        };
      }

      targetUserIds = (allProfiles ?? [])
        .filter((p) => {
          if (p.is_admin) return false;
          return getEffectiveSubscriptionTier(
            p.subscription_tier as 'free' | 'pro' | 'lifetime' | null,
            p.subscription_expires_at,
            p.is_admin
          ) === 'free';
        })
        .map((p) => p.id);
    } else if (userIds.length > 0) {
      targetUserIds = userIds;
    } else {
      return {
        success: false,
        message: 'No users selected for upgrade',
        upgraded: 0,
        totalEligible: 0,
        skipped: 0,
      };
    }

    const totalEligible = targetUserIds.length;

    if (totalEligible === 0) {
      return {
        success: false,
        message: 'No eligible free users found to upgrade',
        upgraded: 0,
        totalEligible: 0,
        skipped: 0,
      };
    }

    const { data: updatedUsers, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        subscription_tier: 'pro',
        subscription_expires_at: expirationDate.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .in('id', targetUserIds)
      .select('id');

    if (updateError) {
      return {
        success: false,
        message: `Failed to upgrade users: ${updateError.message}`,
        upgraded: 0,
        totalEligible,
        skipped: totalEligible,
      };
    }

    const upgraded = updatedUsers?.length ?? 0;
    const skipped = totalEligible - upgraded;

    await logAdminAction({
      adminId: user.id,
      action: 'bulk_upgrade_pro',
      metadata: {
        upgraded,
        totalEligible,
        skipped,
        durationMonths,
        expirationDate: expirationDate.toISOString(),
      },
    });

    return {
      success: true,
      upgraded,
      totalEligible,
      skipped,
      expirationDate: expirationDate.toISOString(),
      message: `Successfully upgraded ${upgraded} user(s) to Pro for ${durationMonths} month(s)`,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to upgrade users';
    return {
      success: false,
      message,
      upgraded: 0,
      totalEligible: 0,
      skipped: 0,
    };
  }
}

export async function getUpgradeEligibleCount(): Promise<{ count: number; error: string | null }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { count: 0, error: 'Authentication required' };
  }

  const isAdmin = await verifyAdminStatus(user);
  if (!isAdmin) {
    return { count: 0, error: 'Admin access required' };
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return { count: 0, error: 'Admin client unavailable' };
  }

  const { data: allProfiles, error } = await supabaseAdmin
    .from('profiles')
    .select('id, subscription_tier, subscription_expires_at, is_admin');

  if (error) {
    return { count: 0, error: error.message };
  }

  const count = (allProfiles ?? []).filter((p) => {
    if (p.is_admin) return false;
    return getEffectiveSubscriptionTier(
      p.subscription_tier as 'free' | 'pro' | 'lifetime' | null,
      p.subscription_expires_at,
      p.is_admin
    ) === 'free';
  }).length;

  return { count, error: null };
}
