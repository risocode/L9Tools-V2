
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  
  // The base URL of the request.
  const next = searchParams.get('next') ?? '/boss-hunt';

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // On successful login, redirect to the boss hunt page.
      // Using a relative path works for both local and production.
      return NextResponse.redirect(new URL(next, request.url));
    }
    console.error('Error exchanging code for session:', error.message);
  } else {
    console.error('No code found in authentication callback.');
  }

  // If there's an error or no code, redirect to an error page.
  // Using a relative path is safer here too.
  const errorUrl = new URL('/auth/auth-code-error', request.url);
  return NextResponse.redirect(errorUrl);
}
