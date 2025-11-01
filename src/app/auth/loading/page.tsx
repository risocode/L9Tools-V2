
"use client";

import { useEffect } from 'react';
import PageLoader from '@/components/ui/page-loader';

// This page acts as an intermediary to ensure the auth session is established
// on the client before redirecting to the main application.
export default function AuthLoadingPage() {

  useEffect(() => {
    // Force a full page reload to ensure the new session cookie is sent to the server.
    // This is more reliable than a client-side navigation with router.replace().
    window.location.href = '/boss-hunt';
  }, []);

  return (
    <div className="page-loader-overlay">
      <PageLoader />
    </div>
  );
}
