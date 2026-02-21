"use client";

import { useEffect, useRef, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase-client';
import { updateOnlineStatus } from '@/app/actions/update-online-status';

interface PresenceMetadata {
  id: string;
  display_name: string | null;
  status: 'online' | 'away';
}

interface UsePresenceOptions {
  userId: string | null;
  displayName: string | null;
  enabled?: boolean;
}

const PRESENCE_CHANNEL = 'online_users';
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const OFFLINE_TIMEOUT = 60000; // 1 minute after disconnect before marking offline

/**
 * Hook to manage user presence tracking via Supabase Realtime
 * Broadcasts presence to a channel and updates online_status in database
 */
export function usePresence({ userId, displayName, enabled = true }: UsePresenceOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const offlineTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isVisibleRef = useRef(true);

  // Cleanup function
  const cleanup = useCallback(async () => {
    // Clear intervals
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }

    if (offlineTimeoutRef.current) {
      clearTimeout(offlineTimeoutRef.current);
      offlineTimeoutRef.current = null;
    }

    // Leave presence channel
    if (channelRef.current) {
      const status = channelRef.current.presenceState();
      const hasPresence = Object.keys(status).length > 0;

      if (hasPresence) {
        // Set offline status with delay to handle reconnects
        offlineTimeoutRef.current = setTimeout(async () => {
          if (userId) {
            try {
              await updateOnlineStatus({ userId, status: 'offline' });
            } catch (error) {
              // Silent fail - status will be corrected on next connection
            }
          }
        }, OFFLINE_TIMEOUT);
      }

      await channelRef.current.unsubscribe();
      channelRef.current = null;
    }
  }, [userId]);

  // Update presence status
  const updatePresence = useCallback(
    async (status: 'online' | 'away') => {
      if (!channelRef.current || !userId || !enabled) return;

      const presenceMetadata: PresenceMetadata = {
        id: userId,
        display_name: displayName,
        status,
      };

      await channelRef.current.track(presenceMetadata);

      // Sync to database
      try {
        await updateOnlineStatus({ userId, status });
      } catch (error) {
        // Silent fail - presence still works via Realtime
      }
    },
    [userId, displayName, enabled]
  );

  // Handle visibility changes
  const handleVisibilityChange = useCallback(() => {
    isVisibleRef.current = !document.hidden;
    if (userId && enabled) {
      updatePresence(document.hidden ? 'away' : 'online');
    }
  }, [userId, enabled, updatePresence]);

  // Setup presence with delay to prioritize initial render
  useEffect(() => {
    if (!userId || !enabled) {
      cleanup();
      return;
    }

    // Defer presence subscription by 500ms to prioritize initial page render
    const setupTimer = setTimeout(() => {
      const setupPresence = async () => {
      // Clear any existing offline timeout
      if (offlineTimeoutRef.current) {
        clearTimeout(offlineTimeoutRef.current);
        offlineTimeoutRef.current = null;
      }

      // Create and subscribe to presence channel
      const channel = supabase.channel(PRESENCE_CHANNEL, {
        config: {
          presence: {
            key: userId,
          },
        },
      });

      // Handle presence sync
      channel
        .on('presence', { event: 'sync' }, () => {
          // Presence state synced
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          // User joined
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          // User left
        });

      // Subscribe to channel
      await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track initial presence
          await channel.track({
            id: userId,
            display_name: displayName,
            status: document.hidden ? 'away' : 'online',
          } as PresenceMetadata);

          // Update database
          try {
            await updateOnlineStatus({
              userId,
              status: document.hidden ? 'away' : 'online',
            });
          } catch (error) {
            // Silent fail
          }

          // Setup heartbeat to keep presence fresh
          heartbeatRef.current = setInterval(() => {
            if (isVisibleRef.current && channelRef.current) {
              channelRef.current.track({
                id: userId,
                display_name: displayName,
                status: 'online',
              } as PresenceMetadata);
            }
          }, HEARTBEAT_INTERVAL);
        }
      });

      channelRef.current = channel;

      // Listen for visibility changes (tab hidden/show)
      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Handle page unload (browser close, tab close, navigation)
      const handleBeforeUnload = () => {
        // Mark as offline immediately on unload
        if (userId) {
          // Try to update status synchronously (may not complete on close)
          updateOnlineStatus({ userId, status: 'offline' }).catch(() => {});
        }
      };

      window.addEventListener('beforeunload', handleBeforeUnload);

      // Handle page focus/blur for better away detection
      const handleFocus = () => {
        if (isVisibleRef.current && userId && enabled) {
          updatePresence('online');
        }
      };

      const handleBlur = () => {
        if (userId && enabled) {
          updatePresence('away');
        }
      };

      window.addEventListener('focus', handleFocus);
      window.addEventListener('blur', handleBlur);

      // Cleanup function
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('blur', handleBlur);
      };
    };

      setupPresence();
    }, 500); // 500ms delay to prioritize initial render

    // Cleanup on unmount or dependency change
    return () => {
      clearTimeout(setupTimer);
      cleanup();
    };
  }, [userId, displayName, enabled, cleanup, handleVisibilityChange, updatePresence]);

  return {
    channel: channelRef.current,
    updatePresence,
  };
}
