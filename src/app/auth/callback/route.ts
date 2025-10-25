
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  
  // This is the URL that the user should be redirected to after a successful login.
  const redirectTo = 'https://www.l9tools.online/dashboard';

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // On successful login, redirect to the main dashboard.
      return NextResponse.redirect(redirectTo)
    }
    console.error('Error exchanging code for session:', error.message);
  } else {
    console.error('No code found in authentication callback.');
  }

  // If there's an error or no code, redirect to an error page.
  return NextResponse.redirect('https://www.l9tools.online/auth/auth-code-error')
}
