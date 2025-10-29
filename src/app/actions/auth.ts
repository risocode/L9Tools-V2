'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';

export async function signInWithGoogle() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'https://www.l9tools.online/auth/callback',
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
