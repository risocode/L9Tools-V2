
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Boss } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase-client';

const FIRST_TIME_KEY = 'l9tools_first_time_user';
const GUEST_TIMERS_KEY = 'guestBossTimers';

export function useBossData(initialBosses: Boss[]) {
  const { user, isInitialLoading: isAuthLoading } = useAuth();
  const [isBossDataLoading, setIsLoading] = useState(true);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [userTimers, setUserTimers] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    const firstTimeVisit = !localStorage.getItem(FIRST_TIME_KEY);
    setIsFirstTime(firstTimeVisit);
  }, []);
  
  useEffect(() => {
    const loadUserData = async () => {
      if (isAuthLoading) return;

      setIsLoading(true);
      
      if (user) {
        const { data: timers, error } = await supabase.from('user_boss_timers').select('boss_id, last_killed').eq('user_id', user.id);
        if (error) {
          console.error('Error fetching user timers:', error.message);
          toast({ variant: "destructive", title: "Error", description: "Could not load your saved timers." });
        }
        
        const timerMap = timers ? Object.fromEntries(timers.map(t => [t.boss_id.toString(), t.last_killed])) : {};
        setUserTimers(timerMap);
        
      } else {
        const localTimers = localStorage.getItem(GUEST_TIMERS_KEY);
        const timerMap = localTimers ? JSON.parse(localTimers) : {};
        setUserTimers(timerMap);
      }
      
      setIsLoading(false);
    };

    loadUserData();
    
  }, [user, isAuthLoading, toast]);

  const bossesWithTimers = useMemo(() => {
    if (!initialBosses) return [];
    return initialBosses.map(boss => ({
      ...boss,
      lastKilled: userTimers[boss.id] || null,
    }));
  }, [initialBosses, userTimers]);
  
  const setNotFirstTime = useCallback(() => {
    localStorage.setItem(FIRST_TIME_KEY, 'false');
    setIsFirstTime(false);
  }, []);

  const handleSetManualTime = async (boss: Boss, killedAt: Date) => {
    if (user) {
      const { error } = await supabase
        .from('user_boss_timers')
        .upsert({ user_id: user.id, boss_id: parseInt(boss.id, 10), last_killed: killedAt.toISOString() }, { onConflict: 'user_id, boss_id' });

      if (error) {
        toast({ variant: "destructive", title: "Error Saving Timer", description: error.message });
        return; 
      }
    } else {
      const localTimers = JSON.parse(localStorage.getItem(GUEST_TIMERS_KEY) || '{}');
      localTimers[boss.id] = killedAt.toISOString();
      localStorage.setItem(GUEST_TIMERS_KEY, JSON.stringify(localTimers));
    }
    
    setUserTimers(prev => ({...prev, [boss.id]: killedAt.toISOString()}));
    toast({ variant: "success", title: `Timer for ${boss.name} Updated!` });
  };

  const handleReset = async (boss: Boss) => {
    if (boss.isFixedSpawn) return;

    if (user) {
      const { error } = await supabase
        .from('user_boss_timers')
        .delete()
        .match({ user_id: user.id, boss_id: parseInt(boss.id, 10) });
      
      if (error) {
        toast({ variant: "destructive", title: "Error Resetting Timer", description: error.message });
        return;
      }
    } else {
        const localTimers = JSON.parse(localStorage.getItem(GUEST_TIMERS_KEY) || '{}');
        delete localTimers[boss.id];
        localStorage.setItem(GUEST_TIMERS_KEY, JSON.stringify(localTimers));
    }

    const newTimers = {...userTimers};
    delete newTimers[boss.id];
    setUserTimers(newTimers);

    toast({ variant: "success", title: `${boss.name} Timer Reset!` });
  };

  const handleGuestReportReset = (bossIds: string[]) => {
    const localTimers = JSON.parse(localStorage.getItem(GUEST_TIMERS_KEY) || '{}');
    let changed = false;
    let newTimers = {...localTimers};
    bossIds.forEach(id => {
      if (newTimers[id]) {
        delete newTimers[id];
        changed = true;
      }
    });

    if (changed) {
        localStorage.setItem(GUEST_TIMERS_KEY, JSON.stringify(newTimers));
        setUserTimers(newTimers)
        toast({ title: "Guest Timers Reset", description: "Your timers for this session have been cleared." });
    }
  };


  return { bossesWithTimers, isBossDataLoading, isFirstTime, setNotFirstTime, handleSetManualTime, handleReset, handleGuestReportReset };
}
