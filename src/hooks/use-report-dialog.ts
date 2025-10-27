
"use client";

import { useState, useCallback, useEffect } from 'react';
import { isToday, formatISO } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { useToast } from '@/hooks/use-toast';
import type { ProcessedBoss } from '@/components/views/boss-timer';
import type { ReportBoss } from '@/components/views/report-dialog';
import { useAuth } from '@/context/auth-context';
import { useAd } from '@/context/ad-context';

const GUEST_REPORT_LIMIT = 10;
const FREE_USER_REPORT_LIMIT = 5;
const REPORT_USAGE_KEY_PREFIX = 'reportUsage';
const PRO_USER_COOLDOWN = 10000; // 10 seconds

interface ReportUsage {
    count: number;
    date: string; // YYYY-MM-DD
}

export function useReportDialog(bosses: ProcessedBoss[], onGuestReportReset: (bossIds: string[]) => void) {
    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
    const [isSendingReport, setIsSendingReport] = useState(false);
    const [reportBosses, setReportBosses] = useState<ReportBoss[]>([]);
    const [reportCooldown, setReportCooldown] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();
    const { openAdDialog } = useAd();

    const getStorageKey = useCallback(() => {
        return user ? `${REPORT_USAGE_KEY_PREFIX}_${user.id}` : `${REPORT_USAGE_KEY_PREFIX}_guest`;
    }, [user]);

    const checkLimit = useCallback(() => {
        if (reportCooldown) {
            toast({
                variant: "destructive",
                title: "Cooldown Active",
                description: "Please wait a moment before sending another report.",
            });
            return false;
        }

        const isGuest = !user;
        const limit = isGuest ? GUEST_REPORT_LIMIT : FREE_USER_REPORT_LIMIT;
        
        // Pro/Lifetime users have no daily count limits, but are subject to the spamming cooldown
        if (user && (user.subscription_tier === 'pro' || user.subscription_tier === 'lifetime')) {
            return true;
        }
        
        const today = formatISO(new Date(), { representation: 'date' });
        const key = getStorageKey();
        const storedUsage = localStorage.getItem(key);
        let usage: ReportUsage = { count: 0, date: today };

        if (storedUsage) {
            try {
                const parsed = JSON.parse(storedUsage);
                if (parsed.date === today) {
                    usage = parsed;
                }
            } catch (e) {
                console.error("Could not parse report usage from localStorage", e);
            }
        }

        if (usage.count >= limit) {
            toast({
                variant: "destructive",
                title: "Daily Report Limit Reached",
                description: `You have reached the daily limit of ${limit} reports. Please upgrade to Pro for unlimited reports.`,
            });
            return false; // Limit reached
        }
        return true; // Limit not reached
    }, [user, toast, getStorageKey, reportCooldown]);
    
    const incrementLimit = useCallback(() => {
        // Pro/Lifetime users don't have count limits to increment
        if (user && (user.subscription_tier === 'pro' || user.subscription_tier === 'lifetime')) {
             // Set a cooldown for Pro users to prevent spam
            setReportCooldown(true);
            setTimeout(() => setReportCooldown(false), PRO_USER_COOLDOWN);
            return;
        }

        const today = formatISO(new Date(), { representation: 'date' });
        const key = getStorageKey();
        const storedUsage = localStorage.getItem(key);
        let usage: ReportUsage = { count: 0, date: today };

        if (storedUsage) {
            try {
                const parsed = JSON.parse(storedUsage);
                if (parsed.date === today) {
                    usage = parsed;
                }
            } catch (e) {
               console.error("Could not parse report usage from localStorage", e);
            }
        }
        usage.count += 1;
        usage.date = today;
        localStorage.setItem(key, JSON.stringify(usage));
    }, [user, getStorageKey]);

    const handleOpenReportDialog = useCallback((filter: 'today' | 'all') => {
        if (!checkLimit()) {
            return;
        }

        // Show ad for guest or free users when they initiate a report
        if (!user || user.subscription_tier === 'free') {
            openAdDialog();
        }
        
        const timeZone = 'Asia/Manila';
        
        let reportData = bosses
          .filter(boss => boss.respawnTime !== null)
          .map(boss => {
            return {
              id: boss.id,
              name: boss.name,
              level: boss.level,
              spawnTime: boss.isSpawned ? 'Active' : formatInTimeZone(toZonedTime(boss.respawnTime!, timeZone), timeZone, 'MMM d, EEE, hh:mm a'),
              spawnDate: boss.respawnTime!,
              isFixedSpawn: boss.isFixedSpawn,
            };
          });

        if (filter === 'today') {
          const zonedNow = toZonedTime(new Date(), timeZone);
          reportData = reportData.filter(b => isToday(toZonedTime(b.spawnDate, timeZone)) || b.spawnTime === 'Active');
        }
          
        reportData.sort((a, b) => {
            if (a.spawnTime === 'Active' && b.spawnTime !== 'Active') return -1;
            if (a.spawnTime !== 'Active' && b.spawnTime === 'Active') return 1;
            return a.spawnDate.getTime() - b.spawnDate.getTime();
        });
          
        setReportBosses(reportData);
        setIsReportDialogOpen(true);
    }, [bosses, user, checkLimit, openAdDialog]);

    const handleConfirmSendReport = async (finalBosses: ReportBoss[], webhookUrl: string) => {
        if (!webhookUrl) {
            toast({ variant: "destructive", title: "Missing Webhook URL", description: "Please enter a webhook URL." });
            return;
        }
        
        if (!checkLimit()) {
            setIsReportDialogOpen(false);
            return;
        }

        setIsSendingReport(true);
        try {
            const response = await fetch('/api/report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ bosses: finalBosses, webhookUrl }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'An unknown error occurred.');
            }
          
          toast({ variant: "success", title: "Report Sent!", description: "Boss spawn report sent to Discord." });
          setIsReportDialogOpen(false);
          
          // Save webhook locally for everyone for convenience, and DB will be updated on the server
          localStorage.setItem('discordWebhookUrl', webhookUrl);

          incrementLimit();

          if (!user) { // Guest User Logic
            const guestBossIdsToReset = finalBosses
              .filter(boss => !boss.isFixedSpawn)
              .map(boss => boss.id);
            
            if (guestBossIdsToReset.length > 0) {
              // The timers are reset immediately upon sending a report for guests
              onGuestReportReset(guestBossIdsToReset);
            }
          }

        } catch (error: any) {
          console.error("Error sending report:", error);
          toast({ variant: "destructive", title: "Report Error", description: error.message || "Could not send report." });
        } finally {
          setIsSendingReport(false);
        }
    };
    
    return {
        isReportDialogOpen,
        isSendingReport,
        reportBosses,
        handleOpenReportDialog,
        handleConfirmSendReport,
        setIsReportDialogOpen,
    };
}
