
'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getSupabaseAdmin, verifyAdminStatus } from '@/lib/supabase-admin';
import type { Profile } from '@/types'

interface GetAllProfilesParams {
  page: number;
  pageSize: number;
  query?: string;
}

export async function getAllProfiles({ page, pageSize, query }: GetAllProfilesParams): Promise<{ profiles: Profile[] | null; count: number | null; error: string | null; }> {
  
  // 1. Get the current user using the standard server client
  const supabaseUserClient = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabaseUserClient.auth.getUser();

  if (authError || !authData?.user) {
    return { profiles: null, count: null, error: 'You must be logged in to view profiles.' };
  }
  
  const user = authData.user;
  
  // 2. Use the centralized function to check for admin privileges.
  const isAdmin = await verifyAdminStatus(user);
  
  if (!isAdmin) {
    return { profiles: null, count: null, error: 'You are not authorized to perform this action.' };
  }

  // 3. Get the admin client
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return { profiles: null, count: null, error: 'Could not create admin database client.' };
  }


  // 4. If the user is an admin, build the query
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let queryBuilder = supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact' });

  // Apply search query if it exists
  if (query) {
    // Use ilike for case-insensitive partial matching.
    const searchPattern = `%${query}%`;
    queryBuilder = queryBuilder.or(
      `email.ilike.${searchPattern},display_name.ilike.${searchPattern},short_id.ilike.${searchPattern}`
    );
  }

  // Apply ordering and pagination
  queryBuilder = queryBuilder
    .order('created_at', { ascending: false })
    .range(from, to);

  // Execute the query
  const { data: paginatedProfiles, error: profilesError, count } = await queryBuilder;

  if (profilesError) {
    console.error('[Admin Action] Supabase error fetching paginated profiles with admin client:', profilesError.message);
    return { profiles: null, count: null, error: 'Database error: Could not fetch profiles.' };
  }

  return { profiles: paginatedProfiles, count, error: null };
}
