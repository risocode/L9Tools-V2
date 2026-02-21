'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

interface UpdateOnlineStatusArgs {
  userId: string;
  status: 'online' | 'away' | 'offline';
}

/**
 * Updates the online_status field for a user
 * Can be called by users to update their own status
 */
export async function updateOnlineStatus({
  userId,
  status,
}: UpdateOnlineStatusArgs): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createSupabaseServerClient();

    // Verify user is updating their own status or is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Users can only update their own status
    if (user.id !== userId) {
      // Check if admin (for potential admin override)
      const { verifyAdminStatus } = await import('@/lib/supabase-admin');
      const isAdmin = await verifyAdminStatus(user);

      if (!isAdmin) {
        return {
          success: false,
          error: 'You can only update your own online status',
        };
      }
    }

    // Update last_sign_in_at when user comes online (if not already set recently)
    const updateFields: any = {
      online_status: status,
      updated_at: new Date().toISOString(),
    };

    // If user is coming online, also update last_sign_in_at
    if (status === 'online') {
      updateFields.last_sign_in_at = new Date().toISOString();
    }

    // Use admin client for update to bypass RLS if needed
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      // Fallback to regular client
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateFields)
        .eq('id', userId);

      if (updateError) {
        return {
          success: false,
          error: `Failed to update online status: ${updateError.message}`,
        };
      }
    } else {
      // Use admin client
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update(updateFields)
        .eq('id', userId);

      if (updateError) {
        return {
          success: false,
          error: `Failed to update online status: ${updateError.message}`,
        };
      }
    }

    return {
      success: true,
      error: null,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to update online status',
    };
  }
}
