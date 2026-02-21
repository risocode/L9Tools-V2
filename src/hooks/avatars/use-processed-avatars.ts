
"use client";

import { useMemo } from 'react';
import type { AvatarData, Grade } from '@/types';
import { calculateTotalStat } from '@/lib/avatars/utils';

export type AvatarFilterType = 'all' | 'mythic' | 'legendary' | 'epic' | 'rare';

// Helper to calculate total stat value for an avatar (for sorting/filtering)
const getTotalStatValue = (avatar: AvatarData, statName: string): number => {
    const baseStat = avatar.stats.find(s => s.attribute === statName);
    if (!baseStat) return 0;
    
    const calculation = calculateTotalStat(
        baseStat.value,
        avatar.fatedRelationship.description,
        statName,
        !!avatar.fatedRelationshipActive
    );
    
    return calculation.total;
};


export function useProcessedAvatars(
  avatars: AvatarData[] | null,
  filterType: AvatarFilterType,
  searchQuery: string,
  selectedStats: string[]
) {

  const processedAvatars = useMemo(() => {
    if (!avatars) return [];
    
    // 1. Filter by search query
    let processed = avatars.filter(avatar => 
      avatar.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // 2. Filter by grade (if not 'all')
    if (filterType !== 'all') {
      processed = processed.filter(avatar => avatar.grade.toLowerCase() === filterType);
    }

    // 3. Filter by selected stats (avatars must have ALL selected stats)
    if (selectedStats.length > 0) {
        processed = processed.filter(avatar => {
            return selectedStats.every(selectedStat => 
                avatar.stats.some(avatarStat => avatarStat.attribute === selectedStat)
            );
        });
    }
    
    // 4. Sort
    // If stats are selected, sort by the first one. Otherwise, sort by grade.
    const sortByStat = selectedStats[0];
    if (sortByStat && sortByStat !== 'none') {
        processed.sort((a, b) => {
            const statA = getTotalStatValue(a, sortByStat);
            const statB = getTotalStatValue(b, sortByStat);
            return statB - statA; // Sort descending
        });
    } else {
        // Default sort by grade order
        const gradeOrder: Record<Grade, number> = {
          'Mythic': 1,
          'Legendary': 2,
          'Epic': 3,
          'Rare': 4,
          'Uncommon': 5,
          'Common': 6
        };
        processed.sort((a, b) => gradeOrder[a.grade] - gradeOrder[b.grade]);
    }

    return processed;
  }, [avatars, filterType, searchQuery, selectedStats]);

  return { processedAvatars };
}
