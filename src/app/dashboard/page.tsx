
"use client";

import { L9ToolsLayout } from '@/components/layout/l9tools-layout';
import { useRouter, usePathname } from 'next/navigation';
import type { MouseEvent } from 'react';
import { useLoading } from '@/context/loading-context';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserNav } from '@/components/layout/user-nav';
import { useState } from 'react';

interface FeatureButtonProps {
  title: string;
  href?: string;
  disabled?: boolean;
  imageSrc: string;
}

const FeatureButton = ({ title, href, disabled, imageSrc }: FeatureButtonProps) => {
  const { showLoader } = useLoading();
  const router = useRouter();
  const pathname = usePathname();

  const handleNavClick = (e: MouseEvent, navHref: string) => {
    e.preventDefault();
    if (pathname !== navHref) {
        showLoader(() => router.push(navHref));
    }
  };

  const handleDisabledClick = (e: MouseEvent) => {
    e.preventDefault();
  };

  const linkProps = disabled
    ? { href: '#', onClick: handleDisabledClick, "aria-disabled": true }
    : { href: href!, onClick: (e: MouseEvent) => handleNavClick(e, href!) };
  
  const content = (
    <a 
      {...linkProps} 
      className={cn(
        "feature-button-v2 group inline-block",
        disabled && "cursor-default"
      )}
    >
      <div className="relative">
          <Image 
              src={imageSrc} 
              alt={title} 
              width={120} 
              height={140}
              className={cn("transition-all duration-300", disabled && "grayscale group-hover:grayscale-0")}
          />
          {disabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex flex-col items-center text-white font-bold text-base">
                  <span>Coming</span>
                  <span>Soon</span>
                </div>
              </div>
          )}
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
            <p>{disabled ? `${title} (Coming Soon)`: `Explore ${title}`}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
  );
};


export default function DashboardPage() {

  return (
    <L9ToolsLayout>
      <div className="relative h-full">
        <ScrollArea className="h-full">
          <div className="space-y-8 p-4 md:p-8 pt-6 md:pt-8 pb-12">
              <div className="welcome-banner">
                  <div className="banner-glow-left" />
                   <div className="banner-content relative w-full flex items-center justify-center">
                        <div className="text-center">
                            <h1 className="banner-title">Welcome to the Player Hall</h1>
                            <p className="banner-subtitle">Select a tool to begin your journey.</p>
                             <div className="flex justify-center mt-6">
                                <UserNav />
                            </div>
                        </div>
                  </div>
                  <div className="banner-glow-right" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6 md:gap-8 justify-center">
                  <FeatureButton 
                    title="Avatars"
                    href="/avatars"
                    imageSrc="/l9rs/avatar.png"
                  />
                  <FeatureButton 
                    title="Mounts"
                    disabled={true}
                    imageSrc="/l9rs/mounts.png"
                  />
                  <FeatureButton 
                    title="Homunculi"
                    disabled={true}
                    imageSrc="/l9rs/homun.png"
                  />
                  <FeatureButton 
                    title="Ability"
                    disabled={true}
                    imageSrc="/l9rs/ability.png"
                  />
                  <FeatureButton 
                    title="Armor"
                    disabled={true}
                    imageSrc="/l9rs/armor.png"
                  />
                  <FeatureButton 
                    title="Weapon"
                    disabled={true}
                    imageSrc="/l9rs/weapon.png"
                  />
                  <FeatureButton 
                    title="Accessories"
                    disabled={true}
                    imageSrc="/l9rs/accessories.png"
                  />
              </div>
          </div>
        </ScrollArea>
      </div>
    </L9ToolsLayout>
  );
}
