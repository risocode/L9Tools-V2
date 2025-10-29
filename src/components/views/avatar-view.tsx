

"use client";

import { useState, useMemo } from 'react';
import type { AvatarData } from '@/types';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { useProcessedAvatars, AvatarFilterType } from '@/hooks/use-processed-avatars';
import { Card, CardContent } from "@/components/ui/card";
import { HolographicInput } from '@/components/ui/holographic-input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { AvatarTable } from './avatar-table';
import { AvatarAccordion } from './avatar-accordion';
import { extractUniqueStats } from '@/lib/utils';
import { Button } from '../ui/button';
import { X, Check, Filter } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { ResponsiveDrawer } from '@/components/ui/responsive-drawer';

interface AvatarViewProps {
  initialAvatars: AvatarData[];
}

export function AvatarView({ initialAvatars }: AvatarViewProps) {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<AvatarFilterType>('all');
  const [selectedStats, setSelectedStats] = useState<string[]>([]);
  const [fatedStatuses, setFatedStatuses] = useState<Record<number, boolean>>({});
  const [isStatPopoverOpen, setIsStatPopoverOpen] = useState(false);

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
                  <div className="w-full md:w-64">
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
                      onValueChange={(value) => setFilterType(value as any)}
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
          {/* Desktop Table Header */}
          {!isMobile && (
            <div className="w-full text-sm px-4 py-2 border-y border-white/5 bg-black/80">
                <div className="w-full font-cinzel font-bold text-crimson">Avatar ({processedAvatars.length})</div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="relative flex-1 min-h-0">
        <ScrollArea className="h-full rounded-b-lg bg-black/60">
          {processedAvatars.length === 0 && (
              <div className="flex items-center justify-center h-full text-center text-muted-foreground p-8">
                No avatars match the current filters.
              </div>
            )
          }
          {isMobile ? (
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
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
