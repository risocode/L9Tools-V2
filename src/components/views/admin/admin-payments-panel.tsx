'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatPhpFromCents } from '@/lib/format-currency';
import {
  getAdminPayments,
  getAdminPaymentSummary,
  type AdminPaymentRow,
  type AdminPaymentSummary,
} from '@/app/actions/get-admin-payments';
import { backfillPayMongoPayments } from '@/app/actions/backfill-paymongo-payments';
import { useToast } from '@/hooks/use-toast';
import Loader from '@/components/ui/loader';
import { Banknote, Calendar, Download, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const PAYMENTS_PAGE_SIZE = 15;

interface AdminPaymentsPanelProps {
  initialSummary: AdminPaymentSummary | null;
}

export function AdminPaymentsPanel({ initialSummary }: AdminPaymentsPanelProps) {
  const { toast } = useToast();
  const [summary, setSummary] = useState<AdminPaymentSummary | null>(initialSummary);
  const [payments, setPayments] = useState<AdminPaymentRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);

  const loadPage = useCallback(async (pageNum: number) => {
    setIsLoading(true);
    const [summaryResult, paymentsResult] = await Promise.all([
      getAdminPaymentSummary(),
      getAdminPayments(pageNum, PAYMENTS_PAGE_SIZE),
    ]);

    if (summaryResult.data) setSummary(summaryResult.data);
    if (paymentsResult.error) {
      toast({ variant: 'destructive', title: 'Failed to load payments', description: paymentsResult.error });
      setPayments([]);
    } else {
      setPayments(paymentsResult.payments);
      setTotalCount(paymentsResult.count);
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    loadPage(page);
  }, [page, loadPage]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAYMENTS_PAGE_SIZE));

  const handleImportPayMongo = async () => {
    setIsImporting(true);
    const result = await backfillPayMongoPayments();
    setIsImporting(false);

    if (!result.success) {
      toast({ variant: 'destructive', title: 'Import failed', description: result.error });
      return;
    }

    toast({
      title: 'PayMongo import complete',
      description: `Imported ${result.imported ?? 0}, skipped ${result.skipped ?? 0}, errors ${result.errors ?? 0}.`,
    });
    setPage(1);
    await loadPage(1);
  };

  const displayEmail = (row: AdminPaymentRow) =>
    row.user_email || row.profile_email || '—';

  const displayName = (row: AdminPaymentRow) =>
    row.user_display_name || displayEmail(row);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Total revenue"
          value={summary ? formatPhpFromCents(summary.totalAmountCents) : '—'}
          icon={Banknote}
          loading={isLoading && !summary}
        />
        <SummaryCard
          label="Paid transactions"
          value={summary ? String(summary.paymentCount) : '—'}
          icon={Receipt}
          loading={isLoading && !summary}
        />
        <SummaryCard
          label="Revenue (7 days)"
          value={summary ? formatPhpFromCents(summary.amountLast7DaysCents) : '—'}
          icon={Calendar}
          loading={isLoading && !summary}
        />
        <SummaryCard
          label="Payments (7 days)"
          value={summary ? String(summary.paymentsLast7Days) : '—'}
          icon={Receipt}
          loading={isLoading && !summary}
        />
      </div>

      <Card className="border-border/50">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="font-cinzel text-lg">Payment history</CardTitle>
            <CardDescription>
              PayMongo QRPh payments recorded when checkout succeeds. Run the SQL migration in Supabase, then import past
              payments once if needed.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleImportPayMongo}
            disabled={isImporting}
            className="shrink-0"
          >
            {isImporting ? (
              <>
                <Loader className="h-4 w-4 mr-2" />
                Importing…
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Import from PayMongo
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading && payments.length === 0 ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : payments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No payments recorded yet. New PayMongo checkouts will appear here automatically. Use Import from PayMongo
              to load historical payments.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-md border border-border/40">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Source</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {format(new Date(row.paid_at), 'MMM d, yyyy HH:mm')}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{displayName(row)}</div>
                          <div className="text-xs text-muted-foreground">{displayEmail(row)}</div>
                        </TableCell>
                        <TableCell className="capitalize text-sm">
                          {row.plan}
                          {row.months > 1 ? ` · ${row.months} mo` : ''}
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-400">
                          {formatPhpFromCents(row.amount_cents)}
                        </TableCell>
                        <TableCell className="text-sm capitalize text-muted-foreground">{row.source}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 text-sm">
                  <span className="text-muted-foreground">
                    Page {page} of {totalPages} ({totalCount} total)
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1 || isLoading} onClick={() => setPage((p) => p - 1)}>
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages || isLoading}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  loading,
}: {
  label: string;
  value: string;
  icon: typeof Banknote;
  loading?: boolean;
}) {
  return (
    <Card className="admin-stat-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="admin-stat-card-label">{label}</CardTitle>
        <Icon className="admin-stat-card-icon h-4 w-4" />
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-8 w-24" /> : <div className="admin-stat-card-value">{value}</div>}
      </CardContent>
    </Card>
  );
}
