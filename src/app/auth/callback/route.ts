
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  
  // Use NEXT_PUBLIC_SITE_URL for production, fall back to request origin for dynamic environments.
  // This must match the logic in the signIn action.
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
  console.error('Authentication callback error or no code found.');
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
