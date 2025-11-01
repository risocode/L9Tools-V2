
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  
  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // On successful login, redirect to a loading page.
      // This gives the client time to set the session cookie.
      return NextResponse.redirect(new URL('/auth/loading', request.url));
    }
    console.error('Error exchanging code for session:', error.message);
  } else {
    console.error('No code found in authentication callback.');
  }

  // If there's an error or no code, redirect to an error page.
  const errorUrl = new URL('/auth/auth-code-error', request.url);
  return NextResponse.redirect(errorUrl);
}
