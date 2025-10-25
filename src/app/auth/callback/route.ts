
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  
  // Use NEXT_PUBLIC_SITE_URL for consistency, fallback to request origin
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // On successful login, redirect to the main dashboard.
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  // If there's an error or no code, redirect to an error page.
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}

