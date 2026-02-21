import { Metadata } from 'next';
import { L9ToolsLayout } from '@/components/layout/l9tools-layout';
import { WeaponTraitsView } from '@/components/views/weapon-traits-view';

export const metadata: Metadata = {
  title: 'Weapon Traits | L9 Tools',
  description: 'Weapon traits for Lord Nine.',
};

export default function WeaponTraitsPage() {
  return (
    <L9ToolsLayout>
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <WeaponTraitsView />
      </div>
    </L9ToolsLayout>
  );
}
