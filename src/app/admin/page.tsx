
"use client";

import { L9ToolsLayout } from '@/components/layout/l9tools-layout';
import { AdminDashboard } from '@/components/views/admin/admin-dashboard';
import { useAuth } from '@/context/auth-context';
import Loader from '@/components/ui/loader';
import { AccessDenied } from '@/components/views/access-denied';

export default function AdminPage() {
  const { user, isInitialLoading } = useAuth();

  if (isInitialLoading) {
    return (
      <main className="flex h-screen w-full items-center justify-center bg-background">
        <Loader className="h-12 w-12 text-primary" />
      </main>
    );
  }

  if (!user || !user.is_admin) {
    return (
      <main className="flex h-screen w-full items-center justify-center bg-background">
        <div className="admin-bg-overlay absolute inset-0" />
        <AccessDenied message="You are not authorized to view this page." />
      </main>
    );
  }

  return (
    <main className="flex">
      <L9ToolsLayout>
        <AdminDashboard />
      </L9ToolsLayout>
    </main>
  );
}
