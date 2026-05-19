'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase-client';
import { PRESENCE_CHANNEL } from '@/lib/admin-constants';
import type { Profile } from '@/types';
import { isProfileOnline } from '@/lib/admin-online-status';

export function useAdminPresence(
  enabled: boolean,
  setPaginatedProfiles: React.Dispatch<React.SetStateAction<Profile[]>>
) {
  const presenceChannelRef = useRef<RealtimeChannel | null>(null);
  const onlineUsersRef = useRef<Set<string>>(new Set());
  const [presenceOnlineCount, setPresenceOnlineCount] = useState(0);
  const [, setPresenceTick] = useState(0);

  const sortProfilesByOnlineStatus = useCallback((profiles: Profile[]): Profile[] => {
    return [...profiles].sort((a, b) => {
      const isAOnline = isProfileOnline(a, onlineUsersRef.current.has(a.id));
      const isBOnline = isProfileOnline(b, onlineUsersRef.current.has(b.id));

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

  const bumpPresence = useCallback(() => {
    setPresenceOnlineCount(onlineUsersRef.current.size);
    setPresenceTick((t) => t + 1);
    setPaginatedProfiles((prev) => sortProfilesByOnlineStatus(prev));
  }, [setPaginatedProfiles, sortProfilesByOnlineStatus]);

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
      bumpPresence();
    };

    channel
      .on('presence', { event: 'sync' }, applyPresence)
      .on('presence', { event: 'join' }, applyPresence)
      .on('presence', { event: 'leave' }, applyPresence)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          applyPresence();
        }
      });

    presenceChannelRef.current = channel;

    return () => {
      channel.unsubscribe();
      presenceChannelRef.current = null;
      onlineUsersRef.current = new Set();
      setPresenceOnlineCount(0);
    };
  }, [enabled, bumpPresence]);

  return { onlineUsersRef, presenceOnlineCount, sortProfilesByOnlineStatus };
}
