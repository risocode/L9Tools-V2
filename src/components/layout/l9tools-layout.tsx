
"use client";

import * as React from 'react';
import type { ReactNode, ElementType, MouseEvent } from 'react';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarFooter,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  Shield,
  User,
  Crown,
  LayoutGrid,
} from 'lucide-react';
import { ViewHeader, ViewHeaderProps } from '@/components/views/view-header';
import { UserNav } from './user-nav';
import { AuthDialog } from '../views/auth-dialog';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import { LegalDialog } from '../views/legal-dialog';
import { DonationDialog } from '../views/donation-dialog';
import { AdDialog } from '../views/ad-dialog';
import { useLoading } from '@/context/loading-context';
import { AboutDialog } from '../views/about-dialog';
import { ContactDialog } from '../views/contact-dialog';
import { AdProvider } from '@/context/ad-context';
import { Button } from '../ui/button';


const donateButtonImages = ['/l9rs/donate1.png', '/l9rs/donate2.png'];

interface NavItem {
    id: string;
    label: string;
    icon: string | ElementType;
    href: string;
    isSpaceButton?: boolean;
    isImageButton?: boolean;
    imageSrc?: string;
    imageClassName?: string;
    disabled?: boolean;
    ariaLabel: string;
}


export function L9ToolsLayout({
  children,
  hideHeader = false,
}: {
  children: React.ReactNode;
  hideHeader?: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { showLoader, isLoading } = useLoading();
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [isDonationOpen, setIsDonationOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [legalType, setLegalType] = useState<'terms' | 'privacy' | 'disclaimer' | 'cookie'>('terms');
  const [donateButtonImage, setDonateButtonImage] = useState(donateButtonImages[0]);
  
  const isAdminPage = pathname.startsWith('/admin');
  const isProfilePage = pathname === '/profile';
  const isDashboardPage = pathname.startsWith('/dashboard');


  // Open legal dialog if query param exists
  useEffect(() => {
    const action = searchParams.get('action');
    const validActions = ['terms', 'privacy', 'disclaimer', 'cookie', 'about', 'contact'];
    if (action && validActions.includes(action)) {
        if (action === 'about') {
            setIsAboutOpen(true);
        } else if (action === 'contact') {
            setIsContactOpen(true);
        } else {
            openLegalDialog(action as 'terms' | 'privacy' | 'disclaimer' | 'cookie');
        }
        // Clean up URL
        router.replace(pathname, undefined);
    }
  }, [searchParams, pathname, router]);

  useEffect(() => {
    // Randomize donate button image on client-side mount
    const randomImage = donateButtonImages[Math.floor(Math.random() * donateButtonImages.length)];
    setDonateButtonImage(randomImage);
  }, []);

  const handleNavClick = (e: MouseEvent, href: string) => {
    // This check prevents the handler from interfering with other buttons in the sidebar
    if (e.currentTarget.closest('[data-sidebar="menu"]')) {
      e.preventDefault();
      if (pathname !== href) {
          showLoader(() => router.push(href));
      }
    }
  }

  const handleDisabledClick = (e: MouseEvent) => {
    e.preventDefault();
  }

  const navItems: NavItem[] = [
    { 
      id: 'boss-hunt', 
      label: 'Boss Hunt', 
      icon: 'skull',
      href: '/boss-hunt',
      isImageButton: true,
      imageSrc: '/l9rs/bosshunt.png',
      imageClassName: 'image-bosshunt-btn',
      ariaLabel: 'Boss Hunt Timers',
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutGrid,
      href: '/dashboard',
      isImageButton: true,
      imageSrc: '/l9rs/dashboardbtn.png',
      imageClassName: 'image-dashboard-btn',
      ariaLabel: 'Player Dashboard'
    },
    {
      id: 'autobuild',
      label: 'AI Autobuild',
      icon: 'sparkles',
      href: '#',
      isImageButton: true,
      imageSrc: '/l9rs/autobuild.png',
      imageClassName: 'image-autobuild-btn',
      disabled: true,
      ariaLabel: 'AI Autobuild (Coming Soon)',
    },
  ];

  if (user?.is_admin) {
    navItems.push({
      id: 'admin',
      label: 'Admin Panel',
      icon: Shield,
      href: '/admin',
      isSpaceButton: true,
      ariaLabel: 'Admin Panel'
    });
  }

  
  let currentTitle = 'Boss Hunt';
  let description = '';
  let headerIcon: any = 'skull';
  
  if (pathname.startsWith('/boss-hunt')) {
    description = '';
  } else if (isDashboardPage) {
    currentTitle = 'Dashboard';
    description = 'Welcome to your command center.';
    headerIcon = LayoutGrid;
  } else if (pathname.startsWith('/avatars')) {
    currentTitle = 'Avatars';
    description = 'Browse all available avatars.';
    headerIcon = User;
  } else if (isProfilePage) {
      currentTitle = 'Profile';
      description = 'View and manage your account details.';
      headerIcon = User;
  } else if (pathname.startsWith('/subscribe')) {
    currentTitle = 'Subscribe';
    description = 'Upgrade to Pro to unlock exclusive features.';
    headerIcon = Crown;
  } else if (isAdminPage) {
    currentTitle = 'Admin Panel';
    description = 'Manage users and application settings.';
    headerIcon = Shield;
  }


  const openLegalDialog = (type: 'terms' | 'privacy' | 'disclaimer' | 'cookie') => {
    setLegalType(type);
    setIsLegalOpen(true);
  }

  const logoSrc = "/l9logo.png";


  const desktopCta = (
      <div className="flex flex-col items-end gap-4">
        {!isDashboardPage && <UserNav size="small" />}
      </div>
  );

  const headerProps: ViewHeaderProps = { 
    title: currentTitle,
    description: description,
    icon: typeof headerIcon !== 'string' ? headerIcon : undefined,
    cta: desktopCta,
    isDashboardPage: isDashboardPage,
  };

  const footer = (
    <footer className="relative z-10 p-2 mt-auto bg-transparent overflow-hidden shrink-0">
        <div className="relative z-10 text-center text-xs text-foreground/50 p-2">
            <p className="mb-2">© 2025 L9 Tools. All rights reserved.</p>
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                <Button variant="link" size="sm" onClick={() => setIsAboutOpen(true)} className="text-muted-foreground hover:text-primary">About Us</Button>
                <span className="text-foreground/30">&bull;</span>
                <Button variant="link" size="sm" onClick={() => setIsContactOpen(true)} className="text-muted-foreground hover:text-primary">Contact</Button>
                <span className="text-foreground/30">&bull;</span>
                <Button variant="link" size="sm" onClick={() => openLegalDialog('terms')} className="text-muted-foreground hover:text-primary">Terms</Button>
                <span className="text-foreground/30">&bull;</span>
                <Button variant="link" size="sm" onClick={() => openLegalDialog('privacy')} className="text-muted-foreground hover:text-primary">Privacy</Button>
                <span className="text-foreground/30">&bull;</span>
                <Button variant="link" size="sm" onClick={() => openLegalDialog('disclaimer')} className="text-muted-foreground hover:text-primary">Disclaimer</Button>
                <span className="text-foreground/30">&bull;</span>
                <Button variant="link" size="sm" onClick={() => openLegalDialog('cookie')} className="text-muted-foreground hover:text-primary">Cookies</Button>
            </div>
        </div>
    </footer>
  );
  
  const content = (
    <div className="h-full flex-1 flex flex-col">
        {!hideHeader && <ViewHeader {...headerProps} />}
        {children}
    </div>
  );


  return (
    <AdProvider>
      <SidebarProvider>
        <div className="flex h-full w-full">
          <Sidebar>
            <div className="absolute inset-0 overflow-hidden z-0">
              <Image
                src="/l9rs/bg_sidebar.jpg"
                alt="Sidebar background"
                fill
                sizes="18rem"
                className="object-cover"
                data-ai-hint="mystical ancient artifact"
                priority
              />
            </div>
            <div className="absolute inset-0 bg-background/50 z-0" />
            <SidebarHeader className="p-0 relative z-10 bg-transparent">
              <a href="/boss-hunt" onClick={(e) => handleNavClick(e, '/boss-hunt')} className="relative aspect-square flex items-center justify-center cursor-pointer group" aria-label="Home">
                <Image 
                  src={logoSrc}
                  alt="L9 Tools Logo" 
                  fill
                  sizes="18rem"
                  className="z-10 object-contain p-4"
                  priority={true}
                />
              </a>
            </SidebarHeader>
            <SidebarContent className="relative z-10 bg-transparent p-0">
              <SidebarMenu data-sidebar="menu" className="py-2">
                {navItems.map((item) => {
                  const Icon = item.icon as ElementType;
                  const isLink = item.href && item.href !== '#';

                  if (item.isImageButton) {
                      const linkProps = item.disabled
                        ? { href: '#', onClick: handleDisabledClick, 'aria-disabled': true }
                        : { href: item.href, onClick: (e: MouseEvent) => isLink && handleNavClick(e, item.href) };

                      return (
                        <SidebarMenuItem key={item.id} className="flex justify-center p-2">
                            <a {...linkProps} className={cn("relative inline-block group/autobuild", item.imageClassName, item.disabled && "cursor-pointer")} aria-label={item.ariaLabel}>
                                <Image
                                    src={item.imageSrc!}
                                    alt={item.label}
                                    width={180}
                                    height={60}
                                    className={cn("transition-all duration-300", item.disabled && "grayscale group-hover/autobuild:grayscale-0")}
                                />
                                {item.disabled && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-md opacity-0 group-hover/autobuild:opacity-100 transition-opacity duration-300">
                                      <span className="text-white font-bold text-lg px-4 py-1 rounded-md">Coming Soon</span>
                                    </div>
                                )}
                            </a>
                        </SidebarMenuItem>
                      );
                  }
                  if (item.isSpaceButton) {
                      return (
                          <SidebarMenuItem key={item.id} className="p-0 mt-2 flex justify-center">
                            <a href={item.href} onClick={(e) => isLink && handleNavClick(e, item.href)} className="button-container" aria-label={item.ariaLabel}>
                                  <div className="space-button">
                                      <div className="bright-particles"></div>
                                      <span>{item.label}</span>
                                  </div>
                              </a>
                          </SidebarMenuItem>
                      );
                  }
                  return (
                    <SidebarMenuItem key={item.id}>
                      <Button
                        asChild
                        variant="ghost"
                        className={cn(
                          'w-full justify-start text-lg h-14',
                          pathname.startsWith(item.href) && 'bg-primary/20'
                        )}
                      >
                        <a href={item.href} onClick={(e) => isLink && handleNavClick(e, item.href)} aria-label={item.ariaLabel}>
                          <Icon className="mr-2 h-5 w-5" />
                          {item.label}
                        </a>
                      </Button>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarContent>
            <SidebarFooter className="relative z-10 mt-auto bg-transparent p-4 flex items-center justify-center">
                  <button
                      onClick={() => setIsDonationOpen(true)}
                      className="image-donate-btn"
                      aria-label="Open donation dialog"
                  >
                      <Image
                          src={donateButtonImage}
                          alt="Donate"
                          width={180}
                          height={60}
                      />
                  </button>
              </SidebarFooter>
          </Sidebar>
          <div 
            className="relative flex-1 flex flex-col min-h-0"
            style={{
              backgroundImage: `url(${isAdminPage ? '/l9rs/admin_bg.jpg' : '/l9rs/bg_page.jpg'})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 z-0 bg-black/60" />
            <div className="relative flex-1 flex flex-col min-h-0">
                <main className="flex-1 flex flex-col min-h-0 z-10">
                    {!isLoading && (
                        <motion.div
                            key={pathname}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ ease: "easeInOut", duration: 0.5 }}
                            className="h-full flex flex-col"
                        >
                            {content}
                        </motion.div>
                    )}
                </main>
                {!hideHeader && footer}
            </div>
          </div>
        </div>
        <AuthDialog />
        <AboutDialog isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
        <ContactDialog isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
        <LegalDialog isOpen={isLegalOpen} onClose={() => setIsLegalOpen(false)} type={legalType} />
        <DonationDialog isOpen={isDonationOpen} onClose={() => setIsDonationOpen(false)} />
        <AdDialog />
      </SidebarProvider>
    </AdProvider>
  );
}
