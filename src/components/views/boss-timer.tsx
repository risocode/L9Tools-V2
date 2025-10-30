
"use client";

import { useState, useEffect, useMemo } from 'react';
import { intervalToDuration, addHours } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import type { Boss } from '@/types';
import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

export type ProcessedBoss = Boss & {
    respawnTime: Date | null;
    isSpawned: boolean;
};

interface BossTimerProps {
    boss: ProcessedBoss;
}

const ActiveCountdown = ({ spawnTime }: { spawnTime: Date }) => {
    const [now, setNow] = useState<Date | null>(null);
    const expiryTime = useMemo(() => addHours(spawnTime, 1), [spawnTime]);

    useEffect(() => {
        setNow(new Date());
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    if (!now || now > expiryTime) {
        // This case should ideally not be hit if the parent component's logic is correct,
        // but it's a safe fallback.
        return <div className="text-lg font-bold text-muted-foreground">Unknown</div>;
    }
    
    const duration = intervalToDuration({ start: now, end: expiryTime });

    const minutes = String(duration.minutes ?? 0).padStart(2, '0');
    const seconds = String(duration.seconds ?? 0).padStart(2, '0');

    return (
        <div className="flex flex-col items-center">
            <span className="font-bold text-green-400 animate-pulse text-lg">Active</span>
            <div className="flex items-center gap-1 text-xs">
                <span className="text-muted-foreground">{`Resets in: ${minutes}:${seconds}`}</span>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger>
                            <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top">
                            <p className="max-w-xs">If the timer is not updated within 1 hour of spawning, the status will reset to &apos;Unknown&apos;.</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </div>
    );
};


const TimerDisplay = ({ endDate, isFixedSpawn }: { endDate: Date, isFixedSpawn: boolean }) => {
    const [now, setNow] = useState<Date | null>(null);
    const oneHourInMillis = 3600 * 1000;

    useEffect(() => {
        // Set the initial time on the client after mounting to avoid hydration mismatch.
        setNow(new Date());
        
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    
    // Render a skeleton or null during server render and initial client render.
    if (!now) {
        return (
            <div className="flex flex-col items-center">
                <Skeleton className="h-6 w-40 mb-1" />
                <Skeleton className="h-8 w-24" />
            </div>
        );
    }

    if (now > endDate) {
        // If the boss has been active for less than an hour, show the countdown.
        if (now.getTime() - endDate.getTime() < oneHourInMillis) {
            return <ActiveCountdown spawnTime={endDate} />;
        }
        // This case should be rare, as useProcessedBosses should reset the timer.
        return <div className="flex flex-col items-center"><span className="font-bold text-green-400 animate-pulse text-lg">Active</span></div>;
    }

    const duration = intervalToDuration({ start: now, end: endDate });
    
    const days = duration.days ?? 0;
    const hours = String(duration.hours ?? 0).padStart(2, '0');
    const minutes = String(duration.minutes ?? 0).padStart(2, '0');
    const seconds = String(duration.seconds ?? 0).padStart(2, '0');
    
    const glowClass = isFixedSpawn ? 'text-glow-purple' : 'text-glow-amber';
    const timeColor = isFixedSpawn ? 'text-purple' : 'text-amber-gold';
    const labelColor = isFixedSpawn ? 'text-purple/80' : 'text-amber-gold/80';


    return (
        <div className="flex flex-col items-center">
            <div className={cn("flex items-center justify-center font-orbitron tracking-wider", glowClass)}>
                {days > 0 && (
                    <>
                        <div className="flex flex-col items-center px-1">
                            <span className={cn("text-lg font-bold", timeColor)}>{days}</span>
                            <span className={cn("text-xs font-roboto", labelColor)}>day</span>
                        </div>
                        <span className={cn("text-lg font-bold", timeColor)}>:</span>
                    </>
                )}
                <div className="flex flex-col items-center px-1">
                    <span className={cn("text-lg font-bold", timeColor)}>{hours}</span>
                    <span className={cn("text-xs font-roboto", labelColor)}>hour</span>
                </div>
                <span className={cn("text-lg font-bold", timeColor)}>:</span>
                <div className="flex flex-col items-center px-1">
                    <span className={cn("text-lg font-bold", timeColor)}>{minutes}</span>
                    <span className={cn("text-xs font-roboto", labelColor)}>min</span>
                </div>
                <span className={cn("text-lg font-bold", timeColor)}>:</span>
                <div className="flex flex-col items-center px-1">
                    <span className={cn("text-lg font-bold", timeColor)}>{seconds}</span>
                    <span className={cn("text-xs font-roboto", labelColor)}>sec</span>
                </div>
            </div>
            {/* Show date/time for ALL timers, not just fixed ones */}
            <div className="text-center font-roboto mt-1 text-shadow-soft">
                <p className="text-xs text-silver">{formatInTimeZone(endDate, 'Asia/Manila', 'hh:mm a')}</p>
                <p className="text-xs text-silver/80">{formatInTimeZone(endDate, 'Asia/Manila', 'MMM d - EEE')}</p>
            </div>
        </div>
    );
};


export function BossTimer({ boss }: BossTimerProps) {
    if (!boss.respawnTime) {
        return (
            <div className="flex flex-col items-center text-silver text-shadow-soft">
                <span className="text-lg">Unknown</span>
                {!boss.isFixedSpawn && boss.respawnCooldown && (
                    <span className="text-xs font-roboto font-bold text-amber-gold">({boss.respawnCooldown} hrs)</span>
                )}
            </div>
        );
    }

    return <TimerDisplay endDate={boss.respawnTime} isFixedSpawn={boss.isFixedSpawn} />;
}
