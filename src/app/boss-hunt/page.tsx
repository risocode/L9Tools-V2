import { BossHuntView } from '@/components/views/boss-hunt-view';
import { getInitialBosses } from '@/app/actions/get-initial-bosses';
import { L9ToolsLayout } from '@/components/layout/l9tools-layout';

// This is a client component now to manage control state
export default async function BossHuntPage() {
  const { bosses, error } = await getInitialBosses();
  
  if (error) {
    console.error("Failed to fetch initial bosses:", error);
    // Render a fallback or error state
    return (
      <L9ToolsLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-destructive">Failed to load boss data. Please try again later.</p>
        </div>
      </L9ToolsLayout>
    );
  }

  return (
    <L9ToolsLayout>
      <BossHuntView 
        initialBosses={bosses} 
      />
    </L9ToolsLayout>
  );
}
