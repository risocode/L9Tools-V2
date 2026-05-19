import { createSupabaseServerClient } from '@/lib/supabase-server';
import { verifyAdminStatus } from '@/lib/supabase-admin';
import { AccessDenied } from '@/components/views/access-denied';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="flex h-screen w-full items-center justify-center bg-background">
        <div className="admin-bg-overlay absolute inset-0" />
        <AccessDenied message="You must be signed in to view this page." />
      </main>
    );
  }

  const isAdmin = await verifyAdminStatus(user);

  if (!isAdmin) {
    return (
      <main className="flex h-screen w-full items-center justify-center bg-background">
        <div className="admin-bg-overlay absolute inset-0" />
        <AccessDenied message="You are not authorized to view this page." />
      </main>
    );
  }

  return <>{children}</>;
}
