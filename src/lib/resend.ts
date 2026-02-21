import { Resend } from 'resend';

/**
 * Validates and sanitizes a Resend API key
 * @param apiKey - The raw API key from environment variable
 * @returns Sanitized API key
 * @throws Error if API key is invalid
 */
function sanitizeApiKey(apiKey: string): string {
  if (!apiKey) {
    throw new Error('API key is required');
  }
  
  // Remove quotes and trim whitespace
  const sanitized = apiKey.trim().replace(/^["']|["']$/g, '');
  
  // Validate format
  if (!sanitized.startsWith('re_')) {
    throw new Error(`Invalid API key format. Resend API keys must start with "re_"`);
  }
  
  // Basic length check
  if (sanitized.length < 20) {
    throw new Error('API key appears to be too short. Please verify it\'s a complete key.');
  }
  
  return sanitized;
}

/**
 * Converts HTML email content to plain text version
 * @param html - HTML email content
 * @returns Plain text version of the email
 */
function htmlToPlainText(html: string): string {
  // Remove HTML tags but preserve text content
  let text = html
    // Remove style blocks
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    // Remove script blocks
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    // Replace anchor tags with URL and text
    .replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, '$2 ($1)')
    // Replace line breaks
    .replace(/<br\s*\/?>/gi, '\n')
    // Replace paragraph tags with double line breaks
    .replace(/<\/p>/gi, '\n\n')
    // Replace heading tags with line breaks
    .replace(/<\/h[1-6]>/gi, '\n\n')
    // Replace list items
    .replace(/<\/li>/gi, '\n')
    // Remove all other HTML tags
    .replace(/<[^>]+>/g, '')
    // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Clean up multiple whitespace
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    // Trim whitespace
    .trim();
  
  return text;
}

/**
 * Get or create Resend client instance
 * Initializes at runtime to ensure environment variables are available
 */
function getResendClient(): Resend {
  const rawApiKey = process.env.RESEND_API_KEY;
  
  if (!rawApiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set. Please configure it in your Vercel project settings (Settings > Environment Variables).');
  }
  
  try {
    // Sanitize and validate API key
    const apiKey = sanitizeApiKey(rawApiKey);
    return new Resend(apiKey);
  } catch (error: any) {
    // Re-throw with more context if it's our validation error
    if (error.message?.includes('API key is required') || 
        error.message?.includes('Invalid API key format') || 
        error.message?.includes('too short')) {
      throw new Error(`RESEND_API_KEY validation failed: ${error.message}. Please verify the key in Resend dashboard and Vercel settings.`);
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
  const results = [];
  const errors = [];

  try {
    const resend = getResendClient();

    // Generate plain text version if not provided
    const plainText = text || htmlToPlainText(html);

    for (const email of emails) {
      try {
        // Ensure proper from email format with display name
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'L9 Tools <noreply@l9tools.online>';
        const formattedFrom = fromEmail.includes('<') 
          ? fromEmail 
          : `L9 Tools <${fromEmail}>`;
        
        const { data, error } = await resend.emails.send({
          from: formattedFrom,
          to: email,
          replyTo: process.env.RESEND_REPLY_TO || 'support@l9tools.online',
          subject,
          html,
          text: plainText,
          headers: {
            'List-Unsubscribe': `<https://www.l9tools.online/unsubscribe?email=${encodeURIComponent(email)}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            'Precedence': 'bulk',
          },
          tags: [
            { name: 'category', value: 'notification' },
          ],
        });

        if (error) {
          errors.push({ email, error: error.message || 'Unknown error' });
        } else {
          results.push({ email, id: data?.id });
        }
      } catch (err: any) {
        errors.push({ email, error: err.message || 'Unknown error' });
      }
      
      // Rate limiting: wait 100ms between emails to avoid hitting limits
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  } catch (err: any) {
    // If Resend client initialization fails, return error for all emails
    return {
      results: [],
      errors: emails.map(email => ({ email, error: err.message || 'Failed to initialize Resend client' }))
    };
  }

  return { results, errors };
}

// Export a function to get Resend client for other uses
export function getResend() {
  return getResendClient();
}
