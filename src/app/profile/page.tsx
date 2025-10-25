
"use client";

import { ProfileView } from '@/components/views/profile-view';
import { L9ToolsLayout } from '@/components/layout/l9tools-layout';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ProfilePage() {
  return (
    <L9ToolsLayout hideHeader={true}>
        <div className="relative h-full">
          <ScrollArea className="h-full">
            <div className="flex flex-col flex-1 p-4 h-full">
                <ProfileView />
            </div>
          </ScrollArea>
        </div>
    </L9ToolsLayout>
  );
}
