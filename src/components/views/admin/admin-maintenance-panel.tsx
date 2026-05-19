'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { refreshUserStatsCache } from '@/app/actions/refresh-user-stats-cache';
import { validateExpiredSubscriptions } from '@/app/actions/validate-expired-subscriptions';
import { forceLogoutAllUsers } from '@/app/actions/force-logout-all-users';
import { getAdminAuditLog, type AuditLogEntry } from '@/app/actions/get-admin-audit-log';
import { useToast } from '@/hooks/use-toast';
import Loader from '@/components/ui/loader';
import { RefreshCw, ShieldCheck, LogOut, Copy, Database } from 'lucide-react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface AdminMaintenancePanelProps {
  onStatsRefresh?: () => void;
}

export function AdminMaintenancePanel({ onStatsRefresh }: AdminMaintenancePanelProps) {
  const { toast } = useToast();
  const [isRefreshingStats, setIsRefreshingStats] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [auditEntries, setAuditEntries] = useState<AuditLogEntry[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  const handleRefreshStatsCache = async () => {
    setIsRefreshingStats(true);
    const result = await refreshUserStatsCache();
    setIsRefreshingStats(false);
    if (result.success) {
      toast({ title: 'Stats cache refreshed' });
      onStatsRefresh?.();
    } else {
      toast({ variant: 'destructive', title: 'Failed', description: result.error ?? undefined });
    }
  };

  const handleValidateExpired = async () => {
    setIsValidating(true);
    const result = await validateExpiredSubscriptions();
    setIsValidating(false);
    if (result.success) {
      toast({
        title: 'Expired subscriptions validated',
        description: `${result.downgraded} user(s) downgraded to free.`,
      });
      onStatsRefresh?.();
    } else {
      toast({ variant: 'destructive', title: 'Failed', description: result.error ?? undefined });
    }
  };

  const handleForceLogout = async () => {
    if (!confirm('Force logout ALL users? Everyone must sign in again.')) return;
    setIsLoggingOut(true);
    const result = await forceLogoutAllUsers();
    setIsLoggingOut(false);
    if (result.success) {
      toast({ title: 'Success', description: result.message });
    } else {
      toast({
        variant: 'destructive',
        title: 'Force logout',
        description: result.message,
      });
    }
  };

  const loadAuditLog = async () => {
    setIsLoadingAudit(true);
    const { entries, error } = await getAdminAuditLog(1, 50);
    setIsLoadingAudit(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Audit log', description: error });
    } else {
      setAuditEntries(entries);
    }
  };

  const copySql = (sql: string) => {
    navigator.clipboard.writeText(sql);
    toast({ title: 'Copied to clipboard' });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4" />
              Stats cache
            </CardTitle>
            <CardDescription>Rebuild cached user statistics in the database.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleRefreshStatsCache} disabled={isRefreshingStats} className="w-full gap-2">
              {isRefreshingStats ? <Loader className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
              Refresh stats cache
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Subscriptions
            </CardTitle>
            <CardDescription>Downgrade expired Pro users to free tier.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleValidateExpired} disabled={isValidating} variant="outline" className="w-full gap-2">
              {isValidating ? <Loader className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
              Validate expired
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Force logout
            </CardTitle>
            <CardDescription>Invalidate all sessions (requires RPC migration).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={handleForceLogout} disabled={isLoggingOut} variant="destructive" className="w-full gap-2">
              {isLoggingOut ? <Loader className="h-4 w-4" /> : <LogOut className="h-4 w-4" />}
              Force logout all
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => copySql('SELECT public.force_logout_all_users();')}
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy SQL fallback
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Audit log</CardTitle>
            <CardDescription>Recent admin actions (last 50).</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadAuditLog} disabled={isLoadingAudit}>
            {isLoadingAudit ? <Loader className="h-4 w-4" /> : 'Load'}
          </Button>
        </CardHeader>
        <CardContent>
          {auditEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">Click Load to fetch audit entries.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Target</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {format(new Date(entry.created_at), 'MMM d, h:mm a')}
                    </TableCell>
                    <TableCell className="text-xs font-mono">{entry.action}</TableCell>
                    <TableCell className="text-xs truncate max-w-[120px]">
                      {entry.admin_display_name ?? entry.admin_id?.slice(0, 8) ?? '—'}
                    </TableCell>
                    <TableCell className="text-xs font-mono truncate max-w-[100px]">
                      {entry.target_user_id?.slice(0, 8) ?? '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

