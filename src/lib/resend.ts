import { Resend } from 'resend';
import { getFormattedFromEmail, getReplyToEmail } from '@/lib/email-config';
import {
  htmlToPlainText,
  prepareBulkEmailHtml,
  prepareBulkEmailPlainText,
} from '@/lib/email-deliverability';
import { buildUnsubscribeOneClickUrl } from '@/lib/unsubscribe-token';

function sanitizeApiKey(apiKey: string): string {
  if (!apiKey) {
    throw new Error('API key is required');
  }

  const sanitized = apiKey.trim().replace(/^["']|["']$/g, '');

  if (!sanitized.startsWith('re_')) {
    throw new Error(`Invalid API key format. Resend API keys must start with "re_"`);
  }

  if (sanitized.length < 20) {
    throw new Error('API key appears to be too short. Please verify it\'s a complete key.');
  }

  return sanitized;
}

function getResendClient(): Resend {
  const rawApiKey = process.env.RESEND_API_KEY;

  if (!rawApiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set. Please configure it in your Vercel project settings (Settings > Environment Variables).');
  }

  try {
    const apiKey = sanitizeApiKey(rawApiKey);
    return new Resend(apiKey);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (
      message.includes('API key is required') ||
      message.includes('Invalid API key format') ||
      message.includes('too short')
    ) {
      throw new Error(`RESEND_API_KEY validation failed: ${message}. Please verify the key in Resend dashboard and Vercel settings.`);
    }
    throw error;
  }
}

export async function sendBulkEmail(
  emails: string[],
  subject: string,
  html: string,
  text?: string
) {
  const results: { email: string; id?: string }[] = [];
  const errors: { email: string; error: string }[] = [];

  try {
    const resend = getResendClient();
    const formattedFrom = getFormattedFromEmail();
    const replyTo = getReplyToEmail();

    for (const email of emails) {
      try {
        const recipientHtml = prepareBulkEmailHtml(html, email);
        const plainText = text || prepareBulkEmailPlainText(html, email);

        const { data, error } = await resend.emails.send({
          from: formattedFrom,
          to: email,
          replyTo,
          subject,
          html: recipientHtml,
          text: plainText,
          headers: {
            'List-Unsubscribe': `<${buildUnsubscribeOneClickUrl(email)}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            Precedence: 'bulk',
          },
          tags: [{ name: 'category', value: 'notification' }],
        });

        if (error) {
          errors.push({ email, error: error.message || 'Unknown error' });
        } else {
          results.push({ email, id: data?.id });
        }
      } catch (err: unknown) {
        errors.push({
          email,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  } catch (err: unknown) {
    return {
      results: [],
      errors: emails.map((email) => ({
        email,
        error: err instanceof Error ? err.message : 'Failed to initialize Resend client',
      })),
    };
  }

  return { results, errors };
}

export { htmlToPlainText };

export function getResend() {
  return getResendClient();
}
