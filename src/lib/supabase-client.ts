
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase';

// This function can be marked `async` if using asynchronous cookies (e.g. from `next/headers`)
export function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase URL or anonymous key.')
  }

  // Note: This is a client-side only client.
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}

export const supabase = createSupabaseBrowserClient();
