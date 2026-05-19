'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getSupabaseAdmin, verifyAdminStatus } from '@/lib/supabase-admin';
import { logAdminAction } from '@/lib/admin-audit';

export async function deleteAdminBoss(id: number): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await verifyAdminStatus(user))) {
    return { success: false, error: 'Not authorized' };
  }

  const admin = getSupabaseAdmin();
  if (!admin) return { success: false, error: 'Admin client unavailable' };

  const { error } = await admin.from('bosses').delete().eq('id', id);
  if (error) return { success: false, error: error.message };

  await logAdminAction({
    adminId: user.id,
    action: 'boss_delete',
    metadata: { bossId: id },
  });

  revalidatePath('/boss-hunt');
  revalidatePath('/admin');
  return { success: true, error: null };
}
