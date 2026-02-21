
"use client";

import { HelpCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { HolographicInput } from '@/components/ui/holographic-input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { FilterType } from '@/hooks/use-processed-bosses';
import { cn } from '@/lib/utils';
import type { User } from '@/context/auth-context';

interface BossHuntControlsProps {
    searchQuery: string;
    onSearchQueryChange: (query: string) => void;
    filterType: FilterType;
    onFilterTypeChange: (type: FilterType) => void;
    onOpenReportDialog: (filter: 'today' | 'all') => void;
    isMobile: boolean;
    bossCount: number;
    isLoading: boolean;
    user: User | null;
}

const ReportButton = ({ onOpenReportDialog }: { onOpenReportDialog: (filter: 'today' | 'all') => void }) => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <button className="send-report-btn">
                <div className="icon-wrapper">
                    <svg xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 58.56 116.18" style={{shapeRendering: 'geometricPrecision', textRendering: 'geometricPrecision', fillRule: 'evenodd', clipRule: 'evenodd'}} version="1.1" xmlSpace="preserve" xmlns="http://www.w3.org/2000/svg"><g id="Layer_x0020_1"><metadata id="CorelCorpID_0Corel-Layer" /></g></svg>
                </div>
                <span className="text">Send Report</span>
            </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="center" 
          className={cn(
            "fantasy-dropdown-menu",
            "w-[180px]"
          )}
        >
            <DropdownMenuItem onSelect={() => onOpenReportDialog('today')} className="fantasy-dropdown-item">
                <span className="fantasy-dropdown-icon">📜</span>
                Today’s Hunts
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onOpenReportDialog('all')} className="fantasy-dropdown-item">
                <span className="fantasy-dropdown-icon">⚔️</span>
                Upcoming Hunts
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
);

export function BossHuntControls({
    searchQuery,
    onSearchQueryChange,
    filterType,
    onFilterTypeChange,
    onOpenReportDialog,
    isMobile,
    bossCount,
    isLoading,
    user,
}: BossHuntControlsProps) {

  if (isMobile) {
      return (
          <div className="flex flex-col items-center justify-between gap-4">
              <div className="w-full">
                  <HolographicInput
                      placeholder="Search for a boss..."
                      value={searchQuery}
                      onChange={(e) => onSearchQueryChange(e.target.value)}
                      className="w-full"
                  />
              </div>
              <div className="w-full">
                  <Tabs 
                      value={filterType}
                      onValueChange={(value) => onFilterTypeChange(value as any)}
                      className="w-full"
                  >
                      <TabsList className="grid w-full grid-cols-4 bg-transparent p-0">
                          <TabsTrigger value="all" data-value="all">All</TabsTrigger>
                          <TabsTrigger value="fixed" data-value="fixed">Fixed</TabsTrigger>
                          <TabsTrigger value="variable" data-value="variable">Variable</TabsTrigger>
                          <TabsTrigger value="spawning" data-value="spawning">Spawning</TabsTrigger>
                      </TabsList>
                  </Tabs>
              </div>
        </div>
      )
  }

  return (
    <>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="w-full md:flex-1">
                <HolographicInput
                    placeholder="Search for a boss..."
                    value={searchQuery}
                    onChange={(e) => onSearchQueryChange(e.target.value)}
                    className="w-full"
                />
            </div>
            <div className="hidden md:flex justify-center md:flex-1">
                <ReportButton onOpenReportDialog={onOpenReportDialog} />
            </div>
            <div className="flex items-center justify-end w-full md:flex-1">
                <Tabs 
                    value={filterType}
                    onValueChange={(value) => onFilterTypeChange(value as any)}
                    className="w-full md:w-auto"
                >
                    <TabsList className="grid w-full grid-cols-4 md:inline-flex bg-transparent md:p-0">
                        <TabsTrigger value="all" data-value="all">All</TabsTrigger>
                        <TabsTrigger value="fixed" data-value="fixed">Fixed</TabsTrigger>
                        <TabsTrigger value="variable" data-value="variable">Variable</TabsTrigger>
                        <TabsTrigger value="spawning" data-value="spawning">Spawning</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>
        </div>
        <div className="hidden md:flex w-full text-sm px-4 py-2 border-y border-white/5 bg-black/80">
          <div className="w-[35%] font-cinzel font-bold text-crimson">Boss ({isLoading ? '...' : bossCount})</div>
          <div className="w-[25%] font-cinzel font-bold text-crimson">Location</div>
          <div className="w-[25%] flex justify-center font-cinzel font-bold text-crimson">
            <TooltipProvider>
              <div className="flex items-center justify-center gap-2">
                <span>Spawn Time</span>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-silver" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-center">
                    <p><span className="font-bold text-purple">Purple:</span> Fixed spawns.</p>
                    <p><span className="font-bold text-amber-gold">Gold:</span> Time of death based.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>
          <div className="w-[15%] text-center font-cinzel font-bold text-crimson">Actions</div>
        </div>
    </>
  )
}

BossHuntControls.ReportButton = ReportButton;
