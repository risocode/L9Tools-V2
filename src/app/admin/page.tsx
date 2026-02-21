
"use client";

import { L9ToolsLayout } from '@/components/layout/l9tools-layout';
import { AdminDashboard } from '@/components/views/admin/admin-dashboard';
import { useAuth } from '@/context/auth-context';
import { isUserAdmin } from '@/lib/supabase-admin';
import { AccessDenied } from '@/components/views/access-denied';

export default function AdminPage() {
  const { user, isInitialLoading } = useAuth();

  // Show skeleton UI immediately (don't block on isInitialLoading)
  // This allows AdminDashboard to start fetching data immediately while auth resolves
  // AdminDashboard will handle its own loading states and access control
  
  // Only show access denied after auth has resolved (not during initial loading)
  if (!isInitialLoading && (!user || !isUserAdmin(user))) {
    return (
      <main className="flex h-screen w-full items-center justify-center bg-background">
        <div className="admin-bg-overlay absolute inset-0" />
        <AccessDenied message="You are not authorized to view this page." />
      </main>
    );
  }

  // Show dashboard immediately (with its own loading skeleton) even while auth is resolving
  return (
    <main className="flex">
      <L9ToolsLayout hideHeader={true}>
        <AdminDashboard />
      </L9ToolsLayout>
    </main>
  );
}
