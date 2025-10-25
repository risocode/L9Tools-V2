import { createClient, type User, type SupabaseClient } from '@supabase/supabase-js';

// This file is intended for server-side use only.
// The environment variables are loaded automatically by Next.js.

let supabaseAdmin: SupabaseClient | null = null;

/**
 * Lazily initializes and returns a Supabase client with admin privileges.
 * This function should only be called from trusted server-side environments.
 * It uses the service_role_key, which must be kept secret.
 * @returns A SupabaseClient instance or null if config is missing.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (supabaseAdmin) {
    return supabaseAdmin;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('CRITICAL ERROR: Missing Supabase URL or service role key for admin client. Please ensure Supabase environment variables are set.');
    return null;
  }

  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseAdmin;
}


/**
 * Verifies if a given user has admin privileges.
 * This function should only be called from trusted server-side environments.
 * @param user The Supabase user object to check.
 * @returns A promise that resolves to true if the user is an admin, false otherwise.
 */
export async function verifyAdminStatus(user: User): Promise<boolean> {
  const adminClient = getSupabaseAdmin();
  if (!adminClient) {
    return false; // Cannot verify status if client fails to initialize
  }
  
  const { data: adminProfile, error } = await adminClient
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error(`[Admin Check] Supabase error during admin check for user ${user.id}:`, error.message);
    return false;
  }
  
  if (!adminProfile) {
    console.warn(`[Admin Check] No profile found for user ${user.id}.`);
    return false;
  }

  return adminProfile.is_admin;
}
