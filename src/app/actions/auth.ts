
'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// This function now also ensures the profile creation trigger and function exist.
// This is a one-time setup that runs when the login action is first called.
async function ensureProfileTriggerExists() {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    console.error("Failed to get admin client to ensure profile trigger exists.");
    return;
  }

  // Check if the function already exists by querying the pg_proc catalog via RPC
  // This is more reliable than listing all functions and avoids type errors.
  const { data: existingFunction, error: functionCheckError } = await supabaseAdmin.rpc('execute_sql' as any, {
      sql: `
        SELECT proname FROM pg_proc WHERE proname = 'handle_new_user_session';
      `,
  });


  if (functionCheckError) {
    console.error("Error checking for existing function:", functionCheckError);
    // Don't proceed if we can't check, to avoid creating duplicates.
    return;
  }
  
  // The RPC call returns an array, so we check the length.
  if (!existingFunction || (Array.isArray(existingFunction) && existingFunction.length === 0)) {
    console.log("Profile trigger function not found, creating it...");

    // The function now correctly extracts user metadata for name and photo.
    const { error: fnError } = await supabaseAdmin.rpc('execute_sql' as any, {
      sql: `
        create or replace function public.handle_new_user_session()
        returns trigger
        language plpgsql
        security definer set search_path = public
        as $$
        begin
          insert into public.profiles (id, email, display_name, user_photo_url)
          values (
            new.id,
            new.email,
            new.raw_user_meta_data->>'full_name',
            new.raw_user_meta_data->>'avatar_url'
          );
          return new;
        end;
        $$;
      `,
    });

    if (fnError) {
      console.error('Error creating handle_new_user_session function:', fnError);
      return;
    }

    // Now create the trigger that uses the function
    const { error: triggerError } = await supabaseAdmin.rpc('execute_sql' as any, {
      sql: `
        create or replace trigger on_auth_user_created
          after insert on auth.users
          for each row execute procedure public.handle_new_user_session();
      `,
    });

    if (triggerError) {
        console.error('Error creating auth trigger:', triggerError);
    } else {
        console.log("Successfully created new user trigger and function.");
    }
  }
}

export async function signInWithGoogle() {
  // Ensure the DB trigger for profile creation is set up before initiating sign-in.
  await ensureProfileTriggerExists();
  
  const supabase = await createSupabaseServerClient();
  const origin = headers().get('origin');
  
  // Use a dynamic redirect URL based on the request's origin.
  // This is more reliable than using environment variables.
  const redirectTo = origin ? `${origin}/auth/callback` : '/auth/callback';

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        prompt: 'select_account',
      }
    },
  });

  if (error) {
    console.error("Error initiating Google sign-in:", error.message);
    return redirect('/auth/auth-code-error');
  }

  return redirect(data.url);
}
