'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getResend } from '@/lib/resend';
import { buildUnsubscribeUrl } from '@/lib/unsubscribe-token';

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

export async function sendTestEmail(
  testEmail: string,
  subject: string,
  htmlContent: string
) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Verify admin access by checking current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { 
        success: false, 
        message: 'Authentication required' 
      };
    }

    // Check if user is admin using centralized verification
    const { verifyAdminStatus } = await import('@/lib/supabase-admin');
    const isAdmin = await verifyAdminStatus(user);
    
    if (!isAdmin) {
      return { 
        success: false, 
        message: 'Admin access required' 
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
      return {
        success: false,
        message: 'Invalid email address format'
      };
    }

    // Get Resend client (validates API key)
    let resend;
    try {
      resend = getResend();
    } catch (validationError: any) {
      // Check if it's a validation error (missing, invalid format, etc.)
      if (validationError.message?.includes('environment variable is not set') || 
          validationError.message?.includes('validation failed') ||
          validationError.message?.includes('format is invalid')) {
        return {
          success: false,
          message: validationError.message
        };
      }
      // Re-throw if it's an unexpected error
      throw validationError;
    }

    // Ensure proper from email format with display name
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'L9 Tools <noreply@l9tools.online>';
    const formattedFrom = fromEmail.includes('<') 
      ? fromEmail 
      : `L9 Tools <${fromEmail}>`;
    
    // Generate plain text version from HTML
    const plainText = htmlToPlainText(htmlContent);
    
    // Send test email
    const { data, error } = await resend.emails.send({
      from: formattedFrom,
      to: testEmail,
      replyTo: process.env.RESEND_REPLY_TO || 'support@l9tools.online',
      subject: subject,
      html: htmlContent,
      text: plainText,
      headers: {
        'List-Unsubscribe': `<${buildUnsubscribeUrl(testEmail)}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'Precedence': 'bulk',
      },
      tags: [
        { name: 'category', value: 'notification' },
      ],
    });

    if (error) {
      // Check if it's an API key error from Resend
      if (error.message?.toLowerCase().includes('api key') && 
          (error.message?.toLowerCase().includes('invalid') || error.message?.toLowerCase().includes('unauthorized'))) {
        return {
          success: false,
          message: `API key validation failed. Please verify: 1) The API key in Vercel matches the one in Resend dashboard, 2) No extra spaces or quotes around the key in Vercel settings, 3) You've redeployed after setting the environment variable, 4) The API key has proper permissions in Resend. Original error: ${error.message}`
        };
      }
      
      return {
        success: false,
        message: `Failed to send test email: ${error.message}`
      };
    }

    return {
      success: true,
      message: `Test email sent successfully to ${testEmail}`,
      emailId: data?.id,
    };
  } catch (error: any) {
    // Handle unexpected errors
    if (error.message?.includes('environment variable is not set') || 
        error.message?.includes('validation failed')) {
      return {
        success: false,
        message: error.message
      };
    }
    
    return {
      success: false,
      message: error.message || 'Failed to send test email',
    };
  }
}
