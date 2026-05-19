'use server';

import { getSupabaseAdmin } from '@/lib/supabase-admin';
import type { Json } from '@/types/supabase';

export async function logAdminAction(params: {
  adminId: string;
  action: string;
  targetUserId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    console.error('[Admin Audit] Missing admin client');
    return;
  }

  const { error } = await supabaseAdmin.from('admin_audit_log').insert({
    admin_id: params.adminId,
    action: params.action,
    target_user_id: params.targetUserId ?? null,
    metadata: (params.metadata ?? {}) as Json,
  });

  if (error) {
    console.error('[Admin Audit] Failed to log action:', error.message);
  }
}
