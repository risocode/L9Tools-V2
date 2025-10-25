


import type { Tables } from './supabase';

export interface Boss {
  id:string;
  name: string;
  level: number;
  location: string;
  map?: string;
  spawnTime: string;
  isFixedSpawn: boolean;
  respawnCooldown: number | null;
  lastKilled: Date | string | null;
  image: string;
}

export type Profile = Tables<'profiles'>;

// Added for the new Avatar View
export type Grade = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';

export interface AvatarStat {
  attribute: string;
  value: string;
  icon: string;
}

export interface AvatarData {
  id: number;
  name: string;
  grade: Grade;
  image: string;
  stats: AvatarStat[];
  fatedRelationship: { name: string; description: string };
  fatedRelationshipActive?: boolean;
}
