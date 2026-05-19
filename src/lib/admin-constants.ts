export const PRESENCE_CHANNEL = 'online_users';
export const ONLINE_THRESHOLD_MS = 10 * 60 * 1000;
export const ADMIN_PAGE_SIZE = 20;

export type SubscriptionTierFilter = 'all' | 'free' | 'pro' | 'lifetime';
export type AdminExtraFilter = 'none' | 'trial' | 'expired_pro' | 'never_signed_in' | 'admins';
export type EmailAudience = 'all' | 'free' | 'pro' | 'lifetime';
