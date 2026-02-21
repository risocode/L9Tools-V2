
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useSearchParams } from "next/navigation";

export default function AuthCodeError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const description = searchParams.get('description');
  const status = searchParams.get('status');

  const getErrorMessage = () => {
    if (description) {
      return description;
    }
    
    switch (error) {
      case 'no_code':
        return 'No authorization code received from Google. Please try signing in again.';
      case 'exchange_failed':
        return 'Failed to exchange authorization code for session. The code may have expired or been used already.';
      case 'unexpected_error':
        return 'An unexpected error occurred during authentication. Please check the browser console for details.';
      default:
        return 'The authentication link may have expired or been used already. Please try signing in again.';
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md m-4">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-4">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>Authentication Error</CardTitle>
          <CardDescription>
            Something went wrong while trying to sign you in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            {getErrorMessage()}
          </p>
          
          {(error || status) && (
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="text-xs text-muted-foreground font-mono">
                {error && <div>Error Code: {error}</div>}
                {status && <div>HTTP Status: {status}</div>}
              </p>
            </div>
          )}

          <div className="mt-4 p-3 bg-muted rounded-md">
            <p className="text-xs text-muted-foreground">
              <strong>Debug Info:</strong>
              <br />
              Check the browser console (F12) and server logs for more details.
              <br />
              Common issues:
              <br />
              • OAuth redirect URL not configured in Google Cloud Console
              <br />
              • Missing NEXT_PUBLIC_SITE_URL environment variable
              <br />
              • Supabase OAuth provider not enabled
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link href="/">Return to Home</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/boss-hunt">Try Sign In Again</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
