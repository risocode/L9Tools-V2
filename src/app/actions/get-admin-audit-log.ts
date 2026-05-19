'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getSupabaseAdmin, verifyAdminStatus } from '@/lib/supabase-admin';

export interface AuditLogEntry {
  id: string;
  admin_id: string | null;
  action: string;
  target_user_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  admin_display_name?: string | null;
  admin_email?: string | null;
}

export async function getAdminAuditLog(page = 1, pageSize = 50): Promise<{
  entries: AuditLogEntry[];
  totalCount: number;
  error: string | null;
}> {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { entries: [], totalCount: 0, error: 'You must be logged in.' };
  }

  if (!(await verifyAdminStatus(user))) {
    return { entries: [], totalCount: 0, error: 'Not authorized.' };
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return { entries: [], totalCount: 0, error: 'Admin client unavailable.' };
  }

  const { data: rpcRows, error: rpcError } = await supabaseAdmin.rpc('get_admin_audit_log', {
    p_page: page,
    p_page_size: pageSize,
  });

  if (!rpcError && rpcRows?.length) {
    const row = rpcRows[0] as { entries: AuditLogEntry[] | string; total_count: number };
    const entriesRaw = row.entries;
    const entries = (typeof entriesRaw === 'string' ? JSON.parse(entriesRaw) : entriesRaw) as AuditLogEntry[];
    return {
      entries: Array.isArray(entries) ? entries : [],
      totalCount: Number(row.total_count) || 0,
      error: null,
    };
  }

  const from = (page - 1) * pageSize;
  const { data, error, count } = await supabaseAdmin
    .from('admin_audit_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1);

  if (error) {
    return { entries: [], totalCount: 0, error: error.message };
  }

  return {
    entries: (data ?? []) as AuditLogEntry[],
    totalCount: count ?? 0,
    error: null,
  };
}
