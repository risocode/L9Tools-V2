'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';

/**
 * Initiates Google OAuth sign-in flow.
 * Redirects user to Google's consent page.
 */
export async function signInWithGoogle() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  
  if (!siteUrl) {
    throw new Error('NEXT_PUBLIC_SITE_URL environment variable is required');
  }

  const supabase = await createSupabaseServerClient();
  const redirectTo = `${siteUrl}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        prompt: 'select_account',
      },
    },
  });

  if (error) {
    console.error('[SignIn] OAuth error:', error);
    throw new Error(`Failed to initiate sign-in: ${error.message}`);
  }

  if (!data?.url) {
    throw new Error('No authorization URL received from OAuth provider');
  }

  // Redirect to Google's OAuth page
  // This throws a NEXT_REDIRECT error which is expected
  redirect(data.url);
}
