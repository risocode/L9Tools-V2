
"use client";

import { useState, useCallback } from 'react';
import type { Boss } from '@/types';
import { useAuth } from '@/context/auth-context';
import { useAd } from '@/context/ad-context';
import { isUserAdmin } from '@/lib/supabase-admin';
import { hasActiveProSubscription } from '@/lib/subscription-utils';

export function useTimeDialog(
    onConfirm: (boss: Boss, killedAt: Date) => Promise<void>, 
    onGoToSubscribe: () => void,
    onOpenProDialog: () => void
) {
    const { user } = useAuth();
    const { openAdDialog } = useAd();
    const [isTimePickerDialog, setIsTimePickerDialog] = useState(false);
    const [timeDialogBoss, setTimeDialogBoss] = useState<Boss | null>(null);
    const [isSubmittingTime, setIsSubmittingTime] = useState(false);

    const handleOpenTimeDialog = useCallback((boss: Boss) => {
        const isProUser = user ? hasActiveProSubscription(
            user.subscription_tier as any,
            user.subscription_expires_at,
            isUserAdmin(user)
        ) : false;

        // Check if it's a high-level VARIABLE boss and the user is not Pro
        if (!boss.isFixedSpawn && boss.level >= 90 && !isProUser) {
            onOpenProDialog();
            return;
        }

        if (!isProUser) {
            openAdDialog(undefined, () => {
                setTimeDialogBoss(boss);
                setIsTimePickerDialog(true);
            });
        } else {
            setTimeDialogBoss(boss);
            setIsTimePickerDialog(true);
        }
    }, [user, openAdDialog, onOpenProDialog]);

    const handleConfirmSetTime = useCallback(async (boss: Boss, killedAt: Date) => {
        setIsSubmittingTime(true);
        try {
            await onConfirm(boss, killedAt);
        } finally {
            setIsSubmittingTime(false);
            setIsTimePickerDialog(false);
        }
    }, [onConfirm]);

    const closeTimePickerDialog = useCallback(() => {
        setIsTimePickerDialog(false);
        setTimeDialogBoss(null);
    }, []);

    return {
        isTimePickerDialog,
        timeDialogBoss,
        isSubmittingTime,
        handleOpenTimeDialog,
        handleConfirmSetTime,
        closeTimePickerDialog,
    };
}
