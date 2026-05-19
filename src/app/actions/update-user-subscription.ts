
'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getSupabaseAdmin, verifyAdminStatus } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';
import { logAdminAction } from '@/lib/admin-audit';

interface UpdateSubscriptionArgs {
  userId: string;
  tier: 'free' | 'pro' | 'lifetime';
  expiresAt: string | null;
}

export async function updateUserSubscription({ userId, tier, expiresAt }: UpdateSubscriptionArgs): Promise<{ success: boolean, error: string | null }> {
  const supabase = await createSupabaseServerClient();

  // 1. Verify admin privileges of the person making the request
  const { data: { user: adminUser } } = await supabase.auth.getUser();
  if (!adminUser) {
    return { success: false, error: 'You must be logged in to perform this action.' };
  }
  
  const isAdmin = await verifyAdminStatus(adminUser);
  if (!isAdmin) {
    return { success: false, error: 'You do not have permission to update subscriptions.' };
  }

  // 2. Get the admin client
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return { success: false, error: 'Could not create admin database client.' };
  }

  const { data: beforeProfile } = await supabaseAdmin
    .from('profiles')
    .select('subscription_tier, subscription_expires_at')
    .eq('id', userId)
    .maybeSingle();

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      subscription_tier: tier,
      subscription_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating subscription:', error.message);
    return { success: false, error: 'Failed to update user subscription.' };
  }

  await logAdminAction({
    adminId: adminUser.id,
    action: 'update_subscription',
    targetUserId: userId,
    metadata: {
      before: beforeProfile,
      after: { tier, expiresAt },
    },
  });

  // Revalidate paths to show updated data
  revalidatePath('/admin');
  revalidatePath('/profile');

  return { success: true, error: null };
}
