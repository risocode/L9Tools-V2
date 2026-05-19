'use client';

import type { Profile } from '@/types';
import type { AdminExtraFilter, SubscriptionTierFilter } from '@/lib/admin-constants';
import { UserTable } from './user-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, RefreshCw, Mail, Sparkles, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Loader from '@/components/ui/loader';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AdminUsersPanelProps {
  profiles: Profile[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  tierFilter: SubscriptionTierFilter;
  onTierFilterChange: (tier: SubscriptionTierFilter) => void;
  extraFilter: AdminExtraFilter;
  onExtraFilterChange: (filter: AdminExtraFilter) => void;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSubscriptionUpdate: () => void;
  onlineUserIds?: Set<string>;
  isRefreshingStatus: boolean;
  isRefreshingStats: boolean;
  onRefreshStatus: () => void;
  onRefreshStats: () => void;
  onSendEmail: () => void;
  onUpgradeUsers: () => void;
}

export function AdminUsersPanel({
  profiles,
  isLoading,
  searchQuery,
  onSearchChange,
  tierFilter,
  onTierFilterChange,
  extraFilter,
  onExtraFilterChange,
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  onSubscriptionUpdate,
  onlineUserIds,
  isRefreshingStatus,
  isRefreshingStats,
  onRefreshStatus,
  onRefreshStats,
  onSendEmail,
  onUpgradeUsers,
}: AdminUsersPanelProps) {
  const start = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="flex flex-1 flex-col gap-4 min-h-0">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search username, email, short ID, or UUID..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={onSendEmail} className="gap-2">
          <Mail className="h-4 w-4" />
          Email
        </Button>
        <Button
          variant="outline"
          onClick={onUpgradeUsers}
          className="gap-2 bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/30 text-yellow-400"
        >
          <Sparkles className="h-4 w-4" />
          Upgrade
        </Button>
        <Button variant="outline" size="icon" onClick={onRefreshStatus} disabled={isRefreshingStatus} title="Refresh online status">
          {isRefreshingStatus ? <Loader className="h-5 w-5" /> : <RefreshCw className="h-5 w-5" />}
        </Button>
        <Button variant="outline" size="icon" onClick={onRefreshStats} disabled={isRefreshingStats} title="Refresh stats cache">
          {isRefreshingStats ? <Loader className="h-5 w-5" /> : <BarChart3 className="h-5 w-5" />}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 gap-2 rounded-lg bg-black/20 p-2 min-w-[200px]">
          {(['all', 'free', 'pro', 'lifetime'] as SubscriptionTierFilter[]).map((tier) => (
            <Button
              key={tier}
              variant={tierFilter === tier ? 'secondary' : 'ghost'}
              onClick={() => onTierFilterChange(tier)}
              className={cn('capitalize flex-1', tierFilter === tier && 'admin-filter-button-active')}
              disabled={isLoading}
              size="sm"
            >
              {tier}
            </Button>
          ))}
        </div>
        <Select value={extraFilter} onValueChange={(v) => onExtraFilterChange(v as AdminExtraFilter)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="More filters" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No extra filter</SelectItem>
            <SelectItem value="trial">Trial accounts</SelectItem>
            <SelectItem value="expired_pro">Expired Pro</SelectItem>
            <SelectItem value="never_signed_in">Never signed in</SelectItem>
            <SelectItem value="admins">Admins only</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          Showing {start}–{end} of {totalCount}
        </span>
      </div>

      <UserTable
        profiles={profiles}
        isLoading={isLoading}
        onSubscriptionUpdate={onSubscriptionUpdate}
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onlineUserIds={onlineUserIds}
      />
    </div>
  );
}

