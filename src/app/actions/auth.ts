
'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';

export async function signInWithGoogle() {
  const supabase = await createSupabaseServerClient();

  // Determine the redirect URL based on the environment
  const redirectTo = process.env.NODE_ENV === 'development'
    ? 'http://localhost:9002/auth/callback'
    : 'https://www.l9tools.online/auth/callback';


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
    return redirect('/auth/auth-code-error');
  }

  return redirect(data.url); // Redirect user to Google OAuth URL
}
