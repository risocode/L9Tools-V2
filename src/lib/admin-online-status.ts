import type { Profile } from '@/types';
import { ONLINE_THRESHOLD_MS } from '@/lib/admin-constants';

type OnlineProfileFields = Pick<Profile, 'online_status' | 'last_sign_in_at'>;

/** True if the user was active within the online window. */
export function isRecentlyActive(lastSignInAt: string | null | undefined): boolean {
  if (!lastSignInAt) return false;
  return Date.now() - new Date(lastSignInAt).getTime() <= ONLINE_THRESHOLD_MS;
}

/**
 * A user is "online" only if:
 * 1) They are on the realtime presence channel, OR
 * 2) DB says online/away AND they were active within ONLINE_THRESHOLD_MS
 *
 * Stale online_status without recent activity does NOT count as online.
 */
export function isProfileOnline(
  profile: OnlineProfileFields,
  isRealtimeOnline?: boolean
): boolean {
  if (isRealtimeOnline === true) return true;

  if (!isRecentlyActive(profile.last_sign_in_at)) return false;

  return profile.online_status === 'online' || profile.online_status === 'away';
}

export function isProfileAway(
  profile: OnlineProfileFields,
  isRealtimeOnline?: boolean
): boolean {
  if (!isProfileOnline(profile, isRealtimeOnline)) return false;
  if (isRealtimeOnline === true) return false;
  return profile.online_status === 'away';
}
