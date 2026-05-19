import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getSupabaseAdmin, verifyAdminStatus } from '@/lib/supabase-admin';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import type { User } from '@supabase/supabase-js';

export type AdminSupabaseClient = SupabaseClient<Database>;

export type AdminSession =
  | { error: string; user: null; admin: null }
  | { error: null; user: User; admin: AdminSupabaseClient };

/** Single auth + admin check per server action (avoids duplicate profile lookups). */
export async function requireAdminSession(): Promise<AdminSession> {
  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData?.user) {
    return { error: 'You must be logged in.', user: null, admin: null };
  }

  const user = authData.user;
  const isAdmin = await verifyAdminStatus(user);

  if (!isAdmin) {
    return { error: 'You are not authorized to perform this action.', user: null, admin: null };
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return { error: 'Could not create admin database client.', user: null, admin: null };
  }

  return { error: null, user, admin };
}

export function isOkAdminSession(
  session: AdminSession
): session is { error: null; user: User; admin: AdminSupabaseClient } {
  return session.error === null && session.admin !== null;
}
