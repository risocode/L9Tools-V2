'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

/**
 * Unsubscribe user from email notifications
 * @param email - User's email address
 * @returns Success status and message
 */
export async function unsubscribeFromEmails(
  email: string
): Promise<{ success: boolean; message: string }> {
  try {
    if (!email || !email.includes('@')) {
      return {
        success: false,
        message: 'Invalid email address provided.'
      };
    }

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return {
        success: false,
        message: 'Could not connect to database. Please try again later.'
      };
    }

    // Update notifications_enabled to false for the user
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
 * @param userId - User's ID (must be authenticated)
 * @returns Success status and message
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

    // Verify user is authenticated
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        message: 'You must be logged in to delete your account.'
      };
    }

    // Verify the user is deleting their own account
    if (user.id !== userId) {
      return {
        success: false,
        message: 'You can only delete your own account.'
      };
    }

    // Use admin client to delete user account (this will cascade delete the profile due to foreign key)
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return {
        success: false,
        message: 'Could not connect to database. Please contact support.'
      };
    }

    // Delete user account using admin client
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