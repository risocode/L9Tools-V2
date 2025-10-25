
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  
  // Force the use of the environment variable to ensure consistency.
  const origin = process.env.NEXT_PUBLIC_SITE_URL;

  if (!origin) {
    console.error('CRITICAL: NEXT_PUBLIC_SITE_URL is not set in environment variables.');
    return NextResponse.redirect(new URL('/auth/auth-code-error', request.url));
  }

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // On successful login, redirect to the main dashboard.
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  // If there's an error or no code, redirect to an error page.
  console.error('Authentication callback error or no code found.');
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
