'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getSupabaseAdmin, verifyAdminStatus } from '@/lib/supabase-admin';
import { getEffectiveSubscriptionTier } from '@/lib/subscription-utils';
import type { EmailAudience } from '@/lib/admin-constants';

export async function getEmailRecipientCount(
  audience: EmailAudience = 'all'
): Promise<{ count: number; error: string | null }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { count: 0, error: 'Authentication required' };
  }

  if (!(await verifyAdminStatus(user))) {
    return { count: 0, error: 'Admin access required' };
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return { count: 0, error: 'Admin client unavailable' };
  }

  const { data: profiles, error } = await supabaseAdmin
    .from('profiles')
    .select('email, subscription_tier, subscription_expires_at, is_admin')
    .not('email', 'is', null);

  if (error) {
    return { count: 0, error: error.message };
  }

  const filtered = (profiles ?? []).filter((p) => {
    if (!p.email) return false;
    if (audience === 'all') return true;
    const effective = getEffectiveSubscriptionTier(
      p.subscription_tier as 'free' | 'pro' | 'lifetime' | null,
      p.subscription_expires_at,
      p.is_admin
    );
    return effective === audience;
  });

  return { count: filtered.length, error: null };
}
