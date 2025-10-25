
'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getSupabaseAdmin, verifyAdminStatus } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';

export async function refreshUserStatsCache(): Promise<{ success: boolean, error: string | null }> {
  
  const supabaseUserClient = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabaseUserClient.auth.getUser();

  if (authError || !authData?.user) {
    return { success: false, error: 'You must be logged in.' };
  }
  
  const user = authData.user;
  const isAdmin = await verifyAdminStatus(user);
  
  if (!isAdmin) {
    return { success: false, error: 'You are not authorized to perform this action.' };
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return { success: false, error: 'Could not create admin database client.' };
  }

  // Calling the RPC will trigger the refresh logic inside the database
  const { error } = await supabaseAdmin.rpc('refresh_user_stats_cache');

  if (error) {
    console.error('[Admin Action] Error refreshing user stats cache:', error.message);
    return { success: false, error: 'Database error: Could not refresh user stats.' };
  }

  // Revalidate the admin page to show the new stats
  revalidatePath('/admin');

  return { success: true, error: null };
}
