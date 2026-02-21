'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getSupabaseAdmin, verifyAdminStatus } from '@/lib/supabase-admin';

interface UserStatus {
  id: string;
  online_status: string | null;
  last_sign_in_at: string | null;
}

export async function refreshUserStatus(
  userIds: string[]
): Promise<{ success: boolean; data: UserStatus[] | null; error: string | null }> {
  
  const supabaseUserClient = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabaseUserClient.auth.getUser();

  if (authError || !authData?.user) {
    return { success: false, data: null, error: 'You must be logged in.' };
  }
  
  const user = authData.user;
  const isAdmin = await verifyAdminStatus(user);
  
  if (!isAdmin) {
    return { success: false, data: null, error: 'You are not authorized to perform this action.' };
  }

  if (!userIds || userIds.length === 0) {
    return { success: false, data: null, error: 'No user IDs provided.' };
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return { success: false, data: null, error: 'Could not create admin database client.' };
  }

  // Fetch only online_status and last_sign_in_at for the specified user IDs
  const { data: profiles, error } = await supabaseAdmin
    .from('profiles')
    .select('id, online_status, last_sign_in_at')
    .in('id', userIds);

  if (error) {
    console.error('[Admin Action] Error refreshing user status:', error.message);
    return { success: false, data: null, error: 'Database error: Could not refresh user status.' };
  }

  return { success: true, data: profiles || [], error: null };
}
