
"use client";

import { useMemo } from 'react';
import { getRespawnDate, getNextFixedSpawn } from '@/lib/time-utils';
import type { Boss } from '@/types';
import { ProcessedBoss } from '@/components/views/boss-timer';
import type { User as AuthUser } from '@supabase/supabase-js';
import type { Profile } from '@/types';

export type FilterType = 'all' | 'fixed' | 'variable' | 'spawning';

type User = AuthUser & Partial<Profile>;


export function useProcessedBosses(
  bosses: Boss[] | null,
  filterType: FilterType,
  searchQuery: string,
  user: User | null
) {

  const processedBosses = useMemo(() => {
    if (!bosses) return [];
    
    const now = new Date();
    const oneHourInMillis = 60 * 60 * 1000;
    
    const processed = bosses
      .map(b => {
        let respawnDate: Date | null;
        if (b.isFixedSpawn) {
            respawnDate = getNextFixedSpawn(b.spawnTime, now); // Pass current time for accurate calculation
        } else {
            respawnDate = getRespawnDate(b);
        }
        
        // This logic remains important for live updates
        if (respawnDate && now.getTime() > respawnDate.getTime()) {
             // If a variable or fixed spawn has been active for over an hour, reset its timer
            if (now.getTime() - respawnDate.getTime() > oneHourInMillis) {
                if (b.isFixedSpawn) {
                    // For fixed spawns, recalculate the next spawn time from *after* the expired window
                    const nextCheckTime = new Date(respawnDate.getTime() + oneHourInMillis);
                    respawnDate = getNextFixedSpawn(b.spawnTime, nextCheckTime);
                } else {
                    respawnDate = null; // For variable spawns, reset to Unknown
                }
            }
        }
        
        const isSpawned = respawnDate ? now.getTime() > respawnDate.getTime() : false;
        
        return {
          ...b,
          respawnTime: respawnDate,
          isSpawned: isSpawned,
        };
      })
      // All bosses are visible to all users now.
      .filter(boss => boss.name.toLowerCase().includes(searchQuery.toLowerCase()));

    let filtered: ProcessedBoss[] = processed;
    if (filterType === 'fixed' || filterType === 'variable') {
      const isFixed = filterType === 'fixed';
      filtered = processed.filter(b => b.isFixedSpawn === isFixed);
    } else if (filterType === 'spawning') {
      const twentyFourHoursInMillis = 24 * 60 * 60 * 1000;
      filtered = processed.filter(b => {
        if (!b.respawnTime) return false;
        const isSpawningSoon = (b.respawnTime.getTime() - now.getTime()) <= twentyFourHoursInMillis;
        return b.isSpawned || isSpawningSoon;
      });
    }

    const sorted = filtered.sort((a, b) => {
      if (filterType === 'all') {
        return a.level - b.level;
      }

      const aHasTime = a.respawnTime !== null;
      const bHasTime = b.respawnTime !== null;

      if (aHasTime && !bHasTime) return -1;
      if (!aHasTime && bHasTime) return 1;
      if (!aHasTime && !bHasTime) return a.name.localeCompare(b.name);

      if (a.isSpawned && !b.isSpawned) return -1;
      if (!a.isSpawned && b.isSpawned) return 1;

      if (a.isSpawned && b.isSpawned) {
        return (a.respawnTime?.getTime() ?? 0) - (b.respawnTime?.getTime() ?? 0);
      }

      return (a.respawnTime?.getTime() ?? 0) - (b.respawnTime?.getTime() ?? 0);
    });

    return sorted;
  }, [bosses, filterType, searchQuery]);

  return { processedBosses };
}
