
'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export async function updateUserLogo(logoUrl: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createSupabaseServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'You must be logged in to update your logo.' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ 
        custom_logo_url: logoUrl,
        updated_at: new Date().toISOString() 
    })
    .eq('id', user.id);

  if (error) {
    console.error('Error updating logo URL:', error.message);
    return { success: false, error: 'Failed to save the new logo to your profile.' };
  }

  // Revalidate the layout to ensure the new logo is fetched and displayed.
  revalidatePath('/', 'layout');

  return { success: true, error: null };
}
