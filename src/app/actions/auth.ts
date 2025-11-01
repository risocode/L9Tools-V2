
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
  
  // Check if the function already exists
  const { data: functions, error: functionCheckError } = await supabaseAdmin.rpc('list_functions');

  if (functionCheckError) {
      console.error("Error checking for existing functions:", functionCheckError);
      // Decide if you want to proceed or return
  }
  
  const functionExists = functions && functions.some((fn: any) => fn.name === 'handle_new_user');

  if (!functionExists) {
    console.log("Profile trigger function not found, creating it...");
    const { error: fnError } = await supabaseAdmin.rpc('create_new_user_handler_function');
     if (fnError) {
      console.error('Error creating handle_new_user function:', fnError);
      return;
    }

    const { error: triggerError } = await supabaseAdmin.rpc('create_new_user_trigger');
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
  
  const redirectTo = `${origin}/auth/callback`;

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
