

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { AvatarData } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


// Helper function to get the visual width of a string, accounting for wide characters
export function getVisualWidth(str: string): number {
    let width = 0;
    for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);
        // This is a simplified check for CJK characters and other full-width forms
        if (code >= 0x1100 && (
            (code >= 0x1100 && code <= 0x115F) || // Hangul Jamo
            (code >= 0x2E80 && code <= 0xA4CF) || // CJK radicals, Kangxi, etc.
            (code >= 0xAC00 && code <= 0xD7A3) || // Hangul Syllables
            (code >= 0xF900 && code <= 0xFAFF) || // CJK Compatibility Ideographs
            (code >= 0xFE10 && code <= 0xFE19) || // Vertical forms
            (code >= 0xFE30 && code <= 0xFE6F) || // CJK Compatibility Forms
            (code >= 0xFF00 && code <= 0xFF60) || // Full-width forms
            (code >= 0xFFE0 && code <= 0xFFE6)
        )) {
            width += 2;
        } else {
            width += 1;
        }
    }
    return width;
}

export function padEndVisual(str: string, length: number, char = ' '): string {
    const visualWidth = getVisualWidth(str);
    const padding = Math.max(0, length - visualWidth);
    return str + char.repeat(padding);
}

/**
 * Calculates the similarity between two strings using the Levenshtein distance.
 * @param str1 The first string.
 * @param str2 The second string.
 * @returns A number between 0 and 100, where 100 is a perfect match.
 */
export function stringSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    const len1 = s1.length;
    const len2 = s2.length;
    const d: number[][] = [];

    for (let i = 0; i <= len1; i++) {
        d[i] = [];
        d[i][0] = i;
    }
    for (let j = 0; j <= len2; j++) {
        d[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
            d[i][j] = Math.min(
                d[i - 1][j] + 1,       // deletion
                d[i][j - 1] + 1,       // insertion
                d[i - 1][j - 1] + cost // substitution
            );
        }
    }

    const distance = d[len1][len2];
    const maxLength = Math.max(len1, len2);
    if (maxLength === 0) return 100;
    
    const similarity = (1 - distance / maxLength) * 100;
    return similarity;
}

export function extractUniqueStats(avatars: AvatarData[]): string[] {
    const allStats = new Set<string>();
    avatars.forEach(avatar => {
        avatar.stats.forEach(stat => {
            allStats.add(stat.attribute);
        });
    });
    return Array.from(allStats).sort();
}
