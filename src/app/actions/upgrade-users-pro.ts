'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';

interface UpgradeUsersOptions {
  durationMonths?: number;
  upgradeAll?: boolean;
  userIds?: string[];
}

/**
 * Upgrade users to Pro tier for a specified duration
 * Admin-only action
 */
export async function upgradeUsersToPro(options: UpgradeUsersOptions = {}) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { 
        success: false, 
        message: 'Authentication required' 
      };
    }

    // Check if user is admin using centralized verification
    const { verifyAdminStatus } = await import('@/lib/supabase-admin');
    const isAdmin = await verifyAdminStatus(user);
    
    if (!isAdmin) {
      return { 
        success: false, 
        message: 'Admin access required' 
      };
    }

    const { durationMonths = 1, upgradeAll = false, userIds = [] } = options;
    
    // Calculate expiration date
    const expirationDate = new Date();
    expirationDate.setMonth(expirationDate.getMonth() + durationMonths);

    let targetUserIds: string[] = [];

    if (upgradeAll) {
      // Get all free users
      const { data: freeUsers, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('subscription_tier', 'free');

      if (fetchError) {
        return {
          success: false,
          message: `Failed to fetch users: ${fetchError.message}`
        };
      }

      targetUserIds = freeUsers.map(u => u.id);
    } else if (userIds.length > 0) {
      targetUserIds = userIds;
    } else {
      return {
        success: false,
        message: 'No users selected for upgrade'
      };
    }

    if (targetUserIds.length === 0) {
      return {
        success: false,
        message: 'No users found to upgrade'
      };
    }

    // Use admin client for bulk update
    const supabaseAdminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseAdminUrl || !supabaseServiceKey) {
      return {
        success: false,
        message: 'Admin API credentials not configured'
      };
    }

    const { createClient } = await import('@supabase/supabase-js');
    const adminClient = createClient(supabaseAdminUrl, supabaseServiceKey);

    // Update users to Pro tier
    const { data: updatedUsers, error: updateError } = await adminClient
      .from('profiles')
      .update({
        subscription_tier: 'pro',
        subscription_expires_at: expirationDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .in('id', targetUserIds)
      .eq('subscription_tier', 'free')
      .select('id');

    if (updateError) {
      return {
        success: false,
        message: `Failed to upgrade users: ${updateError.message}`
      };
    }

    return {
      success: true,
      upgraded: updatedUsers?.length || 0,
      total: targetUserIds.length,
      expirationDate: expirationDate.toISOString(),
      message: `Successfully upgraded ${updatedUsers?.length || 0} user(s) to Pro for ${durationMonths} month(s)`
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to upgrade users',
    };
  }
}
