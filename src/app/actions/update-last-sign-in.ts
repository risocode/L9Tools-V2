'use server';

import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { createSupabaseServerClient } from '@/lib/supabase-server';

/**
 * Updates the last_sign_in_at field for a user in the profiles table
 * Can be called from multiple places as a backup to ensure the field is updated
 */
export async function updateLastSignIn(userId: string): Promise<{ success: boolean; error: string | null }> {
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

    // Users can only update their own last_sign_in_at
    if (user.id !== userId) {
      // Check if admin (for potential admin override)
      const { verifyAdminStatus } = await import('@/lib/supabase-admin');
      const isAdmin = await verifyAdminStatus(user);

      if (!isAdmin) {
        return {
          success: false,
          error: 'You can only update your own last sign-in time',
        };
      }
    }

    // Use admin client for guaranteed update (bypasses RLS)
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      // Fallback to regular client
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          last_sign_in_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        return {
          success: false,
          error: `Failed to update last sign-in time: ${updateError.message}`,
        };
      }
    } else {
      // Use admin client for guaranteed update
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          last_sign_in_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        return {
          success: false,
          error: `Failed to update last sign-in time: ${updateError.message}`,
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
      error: error.message || 'Failed to update last sign-in time',
    };
  }
}
