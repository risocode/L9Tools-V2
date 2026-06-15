'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getResend } from '@/lib/resend';
import { getFormattedFromEmail, getReplyToEmail } from '@/lib/email-config';
import {
  prepareBulkEmailHtml,
  prepareBulkEmailPlainText,
  validateMarketingSubject,
} from '@/lib/email-deliverability';
import { buildUnsubscribeUrl } from '@/lib/unsubscribe-token';

export async function sendTestEmail(
  testEmail: string,
  subject: string,
  htmlContent: string
) {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        message: 'Authentication required',
      };
    }

    const { verifyAdminStatus } = await import('@/lib/supabase-admin');
    const isAdmin = await verifyAdminStatus(user);

    if (!isAdmin) {
      return {
        success: false,
        message: 'Admin access required',
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
      return {
        success: false,
        message: 'Invalid email address format',
      };
    }

    const subjectCheck = validateMarketingSubject(subject);
    if (!subjectCheck.ok) {
      return {
        success: false,
        message: subjectCheck.reason,
      };
    }

    let resend;
    try {
      resend = getResend();
    } catch (validationError: unknown) {
      const message = validationError instanceof Error ? validationError.message : String(validationError);
      if (
        message.includes('environment variable is not set') ||
        message.includes('validation failed') ||
        message.includes('format is invalid')
      ) {
        return { success: false, message };
      }
      throw validationError;
    }

    const formattedFrom = getFormattedFromEmail();
    const recipientHtml = prepareBulkEmailHtml(htmlContent, testEmail);
    const plainText = prepareBulkEmailPlainText(htmlContent, testEmail);

    const { data, error } = await resend.emails.send({
      from: formattedFrom,
      to: testEmail,
      replyTo: getReplyToEmail(),
      subject,
      html: recipientHtml,
      text: plainText,
      headers: {
        'List-Unsubscribe': `<${buildUnsubscribeUrl(testEmail)}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
      tags: [{ name: 'category', value: 'notification' }],
    });

    if (error) {
      if (
        error.message?.toLowerCase().includes('api key') &&
        (error.message?.toLowerCase().includes('invalid') ||
          error.message?.toLowerCase().includes('unauthorized'))
      ) {
        return {
          success: false,
          message: `API key validation failed. Please verify Resend and Vercel configuration. Original error: ${error.message}`,
        };
      }

      return {
        success: false,
        message: `Failed to send test email: ${error.message}`,
      };
    }

    return {
      success: true,
      message: `Test email sent successfully to ${testEmail}`,
      emailId: data?.id,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send test email';
    if (message.includes('environment variable is not set') || message.includes('validation failed')) {
      return { success: false, message };
    }

    return { success: false, message };
  }
}
