'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getSupabaseAdmin, verifyAdminStatus } from '@/lib/supabase-admin';
import { getEffectiveSubscriptionTier, NO_CAMPAIGN } from '@/lib/subscription-utils';
import { sendBulkEmail } from '@/lib/resend';
import { validateMarketingSubject } from '@/lib/email-deliverability';
import { logAdminAction } from '@/lib/admin-audit';
import type { EmailAudience } from '@/lib/admin-constants';

export const BULK_EMAIL_BATCH_SIZE = 10;
export const BULK_EMAIL_BATCH_DELAY_MS = 1000;

async function requireAdminSender() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false as const, message: 'Authentication required' };
  }

  const isAdmin = await verifyAdminStatus(user);
  if (!isAdmin) {
    return { ok: false as const, message: 'Admin access required' };
  }

  return { ok: true as const, adminId: user.id };
}

async function fetchRecipientEmails(audience: EmailAudience): Promise<string[]> {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    throw new Error('Admin client unavailable');
  }

  const { data: profiles, error } = await supabaseAdmin
    .from('profiles')
    .select('email, subscription_tier, subscription_expires_at, is_admin, notifications_enabled')
    .not('email', 'is', null)
    .eq('notifications_enabled', true);

  if (error) {
    throw new Error(`Failed to fetch users: ${error.message}`);
  }

  return (profiles ?? [])
    .filter((p) => {
      if (!p.email) return false;
      if (audience === 'all') return true;
      const effective = getEffectiveSubscriptionTier(
        p.subscription_tier as 'free' | 'pro' | 'lifetime' | null,
        p.subscription_expires_at,
        p.is_admin,
        NO_CAMPAIGN
      );
      return effective === audience;
    })
    .map((p) => p.email as string);
}

export async function getBulkEmailRecipients(audience: EmailAudience = 'all') {
  try {
    const auth = await requireAdminSender();
    if (!auth.ok) {
      return { success: false as const, message: auth.message, emails: [] as string[], total: 0 };
    }

    const emails = await fetchRecipientEmails(audience);
    return { success: true as const, emails, total: emails.length };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load recipients';
    return { success: false as const, message, emails: [] as string[], total: 0 };
  }
}

export async function sendBulkEmailChunk(
  emails: string[],
  subject: string,
  htmlContent: string
) {
  try {
    const auth = await requireAdminSender();
    if (!auth.ok) {
      return { success: false as const, message: auth.message, sent: 0, failed: 0 };
    }

    const subjectCheck = validateMarketingSubject(subject);
    if (!subjectCheck.ok) {
      return { success: false as const, message: subjectCheck.reason, sent: 0, failed: 0 };
    }

    if (emails.length === 0) {
      return { success: true as const, sent: 0, failed: 0 };
    }

    const { results, errors } = await sendBulkEmail(emails, subject, htmlContent);

    return {
      success: true as const,
      sent: results.length,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send email batch';
    return { success: false as const, message, sent: 0, failed: emails.length };
  }
}

export async function finalizeBulkEmailSend(
  audience: EmailAudience,
  subject: string,
  sent: number,
  failed: number,
  total: number
) {
  try {
    const auth = await requireAdminSender();
    if (!auth.ok) {
      return { success: false as const, message: auth.message };
    }

    await logAdminAction({
      adminId: auth.adminId,
      action: 'bulk_email',
      metadata: { audience, subject, sent, failed, total },
    });

    return { success: true as const };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to log bulk email';
    return { success: false as const, message };
  }
}

/** @deprecated Prefer client-orchestrated batch send for progress UI */
export async function sendBulkEmailToAllUsers(
  subject: string,
  htmlContent: string,
  audience: EmailAudience = 'all'
) {
  try {
    const auth = await requireAdminSender();
    if (!auth.ok) {
      return { success: false, message: auth.message };
    }

    const subjectCheck = validateMarketingSubject(subject);
    if (!subjectCheck.ok) {
      return { success: false, message: subjectCheck.reason };
    }

    const emails = await fetchRecipientEmails(audience);
    if (emails.length === 0) {
      return { success: false, message: 'No valid emails found for this audience' };
    }

    const results: { email: string; id?: string }[] = [];
    const errors: { email: string; error: string }[] = [];

    for (let i = 0; i < emails.length; i += BULK_EMAIL_BATCH_SIZE) {
      const batch = emails.slice(i, i + BULK_EMAIL_BATCH_SIZE);
      const { results: batchResults, errors: batchErrors } = await sendBulkEmail(
        batch,
        subject,
        htmlContent
      );

      results.push(...batchResults);
      errors.push(...batchErrors);

      if (i + BULK_EMAIL_BATCH_SIZE < emails.length) {
        await new Promise((resolve) => setTimeout(resolve, BULK_EMAIL_BATCH_DELAY_MS));
      }
    }

    await logAdminAction({
      adminId: auth.adminId,
      action: 'bulk_email',
      metadata: { audience, subject, sent: results.length, failed: errors.length, total: emails.length },
    });

    return {
      success: true,
      sent: results.length,
      failed: errors.length,
      total: emails.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send bulk emails';
    return { success: false, message };
  }
}
