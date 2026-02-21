
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
    // If not in a browser or notifications are disabled, clear all scheduled notifications and stop.
    if (typeof window === 'undefined' || !notificationsEnabled) {
      scheduledNotifications.current.forEach(timeouts => timeouts.forEach(clearTimeout));
      scheduledNotifications.current.clear();
      return;
    }

    const scheduleNotifications = async () => {
      const permission = await checkNotificationPermission();
      if (permission !== 'granted') {
        return; // Stop if permission is not granted
      }

      const now = Date.now();
      const newScheduled = new Map<string, NodeJS.Timeout[]>();

      bosses.forEach(boss => {
        // Only schedule for bosses with a future respawn time
        if (!boss.respawnTime || boss.respawnTime.getTime() <= now) {
          return;
        }

        const respawnTime = boss.respawnTime.getTime();
        const bossKey = `${boss.id}-${respawnTime}`;
        
        // If notifications are already scheduled for this exact spawn time, keep them.
        if (scheduledNotifications.current.has(bossKey)) {
          newScheduled.set(bossKey, scheduledNotifications.current.get(bossKey)!);
          scheduledNotifications.current.delete(bossKey); // Avoid clearing it later
          return;
        }

        const timeouts: NodeJS.Timeout[] = [];
        
        // Schedule 5-minute pre-spawn notification
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

      // Clean up any old timeouts for bosses that are no longer in the list or whose times have changed.
      scheduledNotifications.current.forEach(timeouts => timeouts.forEach(clearTimeout));
      
      // Update the reference to the new set of scheduled timeouts.
      scheduledNotifications.current = newScheduled;
    };

    scheduleNotifications();

    // Cleanup function when the component unmounts or dependencies change
    return () => {
      scheduledNotifications.current.forEach(timeouts => timeouts.forEach(clearTimeout));
      scheduledNotifications.current.clear();
    };
  }, [bosses, notificationsEnabled]);
}
