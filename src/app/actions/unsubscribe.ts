'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { verifyUnsubscribeToken } from '@/lib/unsubscribe-token';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Unsubscribe user from email notifications
 */
export async function unsubscribeFromEmails(
  email: string,
  token?: string | null
): Promise<{ success: boolean; message: string }> {
  try {
    if (!email || !email.includes('@')) {
      return {
        success: false,
        message: 'Invalid email address provided.'
      };
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    const normalizedEmail = normalizeEmail(email);
    const loggedInMatch =
      !!user?.email && normalizeEmail(user.email) === normalizedEmail;
    const tokenValid = verifyUnsubscribeToken(email, token);

    if (!loggedInMatch && !tokenValid) {
      return {
        success: false,
        message: 'Invalid or expired unsubscribe link. Please log in to manage notifications.'
      };
    }

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return {
        success: false,
        message: 'Could not connect to database. Please try again later.'
      };
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ 
        notifications_enabled: false,
        updated_at: new Date().toISOString()
      })
      .eq('email', email);

    if (error) {
      console.error('[Unsubscribe] Error updating notifications:', error.message);
      return {
        success: false,
        message: 'Failed to unsubscribe. Please try again later.'
      };
    }

    return {
      success: true,
      message: 'You have been successfully unsubscribed from email notifications.'
    };
  } catch (error: any) {
    console.error('[Unsubscribe] Unexpected error:', error.message);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again later.'
    };
  }
}

/**
 * Delete user account and all associated data
 */
export async function deleteAccount(
  userId: string
): Promise<{ success: boolean; message: string }> {
  try {
    if (!userId) {
      return {
        success: false,
        message: 'User ID is required.'
      };
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        message: 'You must be logged in to delete your account.'
      };
    }

    if (user.id !== userId) {
      return {
        success: false,
        message: 'You can only delete your own account.'
      };
    }

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return {
        success: false,
        message: 'Could not connect to database. Please contact support.'
      };
    }

    const provider =
      typeof user.app_metadata?.provider === 'string' && user.app_metadata.provider.trim()
        ? user.app_metadata.provider.trim()
        : 'google';

    if (user.email) {
      const { error: preserveError } = await supabaseAdmin.rpc(
        'preserve_trial_history_on_deletion',
        {
          p_auth_user_id: userId,
          p_email: user.email,
          p_provider: provider,
        }
      );

      if (preserveError) {
        console.error('[Delete Account] Failed to preserve trial history:', preserveError.message);
      }
    }

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('[Delete Account] Error deleting user:', deleteError.message);
      return {
        success: false,
        message: 'Failed to delete account. Please contact support.'
      };
    }

    return {
      success: true,
      message: 'Your account has been successfully deleted.'
    };
  } catch (error: any) {
    console.error('[Delete Account] Unexpected error:', error.message);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again later.'
    };
  }
}
