
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  
  // This is the URL that the user should be redirected to after a successful login.
  const redirectTo = process.env.NEXT_PUBLIC_SITE_URL;

  if (!redirectTo) {
    console.error('CRITICAL: NEXT_PUBLIC_SITE_URL is not set in environment variables.');
    // Fallback to a relative path if the env var is not set, though it should be.
    return NextResponse.redirect(new URL('/auth/auth-code-error', request.url));
  }

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // On successful login, redirect to the main dashboard using the site URL.
      return NextResponse.redirect(`${redirectTo}/dashboard`)
    }
    console.error('Error exchanging code for session:', error.message);
  } else {
    console.error('No code found in authentication callback.');
  }

  // If there's an error or no code, redirect to an error page.
  return NextResponse.redirect(`${redirectTo}/auth/auth-code-error`)
}
