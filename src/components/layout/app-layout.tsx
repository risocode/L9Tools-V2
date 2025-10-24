import {
  Sidebar,
  SidebarProvider,
  SidebarInset,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Nav } from '@/components/layout/nav';
import { RunicLogo } from '@/components/icons';
import { Button } from '../ui/button';
import { LogOut } from 'lucide-react';

export function AppLayout({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen">
        <Sidebar>
          <SidebarHeader className="p-4 border-b">
            <div className="flex items-center gap-3">
              <RunicLogo className="w-8 h-8 text-primary" />
              <h1 className="font-headline text-xl font-bold">Lord Nine Tools</h1>
            </div>
          </SidebarHeader>
          <SidebarContent className="p-0">
            <Nav />
          </SidebarContent>
          <SidebarFooter className="p-2 border-t">
             <Button variant="ghost" className="w-full justify-start">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
            </Button>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex flex-col @container">
          <header className="flex items-center justify-between gap-2 border-b p-4 h-16 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="md:hidden" />
              <h2 className="font-headline text-xl font-semibold">{title}</h2>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
