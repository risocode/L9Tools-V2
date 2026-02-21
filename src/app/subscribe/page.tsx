
"use client";

import { L9ToolsLayout } from '@/components/layout/l9tools-layout';
import { SubscribeView } from '@/components/views/subscribe-view';

export default function SubscribePage() {
  return (
    <main className="flex">
      <L9ToolsLayout>
        <SubscribeView />
      </L9ToolsLayout>
    </main>
  );
}
