'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminErrorBanner } from './admin-error-banner';
import type { AdminTab } from './admin-types';

interface AdminShellProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  error: string | null;
  onDismissError: () => void;
  overview: React.ReactNode;
  payments: React.ReactNode | null;
  users: React.ReactNode;
  email: React.ReactNode;
  maintenance: React.ReactNode;
  content: React.ReactNode | null;
}

export function AdminShell({
  activeTab,
  onTabChange,
  error,
  onDismissError,
  overview,
  payments,
  users,
  email,
  maintenance,
  content,
}: AdminShellProps) {
  return (
    <div className="admin-bg-overlay absolute inset-0 flex h-full flex-col gap-4 p-4 md:p-6 overflow-y-auto">
      <AdminErrorBanner message={error} onDismiss={onDismissError} />
      <Tabs
        value={activeTab}
        onValueChange={(v) => onTabChange(v as AdminTab)}
        className="flex flex-1 flex-col min-h-0"
      >
        <TabsList className="grid w-full max-w-3xl grid-cols-3 sm:grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4 flex-1">
          {overview}
        </TabsContent>
        <TabsContent value="payments" className="mt-4 flex-1">
          {payments}
        </TabsContent>
        <TabsContent value="users" className="mt-4 flex-1 flex flex-col min-h-0">
          {users}
        </TabsContent>
        <TabsContent value="email" className="mt-4">
          {email}
        </TabsContent>
        <TabsContent value="maintenance" className="mt-4">
          {maintenance}
        </TabsContent>
        <TabsContent value="content" className="mt-4">
          {content}
        </TabsContent>
      </Tabs>
    </div>
  );
}

