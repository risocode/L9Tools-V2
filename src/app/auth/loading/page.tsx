"use client";

import { useEffect, useRef } from 'react';
import PageLoader from '@/components/ui/page-loader';

// Prevent static generation for this page
export const dynamic = 'force-dynamic';

/**
 * OAuth Loading Page - Handles post-OAuth redirect session verification
 * 
 * RACE CONDITION FIX:
 * The original implementation checked for session after only 800ms and immediately
 * called signOut() if session was missing. This destroyed valid OAuth sessions
 * before HTTP-only cookies could propagate from the server response.
 * 
 * FIX IMPLEMENTATION:
 * - Polls for session with exponential backoff (2-4 seconds total)
 * - NEVER calls signOut() during the polling phase
 * - Only redirects to home if all retries are exhausted
 * - Redirects to app immediately upon valid session confirmation
 */
export default function AuthLoadingPage() {
  const hasRedirected = useRef(false);

  useEffect(() => {
    const pollForSession = async () => {
      console.log('[Auth Loading] ========== POLLING FOR SESSION ==========');
      console.log('[Auth Loading] Timestamp:', new Date().toISOString());
      console.log('[Auth Loading] URL:', typeof window !== 'undefined' ? window.location.href : 'server');
      
      if (hasRedirected.current) {
        console.log('[Auth Loading] Already redirected, skipping poll');
        return;
      }
      
      try {
        // Dynamically import supabase client to avoid build-time evaluation
        const { supabase } = await import('@/lib/supabase-client');
        
        // Polling configuration: 2-4 seconds total with exponential backoff
        const maxAttempts = 6;
        const baseDelay = 300; // Start with 300ms
        const maxDelay = 800; // Cap at 800ms
        let attempt = 0;
        
        while (attempt < maxAttempts && !hasRedirected.current) {
          attempt++;
          const delay = Math.min(baseDelay * Math.pow(1.5, attempt - 1), maxDelay);
          
          if (attempt > 1) {
            // Wait before retry (skip delay on first attempt)
            console.log(`[Auth Loading] Retry attempt ${attempt}/${maxAttempts} after ${delay}ms delay...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            // First attempt - brief initial delay to allow cookies to propagate
            console.log('[Auth Loading] Initial session check after brief delay...');
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          
          // Check for session
          console.log(`[Auth Loading] Attempt ${attempt}: Calling supabase.auth.getSession()...`);
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          console.log(`[Auth Loading] Attempt ${attempt} result:`, {
            hasSession: !!session,
            hasUser: !!session?.user,
            userId: session?.user?.id,
            userEmail: session?.user?.email,
            hasError: !!sessionError,
            errorMessage: sessionError?.message,
            errorCode: sessionError?.code,
            expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
            cookies: typeof document !== 'undefined' ? document.cookie.split(';').map(c => c.trim().split('=')[0]) : [],
          });
          
          // CRITICAL: Check for valid session.user (not just session object)
          // A session without a user is invalid
          if (session?.user) {
            // ✅ Valid session found - redirect to app immediately
            console.log('[Auth Loading] ✅ VALID SESSION CONFIRMED - Redirecting to app');
            if (!hasRedirected.current) {
              hasRedirected.current = true;
              console.log('[Auth Loading] Redirecting to /boss-hunt?signin=success');
              window.location.href = '/boss-hunt?signin=success';
              return; // Exit polling loop
            }
          }
          
          // Session not yet available - continue polling unless exhausted
          if (attempt < maxAttempts) {
            console.log(`[Auth Loading] Session not yet available (attempt ${attempt}/${maxAttempts}), will retry...`);
            // Continue to next iteration
          } else {
            // All retries exhausted - session never became available
            console.warn('[Auth Loading] ⚠️ All retry attempts exhausted - session not found after polling');
            // DO NOT call signOut() - this would destroy any session that might be propagating
            // Simply redirect to home and let middleware handle stale sessions
            if (!hasRedirected.current) {
              console.log('[Auth Loading] Redirecting to home page (session not found after retries)');
              hasRedirected.current = true;
              // No signOut() call - preserve any session that might be propagating
              window.location.href = '/';
              return;
            }
          }
        }
      } catch (err: any) {
        // Error during polling - do not sign out, just redirect
        console.error('[Auth Loading] ❌ ERROR during session polling:', {
          message: err.message,
          stack: err.stack,
          name: err.name,
          error: JSON.stringify(err, Object.getOwnPropertyNames(err)),
        });
        
        // On error, redirect to home WITHOUT signing out
        // The session might still be valid, just not accessible right now
        if (!hasRedirected.current) {
          console.log('[Auth Loading] Redirecting to home due to error (preserving potential session)');
          hasRedirected.current = true;
          // CRITICAL: No signOut() call here either
          window.location.href = '/';
        }
      }
    };

    pollForSession();
    
    // Fallback timeout - only redirect if completely stuck (no sign out)
    // This is a safety net in case polling logic fails
    const timeout = setTimeout(() => {
      if (!hasRedirected.current) {
        console.warn('[Auth Loading] Fallback timeout reached - redirecting without sign out');
        hasRedirected.current = true;
        // CRITICAL: Do NOT call signOut() in timeout either
        // This preserves any session that might be valid
        window.location.href = '/';
      }
    }, 5000); // 5 seconds total safety net

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="page-loader-overlay">
      <PageLoader />
    </div>
  );
}
