
"use client";

import { useState, useEffect, useCallback, useTransition, useRef } from 'react';
import type { Profile } from '@/types';
import { useAuth } from '@/context/auth-context';
import { isUserAdmin } from '@/lib/supabase-admin';
import { supabase } from '@/lib/supabase-client';
import type { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserTable } from '@/components/views/admin/user-table';
import Loader from '@/components/ui/loader';
import { Crown, Star, Users, Search, RefreshCw, Mail, Sparkles } from 'lucide-react';
import { getAllProfiles } from '@/app/actions/get-all-profiles';
import { getCachedUserStats } from '@/app/actions/get-cached-user-stats';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { refreshUserStatsCache } from '@/app/actions/refresh-user-stats-cache';
import { refreshUserStatus } from '@/app/actions/refresh-user-status';
import { upgradeUsersToPro } from '@/app/actions/upgrade-users-pro';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { AccessDenied } from '../access-denied';
import { cn } from '@/lib/utils';
import { SendEmailDialog } from './send-email-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const PAGE_SIZE = 20;

type SubscriptionTierFilter = 'all' | 'free' | 'pro' | 'lifetime';

interface Stats {
    totalUsers: number;
    proSubscribers: number;
    lifetimeSubscribers: number;
    freeUsers: number;
}

const StatCardSkeleton = () => (
    <Card className="admin-stat-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-5" />
        </CardHeader>
        <CardContent>
            <Skeleton className="h-8 w-12" />
        </CardContent>
    </Card>
);

export function AdminDashboard() {
  const { user, isInitialLoading: isAuthLoading } = useAuth();
  const [paginatedProfiles, setPaginatedProfiles] = useState<Profile[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [totalProfileCount, setTotalProfileCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [isRefreshingStats, setIsRefreshingStats] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<SubscriptionTierFilter>('all');
  const [isPending, startTransition] = useTransition();
  const [isSendEmailDialogOpen, setIsSendEmailDialogOpen] = useState(false);
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeMonths, setUpgradeMonths] = useState(1);
  const presenceChannelRef = useRef<RealtimeChannel | null>(null);
  const onlineUsersRef = useRef<Set<string>>(new Set());

  const { toast } = useToast();

  // Helper function to sort profiles: online users first
  const sortProfilesByOnlineStatus = useCallback((profiles: Profile[]): Profile[] => {
    const ONLINE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes
    
    return [...profiles].sort((a, b) => {
      const isAOnline = onlineUsersRef.current.has(a.id) || 
        a.online_status === 'online' ||
        (a.last_sign_in_at && (Date.now() - new Date(a.last_sign_in_at).getTime()) <= ONLINE_THRESHOLD_MS);
      
      const isBOnline = onlineUsersRef.current.has(b.id) || 
        b.online_status === 'online' ||
        (b.last_sign_in_at && (Date.now() - new Date(b.last_sign_in_at).getTime()) <= ONLINE_THRESHOLD_MS);
      
      // Online users come first
      if (isAOnline && !isBOnline) return -1;
      if (!isAOnline && isBOnline) return 1;
      
      // If both are online or both are offline, sort by last_sign_in_at (most recent first)
      if (a.last_sign_in_at && b.last_sign_in_at) {
        const timeDiff = new Date(b.last_sign_in_at).getTime() - new Date(a.last_sign_in_at).getTime();
        if (timeDiff !== 0) return timeDiff;
      }
      if (a.last_sign_in_at && !b.last_sign_in_at) return -1;
      if (!a.last_sign_in_at && b.last_sign_in_at) return 1;
      
      // Finally, sort by created_at (most recent first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, []);

  const fetchStats = useCallback(async () => {
    const { data, error } = await getCachedUserStats();
    if (error || !data) {
        console.error("Error fetching user stats:", error);
    } else {
        const { total_users, pro_users, lifetime_users, free_users } = data;
        setStats({
            totalUsers: total_users,
            proSubscribers: pro_users,
            lifetimeSubscribers: lifetime_users,
            freeUsers: free_users,
        });
    }
  }, []);

  const fetchInitialData = useCallback(async () => {
    setIsDataLoading(true);
    try {
      const [statsResult, profilesResult] = await Promise.all([
        getCachedUserStats(),
        getAllProfiles({ page: 1, pageSize: PAGE_SIZE, query: '', tier: 'all' })
      ]);

      if (statsResult.error || !statsResult.data) {
        console.error("Error fetching user stats:", statsResult.error);
        setError("Could not load user statistics.");
        setStats({ totalUsers: 0, proSubscribers: 0, lifetimeSubscribers: 0, freeUsers: 0 });
      } else {
        const { total_users, pro_users, lifetime_users, free_users } = statsResult.data;
        setStats({
          totalUsers: total_users,
          proSubscribers: pro_users,
          lifetimeSubscribers: lifetime_users,
          freeUsers: free_users,
        });
      }

      if (profilesResult.error) {
        setError(profilesResult.error);
        setPaginatedProfiles([]);
      } else {
        // Sort profiles: online users first
        const sortedProfiles = sortProfilesByOnlineStatus(profilesResult.profiles || []);
        setPaginatedProfiles(sortedProfiles);
        if (profilesResult.count !== null) {
          setTotalProfileCount(profilesResult.count);
        }
      }
    } catch (e: any) {
      setError("An unexpected error occurred while loading dashboard data.");
    } finally {
      setIsDataLoading(false);
    }
  }, [sortProfilesByOnlineStatus]);

  // Subscribe to presence channel for real-time online status updates
  // Defer until after initial data load completes to prioritize initial render
  useEffect(() => {
    // Only set up presence after initial data has loaded and we have profiles
    if (!isDataLoading && !isAuthLoading && isUserAdmin(user) && paginatedProfiles.length > 0) {
      const channel = supabase.channel('online_users_admin');

      channel
        .on(
          'presence',
          { event: 'sync' },
          () => {
            const state = channel.presenceState();
            const onlineIds = new Set<string>();

            // Extract all online user IDs from presence state
            Object.values(state).forEach((presences) => {
              presences.forEach((presence: any) => {
                if (presence.status === 'online' || presence.status === 'away') {
                  onlineIds.add(presence.id);
                }
              });
            });

            onlineUsersRef.current = onlineIds;

            // Update profiles with online status and re-sort (online first)
            setPaginatedProfiles((prev) => {
              const updated = prev.map((profile) => ({
                ...profile,
                online_status: onlineIds.has(profile.id) ? 'online' : profile.online_status,
              }));
              return sortProfilesByOnlineStatus(updated);
            });
          }
        )
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          newPresences.forEach((presence: any) => {
            if (presence.status === 'online' || presence.status === 'away') {
              onlineUsersRef.current.add(presence.id);

              // Update specific profile and re-sort (online first)
              setPaginatedProfiles((prev) => {
                const updated = prev.map((profile) =>
                  profile.id === presence.id
                    ? { ...profile, online_status: 'online' as const }
                    : profile
                );
                return sortProfilesByOnlineStatus(updated);
              });
            }
          });
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          leftPresences.forEach((presence: any) => {
            onlineUsersRef.current.delete(presence.id);

            // Update specific profile and re-sort (online first)
            setPaginatedProfiles((prev) => {
              const updated = prev.map((profile) =>
                profile.id === presence.id
                  ? { ...profile, online_status: 'offline' as const }
                  : profile
              );
              return sortProfilesByOnlineStatus(updated);
            });
          });
        })
        .subscribe();

      presenceChannelRef.current = channel;

      return () => {
        channel.unsubscribe();
        presenceChannelRef.current = null;
      };
    }
  }, [isAuthLoading, isDataLoading, user, paginatedProfiles, sortProfilesByOnlineStatus]);
  
  const fetchProfiles = useCallback(async (page: number, query: string, tier: SubscriptionTierFilter) => {
    setIsTableLoading(true);
    const { profiles: fetchedProfiles, count, error: fetchError } = await getAllProfiles({ page, pageSize: PAGE_SIZE, query, tier });
    
    if (fetchError) {
      setError(fetchError);
      setPaginatedProfiles([]);
    } else {
      // Sort profiles: online users first
      const sortedProfiles = sortProfilesByOnlineStatus(fetchedProfiles || []);
      setPaginatedProfiles(sortedProfiles);
      if (count !== null) {
        setTotalProfileCount(count);
      }
      setError(null);
    }
    setIsTableLoading(false);
  }, [sortProfilesByOnlineStatus]);

  const handleManualRefreshStats = async () => {
    setIsRefreshingStats(true);
    
    // Extract user IDs from currently visible profiles
    const visibleUserIds = paginatedProfiles.map(p => p.id);
    
    if (visibleUserIds.length === 0) {
      setIsRefreshingStats(false);
      return;
    }

    // Create promises: fetch status data AND minimum 1-second delay
    const fetchPromise = refreshUserStatus(visibleUserIds);
    const minDelayPromise = new Promise(resolve => setTimeout(resolve, 1000));

    // Wait for both to complete (ensures minimum 1-second loading)
    const [result] = await Promise.all([fetchPromise, minDelayPromise]);

    if (result.success && result.data) {
      // Create a map of updated status data for quick lookup
      const statusMap = new Map(
        result.data.map(item => [item.id, { online_status: item.online_status, last_sign_in_at: item.last_sign_in_at }])
      );

      // Update profiles with new status data and re-sort (online first)
      setPaginatedProfiles(prev => {
        const updated = prev.map(profile => {
          const updatedStatus = statusMap.get(profile.id);
          if (updatedStatus) {
            return {
              ...profile,
              online_status: updatedStatus.online_status,
              last_sign_in_at: updatedStatus.last_sign_in_at,
            };
          }
          return profile;
        });
        return sortProfilesByOnlineStatus(updated);
      });

      toast({ 
        variant: 'default', 
        title: 'Status Refreshed', 
        description: `Updated status for ${result.data.length} user(s).` 
      });
    } else {
      toast({ 
        variant: 'destructive', 
        title: 'Refresh Failed', 
        description: result.error || 'Failed to refresh user status.' 
      });
    }
    
    setIsRefreshingStats(false);
  }

  const handleUpgradeAllFreeUsers = async () => {
    setIsUpgrading(true);
    const result = await upgradeUsersToPro({
      upgradeAll: true,
      durationMonths: upgradeMonths
    });
    
    if (result.success) {
      toast({ 
        title: 'Users Upgraded!', 
        description: result.message || `Upgraded ${result.upgraded} users to Pro.` 
      });
      setIsUpgradeDialogOpen(false);
      setUpgradeMonths(1);
      // Refresh stats and user list
      await Promise.all([fetchStats(), fetchProfiles(currentPage, debouncedSearchQuery, tierFilter)]);
    } else {
      toast({
        variant: 'destructive',
        title: 'Upgrade Failed',
        description: result.message
      });
    }
    setIsUpgrading(false);
  }
  
  useEffect(() => {
    const handler = setTimeout(() => {
      startTransition(() => {
        setDebouncedSearchQuery(searchQuery);
        setCurrentPage(1);
      });
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Start fetching data immediately (don't wait for auth) - optimize for faster initial render
  useEffect(() => {
    // If user is admin (or was admin previously), start fetching immediately
    if (user && isUserAdmin(user)) {
      fetchInitialData();
    } else if (!isAuthLoading && user && !isUserAdmin(user)) {
      // Non-admin user - no need to fetch
      setIsDataLoading(false);
    } else if (!isAuthLoading && !user) {
      // No user - no need to fetch
      setIsDataLoading(false);
    }
    // Note: We don't wait for isAuthLoading to start fetching for admin users
    // This allows skeleton UI to show immediately while auth resolves
  }, [user, isAuthLoading, fetchInitialData]);

  useEffect(() => {
    if (isDataLoading) return;
    fetchProfiles(currentPage, debouncedSearchQuery, tierFilter);
  }, [currentPage, debouncedSearchQuery, tierFilter, isDataLoading, fetchProfiles]);

  const handleProfileUpdate = useCallback(async () => {
    if (isUserAdmin(user)) {
        setIsTableLoading(true);
        await Promise.all([
            fetchProfiles(currentPage, debouncedSearchQuery, tierFilter), 
            fetchStats()
        ]);
        setIsTableLoading(false);
    }
  }, [user, fetchProfiles, currentPage, debouncedSearchQuery, tierFilter, fetchStats]);

  const handleTierFilterChange = (tier: SubscriptionTierFilter) => {
      startTransition(() => {
        setTierFilter(tier);
        setCurrentPage(1);
      });
  };
  
  if (isAuthLoading || isDataLoading) {
    return (
        <div className="admin-bg-overlay absolute inset-0 flex h-full flex-col gap-6 p-4 md:p-6 overflow-y-auto">
            <div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                </div>
            </div>
        </div>
    )
  }

  // Use centralized admin check helper for consistent validation
  if (!user || !isUserAdmin(user)) {
    return (
      <div className="admin-bg-overlay absolute inset-0">
        <AccessDenied message="You are not authorized to view this page." />
      </div>
    )
  }
  
  const totalPages = totalProfileCount > 0 ? Math.ceil(totalProfileCount / PAGE_SIZE) : 1;
  const isLoadingOrPending = isTableLoading || isPending;
  
  return (
    <div className="admin-bg-overlay absolute inset-0 flex h-full flex-col gap-6 p-4 md:p-6 overflow-y-auto">
        <div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="admin-stat-card admin-stat-card-total">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="admin-stat-card-label">Total Users</CardTitle>
                        <Users className="admin-stat-card-icon" />
                    </CardHeader>
                    <CardContent>
                        <div className="admin-stat-card-value">{stats?.totalUsers ?? 0}</div>
                    </CardContent>
                </Card>
                <Card className="admin-stat-card admin-stat-card-pro">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="admin-stat-card-label">Pro Subs</CardTitle>
                        <Star className="admin-stat-card-icon" />
                    </CardHeader>
                    <CardContent>
                        <div className="admin-stat-card-value text-[#FFD700]">{stats?.proSubscribers ?? 0}</div>
                    </CardContent>
                </Card>
                <Card className="admin-stat-card admin-stat-card-lifetime">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="admin-stat-card-label">Lifetime Subs</CardTitle>
                        <Crown className="admin-stat-card-icon" />
                    </CardHeader>
                    <CardContent>
                        <div className="admin-stat-card-value text-[#ff4d4d]">{stats?.lifetimeSubscribers ?? 0}</div>
                    </CardContent>
                </Card>
                <Card className="admin-stat-card admin-stat-card-free">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="admin-stat-card-label">Free Users</CardTitle>
                        <Users className="admin-stat-card-icon" />
                    </CardHeader>
                    <CardContent>
                        <div className="admin-stat-card-value text-[#d9d9d9]">{stats?.freeUsers ?? 0}</div>
                    </CardContent>
                </Card>
            </div>
            
            <div className="flex items-center gap-4 mt-6">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Search by username, email, or ID..."
                        className="pl-10 pr-4 w-full"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button 
                    variant="outline" 
                    onClick={() => setIsSendEmailDialogOpen(true)}
                    className="gap-2"
                >
                    <Mail className="h-4 w-4" />
                    Send Email
                </Button>
                <Button 
                    variant="outline" 
                    onClick={() => setIsUpgradeDialogOpen(true)}
                    className="gap-2 bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/30 text-yellow-400"
                >
                    <Sparkles className="h-4 w-4" />
                    Upgrade Users
                </Button>
                <Button variant="outline" size="icon" onClick={handleManualRefreshStats} disabled={isRefreshingStats}>
                    {isRefreshingStats ? <Loader className="h-5 w-5" /> : <RefreshCw className="h-5 w-5" />}
                    <span className="sr-only">Refresh Status</span>
                </Button>
            </div>
        </div>

        <div className="flex items-center justify-center gap-2 rounded-lg bg-black/20 p-2">
            {(['all', 'free', 'pro', 'lifetime'] as SubscriptionTierFilter[]).map((tier) => (
                <Button
                    key={tier}
                    variant={tierFilter === tier ? 'secondary' : 'ghost'}
                    onClick={() => handleTierFilterChange(tier)}
                    className={cn("capitalize flex-1", tierFilter === tier && "admin-filter-button-active")}
                    disabled={isLoadingOrPending}
                >
                    {tier}
                </Button>
            ))}
        </div>

        <div className="flex-1 flex flex-col min-h-0">
            <UserTable 
              profiles={paginatedProfiles} 
              isLoading={isLoadingOrPending}
              onSubscriptionUpdate={handleProfileUpdate}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              onlineUserIds={onlineUsersRef.current}
            />
        </div>

        <SendEmailDialog 
          isOpen={isSendEmailDialogOpen} 
          onClose={() => setIsSendEmailDialogOpen(false)} 
        />

        <AlertDialog open={isUpgradeDialogOpen} onOpenChange={setIsUpgradeDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-400" />
                Upgrade Free Users to Pro
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will upgrade all free-tier users to Pro subscription for the specified duration.
                <br /><br />
                <strong className="text-yellow-400">Note:</strong> This action will upgrade all users with &quot;free&quot; tier. Users already on Pro or Lifetime will not be affected.
                <br /><br />
                <div className="space-y-2 mt-4">
                  <Label htmlFor="months">Duration (months)</Label>
                  <Input
                    id="months"
                    type="number"
                    min="1"
                    max="12"
                    value={upgradeMonths}
                    onChange={(e) => setUpgradeMonths(Math.max(1, Math.min(12, parseInt(e.target.value) || 1)))}
                    disabled={isUpgrading}
                    className="max-w-[150px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Users will receive Pro tier for {upgradeMonths} month(s) from now.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isUpgrading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleUpgradeAllFreeUsers}
                disabled={isUpgrading}
                className="bg-yellow-500 hover:bg-yellow-400 text-black"
              >
                {isUpgrading ? (
                  <>
                    <Loader className="h-4 w-4 mr-2" />
                    Upgrading...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Upgrade All Free Users
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
