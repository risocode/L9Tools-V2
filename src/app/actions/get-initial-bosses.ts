
'use server';

import type { Boss } from '@/types';
import { createSupabaseServerClient } from '@/lib/supabase-server';

// This function now fetches boss data directly from the Supabase database.
export async function getInitialBosses(): Promise<{ bosses: Boss[]; error: string | null; }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('bosses')
      .select('*')
      .order('level', { ascending: true });

    if (error) {
      console.error('Error fetching bosses from database:', error.message);
      throw new Error('Failed to fetch boss data from the database.');
    }
    
    const allBosses: Boss[] = data.map((b: any) => ({
      id: b.id.toString(),
      level: b.level,
      name: b.name,
      location: b.location,
      spawnTime: b.spawn_time,
      isFixedSpawn: b.is_fixed_spawn,
      respawnCooldown: b.respawn_cooldown,
      lastKilled: null, // This will be hydrated on the client
      image: `/bosses/${b.name.toLowerCase().replace(/\s+/g, '')}.png`,
      map: `/map/m_${b.name.toLowerCase().replace(/\s+/g, '')}.png`
    }));

    return { bosses: allBosses, error: null };
  } catch (err: any) {
    console.error('An exception occurred while loading boss data:', err.message);
    return { bosses: [], error: 'A server error occurred while loading boss data.' };
  }
}
