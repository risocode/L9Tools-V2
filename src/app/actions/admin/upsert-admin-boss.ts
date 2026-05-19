'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getSupabaseAdmin, verifyAdminStatus } from '@/lib/supabase-admin';
import { logAdminAction } from '@/lib/admin-audit';
import type { Database } from '@/types/supabase';

export type BossPayload = Database['public']['Tables']['bosses']['Insert'] & { id?: number };

export async function upsertAdminBoss(payload: BossPayload): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await verifyAdminStatus(user))) {
    return { success: false, error: 'Not authorized' };
  }

  const admin = getSupabaseAdmin();
  if (!admin) return { success: false, error: 'Admin client unavailable' };

  const row = {
    name: payload.name,
    level: payload.level,
    location: payload.location,
    spawn_time: payload.spawn_time,
    is_fixed_spawn: payload.is_fixed_spawn,
    respawn_cooldown: payload.respawn_cooldown ?? null,
  };

  let error;
  if (payload.id) {
    ({ error } = await admin.from('bosses').update(row).eq('id', payload.id));
  } else {
    ({ error } = await admin.from('bosses').insert(row));
  }

  if (error) return { success: false, error: error.message };

  await logAdminAction({
    adminId: user.id,
    action: payload.id ? 'boss_update' : 'boss_create',
    metadata: { bossId: payload.id, name: payload.name },
  });

  revalidatePath('/boss-hunt');
  revalidatePath('/admin');
  return { success: true, error: null };
}
