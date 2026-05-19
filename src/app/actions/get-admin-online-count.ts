'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getSupabaseAdmin, verifyAdminStatus } from '@/lib/supabase-admin';
import { ONLINE_THRESHOLD_MS } from '@/lib/admin-constants';

/**
 * Count users matching the same "online" rules as the admin user table.
 */
export async function getAdminOnlineCount(): Promise<{ count: number; error: string | null }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { count: 0, error: 'You must be logged in.' };
  }

  if (!(await verifyAdminStatus(user))) {
    return { count: 0, error: 'Not authorized.' };
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return { count: 0, error: 'Admin client unavailable.' };
  }

  const thresholdIso = new Date(Date.now() - ONLINE_THRESHOLD_MS).toISOString();

  const { count, error } = await supabaseAdmin
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .in('online_status', ['online', 'away'])
    .gte('last_sign_in_at', thresholdIso);

  if (error) {
    return { count: 0, error: error.message };
  }

  return { count: count ?? 0, error: null };
}
