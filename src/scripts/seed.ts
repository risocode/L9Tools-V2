// Use require for dotenv in this CJS-style script
import { config } from 'dotenv';
import { resolve } from 'path';

// Explicitly load .env file before any other imports
config({ path: resolve(process.cwd(), '.env') });

import { createClient } from '@supabase/supabase-js';
import bossData from '../lib/boss-data.json';
import rareAvatarData from '../lib/rare-avatar-data.json';
import type { Database } from '../types/supabase';

type BossInsert = Database['public']['Tables']['bosses']['Insert'];
type AvatarInsert = Database['public']['Tables']['avatars']['Insert'];
type AvatarStatInsert = Database['public']['Tables']['avatar_stats']['Insert'];
type AvatarFatedRelationshipInsert = Database['public']['Tables']['avatar_fated_relationships']['Insert'];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase URL or service key is missing. Make sure they are in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedBosses() {
  console.log('Deleting existing boss data...');
  const { error: deleteError } = await supabase.from('bosses').delete().neq('id', 0);
  if (deleteError) {
    console.error('Error deleting bosses:', deleteError);
    return;
  }

  const bossesToInsert: BossInsert[] = bossData.map(boss => ({
    level: boss.level,
    name: boss.name,
    location: boss.location,
    spawn_time: boss.spawnTime,
    is_fixed_spawn: boss.isFixedSpawn,
    respawn_cooldown: boss.respawnCooldown,
  }));

  console.log(`Seeding ${bossesToInsert.length} bosses...`);
  const { data, error } = await supabase.from('bosses').insert(bossesToInsert).select();

  if (error) {
    console.error('Error seeding bosses:', error);
  } else {
    console.log(`Successfully seeded ${data.length} bosses.`);
  }
}

async function seedRareAvatars() {
  console.log(`Seeding ${rareAvatarData.length} rare avatars...`);

  for (const avatar of rareAvatarData) {
    // 1. Insert the main avatar record
    const avatarToInsert: AvatarInsert = {
      name: avatar.name,
      grade: avatar.grade,
      image_url: avatar.image,
    };
    const { data: insertedAvatar, error: avatarError } = await supabase.from('avatars').insert(avatarToInsert).select().single();

    if (avatarError || !insertedAvatar) {
      console.error(`Error inserting avatar ${avatar.name}:`, avatarError?.message);
      continue;
    }

    const avatarId = insertedAvatar.id;

    // 2. Insert avatar stats
    const statsToInsert: AvatarStatInsert[] = avatar.stats.map(stat => ({
      avatar_id: avatarId,
      attribute: stat.attribute,
      value: stat.value,
      icon: stat.icon,
    }));
    const { error: statsError } = await supabase.from('avatar_stats').insert(statsToInsert);
    if (statsError) {
      console.error(`Error inserting stats for ${avatar.name}:`, statsError.message);
    }

    // 3. Insert fated relationship
    const relationshipToInsert: AvatarFatedRelationshipInsert = {
      avatar_id: avatarId,
      name: avatar.fatedRelationship.name,
      description: avatar.fatedRelationship.description,
    };
    const { error: relationshipError } = await supabase.from('avatar_fated_relationships').insert(relationshipToInsert);
    if (relationshipError) {
      console.error(`Error inserting fated relationship for ${avatar.name}:`, relationshipError.message);
    }

    console.log(`- Successfully seeded avatar: ${avatar.name}`);
  }
  console.log('Finished seeding rare avatars.');
}


async function main() {
  console.log('Starting database seed for rare avatars...');
  await seedRareAvatars();
  console.log('Database seeding complete.');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
