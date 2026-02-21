import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase';

// Singleton instance - ensures only ONE Supabase client exists across the app
let supabaseInstance: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Creates or returns the singleton Supabase browser client.
 * This client automatically handles cookies and session management.
 */
export function createSupabaseBrowserClient() {
  // Return existing instance if already created
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase URL or anonymous key.');
  }

  // Create browser client with automatic cookie handling
  supabaseInstance = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
}

// Export singleton instance
// Note: This will only be called client-side in practice
export const supabase = createSupabaseBrowserClient();
