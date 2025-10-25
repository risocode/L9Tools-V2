
import { add, getDay, isAfter, set, addDays, startOfWeek } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import type { Boss } from '@/types';
import type { Timestamp } from 'firebase/firestore';

// Type guard to check for Firebase Timestamp
function isTimestamp(obj: any): obj is Timestamp {
  return obj && typeof obj.seconds === 'number' && typeof obj.nanoseconds === 'number';
}

// Convert Firestore Timestamp or Date to a standard Date object
export function toDate(value: Date | Timestamp | string | null | undefined): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (isTimestamp(value)) {
        return value.toDate();
    }
    // Handle cases where a string might be passed, although the type expects otherwise
    if (typeof value === 'string') {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
            return date;
        }
    }
    return null;
}

// Calculate the respawn date for a variable spawn boss
export const getRespawnDate = (boss: Boss): Date | null => {
    if (boss.isFixedSpawn) return null;
    const lastKilledDate = toDate(boss.lastKilled);
    if (!lastKilledDate || !boss.respawnCooldown) return null;
    return add(lastKilledDate, { hours: boss.respawnCooldown });
};

// Map day names to indices for fixed spawn calculation
const dayNameToIndex: { [key: string]: number } = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

// Calculate the next upcoming fixed spawn time
export const getNextFixedSpawn = (spawnTime: string): Date | null => {
    const timeZone = 'Asia/Manila';
    const now = toZonedTime(new Date(), timeZone);
    const currentDayOfWeek = getDay(now);

    const rules = spawnTime.split(' & ');

    const potentialSpawns: Date[] = [];

    for (const rule of rules) {
        const dayStr = rule.substring(0, 3);
        const targetDay = dayNameToIndex[dayStr];
        
        if (targetDay === undefined) continue;

        const timeMatch = rule.match(/(\d{1,2}):(\d{2})/);
        if (!timeMatch) continue;

        const [hour, minute] = timeMatch.slice(1).map(Number);
        
        let dayDiff = targetDay - currentDayOfWeek;
        
        let spawnCandidate = addDays(now, dayDiff);
        spawnCandidate = set(spawnCandidate, { hours: hour, minutes: minute, seconds: 0, milliseconds: 0 });

        if (isAfter(now, spawnCandidate)) {
            spawnCandidate = addDays(spawnCandidate, 7);
        }
        
        potentialSpawns.push(spawnCandidate);
    }

    if (potentialSpawns.length === 0) {
        return null;
    }

    potentialSpawns.sort((a, b) => a.getTime() - b.getTime());
    
    return potentialSpawns[0];
};
