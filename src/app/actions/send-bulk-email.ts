'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { sendBulkEmail } from '@/lib/resend';

export async function sendBulkEmailToAllUsers(
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
    
    // Get all user emails from profiles
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('email')
      .not('email', 'is', null);

    if (error) {
      return {
        success: false,
        message: `Failed to fetch users: ${error.message}`
      };
    }

    const emails = profiles
      .map((p) => p.email)
      .filter((email): email is string => Boolean(email));

    if (emails.length === 0) {
      return { 
        success: false, 
        message: 'No valid emails found' 
      };
    }

    // Send emails in batches to avoid rate limits
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

      // Wait 1 second between batches to avoid rate limits
      if (i + batchSize < emails.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return {
      success: true,
      sent: results.length,
      failed: errors.length,
      total: emails.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to send bulk emails',
    };
  }
}
