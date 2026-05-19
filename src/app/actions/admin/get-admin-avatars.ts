'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getSupabaseAdmin, verifyAdminStatus } from '@/lib/supabase-admin';
import type { Database } from '@/types/supabase';

export type AdminAvatarRow = Database['public']['Tables']['avatars']['Row'] & {
  avatar_stats?: Database['public']['Tables']['avatar_stats']['Row'][];
  avatar_fated_relationships?: Database['public']['Tables']['avatar_fated_relationships']['Row'] | null;
};

export async function getAdminAvatars(): Promise<{ avatars: AdminAvatarRow[]; error: string | null }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await verifyAdminStatus(user))) {
    return { avatars: [], error: 'Not authorized' };
  }

  const admin = getSupabaseAdmin();
  if (!admin) return { avatars: [], error: 'Admin client unavailable' };

  const { data: avatars, error } = await admin
    .from('avatars')
    .select(`
      *,
      avatar_stats (*),
      avatar_fated_relationships (*)
    `)
    .order('id', { ascending: true });

  if (error) return { avatars: [], error: error.message };

  const normalized = (avatars ?? []).map((a) => {
    const rel = a.avatar_fated_relationships;
    return {
      ...a,
      avatar_fated_relationships: Array.isArray(rel) ? rel[0] ?? null : rel,
    };
  }) as AdminAvatarRow[];

  return { avatars: normalized, error: null };
}
