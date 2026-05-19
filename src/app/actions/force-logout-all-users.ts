'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getSupabaseAdmin, verifyAdminStatus } from '@/lib/supabase-admin';
import { logAdminAction } from '@/lib/admin-audit';

export async function forceLogoutAllUsers() {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, message: 'Authentication required', sqlRequired: false as const };
    }

    const isAdmin = await verifyAdminStatus(user);
    
    if (!isAdmin) {
      return { success: false, message: 'Admin access required', sqlRequired: false as const };
    }

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return {
        success: false,
        message: 'Admin API credentials not configured.',
        sqlRequired: true,
        sqlCommand: 'SELECT public.force_logout_all_users();',
      };
    }

    const { error: rpcError } = await supabaseAdmin.rpc('force_logout_all_users');

    if (rpcError) {
      return {
        success: false,
        message: `RPC failed: ${rpcError.message}. Run admin-migrations.sql or execute manually.`,
        sqlRequired: true,
        sqlCommand: 'SELECT public.force_logout_all_users();',
      };
    }

    await logAdminAction({
      adminId: user.id,
      action: 'force_logout_all',
      metadata: {},
    });

    return {
      success: true,
      message: 'All users have been logged out. They must sign in again.',
      sqlRequired: false as const,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to force logout all users.';
    return {
      success: false,
      message,
      sqlRequired: true,
      sqlCommand: 'SELECT public.force_logout_all_users();',
    };
  }
}
