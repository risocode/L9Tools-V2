
import { L9ToolsLayout } from '@/components/layout/l9tools-layout';
import { AvatarView } from '@/components/views/avatar-view';
import type { AvatarData } from '@/types';
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

export default async function AvatarsPage() {
  const { avatars, error } = await getInitialAvatars();
  
  if (error) {
    console.error("Failed to fetch initial avatars:", error);
    // Even on error, render the layout correctly
    return (
       <L9ToolsLayout>
          <div className="flex items-center justify-center h-full text-destructive">
            <p>Failed to load avatar data. Please try again later.</p>
          </div>
      </L9ToolsLayout>
    )
  }

  return (
    <L9ToolsLayout>
      <AvatarView initialAvatars={avatars} />
    </L9ToolsLayout>
  );
}
