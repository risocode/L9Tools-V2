"use client";

import { useState } from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import { Search, Lock, Star, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AbilityAdvanceDialog, renderDescriptionWithHighlights, type EffectInfo } from './ability-advance-dialog';
import { getLevelData, formatStatLine, formatPassiveEffects, getActiveStatsLines } from '@/lib/ability-level-data';

const CATEGORY_IMAGES: Record<string, string> = {
  Combat: '/ability/combat.png',
  Recon: '/ability/recon.png',
  Spell: '/ability/spell.png',
  Defence: '/ability/defence.png',
  Enhance: '/ability/enhance.png',
  Support: '/ability/support.png',
  Vitality: '/ability/vitality.png',
  Trick: '/ability/trick.png',
};

const CATEGORY_COLORS: Record<string, string> = {
  Combat: '#ff5555',
  Recon: '#b388ff',
  Spell: '#5c9eff',
  Defence: '#9ccc65',
  Enhance: '#e6b800',
  Support: '#c4a77d',
  Vitality: '#4caf50',
  Trick: '#fff176',
};

const LEVEL_OPTIONS = [20, 40, 60, 80, 90, 100, 120] as const;

const LEVEL_TO_GRADE: Record<number, string> = {
  20: 'Apprentice',
  40: 'Intermediate',
  60: 'Advance',
  80: 'Expert',
  90: 'Maestro',
  100: 'Master',
  120: 'Master I',
};

function getGradeForLevel(level: number): string {
  return LEVEL_TO_GRADE[level] ?? 'Apprentice';
}

const ABILITIES_BY_CATEGORY: { category: string; names: string[] }[] = [
  { category: 'Combat', names: ['Polish Weapon', 'Hunting Strategy', 'Wild Dance', 'Earth Shock', "Terreno's Power", 'Disarm', 'Chase'] },
  { category: 'Recon', names: ['Combat Focus', 'Honed Weaponry', 'Vital Point Hit', 'Mental Paralysis', "Secreta's Talent", 'Suspense', 'Spread Venom'] },
  { category: 'Spell', names: ['Soul Slash', 'Power of Darkness', 'Bursting Chill', 'Spell Infusion', "Kallion's Insight", 'Magnetic Field', 'Include Sleep', 'Frost Weapon'] },
  { category: 'Defence', names: ['Armor Corrosion', 'Defensive Stance', 'Parry', 'Create Barrier', 'Deploy Barrier', 'Create Zone', 'Mirror Shield'] },
  { category: 'Enhance', names: ['Cutting Strike', 'Enhance Magic', 'Fire Spirit', 'Ice Spirit', 'Lightning Spirit', 'Deathblow', 'Hellfire Weapon'] },
  { category: 'Support', names: ['Deliberate Attack', 'Weapon of Darkness', 'Deploy trap', 'Heal', 'Anatomy', 'Resource Saving', 'Gamble', 'Continuous Curing'] },
  { category: 'Vitality', names: ['Greater Recovery Potion', 'Pure magic Potion', 'Weapon of Light', 'Quick Heal', 'Magic Circualtion', 'Overcome', 'War Cry'] },
  { category: 'Trick', names: ['Life Tap', 'Time Haste', 'Wanderer', 'Blink', 'Install Bomb', 'Purify', 'Near Escape', 'Reverse Time', 'Weapon of Destruction'] },
];

const PLACEHOLDER_ABILITIES = ABILITIES_BY_CATEGORY.flatMap(({ category, names }) =>
  names.map((name, i) => ({
    id: `${category}-${name.replace(/\s+/g, '-')}`,
    category,
    name,
    current: 0,
  }))
).map((a, i) => ({ ...a, id: String(i + 1) }));

const ASSIGNED_SLOTS = [
  { label: 'Vitality', progress: '80/80' },
  { label: 'Mental Paralysis', progress: '72/80' },
  { label: 'Combat Focus', progress: '76/80' },
  { label: 'Support', progress: '70/80' },
];

const CATEGORY_LIST = ABILITIES_BY_CATEGORY.map((c) => c.category);

export function AbilityView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [selectedAbilityId, setSelectedAbilityId] = useState<string | null>(null);
  const [advanceDialogOpen, setAdvanceDialogOpen] = useState(false);
  const [abilityLevels, setAbilityLevels] = useState<Record<string, number>>(() =>
    Object.fromEntries(PLACEHOLDER_ABILITIES.map((a) => [a.id, 20]))
  );

  const setLevel = (id: string, value: number) => {
    setAbilityLevels((prev) => ({ ...prev, [id]: value }));
  };

  const filteredBySearch = searchQuery.trim()
    ? PLACEHOLDER_ABILITIES.filter(
        (a) =>
          a.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
          a.category.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : PLACEHOLDER_ABILITIES;

  const filteredAbilities =
    categoryFilter === 'All'
      ? filteredBySearch
      : filteredBySearch.filter((a) => a.category === categoryFilter);

  const groupedByCategory = CATEGORY_LIST.reduce<{ category: string; abilities: typeof PLACEHOLDER_ABILITIES }[]>(
    (acc, cat) => {
      const list = filteredAbilities.filter((a) => a.category === cat);
      if (list.length) acc.push({ category: cat, abilities: list });
      return acc;
    },
    []
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_minmax(0,720px)] gap-4 md:gap-6 flex-1 min-h-0 p-4 md:p-6">
        {/* Left panel - 3 separate cards */}
        <div className="flex flex-col gap-3 min-w-0">
          <Tabs defaultValue="ability" className="w-full">
            <Card className="bg-black/60 border border-white/10 overflow-hidden backdrop-blur-sm">
              <CardHeader className="p-3 py-2">
                <TabsList className="w-full justify-start rounded-md bg-white/5 p-1">
                  <TabsTrigger value="ability">Ability</TabsTrigger>
                  <TabsTrigger value="codex">Class Codex</TabsTrigger>
                  <TabsTrigger value="point">Point</TabsTrigger>
                </TabsList>
              </CardHeader>
            </Card>

            <Card className="flex flex-col bg-black/60 border border-white/10 overflow-hidden flex-1 min-h-0 backdrop-blur-sm">
              <CardHeader className="p-2 pt-1.5 pb-1.5 flex-1 flex flex-col min-h-0 overflow-hidden">
                <TabsContent value="ability" className="mt-0 space-y-2 flex-1 flex flex-col min-h-0 overflow-hidden">
                  {/* Clickable category row - shows all abilities when selected */}
                  <div className="flex flex-wrap gap-2 px-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => { setCategoryFilter('All'); setSelectedAbilityId(null); }}
                      className={cn(
                        'min-w-[72px] h-10 px-3 rounded-md border text-left text-sm font-bold uppercase tracking-wide transition-none',
                        'bg-black/70 border-white/10 hover:bg-white/10 hover:border-white/20'
                      )}
                    >
                      <span className="text-[#e8e8e8]">All</span>
                    </button>
                    {CATEGORY_LIST.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => { setCategoryFilter(cat); setSelectedAbilityId(null); }}
                        className={cn(
                          'min-w-[72px] h-10 px-3 rounded-md border text-left text-sm font-bold uppercase tracking-wide transition-none',
                          'bg-black/70 border-white/10 hover:bg-white/10 hover:border-white/20',
                          categoryFilter === cat && 'ring-2 ring-yellow-400 ring-offset-0 ring-offset-background bg-white/10 border-yellow-400/50'
                        )}
                        style={{ color: categoryFilter === cat ? CATEGORY_COLORS[cat] ?? '#e8e8e8' : CATEGORY_COLORS[cat] ?? '#e8e8e8' }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <div className="relative flex-1 min-w-0 px-0.5 shrink-0">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search Ability"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 h-8 text-sm"
                    />
                  </div>
                  <ScrollArea className={cn('h-[420px] md:h-[480px] min-h-0 min-w-0 pr-1 shrink-0', categoryFilter !== 'All' && 'ability-table-no-scroll')}>
                    <div className="space-y-4">
                      {groupedByCategory.map(({ category, abilities }) => (
                        <div key={category} className="space-y-1">
                          {categoryFilter === 'All' && (
                            <div
                              className="text-xs font-bold uppercase tracking-wide px-1 py-0.5 sticky top-0 z-10 bg-black/80 backdrop-blur-sm rounded"
                              style={{ color: CATEGORY_COLORS[category] ?? '#e8e8e8' }}
                            >
                              {category}
                            </div>
                          )}
                          <div className="grid grid-cols-4 gap-0 justify-items-center">
                            {abilities.map((a) => {
                              const maxLevel = abilityLevels[a.id] ?? 20;
                              return (
                                <div
                                  key={a.id}
                                  className={cn(
                                    'ability-card ability-card-selectable cursor-pointer my-2',
                                    selectedAbilityId === a.id && 'ring-2 ring-yellow-400 ring-offset-0'
                                  )}
                                  onClick={() => setSelectedAbilityId(a.id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setSelectedAbilityId(a.id);
                              }
                            }}
                          >
                            <div className="absolute inset-0 rounded-[0.7rem] ability-card-inner z-[1] flex flex-col overflow-hidden">
                              {/* Header: category left, Level + circle right */}
                              <div className="flex items-center justify-between px-2 py-1.5 border-b border-white/10 shrink-0 bg-transparent" onClick={(e) => e.stopPropagation()}>
                                <span className="text-sm font-bold uppercase tracking-wide truncate" style={{ color: CATEGORY_COLORS[a.category] ?? '#e8e8e8' }}>{a.category}</span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-[10px] font-semibold text-[#e8e8e8] uppercase">Level</span>
                                  <Select value={String(maxLevel)} onValueChange={(v) => setLevel(a.id, Number(v))}>
                                    <SelectTrigger className="ability-card-level-trigger h-7 w-7 rounded-full p-0 flex items-center justify-center text-xs font-semibold text-[#e8e8e8] border border-white/20 bg-transparent hover:bg-white/5">
                                      <SelectValue />
                                    </SelectTrigger>
                                  <SelectContent className="ability-level-select-content">
                                    {LEVEL_OPTIONS.map((l) => (
                                      <SelectItem key={l} value={String(l)}>{l}</SelectItem>
                                    ))}
                                  </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              {/* Middle: content area - image with transparent bg */}
                              <div className="flex-1 min-h-0 bg-transparent flex items-center justify-center p-2">
                                <Image
                                  src={CATEGORY_IMAGES[a.category] || '/ability/combat.png'}
                                  alt={a.name}
                                  width={120}
                                  height={120}
                                  className="object-contain w-full h-full"
                                  unoptimized
                                />
                              </div>
                              {/* Footer: ability name centered */}
                              <div className="px-2 py-1.5 border-t border-white/10 text-center shrink-0 bg-transparent">
                                <span className="text-sm font-bold uppercase tracking-wide block drop-shadow-[0_0_6px_rgba(0,0,0,0.9)] text-[#e8e8e8] break-words line-clamp-3 leading-tight">{a.name}</span>
                              </div>
                            </div>
                          </div>
                        );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="codex" className="mt-0">
                  <p className="text-sm text-muted-foreground py-4">Class Codex content coming soon.</p>
                </TabsContent>
                <TabsContent value="point" className="mt-0">
                  <p className="text-sm text-muted-foreground py-4">Point content coming soon.</p>
                </TabsContent>
              </CardHeader>
            </Card>
          </Tabs>
        </div>

        {/* Right panel - Class Info card; ability detail panel on mask when an ability is selected */}
        <div className="relative min-w-0 w-full">
          {selectedAbilityId != null && (() => {
            const selected = PLACEHOLDER_ABILITIES.find((a) => a.id === selectedAbilityId);
            if (!selected) return null;
            const level = abilityLevels[selected.id] ?? 20;
            const grade = getGradeForLevel(level);
            const levelData = getLevelData(selected.category, selected.name, level);
            const effectInfo: EffectInfo = {
              abilityName: selected.name,
              grade,
              durationSec: levelData.durationSec,
              effectLines: levelData.activeEffects.map(formatStatLine),
            };
            const categoryImg = CATEGORY_IMAGES[selected.category] || '/ability/combat.png';
            return (
              <div
                className="absolute inset-0 z-20 flex flex-col rounded-lg bg-black/90 backdrop-blur-sm border border-white/10 overflow-hidden"
                aria-label="Ability details"
              >
                <button
                  type="button"
                  onClick={() => setSelectedAbilityId(null)}
                  className="absolute top-2 right-2 z-10 rounded-md p-2 text-red-500 hover:text-red-400 hover:bg-red-500/20 transition-colors"
                  aria-label="Close"
                >
                  <X className="h-7 w-7" />
                </button>
                <ScrollArea className="flex-1 min-h-0">
                  <div className="px-4 py-3 pb-2 space-y-3">
                    <div className="flex justify-center">
                      <div className="relative w-24 h-24 rounded overflow-hidden bg-white/5 flex items-center justify-center">
                        <Image
                          src={categoryImg}
                          alt={selected.name}
                          width={80}
                          height={80}
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    </div>
                    <h2 className="text-center text-base font-bold text-white uppercase tracking-wide">
                      {selected.name}
                    </h2>
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-0.5 text-sm">
                      <span><strong className="text-muted-foreground">Tag:</strong>{' '}<span className="font-semibold text-white" style={{ color: CATEGORY_COLORS[selected.category] }}>{selected.category}</span></span>
                      <span><strong className="text-muted-foreground">Grade:</strong>{' '}<span className="font-semibold text-white">{grade}</span></span>
                      <span><strong className="text-muted-foreground">Level:</strong>{' '}<span className="font-semibold text-white">{level}</span></span>
                    </div>
                    <p className="text-center text-xs text-green-500">• Can advance to Maestro grade.</p>
                    <div className="border-t border-white/10 pt-3 space-y-3">
                      <div className="rounded border border-white/10 bg-white/5 p-2">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center shrink-0">
                              <Image src={categoryImg} alt="" width={22} height={22} className="object-contain" unoptimized />
                            </div>
                            <span className="text-sm font-semibold text-white truncate">{selected.name}: {grade}</span>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">Active</span>
                        </div>
                        {getActiveStatsLines(levelData.cooldown, levelData.activeEffects).map(({ label, value }) => (
                          <p key={label} className="text-xs text-muted-foreground mb-0.5">
                            {label}: {value}
                          </p>
                        ))}
                        <p className="text-xs text-foreground leading-snug">
                          {renderDescriptionWithHighlights(levelData.activeDesc, effectInfo)}
                        </p>
                      </div>
                      <div className="rounded border border-white/10 bg-white/5 p-2">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center shrink-0">
                              <Image src={categoryImg} alt="" width={22} height={22} className="object-contain" unoptimized />
                            </div>
                            <span className="text-sm font-semibold text-white truncate">{selected.name}: {grade}</span>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">Passive</span>
                        </div>
                        <p className="text-xs text-foreground leading-snug">
                          {formatPassiveEffects(levelData.passiveEffects).map(({ label, value }, i) => (
                            <span key={i}>
                              {i > 0 && ', '}
                              {label} <span className="text-green-500">{value}</span>
                            </span>
                          ))}
                        </p>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
                <div className="shrink-0 px-4 py-2 border-t border-white/10">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-8 border-white/20 bg-white/5 hover:bg-white/10 text-sm uppercase"
                    onClick={() => setAdvanceDialogOpen(true)}
                  >
                    Advance Info
                  </Button>
                </div>
              </div>
            );
          })()}
          {selectedAbilityId != null && (() => {
            const selected = PLACEHOLDER_ABILITIES.find((a) => a.id === selectedAbilityId);
            if (!selected) return null;
            const level = abilityLevels[selected.id] ?? 20;
            return (
              <AbilityAdvanceDialog
                open={advanceDialogOpen}
                onOpenChange={setAdvanceDialogOpen}
                ability={{ id: selected.id, name: selected.name, category: selected.category }}
                currentLevel={level}
                categoryColor={CATEGORY_COLORS[selected.category] ?? '#e8e8e8'}
                categoryImage={CATEGORY_IMAGES[selected.category] || '/ability/combat.png'}
              />
            );
          })()}
          <Card className="flex flex-col bg-black/60 border border-white/10 overflow-hidden w-full backdrop-blur-sm">
            <CardHeader className="p-3 pb-1">
              <Tabs defaultValue="classinfo" className="w-full">
              <TabsList className="w-full justify-start rounded-md bg-white/5 p-1">
                <TabsTrigger value="classinfo" className="text-xs">Class Info</TabsTrigger>
                <TabsTrigger value="taglevel" className="text-xs">Tag Level</TabsTrigger>
              </TabsList>
              <TabsContent value="classinfo" className="mt-2 space-y-3">
                <ScrollArea className="h-[420px] pr-2">
                  <div>
                    <h3 className="font-cinzel font-bold text-sm text-primary mb-1">Details</h3>
                    <p className="text-primary font-medium text-sm">Hunter (Lv. 468)</p>
                    <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                      <span>Vitality</span>
                      <span>Recon</span>
                      <span>Support</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-snug">
                      Deals greater damage against monsters, but also receives more damage.
                    </p>
                  </div>
                  <div className="mt-3">
                    <h3 className="font-cinzel font-bold text-sm text-primary mb-1">Assigned skills</h3>
                    <div className="flex flex-col gap-1 mt-1">
                      {ASSIGNED_SLOTS.map((slot, i) => (
                        <div
                          key={i}
                          className="rounded border border-border bg-muted/30 px-2 py-1 flex items-center justify-between"
                        >
                          <span className="text-xs text-primary truncate">{slot.label}</span>
                          <span className="text-[10px] text-muted-foreground flex-shrink-0">{slot.progress}</span>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" className="mt-2 gap-1 h-7 text-xs">
                      <Lock className="h-3 w-3" /> Unlock
                    </Button>
                  </div>
                  <div className="rounded border border-border bg-muted/20 p-2 mt-3">
                    <p className="text-[10px] text-muted-foreground mb-0.5">Ability effect</p>
                    <p className="text-xs text-foreground leading-snug">
                      Defeating a Monster has a 100% chance of increasing Damage to Monsters and Damage
                      Received from Monsters for a short duration. Stacks up to 50 times.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    <Button variant="outline" size="sm" className="h-7 text-xs">Release All</Button>
                    <span className="text-xs text-muted-foreground flex items-center">Favorites 0/5</span>
                    <Button variant="outline" size="sm" className="gap-1 h-7 text-xs">
                      <Star className="h-3 w-3" /> Favorites
                    </Button>
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="taglevel" className="mt-2">
                <p className="text-xs text-muted-foreground">Tag Level content coming soon.</p>
              </TabsContent>
            </Tabs>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
