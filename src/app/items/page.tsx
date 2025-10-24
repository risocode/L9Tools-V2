import { AppLayout } from '@/components/layout/app-layout';
import { ItemFinder } from '@/components/items/item-finder';
import { ItemTable } from '@/components/items/item-table';
import { Separator } from '@/components/ui/separator';

export default function ItemsPage() {
  return (
    <AppLayout title="Item Database">
      <div className="space-y-8">
        <ItemFinder />
        <Separator />
        <ItemTable />
      </div>
    </AppLayout>
  );
}
