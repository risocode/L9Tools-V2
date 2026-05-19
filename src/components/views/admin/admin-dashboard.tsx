"use client";

import { useState, useEffect, useCallback, useTransition, useRef } from 'react';
import type { Profile } from '@/types';
import { useAuth } from '@/context/auth-context';
import { isUserAdmin } from '@/lib/supabase-admin';
import { ADMIN_PAGE_SIZE, type AdminExtraFilter, type SubscriptionTierFilter } from '@/lib/admin-constants';
import { getAllProfiles } from '@/app/actions/get-all-profiles';
import { loadAdminDashboard } from '@/app/actions/load-admin-dashboard';
import { getCachedUserStats } from '@/app/actions/get-cached-user-stats';
import { refreshUserStatsCache } from '@/app/actions/refresh-user-stats-cache';
import { refreshUserStatus } from '@/app/actions/refresh-user-status';
import { upgradeUsersToPro, getUpgradeEligibleCount } from '@/app/actions/upgrade-users-pro';
import { getAdminAnalytics } from '@/app/actions/get-admin-analytics';
import { getAdminOnlineCount } from '@/app/actions/get-admin-online-count';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { AccessDenied } from '../access-denied';
import { SendEmailDialog } from './send-email-dialog';
import { AdminShell } from './admin-shell';
import { AdminOverview } from './admin-overview';
import { AdminUsersPanel } from './admin-users-panel';
import { AdminMaintenancePanel } from './admin-maintenance-panel';
import { AdminContentPanel } from './admin-content-panel';
import { AdminPaymentsPanel } from './admin-payments-panel';
import type { AdminPaymentSummary } from '@/app/actions/get-admin-payments';
import { useAdminPresence } from '@/hooks/admin/use-admin-presence';
import type { AdminTab } from './admin-types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Loader from '@/components/ui/loader';
import { Sparkles } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

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
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [paginatedProfiles, setPaginatedProfiles] = useState<Profile[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [analytics, setAnalytics] = useState<{ signupsLast7Days: number; proExpiringNext7Days: number } | null>(null);
  const [totalProfileCount, setTotalProfileCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [isRefreshingStats, setIsRefreshingStats] = useState(false);
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<SubscriptionTierFilter>('all');
  const [extraFilter, setExtraFilter] = useState<AdminExtraFilter>('none');
  const [isPending, startTransition] = useTransition();
  const [isSendEmailDialogOpen, setIsSendEmailDialogOpen] = useState(false);
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeMonths, setUpgradeMonths] = useState(1);
  const [upgradeConfirmText, setUpgradeConfirmText] = useState('');
  const [eligibleUpgradeCount, setEligibleUpgradeCount] = useState(0);
  const [onlineCount, setOnlineCount] = useState(0);
  const [paymentSummary, setPaymentSummary] = useState<AdminPaymentSummary | null>(null);

  const skipNextProfilesFetch = useRef(true);
  const { toast } = useToast();

  const presenceEnabled = !isBootstrapping && !isAuthLoading && Boolean(user && isUserAdmin(user));
  const { onlineUsersRef, presenceOnlineCount, sortProfilesByOnlineStatus } = useAdminPresence(
    presenceEnabled,
    setPaginatedProfiles
  );

  const fetchOnlineCount = useCallback(async () => {
    const { count, error: countError } = await getAdminOnlineCount();
    if (!countError) setOnlineCount(count);
  }, []);

  useEffect(() => {
    if (!isBootstrapping && user && isUserAdmin(user)) {
      fetchOnlineCount();
    }
  }, [isBootstrapping, user, fetchOnlineCount, presenceOnlineCount]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (user && isUserAdmin(user)) fetchOnlineCount();
    }, 60000);
    return () => clearInterval(interval);
  }, [user, fetchOnlineCount]);

  useEffect(() => {
    if (searchParams.get('error') === 'unauthorized') {
      toast({
        variant: 'destructive',
        title: 'Access denied',
        description: 'You are not authorized to view the admin panel.',
      });
    }
  }, [searchParams, toast]);

  const applyDashboardPayload = useCallback(
    (payload: Awaited<ReturnType<typeof loadAdminDashboard>>) => {
      if (payload.error && !payload.stats) {
        setError(payload.error);
        setStats({ totalUsers: 0, proSubscribers: 0, lifetimeSubscribers: 0, freeUsers: 0 });
      } else if (payload.stats) {
        setStats({
          totalUsers: payload.stats.total_users,
          proSubscribers: payload.stats.pro_users,
          lifetimeSubscribers: payload.stats.lifetime_users,
          freeUsers: payload.stats.free_users,
        });
      }

      if (payload.analytics) setAnalytics(payload.analytics);
      setOnlineCount(payload.onlineCount);
      if (payload.paymentSummary) setPaymentSummary(payload.paymentSummary);

      if (payload.profiles.length > 0 || payload.totalCount >= 0) {
        setPaginatedProfiles(sortProfilesByOnlineStatus(payload.profiles));
        setTotalProfileCount(payload.totalCount);
      }

      if (payload.error) setError(payload.error);
      else setError(null);
    },
    [sortProfilesByOnlineStatus]
  );

  const fetchOverviewMetrics = useCallback(async () => {
    const [statsResult, analyticsResult, onlineResult] = await Promise.all([
      getCachedUserStats(),
      getAdminAnalytics(),
      getAdminOnlineCount(),
    ]);

    if (statsResult.data) {
      setStats({
        totalUsers: statsResult.data.total_users,
        proSubscribers: statsResult.data.pro_users,
        lifetimeSubscribers: statsResult.data.lifetime_users,
        freeUsers: statsResult.data.free_users,
      });
    }
    if (analyticsResult.data) setAnalytics(analyticsResult.data);
    if (!onlineResult.error) setOnlineCount(onlineResult.count);
  }, []);

  const fetchProfiles = useCallback(
    async (page: number, query: string, tier: SubscriptionTierFilter, extra: AdminExtraFilter) => {
      setIsTableLoading(true);
      const { profiles: fetchedProfiles, count, error: fetchError } = await getAllProfiles({
        page,
        pageSize: ADMIN_PAGE_SIZE,
        query,
        tier,
        extraFilter: extra,
      });

      if (fetchError) {
        setError(fetchError);
        setPaginatedProfiles([]);
      } else {
        setPaginatedProfiles(sortProfilesByOnlineStatus(fetchedProfiles || []));
        if (count !== null) setTotalProfileCount(count);
        setError(null);
      }
      setIsTableLoading(false);
    },
    [sortProfilesByOnlineStatus]
  );

  const bootstrapDashboard = useCallback(async () => {
    setIsBootstrapping(true);
    skipNextProfilesFetch.current = true;
    try {
      const payload = await loadAdminDashboard();
      applyDashboardPayload(payload);
    } catch {
      setError('An unexpected error occurred while loading dashboard data.');
    } finally {
      setIsBootstrapping(false);
    }
  }, [applyDashboardPayload]);

  useEffect(() => {
    const handler = setTimeout(() => {
      startTransition(() => {
        setDebouncedSearchQuery(searchQuery);
        setCurrentPage(1);
      });
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    if (user && isUserAdmin(user)) {
      bootstrapDashboard();
    } else if (!isAuthLoading && !user) {
      setIsBootstrapping(false);
    } else if (!isAuthLoading && user && !isUserAdmin(user)) {
      setIsBootstrapping(false);
    }
  }, [user, isAuthLoading, bootstrapDashboard]);

  useEffect(() => {
    if (isBootstrapping) return;

    if (skipNextProfilesFetch.current) {
      skipNextProfilesFetch.current = false;
      return;
    }

    fetchProfiles(currentPage, debouncedSearchQuery, tierFilter, extraFilter);
  }, [currentPage, debouncedSearchQuery, tierFilter, extraFilter, isBootstrapping, fetchProfiles]);

  const handleProfileUpdate = useCallback(async () => {
    if (isUserAdmin(user)) {
      setIsTableLoading(true);
      await Promise.all([
        fetchProfiles(currentPage, debouncedSearchQuery, tierFilter, extraFilter),
        fetchOverviewMetrics(),
      ]);
      setIsTableLoading(false);
    }
  }, [user, fetchProfiles, currentPage, debouncedSearchQuery, tierFilter, extraFilter, fetchOverviewMetrics]);

  const handleManualRefreshStatus = async () => {
    setIsRefreshingStatus(true);
    const visibleUserIds = paginatedProfiles.map((p) => p.id);
    if (visibleUserIds.length === 0) {
      setIsRefreshingStatus(false);
      return;
    }

    const result = await refreshUserStatus(visibleUserIds);

    if (result.success && result.data) {
      const statusMap = new Map(result.data.map((item) => [item.id, item]));
      setPaginatedProfiles((prev) =>
        sortProfilesByOnlineStatus(
          prev.map((profile) => {
            const updated = statusMap.get(profile.id);
            if (updated) {
              return {
                ...profile,
                online_status: updated.online_status as Profile['online_status'],
                last_sign_in_at: updated.last_sign_in_at,
              };
            }
            return profile;
          })
        )
      );
      toast({ title: 'Status refreshed', description: `Updated ${result.data.length} user(s).` });
      await fetchOnlineCount();
    } else {
      toast({ variant: 'destructive', title: 'Refresh failed', description: result.error ?? undefined });
    }
    setIsRefreshingStatus(false);
  };

  const handleRefreshStatsCache = async () => {
    setIsRefreshingStats(true);
    const result = await refreshUserStatsCache();
    if (result.success) {
      await fetchOverviewMetrics();
      toast({ title: 'Stats cache refreshed' });
    } else {
      toast({ variant: 'destructive', title: 'Failed', description: result.error ?? undefined });
    }
    setIsRefreshingStats(false);
  };

  const openUpgradeDialog = async () => {
    const { count } = await getUpgradeEligibleCount();
    setEligibleUpgradeCount(count);
    setUpgradeConfirmText('');
    setIsUpgradeDialogOpen(true);
  };

  const handleUpgradeAllFreeUsers = async () => {
    if (upgradeConfirmText !== 'UPGRADE') {
      toast({ variant: 'destructive', title: 'Type UPGRADE to confirm' });
      return;
    }
    setIsUpgrading(true);
    const result = await upgradeUsersToPro({ upgradeAll: true, durationMonths: upgradeMonths });
    if (result.success) {
      toast({
        title: 'Users upgraded',
        description: result.message ?? `Upgraded ${result.upgraded} users.`,
      });
      setIsUpgradeDialogOpen(false);
      setUpgradeMonths(1);
      setUpgradeConfirmText('');
      skipNextProfilesFetch.current = true;
      const payload = await loadAdminDashboard();
      applyDashboardPayload(payload);
    } else {
      toast({ variant: 'destructive', title: 'Upgrade failed', description: result.message });
    }
    setIsUpgrading(false);
  };

  if (isAuthLoading) {
    return (
      <div className="admin-bg-overlay absolute inset-0 flex h-full flex-col gap-6 p-4 md:p-6 overflow-y-auto">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      </div>
    );
  }

  if (!user || !isUserAdmin(user)) {
    return (
      <div className="admin-bg-overlay absolute inset-0">
        <AccessDenied message="You are not authorized to view this page." />
      </div>
    );
  }

  const totalPages = totalProfileCount > 0 ? Math.ceil(totalProfileCount / ADMIN_PAGE_SIZE) : 1;
  const isLoadingOrPending = isTableLoading || isPending;

  if (isBootstrapping) {
    return (
      <div className="admin-bg-overlay absolute inset-0 flex h-full flex-col gap-4 p-4 md:p-6 overflow-y-auto">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground text-sm">
          <Loader className="h-5 w-5" />
          Loading admin data…
        </div>
      </div>
    );
  }

  return (
    <>
      <AdminShell
        activeTab={activeTab}
        onTabChange={setActiveTab}
        error={error}
        onDismissError={() => setError(null)}
        overview={<AdminOverview stats={stats} onlineCount={onlineCount} analytics={analytics} />}
        payments={
          activeTab === 'payments' ? <AdminPaymentsPanel initialSummary={paymentSummary} /> : null
        }
        users={
          <AdminUsersPanel
            profiles={paginatedProfiles}
            isLoading={isLoadingOrPending}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            tierFilter={tierFilter}
            onTierFilterChange={(tier) => {
              startTransition(() => {
                setTierFilter(tier);
                setCurrentPage(1);
              });
            }}
            extraFilter={extraFilter}
            onExtraFilterChange={(f) => {
              startTransition(() => {
                setExtraFilter(f);
                setCurrentPage(1);
              });
            }}
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalProfileCount}
            pageSize={ADMIN_PAGE_SIZE}
            onPageChange={setCurrentPage}
            onSubscriptionUpdate={handleProfileUpdate}
            onlineUserIds={onlineUsersRef.current}
            isRefreshingStatus={isRefreshingStatus}
            isRefreshingStats={isRefreshingStats}
            onRefreshStatus={handleManualRefreshStatus}
            onRefreshStats={handleRefreshStatsCache}
            onSendEmail={() => setIsSendEmailDialogOpen(true)}
            onUpgradeUsers={openUpgradeDialog}
          />
        }
        email={
          <div className="rounded-lg border border-border/50 p-6 text-center">
            <p className="text-muted-foreground mb-4">Open the email campaign dialog from the Users tab, or use the button below.</p>
            <Button onClick={() => setIsSendEmailDialogOpen(true)}>Open email dialog</Button>
          </div>
        }
        maintenance={<AdminMaintenancePanel onStatsRefresh={fetchOverviewMetrics} />}
        content={activeTab === 'content' ? <AdminContentPanel /> : null}
      />

      <SendEmailDialog isOpen={isSendEmailDialogOpen} onClose={() => setIsSendEmailDialogOpen(false)} />

      <AlertDialog open={isUpgradeDialogOpen} onOpenChange={setIsUpgradeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-400" />
              Upgrade free users to Pro
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  This will upgrade <strong className="text-foreground">{eligibleUpgradeCount}</strong> eligible free-tier
                  user(s). Pro and Lifetime users are not affected.
                </p>
                <div>
                  <Label htmlFor="months">Duration (months)</Label>
                  <Input
                    id="months"
                    type="number"
                    min={1}
                    max={12}
                    value={upgradeMonths}
                    onChange={(e) => setUpgradeMonths(Math.max(1, Math.min(12, parseInt(e.target.value, 10) || 1)))}
                    disabled={isUpgrading}
                    className="max-w-[150px] mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="confirm">Type UPGRADE to confirm</Label>
                  <Input
                    id="confirm"
                    value={upgradeConfirmText}
                    onChange={(e) => setUpgradeConfirmText(e.target.value)}
                    disabled={isUpgrading}
                    className="mt-1"
                    placeholder="UPGRADE"
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpgrading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUpgradeAllFreeUsers}
              disabled={isUpgrading || upgradeConfirmText !== 'UPGRADE'}
              className="bg-yellow-500 hover:bg-yellow-400 text-black"
            >
              {isUpgrading ? (
                <>
                  <Loader className="h-4 w-4 mr-2" />
                  Upgrading...
                </>
              ) : (
                'Upgrade all eligible users'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
