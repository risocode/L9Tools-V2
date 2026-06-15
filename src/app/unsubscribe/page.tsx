'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { unsubscribeFromEmails, deleteAccount } from '@/app/actions/unsubscribe';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Trash2, MailX } from 'lucide-react';
import { L9ToolsLayout } from '@/components/layout/l9tools-layout';

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, logout } = useAuth();
  const emailParam = searchParams.get('email');
  const tokenParam = searchParams.get('token');
  
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [actionType, setActionType] = useState<'unsubscribe' | 'delete' | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Determine email to use
  const email = user?.email || emailParam || '';

  const handleUnsubscribe = async () => {
    if (!email) {
      setResult({
        success: false,
        message: 'Email address not found. Please log in or provide your email address.'
      });
      return;
    }

    setIsLoading(true);
    setActionType('unsubscribe');
    
    try {
      const response = await unsubscribeFromEmails(email, tokenParam);
      setResult(response);
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || 'An error occurred while unsubscribing.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) {
      setResult({
        success: false,
        message: 'You must be logged in to delete your account.'
      });
      return;
    }

    setIsLoading(true);
    setActionType('delete');
    
    try {
      const response = await deleteAccount(user.id);
      setResult(response);
      
      if (response.success) {
        // Logout user after successful deletion
        setTimeout(async () => {
          await logout();
          router.push('/');
        }, 2000);
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || 'An error occurred while deleting your account.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <L9ToolsLayout hideHeader={true}>
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-2xl border-4 border-primary bg-black/90">
          <CardHeader className="text-center border-b-2 border-primary pb-6">
            <CardTitle className="text-4xl font-bold text-primary mb-2 font-cinzel">
              Account Management
            </CardTitle>
            <CardDescription className="text-muted-foreground text-lg">
              Manage your email preferences or delete your account
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6 space-y-6">
            {result ? (
              <Alert className={`${result.success ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10'}`}>
                {result.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                <AlertTitle className={result.success ? 'text-green-500' : 'text-red-500'}>
                  {result.success ? 'Success' : 'Error'}
                </AlertTitle>
                <AlertDescription className="text-foreground">
                  {result.message}
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {email && (
                  <div className="bg-primary/10 border-2 border-primary rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Email Address:</p>
                    <p className="text-lg font-semibold text-primary">{email}</p>
                  </div>
                )}

                {/* Unsubscribe Section */}
                <div className="border-2 border-yellow-400 rounded-lg p-6 bg-yellow-400/5">
                  <div className="flex items-start gap-4">
                    <MailX className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-yellow-400 mb-2">Unsubscribe from Emails</h3>
                      <p className="text-muted-foreground mb-4">
                        Stop receiving email notifications from L9 Tools. Your account will remain active.
                      </p>
                      <Button
                        onClick={handleUnsubscribe}
                        disabled={isLoading || !email}
                        className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold"
                      >
                        {isLoading && actionType === 'unsubscribe' ? 'Processing...' : 'Unsubscribe from Emails'}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Delete Account Section */}
                {user && (
                  <div className="border-2 border-red-500 rounded-lg p-6 bg-red-500/5">
                    <div className="flex items-start gap-4">
                      <Trash2 className="h-6 w-6 text-red-500 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-red-500 mb-2">Delete Account</h3>
                        <p className="text-muted-foreground mb-4">
                          Permanently delete your account and all associated data. This action cannot be undone.
                        </p>
                        {!showDeleteConfirm ? (
                          <Button
                            onClick={() => setShowDeleteConfirm(true)}
                            variant="destructive"
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete My Account
                          </Button>
                        ) : (
                          <div className="space-y-3">
                            <Alert className="border-red-500 bg-red-500/10">
                              <AlertCircle className="h-5 w-5 text-red-500" />
                              <AlertTitle className="text-red-500">Warning: This action is permanent!</AlertTitle>
                              <AlertDescription className="text-foreground">
                                Deleting your account will permanently remove all your data, including boss timers, preferences, and subscription information. This cannot be undone.
                              </AlertDescription>
                            </Alert>
                            <div className="flex gap-3">
                              <Button
                                onClick={handleDeleteAccount}
                                disabled={isLoading}
                                variant="destructive"
                                className="bg-red-600 hover:bg-red-700"
                              >
                                {isLoading && actionType === 'delete' ? 'Deleting...' : 'Confirm Delete'}
                              </Button>
                              <Button
                                onClick={() => setShowDeleteConfirm(false)}
                                variant="outline"
                                disabled={isLoading}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {!user && !emailParam && (
                  <Alert>
                    <AlertCircle className="h-5 w-5" />
                    <AlertTitle>Login Required</AlertTitle>
                    <AlertDescription>
                      Please log in to manage your account settings, or provide your email address in the URL to unsubscribe from emails.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </L9ToolsLayout>
  );
}