
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageLoader from '@/components/ui/page-loader';

// This page acts as an intermediary to ensure the auth session is established
// on the client before redirecting to the main application.
export default function AuthLoadingPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main app page after a short delay.
    // This delay gives the Supabase client library time to initialize and recognize the new session.
    const timer = setTimeout(() => {
      router.replace('/boss-hunt');
    }, 100); // A short delay is usually sufficient

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="page-loader-overlay">
      <PageLoader />
    </div>
  );
}
