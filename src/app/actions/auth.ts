
'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export async function signInWithGoogle() {
  const supabase = await createSupabaseServerClient();

  const origin = process.env.NEXT_PUBLIC_SITE_URL || headers().get('origin');

  if (!origin) {
    // Fallback if origin is missing from both env and headers
    return redirect('/auth/auth-code-error');
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
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
