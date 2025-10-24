import { AppLayout } from '@/components/layout/app-layout';
import { QuestList } from '@/components/quests/quest-list';

export default function QuestsPage() {
  return (
    <AppLayout title="Quest Management">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-headline font-bold text-foreground">Active Quests</h2>
          <p className="text-muted-foreground">Track your ongoing adventures and objectives.</p>
        </div>
        <QuestList />
      </div>
    </AppLayout>
  );
}
