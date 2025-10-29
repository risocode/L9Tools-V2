
"use client";

import { L9ToolsLayout } from '@/components/layout/l9tools-layout';
import { AvatarView } from '@/components/views/avatar-view';
import type { AvatarData } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useState, useEffect } from 'react';
import mainAvatarData from '@/lib/avatar-data.json';
import rareAvatarData from '@/lib/rare-avatar-data.json';


// This function simulates fetching initial data on the server.
async function getInitialAvatars(): Promise<{ avatars: AvatarData[]; error: string | null; }> {
  try {
    // In a real app, this could be a database call. Here, we just type-cast the JSON.
    const allAvatars: AvatarData[] = [...(mainAvatarData as AvatarData[]), ...(rareAvatarData as AvatarData[])];
    return { avatars: allAvatars, error: null };
  } catch (err: any) {
    console.error('An exception occurred while loading avatar data:', err.message);
    return { avatars: [], error: 'A server error occurred while loading avatar data.' };
  }
}

export default function AvatarsPage() {
  const isMobile = useIsMobile();
  const [avatars, setAvatars] = useState<AvatarData[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
        const { avatars: fetchedAvatars, error: fetchError } = await getInitialAvatars();
        setAvatars(fetchedAvatars);
        setError(fetchError);
    }
    fetchData();
  }, []);

  if (error) {
    console.error("Failed to fetch initial avatars:", error);
    // Even on error, render the layout correctly
    return (
       <L9ToolsLayout hideHeader={true}>
          <div className="relative h-full flex flex-col">
              {isMobile && (
                <div className="absolute top-4 left-4 z-20">
                  <SidebarTrigger />
                </div>
              )}
              <div className="flex-1 min-h-0">
                  <ScrollArea className="h-full">
                      <AvatarView initialAvatars={[]} />
                  </ScrollArea>
              </div>
          </div>
      </L9ToolsLayout>
    )
  }

  return (
    <L9ToolsLayout hideHeader={true}>
        <div className="relative h-full flex flex-col">
            {isMobile && (
              <div className="absolute top-4 left-4 z-20">
                <SidebarTrigger />
              </div>
            )}
            <div className="flex-1 min-h-0 pt-12 md:pt-0">
                <ScrollArea className="h-full">
                    <AvatarView initialAvatars={avatars || []} />
                </ScrollArea>
            </div>
        </div>
    </L9ToolsLayout>
  );
}
