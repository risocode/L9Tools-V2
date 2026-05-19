'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getSupabaseAdmin, verifyAdminStatus } from '@/lib/supabase-admin';
import type { Database } from '@/types/supabase';

export type AdminBossRow = Database['public']['Tables']['bosses']['Row'];

export async function getAdminBosses(): Promise<{ bosses: AdminBossRow[]; error: string | null }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await verifyAdminStatus(user))) {
    return { bosses: [], error: 'Not authorized' };
  }

  const admin = getSupabaseAdmin();
  if (!admin) return { bosses: [], error: 'Admin client unavailable' };

  const { data, error } = await admin.from('bosses').select('*').order('level', { ascending: true });
  if (error) return { bosses: [], error: error.message };
  return { bosses: data ?? [], error: null };
}
