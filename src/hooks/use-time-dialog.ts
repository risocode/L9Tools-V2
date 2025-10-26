
"use client";

import { useState, useCallback } from 'react';
import type { Boss } from '@/types';
import { useAuth } from '@/context/auth-context';
import { useAd } from '@/context/ad-context';

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
        const isProUser = user?.subscription_tier === 'pro' || user?.subscription_tier === 'lifetime' || user?.is_admin;

        // Check if it's a high-level VARIABLE boss and the user is not Pro
        if (!boss.isFixedSpawn && boss.level >= 90 && !isProUser) {
            onOpenProDialog();
            return;
        }

        // Show ad for free tier users on any allowed action
        if (user && user.subscription_tier === 'free') {
            openAdDialog();
        }
        
        setTimeDialogBoss(boss);
        setIsTimePickerDialog(true);
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

    const handleClose = useCallback(() => {
        setIsTimePickerDialog(false);
        setTimeDialogBoss(null);
    }, []);

    return {
        isTimePickerDialog,
        timeDialogBoss,
        isSubmittingTime,
        handleOpenTimeDialog,
        handleConfirmSetTime,
        setIsTimePickerDialog: handleClose,
    };
}
