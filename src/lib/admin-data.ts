import { getEffectiveSubscriptionTier, NO_CAMPAIGN } from '@/lib/subscription-utils';
import { ONLINE_THRESHOLD_MS, type AdminExtraFilter, type SubscriptionTierFilter } from '@/lib/admin-constants';
import type { Profile } from '@/types';
import type { AdminSupabaseClient } from '@/lib/admin-session';

export interface AdminStats {
  total_users: number;
  pro_users: number;
  lifetime_users: number;
  free_users: number;
}

export interface AdminAnalyticsData {
  signupsLast7Days: number;
  proExpiringNext7Days: number;
}

export interface ProfilePageParams {
  page: number;
  pageSize: number;
  query?: string;
  tier?: SubscriptionTierFilter;
  extraFilter?: AdminExtraFilter;
}

export async function queryUserStats(admin: AdminSupabaseClient): Promise<AdminStats> {
  const { data: rpcData, error: rpcError } = await admin.rpc('get_cached_user_stats');

  if (!rpcError && rpcData) {
    const row = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    if (row && typeof row === 'object' && 'total_users' in row) {
      const stats = row as AdminStats;
      return {
        total_users: stats.total_users,
        pro_users: stats.pro_users,
        lifetime_users: stats.lifetime_users,
        free_users: stats.free_users < 0 ? 0 : stats.free_users,
      };
    }
  }

  if (rpcError) {
    console.warn('[Admin] get_cached_user_stats RPC failed, using fallback:', rpcError.message);
  }

  const { data: allProfiles, error: fetchError } = await admin
    .from('profiles')
    .select('id, subscription_tier, subscription_expires_at, is_admin');

  if (fetchError || !allProfiles) {
    return { total_users: 0, pro_users: 0, lifetime_users: 0, free_users: 0 };
  }

  let proUsers = 0;
  let lifetimeUsers = 0;
  let freeUsers = 0;

  for (const profile of allProfiles) {
    const effectiveTier = getEffectiveSubscriptionTier(
      profile.subscription_tier as 'free' | 'pro' | 'lifetime' | null,
      profile.subscription_expires_at,
      profile.is_admin,
      NO_CAMPAIGN
    );
    if (effectiveTier === 'pro') proUsers++;
    else if (effectiveTier === 'lifetime') lifetimeUsers++;
    else freeUsers++;
  }

  return {
    total_users: allProfiles.length,
    pro_users: proUsers,
    lifetime_users: lifetimeUsers,
    free_users: freeUsers < 0 ? 0 : freeUsers,
  };
}

export async function queryProfilePage(
  admin: AdminSupabaseClient,
  { page, pageSize, query, tier = 'all', extraFilter = 'none' }: ProfilePageParams
): Promise<{ profiles: Profile[]; count: number; error: string | null }> {
  const search = query?.trim() || null;
  const extra = extraFilter === 'none' ? null : extraFilter;

  const { data: rpcRows, error: rpcError } = await admin.rpc('get_admin_profiles', {
    p_page: page,
    p_page_size: pageSize,
    p_search: search,
    p_tier_filter: tier,
    p_extra_filter: extra,
  });

  if (!rpcError && rpcRows && rpcRows.length > 0) {
    const row = rpcRows[0] as { profiles: Profile[] | string; total_count: number };
    const profilesRaw = row.profiles;
    const profiles = (typeof profilesRaw === 'string' ? JSON.parse(profilesRaw) : profilesRaw) as Profile[];
    return {
      profiles: Array.isArray(profiles) ? profiles : [],
      count: Number(row.total_count) ?? 0,
      error: null,
    };
  }

  if (rpcError) {
    console.warn('[Admin] get_admin_profiles RPC failed, using fallback:', rpcError.message);
  }

  return queryProfilePageFallback(admin, { page, pageSize, query: search ?? undefined, tier });
}

async function queryProfilePageFallback(
  admin: AdminSupabaseClient,
  { page, pageSize, query, tier }: { page: number; pageSize: number; query?: string; tier: SubscriptionTierFilter }
): Promise<{ profiles: Profile[]; count: number; error: string | null }> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let queryBuilder = admin.from('profiles').select('*', { count: 'exact' });

  if (tier && tier !== 'all') {
    if (tier === 'free') {
      queryBuilder = queryBuilder.or('subscription_tier.eq.free,subscription_tier.is.null,subscription_tier.eq.pro');
    } else if (tier === 'pro') {
      const now = new Date().toISOString();
      queryBuilder = queryBuilder
        .eq('subscription_tier', 'pro')
        .or(`subscription_expires_at.is.null,subscription_expires_at.gt.${now}`);
    } else {
      queryBuilder = queryBuilder.eq('subscription_tier', tier);
    }
  }

  if (query) {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidPattern.test(query)) {
      queryBuilder = queryBuilder.eq('id', query);
    } else {
      const searchPattern = `%${query}%`;
      queryBuilder = queryBuilder.or(
        `email.ilike.${searchPattern},display_name.ilike.${searchPattern},short_id.ilike.${searchPattern}`
      );
    }
  }

  queryBuilder = queryBuilder
    .order('last_sign_in_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(from, to);

  const { data: paginatedProfiles, error: profilesError, count } = await queryBuilder;

  if (profilesError) {
    return { profiles: [], count: 0, error: 'Database error: Could not fetch profiles.' };
  }

  let filteredProfiles = paginatedProfiles || [];
  let finalCount = count ?? 0;

  if (tier === 'free' && paginatedProfiles) {
    filteredProfiles = paginatedProfiles.filter((profile) => {
      const effectiveTier = getEffectiveSubscriptionTier(
        profile.subscription_tier as 'free' | 'pro' | 'lifetime' | null,
        profile.subscription_expires_at,
        profile.is_admin,
        NO_CAMPAIGN
      );
      return effectiveTier === 'free';
    });

    const countQueryBuilder = admin
      .from('profiles')
      .select('id, subscription_tier, subscription_expires_at, is_admin');

    if (query) {
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidPattern.test(query)) {
        countQueryBuilder.eq('id', query);
      } else {
        const searchPattern = `%${query}%`;
        countQueryBuilder.or(
          `email.ilike.${searchPattern},display_name.ilike.${searchPattern},short_id.ilike.${searchPattern}`
        );
      }
    }

    const { data: allMatchingProfiles } = await countQueryBuilder;

    if (allMatchingProfiles) {
      finalCount = allMatchingProfiles.filter((profile) => {
        const effectiveTier = getEffectiveSubscriptionTier(
          profile.subscription_tier as 'free' | 'pro' | 'lifetime' | null,
          profile.subscription_expires_at,
          profile.is_admin,
          NO_CAMPAIGN
        );
        return effectiveTier === 'free';
      }).length;
    }
  }

  return { profiles: filteredProfiles, count: finalCount, error: null };
}

export async function queryAdminAnalytics(admin: AdminSupabaseClient): Promise<AdminAnalyticsData> {
  const { data: rpcData, error: rpcError } = await admin.rpc('get_admin_analytics');

  if (!rpcError && rpcData?.length) {
    const row = rpcData[0];
    return {
      signupsLast7Days: Number(row.signups_last_7_days) || 0,
      proExpiringNext7Days: Number(row.pro_expiring_next_7_days) || 0,
    };
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const sevenDaysAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [signupsRes, expiringRes] = await Promise.all([
    admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString()),
    admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('subscription_tier', 'pro')
      .eq('is_admin', false)
      .gt('subscription_expires_at', now.toISOString())
      .lte('subscription_expires_at', sevenDaysAhead.toISOString()),
  ]);

  return {
    signupsLast7Days: signupsRes.count ?? 0,
    proExpiringNext7Days: expiringRes.count ?? 0,
  };
}

export interface AdminPaymentSummary {
  totalAmountCents: number;
  paymentCount: number;
  amountLast7DaysCents: number;
  paymentsLast7Days: number;
}

export interface AdminPaymentRow {
  id: string;
  user_id: string | null;
  paymongo_payment_id: string | null;
  amount_cents: number;
  currency: string;
  plan: string;
  months: number;
  status: string;
  source: string;
  user_email: string | null;
  paid_at: string;
  created_at: string;
  user_display_name: string | null;
  profile_email: string | null;
}

export async function queryPaymentSummary(admin: AdminSupabaseClient): Promise<AdminPaymentSummary> {
  const empty: AdminPaymentSummary = {
    totalAmountCents: 0,
    paymentCount: 0,
    amountLast7DaysCents: 0,
    paymentsLast7Days: 0,
  };

  const { data: rpcData, error: rpcError } = await admin.rpc('get_admin_payment_summary');

  if (!rpcError && rpcData?.length) {
    const row = rpcData[0];
    return {
      totalAmountCents: Number(row.total_amount_cents) || 0,
      paymentCount: Number(row.payment_count) || 0,
      amountLast7DaysCents: Number(row.amount_last_7_days_cents) || 0,
      paymentsLast7Days: Number(row.payments_last_7_days) || 0,
    };
  }

  if (rpcError) {
    console.warn('[Admin] get_admin_payment_summary RPC failed, using fallback:', rpcError.message);
  }

  const { data: rows, error } = await admin
    .from('payment_records')
    .select('amount_cents, paid_at')
    .eq('status', 'paid');

  if (error || !rows) return empty;

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  let totalAmountCents = 0;
  let amountLast7DaysCents = 0;
  let paymentsLast7Days = 0;

  for (const row of rows) {
    const cents = row.amount_cents ?? 0;
    totalAmountCents += cents;
    if (new Date(row.paid_at).getTime() >= sevenDaysAgo) {
      amountLast7DaysCents += cents;
      paymentsLast7Days++;
    }
  }

  return {
    totalAmountCents,
    paymentCount: rows.length,
    amountLast7DaysCents,
    paymentsLast7Days,
  };
}

export async function queryPaymentPage(
  admin: AdminSupabaseClient,
  page: number,
  pageSize: number
): Promise<{ payments: AdminPaymentRow[]; count: number; error: string | null }> {
  const { data: rpcRows, error: rpcError } = await admin.rpc('get_admin_payments', {
    p_page: page,
    p_page_size: pageSize,
  });

  if (!rpcError && rpcRows?.length) {
    const row = rpcRows[0] as { payments: AdminPaymentRow[] | string; total_count: number };
    const paymentsRaw = row.payments;
    const payments = (typeof paymentsRaw === 'string' ? JSON.parse(paymentsRaw) : paymentsRaw) as AdminPaymentRow[];
    return {
      payments: Array.isArray(payments) ? payments : [],
      count: Number(row.total_count) ?? 0,
      error: null,
    };
  }

  if (rpcError) {
    console.warn('[Admin] get_admin_payments RPC failed, using fallback:', rpcError.message);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await admin
    .from('payment_records')
    .select(
      'id, user_id, paymongo_payment_id, amount_cents, currency, plan, months, status, source, user_email, paid_at, created_at, profiles(display_name, email)',
      { count: 'exact' }
    )
    .eq('status', 'paid')
    .order('paid_at', { ascending: false })
    .range(from, to);

  if (error) {
    return { payments: [], count: 0, error: 'Could not load payment history.' };
  }

  const payments: AdminPaymentRow[] = (data ?? []).map((row) => {
    const profile = row.profiles as { display_name?: string | null; email?: string | null } | null;
    return {
      id: row.id,
      user_id: row.user_id,
      paymongo_payment_id: row.paymongo_payment_id,
      amount_cents: row.amount_cents,
      currency: row.currency,
      plan: row.plan,
      months: row.months,
      status: row.status,
      source: row.source,
      user_email: row.user_email,
      paid_at: row.paid_at,
      created_at: row.created_at,
      user_display_name: profile?.display_name ?? null,
      profile_email: profile?.email ?? null,
    };
  });

  return { payments, count: count ?? 0, error: null };
}

export async function queryOnlineCount(admin: AdminSupabaseClient): Promise<number> {
  const thresholdIso = new Date(Date.now() - ONLINE_THRESHOLD_MS).toISOString();

  const { count, error } = await admin
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .in('online_status', ['online', 'away'])
    .gte('last_sign_in_at', thresholdIso);

  if (error) return 0;
  return count ?? 0;
}
