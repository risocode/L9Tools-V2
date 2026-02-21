'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';

/**
 * Force logout all users by invalidating all refresh tokens
 * This will require all users to sign in again on their next visit
 * 
 * NOTE: This requires Supabase Admin API access via RPC function
 */
export async function forceLogoutAllUsers() {
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

    const supabaseAdminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseAdminUrl || !supabaseServiceKey) {
      return {
        success: false,
        message: 'Admin API credentials not configured. Please run the SQL script manually in Supabase SQL Editor.',
        sqlRequired: true
      };
    }

    // Use admin client with service role key to access auth schema
    const { createClient } = await import('@supabase/supabase-js');
    const adminClient = createClient(supabaseAdminUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Attempt to delete all refresh tokens using RPC function
    // First, we need to create an RPC function in Supabase, or use direct SQL execution
    // For now, we'll use the Postgres REST API via admin client
    
    // Note: Direct deletion from auth.refresh_tokens requires RPC or SQL execution
    // This is a limitation of Supabase - auth tables are not directly accessible via the client
    // Return instruction to use SQL editor instead
    
    return {
      success: false,
      message: 'Please run the SQL script in Supabase SQL Editor. See FORCE_LOGOUT_ALL_USERS.sql file for instructions.',
      sqlRequired: true,
      sqlCommand: 'DELETE FROM auth.refresh_tokens;'
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to force logout all users. Please use SQL Editor.',
      sqlRequired: true
    };
  }
}
