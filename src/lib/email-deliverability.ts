import { getReplyToEmail, DEFAULT_SENDER_ADDRESS } from '@/lib/email-config';
import { buildUnsubscribeUrl } from '@/lib/unsubscribe-token';

export const UNSUBSCRIBE_URL_PLACEHOLDER = '{{UNSUBSCRIBE_URL}}';

const SPAM_SUBJECT_PATTERNS: RegExp[] = [
  /\bFREE\b/i,
  /\bCLAIM NOW\b/i,
  /\bURGENT\b/i,
  /\bACT NOW\b/i,
  /\bLIMITED TIME\b/i,
  /\bWINNER\b/i,
];

const EMOJI_REGEX = /\p{Extended_Pictographic}/gu;

export function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, '$2 ($1)')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

export function validateMarketingSubject(subject: string): { ok: true } | { ok: false; reason: string } {
  const trimmed = subject.trim();
  if (!trimmed) {
    return { ok: false, reason: 'Subject line is required.' };
  }

  for (const pattern of SPAM_SUBJECT_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        ok: false,
        reason: `Subject contains spam-trigger phrase matching "${pattern.source}". Use neutral wording (e.g. "July event: Pro access for L9 Tools users").`,
      };
    }
  }

  const emojiMatches = trimmed.match(EMOJI_REGEX);
  if (emojiMatches && emojiMatches.length > 2) {
    return {
      ok: false,
      reason: `Subject has ${emojiMatches.length} emojis (max 2). Reduce emoji use for better deliverability.`,
    };
  }

  if (trimmed === trimmed.toUpperCase() && trimmed.length > 12) {
    return {
      ok: false,
      reason: 'Subject is fully ALL CAPS. Use sentence case instead.',
    };
  }

  return { ok: true };
}

function getPhysicalAddressLine(): string {
  return (
    process.env.EMAIL_PHYSICAL_ADDRESS?.trim() ||
    'L9 Tools — online service at www.l9tools.online'
  );
}

export function buildComplianceFooterHtml(unsubscribeUrl: string): string {
  const contactEmail = getReplyToEmail();
  const physical = getPhysicalAddressLine();

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;border-top:1px solid rgba(108,99,255,0.25);">
  <tr>
    <td align="center" style="padding:20px 16px;font-family:Arial,Helvetica,sans-serif;">
      <p style="color:#757575;font-size:11px;line-height:1.7;margin:0 0 8px;">
        You are receiving this because you have an L9 Tools account with email notifications enabled.
      </p>
      <p style="color:#757575;font-size:11px;line-height:1.7;margin:0 0 8px;">
        ${physical}<br>
        Contact: <a href="mailto:${contactEmail}" style="color:#6C63FF;">${contactEmail}</a>
      </p>
      <p style="color:#555;font-size:11px;margin:0 0 8px;">© ${new Date().getFullYear()} L9 Tools</p>
      <p style="margin:0;">
        <a href="${unsubscribeUrl}" style="color:#6C63FF;font-size:11px;text-decoration:underline;">Unsubscribe from emails</a>
      </p>
    </td>
  </tr>
</table>`;
}

export function buildComplianceFooterPlainText(unsubscribeUrl: string): string {
  const contactEmail = getReplyToEmail();
  const physical = getPhysicalAddressLine();

  return [
    '---',
    'You are receiving this because you have an L9 Tools account with email notifications enabled.',
    physical,
    `Contact: ${contactEmail}`,
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join('\n');
}

/**
 * Per-recipient HTML: tokenized unsubscribe URL + compliance footer when missing.
 */
export function prepareBulkEmailHtml(html: string, recipientEmail: string): string {
  const unsubscribeUrl = buildUnsubscribeUrl(recipientEmail);
  let prepared = html.replace(/\{\{UNSUBSCRIBE_URL\}\}/gi, unsubscribeUrl);

  const hasSignedUnsubscribe = prepared.includes(unsubscribeUrl);
  const hasContactInfo =
    prepared.includes(DEFAULT_SENDER_ADDRESS) ||
    prepared.includes('team@l9tools.online') ||
    prepared.includes('contact@l9tools.online');

  if (!hasSignedUnsubscribe || !hasContactInfo) {
    prepared += buildComplianceFooterHtml(unsubscribeUrl);
  }

  return prepared;
}

export function prepareBulkEmailPlainText(html: string, recipientEmail: string): string {
  const unsubscribeUrl = buildUnsubscribeUrl(recipientEmail);
  const base = htmlToPlainText(
    html.replace(/\{\{UNSUBSCRIBE_URL\}\}/gi, unsubscribeUrl)
  );
  return `${base}\n\n${buildComplianceFooterPlainText(unsubscribeUrl)}`;
}
