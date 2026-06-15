import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/supabase';
import { resolveOAuthProvider, resolveTrialSubscription } from '@/lib/trial-eligibility';

/**
 * OAuth callback route - handles the return from Google OAuth.
 * Exchanges authorization code for session and sets cookies.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error_code = searchParams.get('error');
  const error_description = searchParams.get('error_description');

  // Handle OAuth errors
  if (error_code) {
    const errorUrl = new URL('/auth/error', request.url);
    errorUrl.searchParams.set('error', error_code);
    errorUrl.searchParams.set('description', error_description || 'OAuth error occurred');
    return NextResponse.redirect(errorUrl);
  }

  if (!code) {
    const errorUrl = new URL('/auth/error', request.url);
    errorUrl.searchParams.set('error', 'no_code');
    errorUrl.searchParams.set('description', 'No authorization code received');
    return NextResponse.redirect(errorUrl);
  }

  // Create Supabase client for handling cookies in Route Handler
  const response = NextResponse.redirect(new URL('/auth/success', request.url));

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Set cookie on both request and response
          request.cookies.set({ name, value, ...options });
          response.cookies.set({
            name,
            value,
            ...options,
            // Production cookie settings for custom domain
            httpOnly: options.httpOnly ?? true,
            secure: true, // Always secure for HTTPS
            sameSite: 'lax', // Allows cookies in OAuth redirects
            path: options.path || '/',
            maxAge: options.maxAge ?? 60 * 60 * 24 * 7, // 7 days default
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response.cookies.set({
            name,
            value: '',
            ...options,
            maxAge: 0,
          });
        },
      },
    }
  );

  try {
    console.log('[Auth Callback] ========== OAUTH CALLBACK START ==========');
    console.log('[Auth Callback] Code received:', code ? 'YES' : 'NO');
    console.log('[Auth Callback] Request URL:', request.url);
    
    // Exchange authorization code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('[Auth Callback] ❌ Exchange error:', {
        message: error.message,
        status: error.status,
        name: error.name,
      });
      const errorUrl = new URL('/auth/error', request.url);
      errorUrl.searchParams.set('error', 'exchange_failed');
      errorUrl.searchParams.set('description', error.message || 'Failed to create session');
      return NextResponse.redirect(errorUrl);
    }

    if (!data.session) {
      console.error('[Auth Callback] ❌ No session in exchange response');
      const errorUrl = new URL('/auth/error', request.url);
      errorUrl.searchParams.set('error', 'no_session');
      errorUrl.searchParams.set('description', 'Session was not created');
      return NextResponse.redirect(errorUrl);
    }

    console.log('[Auth Callback] ✅ Session created successfully:', {
      userId: data.session.user?.id,
      userEmail: data.session.user?.email,
      expiresAt: data.session.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : 'N/A',
      accessToken: data.session.access_token ? 'PRESENT' : 'MISSING',
      refreshToken: data.session.refresh_token ? 'PRESENT' : 'MISSING',
    });

    // Ensure profile exists and update with latest Google account data
    if (data.user) {
      const { getSupabaseAdmin } = await import('@/lib/supabase-admin');
      const adminClient = getSupabaseAdmin();
      if (adminClient) {
        // Get existing profile to preserve admin status and subscription
        const { data: existingProfile } = await adminClient
          .from('profiles')
          .select('is_admin, subscription_tier, subscription_expires_at, notifications_enabled, short_id, username')
          .eq('id', data.user.id)
          .maybeSingle(); // Use maybeSingle to handle case when profile doesn't exist

        // Upsert profile, updating with Google account data while preserving admin/subscription
        const updateData: any = {
          id: data.user.id,
          email: data.user.email || null,
          // Always update with latest Google account data
          display_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || null,
          user_photo_url: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || null,
          updated_at: new Date().toISOString(),
          // Update last_sign_in_at on every sign-in
          last_sign_in_at: new Date().toISOString(),
        };

        // Only set defaults on new profiles — trial gated by server-side trial_history
        if (!existingProfile) {
          const email = data.user.email ?? '';
          const provider = resolveOAuthProvider(data.user.app_metadata);

          let grantTrial = false;
          if (email) {
            const { data: eligible, error: trialError } = await adminClient.rpc(
              'claim_trial_if_eligible',
              {
                p_auth_user_id: data.user.id,
                p_email: email,
                p_provider: provider,
              }
            );

            if (trialError) {
              console.error('[Auth Callback] Trial eligibility check failed:', trialError);
            } else {
              grantTrial = eligible === true;
            }
          }

          const trialDefaults = resolveTrialSubscription(grantTrial);

          updateData.created_at = new Date().toISOString();
          updateData.subscription_tier = trialDefaults.subscription_tier;
          updateData.subscription_expires_at = trialDefaults.subscription_expires_at;
          updateData.is_admin = false;
          updateData.notifications_enabled = true;
          updateData.short_id = data.user.id.replace(/-/g, '').substring(0, 8).toUpperCase();
          updateData.username = email.split('@')[0] || null;
        } else {
          // Preserve existing admin status and subscription for existing profiles
          updateData.is_admin = existingProfile.is_admin;
          updateData.subscription_tier = existingProfile.subscription_tier;
          updateData.subscription_expires_at = existingProfile.subscription_expires_at;
          updateData.notifications_enabled = existingProfile.notifications_enabled ?? true;
          // Preserve short_id and username if they exist, otherwise generate them
          updateData.short_id = existingProfile.short_id || data.user.id.replace(/-/g, '').substring(0, 8).toUpperCase();
          updateData.username = existingProfile.username || data.user.email?.split('@')[0] || null;
        }

        const { error: profileError } = await adminClient
          .from('profiles')
          .upsert(updateData, {
            onConflict: 'id',
          });

        if (profileError) {
          console.error('[Auth Callback] Profile upsert error:', profileError);
          // Don't fail auth if profile upsert fails
        }

        // Explicitly update last_sign_in_at after upsert to ensure it's set
        // This is necessary because upsert ON CONFLICT might not update the field if it exists
        const { error: updateError } = await adminClient
          .from('profiles')
          .update({
            last_sign_in_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', data.user.id);

        if (updateError) {
          console.error('[Auth Callback] Failed to update last_sign_in_at:', updateError);
          // Don't fail auth if update fails - trigger will handle it
        }
      }
    }

    return response;
  } catch (err: any) {
    console.error('[Auth Callback] Unexpected error:', err);
    const errorUrl = new URL('/auth/error', request.url);
    errorUrl.searchParams.set('error', 'unexpected');
    errorUrl.searchParams.set('description', err.message || 'An unexpected error occurred');
    return NextResponse.redirect(errorUrl);
  }
}
