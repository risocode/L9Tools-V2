import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Redirect root path to /boss-hunt (permanent redirect for SEO)
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/boss-hunt', request.url), 308);
  }
  
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
  
  // Skip middleware for auth routes to avoid interfering with OAuth flow
  const isAuthRoute = pathname.startsWith('/auth/');
  
  if (isAuthRoute) {
    return response;
  }

  // Create Supabase client for other routes
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Validate session (optional - can be used for protected routes)
  // Don't clear cookies here - let client handle invalid sessions

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Static assets and important files (ads.txt, robots.txt, sitemap.xml, manifest.json, etc.)
     * - API webhooks (should not go through auth middleware)
     */
    '/((?!_next/static|_next/image|favicon.ico|favicon|bosses|map|wallet|logo.png|l9rs|ads.txt|robots.txt|sitemap.xml|manifest.json|sw.js|workbox-.*\\.js|api/webhooks|api/payments).*)',
  ],
};
