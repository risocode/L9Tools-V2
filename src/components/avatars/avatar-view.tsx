
"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import type { AvatarData } from '@/types';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { useProcessedAvatars, AvatarFilterType } from '@/hooks/avatars/use-processed-avatars';
import { Card, CardContent } from "@/components/ui/card";
import { HolographicInput } from '@/components/ui/holographic-input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AvatarTable } from './avatar-table';
import { AvatarAccordion } from './avatar-accordion';
import { extractUniqueStats } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { X, Check, Filter, ChevronDown } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { ResponsiveDrawer } from '@/components/ui/responsive-drawer';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

interface AvatarViewProps {
  initialAvatars: AvatarData[];
}

export function AvatarView({ initialAvatars }: AvatarViewProps) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  // Initialize filter from URL param if present
  const urlFilter = searchParams.get('filter') as AvatarFilterType | null;
  const [filterType, setFilterType] = useState<AvatarFilterType>(urlFilter || 'all');
  const [selectedStats, setSelectedStats] = useState<string[]>([]);
  const [fatedStatuses, setFatedStatuses] = useState<Record<number, boolean>>({});
  const [isStatPopoverOpen, setIsStatPopoverOpen] = useState(false);
  const [statSearchQuery, setStatSearchQuery] = useState('');
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const listScrollViewportRef = useRef<HTMLDivElement>(null);
  const scrollTargetRef = useRef<HTMLDivElement | null>(null);

  const uniqueStats = useMemo(() => {
    const stats = extractUniqueStats(initialAvatars);
    return stats.map(stat => ({ label: stat, value: stat }));
  }, [initialAvatars]);

  const avatarsWithFatedStatus = useMemo(() => 
    initialAvatars.map(avatar => ({
      ...avatar,
      fatedRelationshipActive: !!fatedStatuses[avatar.id],
    })), [initialAvatars, fatedStatuses]);

  const { processedAvatars } = useProcessedAvatars(avatarsWithFatedStatus, filterType, searchQuery, selectedStats);

  const handleFatedChange = (avatarId: number, isActive: boolean) => {
    setFatedStatuses(prev => ({ ...prev, [avatarId]: isActive }));
  };

  const handleStatSelect = (stat: string) => {
    setSelectedStats(prev => 
      prev.includes(stat) ? prev.filter(s => s !== stat) : [...prev, stat]
    );
    // On mobile, the drawer should close after a selection
    if (isMobile) {
      setIsStatPopoverOpen(false);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedStats([]);
  }

  const isFilterActive = searchQuery !== '' || selectedStats.length > 0;

  // Rely on ScrollArea's onScroll so we don't depend on ref timing; capture target for scrollToTop
  const handleListScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    scrollTargetRef.current = el;
    setShowScrollToTop(el.scrollTop > 80);
  };

  const scrollToTop = () => {
    const target = scrollTargetRef.current ?? listScrollViewportRef.current;
    target?.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Filter stats based on search query
  const filteredStats = useMemo(() => {
    if (!statSearchQuery) return uniqueStats;
    const query = statSearchQuery.toLowerCase();
    return uniqueStats.filter(stat => stat.label.toLowerCase().includes(query));
  }, [uniqueStats, statSearchQuery]);
  
  const StatFilterContent = () => (
    <Command>
        <CommandInput placeholder="Search stat..." />
        <CommandList>
            <CommandEmpty>No stat found.</CommandEmpty>
            <CommandGroup>
                {uniqueStats.map((stat) => (
                    <CommandItem
                        key={stat.value}
                        value={stat.label}
                        onSelect={() => handleStatSelect(stat.value)}
                        className="flex items-center justify-start cursor-pointer"
                    >
                        <div className={cn(
                            "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                            selectedStats.includes(stat.value)
                                ? "bg-primary text-primary-foreground"
                                : "opacity-50"
                        )}>
                            <Check className={cn(selectedStats.includes(stat.value) ? "opacity-100" : "opacity-0")} />
                        </div>
                        <span>{stat.label}</span>
                    </CommandItem>
                ))}
            </CommandGroup>
        </CommandList>
    </Command>
  );
  
  return (
    <div className="w-full h-full flex flex-col">
      <Card className="bg-transparent border-0 shadow-none w-full">
        <CardContent className="p-4 w-full">
          {/* Controls: Search and Filter */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
              <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                  <HolographicInput
                      placeholder="Search for an avatar..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full md:w-64"
                  />
                  {/* Mobile: Drawer */}
                  <div className="w-full md:w-64 md:hidden">
                    <ResponsiveDrawer
                        open={isStatPopoverOpen}
                        onOpenChange={setIsStatPopoverOpen}
                        trigger={
                            <Button
                                variant="ghost"
                                role="combobox"
                                aria-expanded={isStatPopoverOpen}
                                className="futuristic-select-trigger w-full justify-between"
                            >
                                <span className="block truncate">
                                    {selectedStats.length > 0
                                        ? `Stat (${selectedStats.length})`
                                        : "Filter Stat"}
                                </span>
                                <Filter className="h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        }
                        contentClassName="w-[--radix-popover-trigger-width] p-0"
                    >
                      <StatFilterContent />
                    </ResponsiveDrawer>
                  </div>
                  {isFilterActive && (
                    <Button variant="ghost" size="icon" onClick={handleClearFilters} className="text-red-500/70 hover:text-red-500 hover:bg-red-500/10">
                      <X className="h-5 w-5" />
                      <span className="sr-only">Clear filters</span>
                    </Button>
                  )}
              </div>

              <div className="w-full md:w-auto">
                  <Tabs 
                      value={filterType}
                      onValueChange={(value) => {
                        setFilterType(value as any);
                        // Update URL search param to communicate filter state to layout
                        const params = new URLSearchParams(searchParams.toString());
                        if (value === 'all') {
                          params.delete('filter');
                        } else {
                          params.set('filter', value);
                        }
                        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
                      }}
                      className="w-full md:w-auto"
                  >
                      <TabsList className="grid w-full grid-cols-5 md:flex">
                          <TabsTrigger value="all" data-value="all">All</TabsTrigger>
                          <TabsTrigger value="mythic" data-value="mythic" className="data-[state=active]:[--glow-color:theme(colors.red.500)]">Mythic</TabsTrigger>
                          <TabsTrigger value="legendary" data-value="legendary">Legendary</TabsTrigger>
                          <TabsTrigger value="epic" data-value="epic" className="data-[state=active]:[--glow-color:theme(colors.purple.400)]">Epic</TabsTrigger>
                          <TabsTrigger value="rare" data-value="rare" className="data-[state=active]:[--glow-color:theme(colors.blue.400)]">Rare</TabsTrigger>
                      </TabsList>
                  </Tabs>
              </div>
          </div>
          {/* Desktop: Stat Filters - Collapsible */}
          {!isMobile && (
            <Accordion type="single" collapsible className="w-full mb-2" value={isFilterExpanded ? 'filter' : ''} onValueChange={(value) => setIsFilterExpanded(value === 'filter')}>
              <AccordionItem value="filter" className="border border-primary/20 rounded-lg bg-black/40">
                <AccordionTrigger className="px-4 py-2 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">Filter Stats</h3>
                    {selectedStats.length > 0 && (
                      <span className="text-xs text-muted-foreground">({selectedStats.length} selected)</span>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <HolographicInput
                    placeholder="Search stat..."
                    value={statSearchQuery}
                    onChange={(e) => setStatSearchQuery(e.target.value)}
                    className="w-full mb-3"
                  />
                  <ScrollArea className="h-[150px] pr-4">
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                      {filteredStats.map((stat) => (
                        <div
                          key={stat.value}
                          className="flex items-center space-x-2 p-2 rounded-md hover:bg-primary/5 transition-colors cursor-pointer"
                          onClick={() => handleStatSelect(stat.value)}
                        >
                          <Checkbox
                            id={`stat-${stat.value}`}
                            checked={selectedStats.includes(stat.value)}
                            onCheckedChange={() => handleStatSelect(stat.value)}
                          />
                          <Label
                            htmlFor={`stat-${stat.value}`}
                            className="text-xs cursor-pointer flex-1 leading-tight"
                          >
                            {stat.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
          {/* Desktop Table Header */}
          {!isMobile && (
            <div className="w-full text-sm px-4 py-2 border-y border-white/5 bg-black/80">
                <div className="w-full font-cinzel font-bold text-crimson">Avatar ({processedAvatars.length})</div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="relative flex-1 min-h-0">
        <ScrollArea className="h-full rounded-b-lg bg-black/60" viewportRef={listScrollViewportRef} onScroll={handleListScroll}>
          {processedAvatars.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center text-muted-foreground p-8">
                No avatars match the current filters.
              </div>
            ) : isMobile ? (
              <AvatarAccordion 
                avatars={processedAvatars} 
                onFatedChange={handleFatedChange} 
                highlightStats={selectedStats}
                className="px-4" 
              />
            ) : (
              <AvatarTable 
                avatars={processedAvatars} 
                onFatedChange={handleFatedChange} 
                highlightStats={selectedStats}
                className="px-4"
              />
            )
          }
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
      </div>
    </div>
  );
}
