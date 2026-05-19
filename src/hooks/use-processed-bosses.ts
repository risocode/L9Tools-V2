
"use client";

import { useEffect, useMemo, useState } from 'react';
import { getRespawnDate, getNextFixedSpawn } from '@/lib/time-utils';
import type { Boss } from '@/types';
import { ProcessedBoss } from '@/components/views/boss-timer';
import type { User } from '@/context/auth-context';
import { hasActiveProSubscription } from '@/lib/subscription-utils';
import { isUserAdmin } from '@/lib/supabase-admin';

export type FilterType = 'all' | 'fixed' | 'variable' | 'spawning';


export function useProcessedBosses(
  bosses: Boss[] | null,
  filterType: FilterType,
  searchQuery: string,
  user: User | null
) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30 * 1000);
    return () => clearInterval(timer);
  }, []);

  const processedBosses = useMemo(() => {
    if (!bosses) return [];
    
    const oneHourInMillis = 60 * 60 * 1000;
    
    const processed = bosses
      .map(b => {
        let respawnDate: Date | null;
        if (b.isFixedSpawn) {
            // For guests: level 80 and below can see full details
            if (!user && b.level <= 80) {
                respawnDate = getNextFixedSpawn(b.spawnTime, now);
            }
            // For logged-in users: level 95 and below can see (level 95 is included), above level 95 requires Pro
            else if (user) {
                const isPro = hasActiveProSubscription(
                    user.subscription_tier as any,
                    user.subscription_expires_at,
                    isUserAdmin(user)
                );
                // Show timer if level 95 and below (includes level 95), OR if above level 95 and user is Pro
                if (b.level <= 95 || isPro) {
                    respawnDate = getNextFixedSpawn(b.spawnTime, now);
                } else {
                    // Free users cannot see fixed spawn times for bosses above level 95
                    respawnDate = null;
                }
            } else {
                // Guests cannot see fixed spawn times for bosses above level 80
                respawnDate = null;
            }
        } else {
            respawnDate = getRespawnDate(b);
        }
        
        // This logic remains important for live updates
        if (respawnDate && now.getTime() > respawnDate.getTime()) {
             // If a variable or fixed spawn has been active for over an hour, reset its timer
            if (now.getTime() - respawnDate.getTime() > oneHourInMillis) {
                if (b.isFixedSpawn) {
                    // For fixed spawns, recalculate the next spawn time from *after* the expired window
                    // For guests: level 80 and below
                    if (!user && b.level <= 80) {
                        const nextCheckTime = new Date(respawnDate.getTime() + oneHourInMillis);
                        respawnDate = getNextFixedSpawn(b.spawnTime, nextCheckTime);
                    }
                    // For logged-in users: level 95 and below, OR above level 95 with Pro
                    else if (user) {
                        const isPro = hasActiveProSubscription(
                            user.subscription_tier as any,
                            user.subscription_expires_at,
                            isUserAdmin(user)
                        );
                        if (b.level <= 95 || isPro) {
                            const nextCheckTime = new Date(respawnDate.getTime() + oneHourInMillis);
                            respawnDate = getNextFixedSpawn(b.spawnTime, nextCheckTime);
                        } else {
                            respawnDate = null;
                        }
                    } else {
                        respawnDate = null;
                    }
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
  }, [bosses, filterType, now, searchQuery, user]);

  return { processedBosses };
}
