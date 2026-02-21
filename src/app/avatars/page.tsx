
import { L9ToolsLayout } from '@/components/layout/l9tools-layout';
import { AvatarView } from '@/components/avatars/avatar-view';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import type { AvatarData, Grade } from '@/types';

// This function now fetches data from Supabase on the server.
async function getInitialAvatars(): Promise<{ avatars: AvatarData[]; error: string | null; }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: avatarsData, error } = await supabase
      .from('avatars')
      .select(`
        id,
        name,
        grade,
        image_url,
        avatar_stats (
          attribute,
          value,
          icon
        ),
        avatar_fated_relationships (
          name,
          description
        )
      `)
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching avatars from Supabase:', error.message);
      throw new Error('Failed to fetch avatar data from the database.');
    }
    
    const allAvatars: AvatarData[] = avatarsData.map((avatar: any) => ({
      id: avatar.id,
      name: avatar.name,
      grade: avatar.grade as Grade,
      image: avatar.image_url || '/l9rs/avatar.png',
      stats: avatar.avatar_stats.map((stat: any) => ({
        attribute: stat.attribute,
        value: stat.value,
        icon: stat.icon,
      })),
      fatedRelationship: {
        name: avatar.avatar_fated_relationships?.name || 'N/A',
        description: avatar.avatar_fated_relationships?.description || '',
      }
    }));
    
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
