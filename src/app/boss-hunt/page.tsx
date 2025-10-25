
"use client";
import { useState, useEffect } from 'react';
import { BossHuntView } from '@/components/views/boss-hunt-view';
import { getInitialBosses } from '@/app/actions/get-initial-bosses';
import { L9ToolsLayout } from '@/components/layout/l9tools-layout';
import type { Boss } from '@/types';

// This is a client component now to manage control state
export default function BossHuntPage() {
  const [initialBosses, setInitialBosses] = useState<Boss[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const { bosses, error } = await getInitialBosses();
      if (error) {
        console.error("Failed to fetch initial bosses:", error);
        setError("Failed to load boss data.");
      }
      setInitialBosses(bosses || []);
    }
    loadData();
  }, []);
  
  return (
    <L9ToolsLayout>
      <BossHuntView 
        initialBosses={initialBosses} 
      />
    </L9ToolsLayout>
  );
}
