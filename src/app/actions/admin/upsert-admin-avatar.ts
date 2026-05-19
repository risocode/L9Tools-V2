'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getSupabaseAdmin, verifyAdminStatus } from '@/lib/supabase-admin';
import { logAdminAction } from '@/lib/admin-audit';

export interface AvatarPayload {
  id?: number;
  name: string;
  grade: string;
  image_url: string | null;
}

export async function upsertAdminAvatar(payload: AvatarPayload): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await verifyAdminStatus(user))) {
    return { success: false, error: 'Not authorized' };
  }

  const admin = getSupabaseAdmin();
  if (!admin) return { success: false, error: 'Admin client unavailable' };

  const row = {
    name: payload.name,
    grade: payload.grade,
    image_url: payload.image_url,
  };

  let error;
  if (payload.id) {
    ({ error } = await admin.from('avatars').update(row).eq('id', payload.id));
  } else {
    ({ error } = await admin.from('avatars').insert(row));
  }

  if (error) return { success: false, error: error.message };

  await logAdminAction({
    adminId: user.id,
    action: payload.id ? 'avatar_update' : 'avatar_create',
    metadata: { avatarId: payload.id, name: payload.name },
  });

  revalidatePath('/avatars');
  revalidatePath('/admin');
  return { success: true, error: null };
}
