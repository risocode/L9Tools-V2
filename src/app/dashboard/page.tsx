
"use client";

import { L9ToolsLayout } from '@/components/layout/l9tools-layout';
import { useRouter, usePathname } from 'next/navigation';
import type { MouseEvent } from 'react';
import { useLoading } from '@/context/loading-context';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserNav } from '@/components/layout/user-nav';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/context/auth-context';
import { isUserAdmin } from '@/lib/supabase-admin';

interface FeatureButtonProps {
  title: string;
  href: string;
  imageSrc: string;
}

const FeatureButton = ({ title, href, imageSrc }: FeatureButtonProps) => {
  const { showLoader } = useLoading();
  const router = useRouter();
  const pathname = usePathname();

  const handleNavClick = (e: MouseEvent, navHref: string) => {
    e.preventDefault();
    if (pathname !== navHref) {
        showLoader(() => router.push(navHref));
    }
  };
  
  const content = (
    <a 
      href={href}
      onClick={(e: MouseEvent) => handleNavClick(e, href)}
      className="feature-button-v2 group inline-block"
    >
      <div className="relative">
          <Image 
              src={imageSrc} 
              alt={title} 
              width={120} 
              height={140}
              className="transition-all duration-300"
          />
      </div>
    </a>
  );

  return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div tabIndex={0} className="focus:outline-none focus:ring-2 focus:ring-primary rounded-lg">{content}</div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Explore {title}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
  );
};


export default function DashboardPage() {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const isAdmin = isUserAdmin(user);

  return (
    <L9ToolsLayout hideHeader={true}>
      <div className="relative h-full">
        {isMobile && (
          <div className="absolute top-4 left-4 z-20">
            <SidebarTrigger />
          </div>
        )}
        <ScrollArea className="h-full">
          <div className="space-y-8 p-4 md:p-8 pt-6 md:pt-8 pb-12">
              <div className="welcome-banner">
                  <div className="banner-glow-left" />
                   <div className="banner-content relative w-full flex items-center justify-center">
                        <div className="text-center">
                            <h1 className="banner-title">Welcome to the Player Hall</h1>
                            <p className="banner-subtitle">Select a tool to begin your journey.</p>
                            <div className="mt-6 flex justify-center">
                                <UserNav size="large" />
                            </div>
                        </div>
                  </div>
                  <div className="banner-glow-right" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-2 gap-6 md:gap-8 justify-center">
                  <FeatureButton 
                    title="Avatars"
                    href="/avatars"
                    imageSrc="/l9rs/avatar.png"
                  />
                  {/* Ability page hidden – still in development */}
                  {/* <FeatureButton title="Ability" href="/ability" imageSrc="/l9rs/ability.png" /> */}
              </div>
          </div>
        </ScrollArea>
      </div>
    </L9ToolsLayout>
  );
}
