
"use client";

import { useMemo } from 'react';
import type { AvatarData, Grade } from '@/types';

export type AvatarFilterType = 'all' | 'mythic' | 'legendary' | 'epic' | 'rare';

// Helper to parse stat values like "+50%", "-5%", "+144" into numbers
const parseStatValue = (value: string | undefined): number => {
    if (!value) return 0;
    const numericPart = parseFloat(value.replace(/,/g, ''));
    if (isNaN(numericPart)) return 0;
    return numericPart;
};

// Helper to calculate total stat value for an avatar
const calculateTotalStat = (avatar: AvatarData, statName: string): number => {
    let total = 0;

    // Base stats
    const baseStat = avatar.stats.find(s => s.attribute === statName);
    if (baseStat) {
        total += parseStatValue(baseStat.value);
    }

    // Fated relationship bonus
    if (avatar.fatedRelationshipActive && avatar.fatedRelationship.description) {
      const desc = avatar.fatedRelationship.description.toLowerCase();
      const statNameLower = statName.toLowerCase();
      
      // Example: "Attack Speed +4%, Channeling Speed +4%"
      if (desc.includes(statNameLower)) {
          // Use regex to find the value associated with the stat
          const regex = new RegExp(`${statNameLower}[^\\d-]*([+-]?\\d*\\.?\\d+\\s?%?)`, 'i');
          const match = desc.match(regex);
          
          if (match && match[1]) {
              total += parseStatValue(match[1]);
          }
      }
    }
    
    return total;
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
            const statA = calculateTotalStat(a, sortByStat);
            const statB = calculateTotalStat(b, sortByStat);
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
