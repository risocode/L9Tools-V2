
"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ArrowUp } from "lucide-react";
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
import { BossTable } from './boss-table';
import { BossAccordion } from './boss-accordion';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { ResetConfirmationDialog } from './reset-confirmation-dialog';
import { BossHuntControls } from './boss-hunt-controls';
import { useLoading } from '@/context/loading-context';
import { useRouter } from 'next/navigation';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { cn } from '@/lib/utils';
import { buttonVariants } from '../ui/button';
import { ViewHeader } from './view-header';
import { UserNav } from '../layout/user-nav';
import { useAd } from '@/context/ad-context';
import { useBossNotifications } from '@/hooks/use-boss-notifications';

interface BossHuntViewProps {
  initialBosses: Boss[];
}

export function BossHuntView({ initialBosses }: BossHuntViewProps) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const router = useRouter();
  const { showLoader } = useLoading();
  const { openAdDialog } = useAd();
  
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
  const scrollViewportRef = useRef<HTMLDivElement>(null);

  const {
    processedBosses,
  } = useProcessedBosses(bossesWithTimers, filterType, searchQuery, user);

  // Initialize notification hook
  useBossNotifications(processedBosses, user?.notifications_enabled ?? false);

  useEffect(() => {
    if (isFirstTime) {
      setIsWelcomeOpen(true);
    }
  }, [isFirstTime]);

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
    setIsTimePickerDialog
  } = useTimeDialog(handleSetManualTime, handleGoToSubscribe, () => setIsProDialogOpen(true));

  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
  const [mapBoss, setMapBoss] = useState<Boss | null>(null);
  
  const handleOpenMapDialog = (boss: Boss) => {
    // Show ad for guest or free users when they click the map
    if (!user || user.subscription_tier === 'free') {
        openAdDialog();
    }
    setMapBoss(boss);
    setIsMapDialogOpen(true);
  };
  
  const handleOpenResetDialog = (boss: Boss) => {
    if (boss.isFixedSpawn || !boss.lastKilled) return;
    setResettingBoss(boss);
    setIsResetConfirmationOpen(true);
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

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    setShowScrollToTop(event.currentTarget.scrollTop > 200);
  };

  const scrollToTop = () => {
    scrollViewportRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  return (
      <div className="relative flex-1 flex flex-col min-h-0">
          {/* Main content with sticky header and scrollable area */}
        <ScrollArea 
          className="h-full rounded-b-lg"
          onScroll={handleScroll}
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
        {showScrollToTop && (
          <Button
            size="icon"
            className="absolute bottom-4 right-4 z-20 h-12 w-12 rounded-full p-0 bg-transparent hover:bg-primary/10 border-none"
            onClick={scrollToTop}
          >
            <Image src="/l9rs/arrow_up.png" alt="Scroll to top" width={48} height={48} />
          </Button>
        )}
        
        <WelcomeDialog
          isOpen={isWelcomeOpen}
          onClose={handleCloseWelcomeDialog}
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
          onClose={setIsTimePickerDialog}
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
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Pro Feature Required</AlertDialogTitle>
              <AlertDialogDescription>
                Due to the high volume of users, setting timers for level 90+ bosses is now a Pro feature. This helps keep our service sustainable and allows us to continue providing valuable tools for the community.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className={cn(buttonVariants({ variant: "default" }))}
                onClick={() => {
                  setIsProDialogOpen(false);
                  handleGoToSubscribe();
                }}
              >
                Upgrade to Pro
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
  );
}
