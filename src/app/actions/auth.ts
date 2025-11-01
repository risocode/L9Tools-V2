
'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export async function signInWithGoogle() {
  const supabase = await createSupabaseServerClient();
  const origin = headers().get('origin');
  
  // Dynamically construct the redirect URL based on the request's origin.
  // This is more robust than relying on NODE_ENV.
  const redirectTo = `${origin}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      // Force the account selection prompt every time
      queryParams: {
        prompt: 'select_account',
      }
    },
  });

  if (error) {
    console.error("Error initiating Google sign-in:", error.message);
    return redirect('/auth/auth-code-error');
  }

  return redirect(data.url); // Redirect user to Google OAuth URL
}
