'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase-client';
import { PRESENCE_CHANNEL } from '@/lib/admin-constants';
import type { Profile } from '@/types';
import { ONLINE_THRESHOLD_MS } from '@/lib/admin-constants';

export function useAdminPresence(
  enabled: boolean,
  setPaginatedProfiles: React.Dispatch<React.SetStateAction<Profile[]>>
) {
  const presenceChannelRef = useRef<RealtimeChannel | null>(null);
  const onlineUsersRef = useRef<Set<string>>(new Set());
  const onlineCountRef = useRef(0);

  const sortProfilesByOnlineStatus = useCallback((profiles: Profile[]): Profile[] => {
    return [...profiles].sort((a, b) => {
      const isAOnline =
        onlineUsersRef.current.has(a.id) ||
        a.online_status === 'online' ||
        (a.last_sign_in_at &&
          Date.now() - new Date(a.last_sign_in_at).getTime() <= ONLINE_THRESHOLD_MS);

      const isBOnline =
        onlineUsersRef.current.has(b.id) ||
        b.online_status === 'online' ||
        (b.last_sign_in_at &&
          Date.now() - new Date(b.last_sign_in_at).getTime() <= ONLINE_THRESHOLD_MS);

      if (isAOnline && !isBOnline) return -1;
      if (!isAOnline && isBOnline) return 1;

      if (a.last_sign_in_at && b.last_sign_in_at) {
        const timeDiff =
          new Date(b.last_sign_in_at).getTime() - new Date(a.last_sign_in_at).getTime();
        if (timeDiff !== 0) return timeDiff;
      }
      if (a.last_sign_in_at && !b.last_sign_in_at) return -1;
      if (!a.last_sign_in_at && b.last_sign_in_at) return 1;

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase.channel(PRESENCE_CHANNEL);

    const applyPresence = () => {
      const state = channel.presenceState();
      const onlineIds = new Set<string>();
      Object.values(state).forEach((presences) => {
        (presences as { id?: string; status?: string }[]).forEach((presence) => {
          if (presence.id && (presence.status === 'online' || presence.status === 'away')) {
            onlineIds.add(presence.id);
          }
        });
      });
      onlineUsersRef.current = onlineIds;
      onlineCountRef.current = onlineIds.size;

      setPaginatedProfiles((prev) => {
        const updated = prev.map((profile) => ({
          ...profile,
          online_status: onlineIds.has(profile.id) ? ('online' as const) : profile.online_status,
        }));
        return sortProfilesByOnlineStatus(updated);
      });
    };

    channel
      .on('presence', { event: 'sync' }, applyPresence)
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        (newPresences as { id?: string; status?: string }[]).forEach((presence) => {
          if (presence.id && (presence.status === 'online' || presence.status === 'away')) {
            onlineUsersRef.current.add(presence.id);
          }
        });
        onlineCountRef.current = onlineUsersRef.current.size;
        setPaginatedProfiles((prev) => {
          const updated = prev.map((profile) =>
            onlineUsersRef.current.has(profile.id)
              ? { ...profile, online_status: 'online' as const }
              : profile
          );
          return sortProfilesByOnlineStatus(updated);
        });
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        (leftPresences as { id?: string }[]).forEach((presence) => {
          if (presence.id) onlineUsersRef.current.delete(presence.id);
        });
        onlineCountRef.current = onlineUsersRef.current.size;
        setPaginatedProfiles((prev) => {
          const updated = prev.map((profile) =>
            onlineUsersRef.current.has(profile.id)
              ? profile
              : { ...profile, online_status: 'offline' as const }
          );
          return sortProfilesByOnlineStatus(updated);
        });
      })
      .subscribe();

    presenceChannelRef.current = channel;

    return () => {
      channel.unsubscribe();
      presenceChannelRef.current = null;
    };
  }, [enabled, setPaginatedProfiles, sortProfilesByOnlineStatus]);

  return { onlineUsersRef, onlineCountRef, sortProfilesByOnlineStatus };
}
