'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getSupabaseAdmin, verifyAdminStatus } from '@/lib/supabase-admin';
import { getEffectiveSubscriptionTier } from '@/lib/subscription-utils';
import { sendBulkEmail } from '@/lib/resend';
import { logAdminAction } from '@/lib/admin-audit';
import type { EmailAudience } from '@/lib/admin-constants';

export async function sendBulkEmailToAllUsers(
  subject: string,
  htmlContent: string,
  audience: EmailAudience = 'all'
) {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, message: 'Authentication required' };
    }

    const isAdmin = await verifyAdminStatus(user);
    
    if (!isAdmin) {
      return { success: false, message: 'Admin access required' };
    }

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return { success: false, message: 'Admin client unavailable' };
    }
    
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('email, subscription_tier, subscription_expires_at, is_admin')
      .not('email', 'is', null);

    if (error) {
      return { success: false, message: `Failed to fetch users: ${error.message}` };
    }

    const emails = (profiles ?? [])
      .filter((p) => {
        if (!p.email) return false;
        if (audience === 'all') return true;
        const effective = getEffectiveSubscriptionTier(
          p.subscription_tier as 'free' | 'pro' | 'lifetime' | null,
          p.subscription_expires_at,
          p.is_admin
        );
        return effective === audience;
      })
      .map((p) => p.email as string);

    if (emails.length === 0) {
      return { success: false, message: 'No valid emails found for this audience' };
    }

    const batchSize = 10;
    const results = [];
    const errors = [];

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const { results: batchResults, errors: batchErrors } = await sendBulkEmail(
        batch,
        subject,
        htmlContent
      );

      results.push(...batchResults);
      errors.push(...batchErrors);

      if (i + batchSize < emails.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    await logAdminAction({
      adminId: user.id,
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
