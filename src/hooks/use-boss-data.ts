"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { Boss } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase-client";

const FIRST_TIME_KEY = "l9tools_first_time_user";

interface BossTimer {
  boss_id: number;
  last_killed: string | null;
}

export function useBossData(initialBosses: Boss[]) {
  const { user, isInitialLoading: isAuthLoading } = useAuth();
  const [isBossDataLoading, setIsLoading] = useState(true);
  const [isFirstTime, setIsFirstTime] = useState(false);
  // ✅ allow null since Supabase can return null for `last_killed`
  const [userTimers, setUserTimers] = useState<Record<string, string | null>>({});
  const { toast } = useToast();

  // Detect first-time visitor
  useEffect(() => {
    const firstTimeVisit = !localStorage.getItem(FIRST_TIME_KEY);
    setIsFirstTime(firstTimeVisit);
  }, []);

  // Load user or guest data
  useEffect(() => {
    const loadUserData = async () => {
      if (isAuthLoading) return;

      setIsLoading(true);

      try {
        if (user) {
          const { data: timers, error } = await supabase
            .from("user_boss_timers")
            .select("boss_id, last_killed")
            .eq("user_id", user.id);

          if (error) throw error;

          const timerMap = timers
            ? Object.fromEntries(
                timers.map((t: BossTimer) => [
                  t.boss_id.toString(),
                  t.last_killed ?? null,
                ])
              )
            : {};

          setUserTimers(timerMap);
        } else {
          // Guest: do not load timers from storage so they reset on reload until they log in
          setUserTimers({});
        }
      } catch (err: any) {
        console.error("Error fetching boss timers:", err.message);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load your saved timers.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [user, isAuthLoading, toast]);

  // Computed list merging boss data with timers
  const bossesWithTimers = useMemo(() => {
    if (!initialBosses) return [];
    return initialBosses.map((boss) => ({
      ...boss,
      lastKilled: userTimers[boss.id] ?? null,
    }));
  }, [initialBosses, userTimers]);

  // Mark user as not first-time
  const setNotFirstTime = useCallback(() => {
    localStorage.setItem(FIRST_TIME_KEY, "false");
    setIsFirstTime(false);
  }, []);

  // Update or insert manual kill time
  const handleSetManualTime = async (boss: Boss, killedAt: Date) => {
    try {
      if (user) {
        const { error } = await supabase
          .from("user_boss_timers")
          .upsert(
            {
              user_id: user.id,
              boss_id: parseInt(boss.id, 10),
              last_killed: killedAt.toISOString(),
            },
            { onConflict: "user_id,boss_id" }
          );

        if (error) throw error;
      } else {
        // Guest: only update in-memory; do not persist so timers reset on page reload
      }

      setUserTimers((prev) => ({
        ...prev,
        [boss.id]: killedAt.toISOString(),
      }));

      toast({
        variant: "success",
        title: `Timer for ${boss.name} Updated!`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error Saving Timer",
        description: err.message,
      });
    }
  };

  // Reset a boss timer
  const handleReset = async (boss: Boss) => {
    if (boss.isFixedSpawn) return;

    try {
      if (user) {
        const { error } = await supabase
          .from("user_boss_timers")
          .delete()
          .match({ user_id: user.id, boss_id: parseInt(boss.id, 10) });

        if (error) throw error;
      } else {
        // Guest: only update state; no persistence
      }

      const newTimers = { ...userTimers };
      delete newTimers[boss.id];
      setUserTimers(newTimers);

      toast({
        variant: "success",
        title: `${boss.name} Timer Reset!`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error Resetting Timer",
        description: err.message,
      });
    }
  };

  // Guest-only bulk reset (session state only; guest timers are not persisted)
  const handleGuestReportReset = (bossIds: string[]) => {
    setUserTimers((prev) => {
      let changed = false;
      const next = { ...prev };
      bossIds.forEach((id) => {
        if (next[id]) {
          delete next[id];
          changed = true;
        }
      });
      if (changed) {
        toast({
          title: "Guest Timers Reset",
          description: "Your timers for this session have been cleared.",
        });
      }
      return next;
    });
  };

  return {
    bossesWithTimers,
    isBossDataLoading,
    isFirstTime,
    setNotFirstTime,
    handleSetManualTime,
    handleReset,
    handleGuestReportReset,
  };
}
