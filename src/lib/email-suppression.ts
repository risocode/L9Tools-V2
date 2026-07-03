import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function suppressEmailRecipient(
  email: string,
  reason: 'bounce' | 'complaint' | 'suppressed'
): Promise<void> {
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes('@')) {
    return;
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    console.error('[Email Suppression] Admin client unavailable', { email: normalized, reason });
    return;
  }

  const { error } = await admin
    .from('profiles')
    .update({
      notifications_enabled: false,
      updated_at: new Date().toISOString(),
    })
    .eq('email', normalized);

  if (error) {
    console.error('[Email Suppression] Failed to suppress recipient:', {
      email: normalized,
      reason,
      error: error.message,
    });
  } else {
    console.log('[Email Suppression] Recipient suppressed:', { email: normalized, reason });
  }
}

export function extractRecipientEmails(to: unknown): string[] {
  if (!to) {
    return [];
  }
  if (Array.isArray(to)) {
    return to.filter((v): v is string => typeof v === 'string');
  }
  if (typeof to === 'string') {
    return [to];
  }
  return [];
}
