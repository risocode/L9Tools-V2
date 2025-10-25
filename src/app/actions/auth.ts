
'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export async function signInWithGoogle() {
  const supabase = await createSupabaseServerClient();

  // Use NEXT_PUBLIC_SITE_URL for production, but fall back to request origin for dynamic environments (like Cloud Workstations)
  const origin = process.env.NEXT_PUBLIC_SITE_URL || headers().get('origin');

  if (!origin) {
    // Fallback if origin is missing from both env and headers
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
