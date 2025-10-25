
'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getSupabaseAdmin, verifyAdminStatus } from '@/lib/supabase-admin';

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
    const [
      { count: total_users, error: totalError },
      { count: pro_users, error: proError },
      { count: lifetime_users, error: lifetimeError },
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_tier', 'pro'),
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_tier', 'lifetime'),
    ]);

    if (totalError || proError || lifetimeError) {
      console.error('[Admin Action] Error fetching user counts:', { totalError, proError, lifetimeError });
      return { data: null, error: 'Database error: Could not fetch user counts.' };
    }
    
    const totalUsers = total_users ?? 0;
    const proUsers = pro_users ?? 0;
    const lifetimeUsers = lifetime_users ?? 0;
    
    // Reliably calculate free users on the server side.
    const freeUsers = totalUsers - proUsers - lifetimeUsers;

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
