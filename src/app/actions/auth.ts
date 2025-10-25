
'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';

export async function signInWithGoogle() {
  const supabase = await createSupabaseServerClient();

  // Force the use of the environment variable to ensure consistency.
  // This is more reliable than relying on request headers in some environments.
  const origin = process.env.NEXT_PUBLIC_SITE_URL;

  if (!origin) {
    console.error('CRITICAL: NEXT_PUBLIC_SITE_URL is not set in environment variables.');
    return redirect('/auth/auth-code-error');
  }

  const redirectTo = `${origin}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
    },
  });

  if (error) {
    console.error('Error signing in with Google:', error.message);
    return redirect('/auth/auth-code-error');
  }

  if (data?.url) {
    return redirect(data.url); // Redirect user to Google OAuth URL
  }

  return redirect('/auth/auth-code-error');
}
