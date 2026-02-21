"use client";

import { useEffect, useState, useRef } from 'react';
import PageLoader from '@/components/ui/page-loader';
import { supabase } from '@/lib/supabase-client';

/**
 * Success page after OAuth callback.
 * Waits for session to be available, then redirects to app.
 */
export default function AuthSuccessPage() {
  const [sessionChecked, setSessionChecked] = useState(false);
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (hasRedirected.current) return;
    
    console.log('[Auth Success] ========== SUCCESS PAGE MOUNTED ==========');
    console.log('[Auth Success] Current URL:', typeof window !== 'undefined' ? window.location.href : 'server');
    
    const checkSessionAndRedirect = async () => {
      if (hasRedirected.current) return;
      
      try {
        // Wait a bit for cookies to be processed
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if session is available
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('[Auth Success] Session check result:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id,
          hasError: !!error,
          errorMessage: error?.message,
        });

        setSessionChecked(true);

        // Wait a bit more to ensure auth context has processed INITIAL_SESSION
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (!hasRedirected.current) {
          console.log('[Auth Success] Redirecting to /boss-hunt?signin=success');
          hasRedirected.current = true;
          // Use window.location for a clean redirect that avoids React hydration issues
          window.location.href = '/boss-hunt?signin=success';
        }
      } catch (err: any) {
        console.error('[Auth Success] Error checking session:', err);
        // Redirect anyway after a delay using window.location to avoid React issues
        if (!hasRedirected.current) {
          hasRedirected.current = true;
          setTimeout(() => {
            window.location.href = '/boss-hunt?signin=success';
          }, 1000);
        }
      }
    };

    checkSessionAndRedirect();
  }, []);

  return (
    <div className="page-loader-overlay">
      <PageLoader />
      {!sessionChecked && (
        <p className="text-center text-sm text-muted-foreground mt-4">
          Verifying your session...
        </p>
      )}
    </div>
  );
}
