'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, Star, Users, UserCheck, TrendingUp, Clock } from 'lucide-react';

interface Stats {
  totalUsers: number;
  proSubscribers: number;
  lifetimeSubscribers: number;
  freeUsers: number;
}

interface AdminOverviewProps {
  stats: Stats | null;
  onlineCount: number;
  analytics: { signupsLast7Days: number; proExpiringNext7Days: number } | null;
}

export function AdminOverview({ stats, onlineCount, analytics }: AdminOverviewProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Users" value={stats?.totalUsers ?? 0} icon={Users} variant="total" />
        <StatCard label="Pro Subs" value={stats?.proSubscribers ?? 0} icon={Star} variant="pro" valueClass="text-[#FFD700]" />
        <StatCard label="Lifetime Subs" value={stats?.lifetimeSubscribers ?? 0} icon={Crown} variant="lifetime" valueClass="text-[#ff4d4d]" />
        <StatCard label="Free Users" value={stats?.freeUsers ?? 0} icon={Users} variant="free" valueClass="text-[#d9d9d9]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Online Now" value={onlineCount} icon={UserCheck} valueClass="text-green-400" />
        <StatCard label="Signups (7d)" value={analytics?.signupsLast7Days ?? 0} icon={TrendingUp} />
        <StatCard label="Pro Expiring (7d)" value={analytics?.proExpiringNext7Days ?? 0} icon={Clock} valueClass="text-yellow-400" />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  variant,
  valueClass,
}: {
  label: string;
  value: number;
  icon: typeof Users;
  variant?: 'total' | 'pro' | 'lifetime' | 'free';
  valueClass?: string;
}) {
  const variantClass =
    variant === 'total'
      ? 'admin-stat-card-total'
      : variant === 'pro'
        ? 'admin-stat-card-pro'
        : variant === 'lifetime'
          ? 'admin-stat-card-lifetime'
          : variant === 'free'
            ? 'admin-stat-card-free'
            : '';

  return (
    <Card className={`admin-stat-card ${variantClass}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="admin-stat-card-label">{label}</CardTitle>
        <Icon className="admin-stat-card-icon" />
      </CardHeader>
      <CardContent>
        <div className={`admin-stat-card-value ${valueClass ?? ''}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

