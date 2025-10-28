
"use client";

import { useEffect, useRef } from 'react';
import type { ProcessedBoss } from '@/components/views/boss-timer';

const NOTIFICATION_TITLE = 'L9 Tools - Boss Alert';
const PRE_SPAWN_MINUTES = 5;

// Helper to check and request notification permission
const checkNotificationPermission = async () => {
  if (!("Notification" in window)) {
    console.error("This browser does not support desktop notification");
    return 'denied';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }
  return 'denied';
};

// Helper to create and show a notification
const showNotification = (bossName: string, body: string) => {
  new Notification(NOTIFICATION_TITLE, {
    body,
    icon: '/favicon/favicon-32x32.png',
    badge: '/favicon/favicon-96x96.png', // For Android
    tag: `boss-alert-${bossName}-${Date.now()}` // Unique tag to avoid stacking identical notifications
  });
};

export function useBossNotifications(bosses: ProcessedBoss[], notificationsEnabled: boolean) {
  const scheduledNotifications = useRef<Map<string, NodeJS.Timeout[]>>(new Map());

  useEffect(() => {
    if (typeof window === 'undefined' || !notificationsEnabled) {
      // Clear all existing timeouts if notifications are disabled
      scheduledNotifications.current.forEach(timeouts => timeouts.forEach(clearTimeout));
      scheduledNotifications.current.clear();
      return;
    }

    const checkAndSchedule = async () => {
      const permission = await checkNotificationPermission();
      if (permission !== 'granted') {
        return;
      }
      
      const now = Date.now();
      const newScheduled = new Map<string, NodeJS.Timeout[]>();

      bosses.forEach(boss => {
        if (!boss.respawnTime) {
          return;
        }

        const respawnTime = boss.respawnTime.getTime();
        const bossKey = `${boss.id}-${respawnTime}`;
        
        // If we already have timeouts for this exact boss spawn, keep them.
        if (scheduledNotifications.current.has(bossKey)) {
          newScheduled.set(bossKey, scheduledNotifications.current.get(bossKey)!);
          scheduledNotifications.current.delete(bossKey);
          return;
        }

        const timeouts: NodeJS.Timeout[] = [];
        
        // Schedule pre-spawn notification
        const preSpawnTime = respawnTime - PRE_SPAWN_MINUTES * 60 * 1000;
        const preSpawnDelay = preSpawnTime - now;

        if (preSpawnDelay > 0) {
          const preSpawnTimeout = setTimeout(() => {
            showNotification(boss.name, `${boss.name} is spawning in ${PRE_SPAWN_MINUTES} minutes!`);
          }, preSpawnDelay);
          timeouts.push(preSpawnTimeout);
        }

        // Schedule spawn-time notification
        const spawnDelay = respawnTime - now;
        if (spawnDelay > 0) {
          const spawnTimeout = setTimeout(() => {
            showNotification(boss.name, `${boss.name} has spawned!`);
          }, spawnDelay);
          timeouts.push(spawnTimeout);
        }

        if (timeouts.length > 0) {
          newScheduled.set(bossKey, timeouts);
        }
      });

      // Clean up old timeouts for bosses that are no longer in the list or have changed times
      scheduledNotifications.current.forEach(timeouts => timeouts.forEach(clearTimeout));
      
      // Set the new timeouts
      scheduledNotifications.current = newScheduled;
    };

    checkAndSchedule();

    // Cleanup function when component unmounts
    return () => {
      scheduledNotifications.current.forEach(timeouts => timeouts.forEach(clearTimeout));
      scheduledNotifications.current.clear();
    };
  }, [bosses, notificationsEnabled]);
}
