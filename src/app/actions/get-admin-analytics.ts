'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getSupabaseAdmin, verifyAdminStatus } from '@/lib/supabase-admin';

export interface AdminAnalytics {
  signupsLast7Days: number;
  proExpiringNext7Days: number;
}

export async function getAdminAnalytics(): Promise<{ data: AdminAnalytics | null; error: string | null }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: 'You must be logged in.' };
  }

  if (!(await verifyAdminStatus(user))) {
    return { data: null, error: 'Not authorized.' };
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return { data: null, error: 'Admin client unavailable.' };
  }

  const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('get_admin_analytics');

  if (!rpcError && rpcData?.length) {
    const row = rpcData[0];
    return {
      data: {
        signupsLast7Days: Number(row.signups_last_7_days) || 0,
        proExpiringNext7Days: Number(row.pro_expiring_next_7_days) || 0,
      },
      error: null,
    };
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const sevenDaysAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [signupsRes, expiringRes] = await Promise.all([
    supabaseAdmin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString()),
    supabaseAdmin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('subscription_tier', 'pro')
      .eq('is_admin', false)
      .gt('subscription_expires_at', now.toISOString())
      .lte('subscription_expires_at', sevenDaysAhead.toISOString()),
  ]);

  return {
    data: {
      signupsLast7Days: signupsRes.count ?? 0,
      proExpiringNext7Days: expiringRes.count ?? 0,
    },
    error: null,
  };
}
