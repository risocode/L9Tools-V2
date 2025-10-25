
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Profile } from '@/types';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserTable } from '@/components/views/admin/user-table';
import Loader from '@/components/ui/loader';
import { Crown, Star, Users, Search, RefreshCw } from 'lucide-react';
import { getAllProfiles } from '@/app/actions/get-all-profiles';
import { getCachedUserStats } from '@/app/actions/get-cached-user-stats';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { refreshUserStatsCache } from '@/app/actions/refresh-user-stats-cache';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { AccessDenied } from '../access-denied';

const PAGE_SIZE = 20;

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
  const { toast } = useToast();

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
        getAllProfiles({ page: 1, pageSize: PAGE_SIZE, query: '' })
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
        setPaginatedProfiles(profilesResult.profiles || []);
        if (profilesResult.count !== null) {
          setTotalProfileCount(profilesResult.count);
        }
      }
    } catch (e: any) {
      setError("An unexpected error occurred while loading dashboard data.");
    } finally {
      setIsDataLoading(false);
    }
  }, []);
  
  const fetchProfiles = useCallback(async (page: number, query: string) => {
    setIsTableLoading(true);
    const { profiles: fetchedProfiles, count, error: fetchError } = await getAllProfiles({ page, pageSize: PAGE_SIZE, query });
    
    if (fetchError) {
      setError(fetchError);
      setPaginatedProfiles([]);
    } else {
      setPaginatedProfiles(fetchedProfiles || []);
      if (count !== null) {
        setTotalProfileCount(count);
      }
      setError(null);
    }
    setIsTableLoading(false);
  }, []);

  const handleManualRefreshStats = async () => {
    setIsRefreshingStats(true);
    const result = await refreshUserStatsCache();
    if (result.success) {
        await fetchStats();
        toast({ variant: 'success', title: 'Stats Refreshed', description: 'User statistics have been updated.' });
    } else {
        toast({ variant: 'destructive', title: 'Refresh Failed', description: result.error });
    }
    setIsRefreshingStats(false);
  }
  
  useEffect(() => {
    const handler = setTimeout(() => {
        setDebouncedSearchQuery(searchQuery);
        setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    if (!isAuthLoading && user?.is_admin) {
        fetchInitialData();
    } else if (!isAuthLoading) {
      setIsDataLoading(false);
    }
  }, [isAuthLoading, user, fetchInitialData]);

  useEffect(() => {
    if (isDataLoading) return;
    fetchProfiles(currentPage, debouncedSearchQuery);
  }, [currentPage, debouncedSearchQuery, isDataLoading, fetchProfiles]);

  const handleProfileUpdate = useCallback(async () => {
    if (user?.is_admin) {
        setIsTableLoading(true);
        await Promise.all([
            fetchProfiles(currentPage, debouncedSearchQuery), 
            fetchStats()
        ]);
        setIsTableLoading(false);
    }
  }, [user, fetchProfiles, currentPage, debouncedSearchQuery, fetchStats]);
  
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

  // This check is now redundant due to the page-level check, but kept as a fallback.
  if (!user || !user.is_admin) {
    return (
      <div className="admin-bg-overlay absolute inset-0">
        <AccessDenied message="You are not authorized to view this page." />
      </div>
    )
  }
  
  const totalPages = totalProfileCount > 0 ? Math.ceil(totalProfileCount / PAGE_SIZE) : 1;
  
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
                <Button variant="outline" size="icon" onClick={handleManualRefreshStats} disabled={isRefreshingStats}>
                    {isRefreshingStats ? <Loader className="h-5 w-5" /> : <RefreshCw className="h-5 w-5" />}
                    <span className="sr-only">Refresh Stats</span>
                </Button>
            </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
            <UserTable 
              profiles={paginatedProfiles} 
              isLoading={isTableLoading}
              onSubscriptionUpdate={handleProfileUpdate}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
        </div>
    </div>
  );
}
