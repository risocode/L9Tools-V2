'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getSupabaseAdmin, verifyAdminStatus } from '@/lib/supabase-admin';

/**
 * Get email template from database
 * @param templateKey - Template key (default: 'bulk_email_default')
 * @returns Template with subject and html_content, or null if not found
 */
export async function getEmailTemplate(
  templateKey: string = 'bulk_email_default'
): Promise<{ 
  success: boolean; 
  template: { subject: string; html_content: string } | null; 
  error: string | null; 
}> {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { 
        success: false, 
        template: null, 
        error: 'Authentication required' 
      };
    }

    // Check if user is admin
    const isAdmin = await verifyAdminStatus(user);
    
    if (!isAdmin) {
      return { 
        success: false, 
        template: null, 
        error: 'Admin access required' 
      };
    }

    // Query database for template
    const { data: template, error } = await supabase
      .from('email_templates')
      .select('subject, html_content')
      .eq('template_key', templateKey)
      .maybeSingle();

    if (error) {
      console.error('[Email Template] Error fetching template:', error.message);
      return { 
        success: false, 
        template: null, 
        error: 'Failed to fetch email template' 
      };
    }

    // Return template if found, or null if not found (will fallback to default)
    return { 
      success: true, 
      template: template || null, 
      error: null 
    };
  } catch (error: any) {
    console.error('[Email Template] Unexpected error:', error.message);
    return { 
      success: false, 
      template: null, 
      error: error.message || 'An unexpected error occurred' 
    };
  }
}

/**
 * Save email template to database
 * @param htmlContent - HTML email content
 * @param subject - Email subject line
 * @param templateKey - Template key (default: 'bulk_email_default')
 * @returns Success status and message
 */
export async function saveEmailTemplate(
  htmlContent: string,
  subject: string,
  templateKey: string = 'bulk_email_default'
): Promise<{ 
  success: boolean; 
  message: string; 
}> {
  try {
    if (!htmlContent.trim() || !subject.trim()) {
      return {
        success: false,
        message: 'Subject and HTML content are required'
      };
    }

    const supabase = await createSupabaseServerClient();
    
    // Verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { 
        success: false, 
        message: 'Authentication required' 
      };
    }

    // Check if user is admin
    const isAdmin = await verifyAdminStatus(user);
    
    if (!isAdmin) {
      return { 
        success: false, 
        message: 'Admin access required' 
      };
    }

    // Use admin client to upsert template (insert or update)
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return {
        success: false,
        message: 'Could not connect to database'
      };
    }

    // Check if template exists
    const { data: existingTemplate } = await supabaseAdmin
      .from('email_templates')
      .select('id')
      .eq('template_key', templateKey)
      .maybeSingle();

    if (existingTemplate) {
      // Update existing template
      const { error: updateError } = await supabaseAdmin
        .from('email_templates')
        .update({
          subject: subject.trim(),
          html_content: htmlContent.trim(),
          updated_at: new Date().toISOString(),
          updated_by: user.id
        })
        .eq('template_key', templateKey);

      if (updateError) {
        console.error('[Email Template] Error updating template:', updateError.message);
        return {
          success: false,
          message: 'Failed to save email template'
        };
      }

      return {
        success: true,
        message: 'Email template saved successfully'
      };
    } else {
      // Insert new template
      const { error: insertError } = await supabaseAdmin
        .from('email_templates')
        .insert({
          template_key: templateKey,
          subject: subject.trim(),
          html_content: htmlContent.trim(),
          created_by: user.id,
          updated_by: user.id
        });

      if (insertError) {
        console.error('[Email Template] Error inserting template:', insertError.message);
        return {
          success: false,
          message: 'Failed to save email template'
        };
      }

      return {
        success: true,
        message: 'Email template created successfully'
      };
    }
  } catch (error: any) {
    console.error('[Email Template] Unexpected error:', error.message);
    return {
      success: false,
      message: error.message || 'An unexpected error occurred'
    };
  }
}
