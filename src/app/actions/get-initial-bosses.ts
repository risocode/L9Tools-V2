
'use server';

import type { Boss } from '@/types';
import bossesData from '@/lib/boss-data.json';

// This function now only fetches and returns the raw boss data.
// All timer processing, filtering, and sorting will be handled client-side.
export async function getInitialBosses(): Promise<{ bosses: Boss[]; error: string | null; }> {
  try {
    const allBosses: Boss[] = bossesData.map((b: any, index: number) => ({
      id: (index + 1).toString(),
      level: b.level,
      name: b.name,
      location: b.location,
      spawnTime: b.spawnTime,
      isFixedSpawn: b.isFixedSpawn,
      respawnCooldown: b.respawnCooldown,
      lastKilled: null, // This will be hydrated on the client
      image: '/bosses/img_boss.jpg',
      map: `/map/m_${b.name.toLowerCase().replace(/\s+/g, '')}.png`
    }));

    return { bosses: allBosses, error: null };
  } catch (err: any) {
    console.error('An exception occurred while loading boss data:', err.message);
    return { bosses: [], error: 'A server error occurred while loading boss data.' };
  }
}
