

"use client";

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { ArrowUp, Star } from "lucide-react";
import type { Boss } from '@/types';
import { useBossData } from '@/hooks/use-boss-data';
import { useReportDialog } from '@/hooks/use-report-dialog';
import { useTimeDialog } from '@/hooks/use-time-dialog';
import { useProcessedBosses, FilterType } from '@/hooks/use-processed-bosses';
import { useAuth } from '@/context/auth-context';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { ReportDialog } from './report-dialog';
import { TimePickerDialog } from './time-picker-dialog';
import { MapDialog } from './map-dialog';
import { WelcomeDialog } from './welcome-dialog';
import { TrialPromoDialog } from './trial-promo-dialog';
import { NewUserWelcomeDialog } from './new-user-welcome-dialog';
import { BossTable } from './boss-table';
import { BossAccordion } from './boss-accordion';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { ResetConfirmationDialog } from './reset-confirmation-dialog';
import { BossHuntControls } from './boss-hunt-controls';
import { useLoading } from '@/context/loading-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { cn } from '@/lib/utils';
import { buttonVariants } from '../ui/button';
import { ViewHeaderProps } from './view-header';
import { useAd } from '@/context/ad-context';
import { useBossNotifications } from '@/hooks/use-boss-notifications';
import { useToast } from '@/hooks/use-toast';

interface BossHuntViewProps {
  initialBosses: Boss[];
}

export function BossHuntView({ initialBosses }: BossHuntViewProps) {
  const { user, refreshUser, isInitialLoading, openAuthDialog } = useAuth();
  const isMobile = useIsMobile();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showLoader } = useLoading();
  const { openAdDialog } = useAd();
  const { toast } = useToast();
  
  const {
    bossesWithTimers,
    isBossDataLoading,
    isFirstTime,
    setNotFirstTime,
    handleSetManualTime,
    handleReset,
    handleGuestReportReset,
  } = useBossData(initialBosses);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [isResetConfirmationOpen, setIsResetConfirmationOpen] = useState(false);
  const [resettingBoss, setResettingBoss] = useState<Boss | null>(null);
  const [isProDialogOpen, setIsProDialogOpen] = useState(false);
  const [isTrialPromoOpen, setIsTrialPromoOpen] = useState(false);
  const [isNewUserWelcomeOpen, setIsNewUserWelcomeOpen] = useState(false);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLElement | null>(null);

  const {
    processedBosses,
  } = useProcessedBosses(bossesWithTimers, filterType, searchQuery, user);

  // Initialize notification hook
  useBossNotifications(processedBosses, user?.notifications_enabled ?? true);

  // Check for sign-in success query param and show toast
  useEffect(() => {
    const signinParam = searchParams.get('signin');
    if (signinParam === 'success') {
      // Force refresh user session when coming from sign-in
      const refreshSessionAndShowToast = async () => {
        try {
          // Force refresh the user in auth context
          await refreshUser();
          
          // Wait for auth context to update
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Check if user is now available and show toast
          // Use a closure to capture the latest user value
          const checkAndShowToast = () => {
            // Force another refresh check after delay
            setTimeout(async () => {
              await refreshUser();
              // The toast will show in auth context's SIGNED_IN handler
              // Just remove the query param
              router.replace('/boss-hunt', { scroll: false });
            }, 500);
          };
          
          checkAndShowToast();
        } catch (err) {
          console.error('[Boss Hunt] Error refreshing session:', err);
          router.replace('/boss-hunt', { scroll: false });
        }
      };
      
      // Wait a bit for auth context to initialize, then refresh
      setTimeout(refreshSessionAndShowToast, 800);
    }
  }, [searchParams, refreshUser, router]);

  useEffect(() => {
    if (isFirstTime) {
      setIsWelcomeOpen(true);
    }
  }, [isFirstTime]);

  // Show trial promo popup after 5 seconds for non-authenticated users
  useEffect(() => {
    // Wait for auth to finish loading
    if (isInitialLoading) return;
    
    // Only show for non-authenticated users
    if (user !== null) {
      setIsTrialPromoOpen(false);
      return;
    }

    // 5-second delay before showing
    const timer = setTimeout(() => {
      setIsTrialPromoOpen(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, [user, isInitialLoading]);

  // Show new user welcome popup for newly signed-in users
  useEffect(() => {
    // Wait for auth to finish loading
    if (isInitialLoading) return;
    
    // Only show for authenticated users
    if (!user) {
      setIsNewUserWelcomeOpen(false);
      return;
    }

    // Check if user has already seen the welcome popup
    const welcomeSeenKey = `l9tools_new_user_welcome_seen_${user.id}`;
    const hasSeenWelcome = localStorage.getItem(welcomeSeenKey);
    
    if (hasSeenWelcome === 'true') {
      setIsNewUserWelcomeOpen(false);
      return;
    }

    // Check if this is a new user (created within last 5 minutes)
    const isNewUser = (() => {
      if (!user.created_at) return false;
      
      const createdDate = new Date(user.created_at);
      const now = new Date();
      const timeDiffMs = now.getTime() - createdDate.getTime();
      const timeDiffMinutes = timeDiffMs / (1000 * 60);
      
      // Consider user as "new" if account was created within last 5 minutes
      if (timeDiffMinutes <= 5) return true;
      
      // Also check if they have a fresh 3-day trial (subscription expires exactly ~3 days from creation)
      if (user.subscription_expires_at && user.created_at) {
        const expiresDate = new Date(user.subscription_expires_at);
        const createdDateCheck = new Date(user.created_at);
        const daysDiff = (expiresDate.getTime() - createdDateCheck.getTime()) / (1000 * 60 * 60 * 24);
        
        // If subscription expires approximately 3 days from creation (2.5 to 3.5 days), it's a new trial
        if (daysDiff >= 2.5 && daysDiff <= 3.5 && user.subscription_tier === 'pro') {
          return true;
        }
      }
      
      return false;
    })();

    if (isNewUser) {
      // Small delay to ensure smooth user experience
      const timer = setTimeout(() => {
        setIsNewUserWelcomeOpen(true);
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      setIsNewUserWelcomeOpen(false);
    }
  }, [user, isInitialLoading]);

  // Handler for closing new user welcome dialog
  const handleCloseNewUserWelcome = () => {
    setIsNewUserWelcomeOpen(false);
    // Mark as seen in localStorage so it never shows again
    if (user?.id) {
      const welcomeSeenKey = `l9tools_new_user_welcome_seen_${user.id}`;
      localStorage.setItem(welcomeSeenKey, 'true');
    }
  };

  // Handler to open auth dialog when user clicks "Sign Up"
  const handleTrialSignUp = () => {
    openAuthDialog();
  };

  const {
    isReportDialogOpen,
    isSendingReport,
    reportBosses,
    handleOpenReportDialog,
    handleConfirmSendReport,
    setIsReportDialogOpen
  } = useReportDialog(processedBosses, handleGuestReportReset);
  
  const handleGoToSubscribe = () => {
    showLoader(() => router.push('/subscribe'));
  };
  
  const {
    isTimePickerDialog,
    timeDialogBoss,
    isSubmittingTime,
    handleOpenTimeDialog,
    handleConfirmSetTime,
    closeTimePickerDialog
  } = useTimeDialog(handleSetManualTime, handleGoToSubscribe, () => setIsProDialogOpen(true));

  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
  const [mapBoss, setMapBoss] = useState<Boss | null>(null);
  
  const handleOpenMapDialog = (boss: Boss) => {
    if (!user || user.subscription_tier === 'free') {
      openAdDialog(undefined, () => {
        setMapBoss(boss);
        setIsMapDialogOpen(true);
      });
    } else {
      setMapBoss(boss);
      setIsMapDialogOpen(true);
    }
  };

  const handleOpenResetDialog = (boss: Boss) => {
    if (boss.isFixedSpawn || !boss.lastKilled) return;
    if (!user || user.subscription_tier === 'free') {
      openAdDialog(undefined, () => {
        setResettingBoss(boss);
        setIsResetConfirmationOpen(true);
      });
    } else {
      setResettingBoss(boss);
      setIsResetConfirmationOpen(true);
    }
  };

  const handleConfirmReset = () => {
    if (resettingBoss) {
      handleReset(resettingBoss);
    }
    setIsResetConfirmationOpen(false);
    setResettingBoss(null);
  };

  const handleCloseWelcomeDialog = (dontShowAgain: boolean) => {
    setIsWelcomeOpen(false);
    if (dontShowAgain) {
      setNotFirstTime();
    }
  };

  // Attach scroll listener to the actual scroll container (layout uses overflow-auto on parent)
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    let el: HTMLElement | null = root.parentElement;
    while (el) {
      const { overflowY } = getComputedStyle(el);
      if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') {
        scrollContainerRef.current = el;
        break;
      }
      el = el.parentElement;
    }
    const scrollEl = scrollContainerRef.current;
    if (!scrollEl) return;
    const handleScroll = () => setShowScrollToTop(scrollEl.scrollTop > 80);
    scrollEl.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      scrollEl.removeEventListener('scroll', handleScroll);
      scrollContainerRef.current = null;
    };
  }, []);

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  return (
      <div ref={containerRef} className="relative flex-1 flex flex-col min-h-0">
        <ScrollArea 
          className="h-full rounded-b-lg"
          viewportRef={scrollViewportRef}
        >
          {/* Sticky Header */}
          <div className="sticky top-0 z-20 p-4 bg-cover bg-center" style={{backgroundImage: `url('/l9rs/bg_header.jpg')`}}>
            <BossHuntControls
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              filterType={filterType}
              onFilterTypeChange={setFilterType}
              onOpenReportDialog={handleOpenReportDialog}
              isMobile={isMobile}
              bossCount={processedBosses.length}
              isLoading={isBossDataLoading}
              user={user}
            />
          </div>

          {/* Boss List */}
          {processedBosses.length === 0 && !isBossDataLoading && (
            <div className="flex items-center justify-center h-[calc(100%-150px)] text-center text-muted-foreground p-8">
              No bosses match the current filter.
            </div>
          )}
          <div className="bg-black/60">
            { isMobile ? (
              <BossAccordion
                bosses={processedBosses}
                onOpenMap={handleOpenMapDialog}
                onOpenTimeDialog={handleOpenTimeDialog}
                onResetTimer={handleOpenResetDialog}
                className="px-4"
              />
            ) : (
              <BossTable
                bosses={processedBosses}
                onOpenMap={handleOpenMapDialog}
                onOpenTimeDialog={handleOpenTimeDialog}
                onResetTimer={handleOpenResetDialog}
                className="px-4"
              />
            )}
          </div>
        </ScrollArea>
        {showScrollToTop && typeof document !== 'undefined' && createPortal(
          <Button
            size="icon"
            className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full p-0 bg-background/90 hover:bg-background border border-border shadow-lg"
            onClick={scrollToTop}
            aria-label="Scroll to top"
          >
            <Image src="/l9rs/arrow_up.png" alt="" width={48} height={48} className="object-contain" />
          </Button>,
          document.body
        )}
        
        <WelcomeDialog
          isOpen={isWelcomeOpen}
          onClose={handleCloseWelcomeDialog}
        />

        <TrialPromoDialog
          isOpen={isTrialPromoOpen}
          onClose={() => setIsTrialPromoOpen(false)}
          onSignUp={handleTrialSignUp}
        />

        <NewUserWelcomeDialog
          isOpen={isNewUserWelcomeOpen}
          onClose={handleCloseNewUserWelcome}
        />
        
        <ReportDialog
          isOpen={isReportDialogOpen}
          onClose={() => setIsReportDialogOpen(false)}
          bosses={reportBosses}
          onConfirm={handleConfirmSendReport}
          isSending={isSendingReport}
          isGuest={!user}
        />

        <TimePickerDialog 
          isOpen={isTimePickerDialog}
          onClose={closeTimePickerDialog}
          boss={timeDialogBoss}
          isSubmitting={isSubmittingTime}
          onConfirm={handleConfirmSetTime}
        />

        <MapDialog
          isOpen={isMapDialogOpen}
          onClose={() => setIsMapDialogOpen(false)}
          boss={mapBoss}
        />

        <ResetConfirmationDialog
          isOpen={isResetConfirmationOpen}
          onClose={() => setIsResetConfirmationOpen(false)}
          onConfirm={handleConfirmReset}
          bossName={resettingBoss?.name || ''}
        />

        <AlertDialog open={isProDialogOpen} onOpenChange={setIsProDialogOpen}>
          <AlertDialogContent
            className={cn(
                "glowing-card sm:max-w-md bg-transparent border-0 shadow-none p-0",
                "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-90 data-[state=open]:slide-in-from-bottom-24"
            )}
          >
            <div className="bg-[#181818] m-1 rounded-[28px] p-6 relative z-10 flex flex-col items-center">
              <AlertDialogHeader className="text-center items-center">
                <Star className="h-12 w-12 text-yellow-400 mb-2 animate-pulse" style={{ filter: 'drop-shadow(0 0 10px #facc15)'}} />
                <AlertDialogTitle className="font-cinzel text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600">Pro Feature Required</AlertDialogTitle>
                <AlertDialogDescription className="text-sm text-slate-300 pt-2">
                  Due to the high volume of users, setting timers for level 90+ bosses is now a Pro feature. This helps keep our service sustainable and allows us to continue providing valuable tools for the community.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col gap-2 w-full mt-6">
                <AlertDialogAction
                  className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-base"
                  onClick={() => {
                    setIsProDialogOpen(false);
                    handleGoToSubscribe();
                  }}
                >
                  Upgrade to Pro
                </AlertDialogAction>
                <AlertDialogCancel className="w-full border-slate-700 hover:bg-slate-800 hover:text-white">Cancel</AlertDialogCancel>
              </AlertDialogFooter>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
  );
}
