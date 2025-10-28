
"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page is now a dialog. Redirect to the main page with a query param.
export default function ContactPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/boss-hunt?action=contact');
  }, [router]);

  return null; // Render nothing as the redirect will happen
}
