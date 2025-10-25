
'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getSupabaseAdmin, verifyAdminStatus } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';

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

  // 3. Fetch the target user's current profile to preserve existing data
  const { data: targetProfile, error: targetProfileError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (targetProfileError || !targetProfile) {
    console.error('Error fetching target profile for update:', targetProfileError?.message);
    return { success: false, error: 'Could not find the user profile to update.' };
  }
  
  // 4. Perform the update using the admin client, merging new data with existing data
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      ...targetProfile, // Preserve existing data like is_admin
      subscription_tier: tier,
      subscription_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating subscription:', error.message);
    return { success: false, error: 'Failed to update user subscription.' };
  }

  // 5. Revalidate paths to show updated data in case user is viewing their own profile elsewhere
  revalidatePath('/admin');
  revalidatePath('/profile');
  revalidatePath(`/profile/${userId}`); // Revalidate specific user profiles if they have public pages

  return { success: true, error: null };
}
