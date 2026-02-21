
// Use require for dotenv in this CJS-style script
import { config } from 'dotenv';
import { resolve } from 'path';

// Explicitly load .env file before any other imports
config({ path: resolve(process.cwd(), '.env') });

import { createClient } from '@supabase/supabase-js';
import bossData from '../lib/boss-data.json';
import type { Database } from '../types/supabase';

type BossInsert = Database['public']['Tables']['bosses']['Insert'];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase URL or service key is missing. Make sure they are in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedBosses() {
  console.log('Checking for existing boss data...');
  const { data: existingBosses, error: checkError } = await supabase.from('bosses').select('id');
  if (checkError) {
      console.error('Error checking for existing bosses:', checkError);
      return;
  }
  if (existingBosses && existingBosses.length > 0) {
      console.log('Boss data already exists. Skipping seeding.');
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

async function main() {
  console.log('Starting database seed...');
  await seedBosses();
  console.log('Database seeding complete.');
  console.log('Note: Avatar data should be seeded using the SQL script: src/scripts/seed-avatars-from-json.sql');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
