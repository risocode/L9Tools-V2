import { AppLayout } from '@/components/layout/app-layout';
import { CharacterSheet } from '@/components/character/character-sheet';
import { StatSuggester } from '@/components/character/stat-suggester';
import { Separator } from '@/components/ui/separator';

export default function CharacterPage() {
  return (
    <AppLayout title="Character Stats">
      <div className="space-y-8">
        <CharacterSheet />
        <Separator />
        <StatSuggester />
      </div>
    </AppLayout>
  );
}
