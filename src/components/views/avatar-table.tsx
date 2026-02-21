
"use client";

import type { ElementType } from 'react';
import Image from "next/image";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { cn } from '@/lib/utils';
import type { AvatarData, Grade } from '@/types';
import { Wind, Zap, Forward, Swords, Shield, Dna, MinusCircle, HeartPulse, ShieldCheck, Gem, Target, Star } from 'lucide-react';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';

interface AvatarTableProps {
  avatars: AvatarData[];
  onFatedChange: (avatarId: number, isActive: boolean) => void;
  highlightStats: string[];
  className?: string;
}

const icons: Record<string, ElementType> = {
  wind: Wind,
  zap: Zap,
  forward: Forward,
  swords: Swords,
  shield: Shield,
  dna: Dna,
  'minus-circle': MinusCircle,
  'heart-pulse': HeartPulse,
  'shield-check': ShieldCheck,
  gem: Gem,
  target: Target,
};

const gradeStyles: Record<Grade, { color: string; glow: string; }> = {
  Common: { color: 'text-gray-400', glow: 'text-glow-gray-400' },
  Uncommon: { color: 'text-green-400', glow: 'text-glow-green-400' },
  Rare: { color: 'text-blue-400', glow: 'text-glow-blue-400' },
  Epic: { color: 'text-purple-400', glow: 'text-glow-purple-400' },
  Legendary: { color: 'text-amber-gold', glow: 'text-glow-amber-gold' },
  Mythic: { color: 'text-red-500', glow: 'text-glow-red-500' }
};

export function AvatarTable({ avatars, onFatedChange, highlightStats, className }: AvatarTableProps) {
  if (avatars.length === 0) {
    return null;
  }

  return (
    <div className={cn("p-4", className)}>
        <Accordion type="multiple" className="w-full space-y-2">
            {avatars.map((avatar) => (
            <AccordionItem key={avatar.id} value={`item-${avatar.id}`} className="bg-black/20 rounded-lg border-primary/10">
                <AccordionTrigger className="hover:no-underline p-4">
                <div className="flex items-center gap-4 w-full">
                    <div className="relative h-20 w-14 flex-shrink-0">
                        <Image 
                            src={avatar.image} 
                            alt={avatar.name} 
                            width={56}
                            height={80}
                            className="rounded-md object-contain" 
                            data-ai-hint="fantasy character"
                        />
                    </div>
                    <div className="flex-1 text-left">
                    <p className={cn("text-xl font-bold font-cinzel", gradeStyles[avatar.grade]?.color)}>
                        {avatar.name}
                    </p>
                    </div>
                </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0">
                <div className="bg-black/30 p-4 rounded-md border border-primary/10">
                    <h3 className="font-cinzel text-lg font-semibold text-golden mb-3">Base Stats</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2 mb-4">
                    {avatar.stats.map(stat => {
                        const StatIcon = icons[stat.icon] || Star;
                        const isHighlighted = highlightStats.includes(stat.attribute);
                        return (
                        <div 
                          key={stat.attribute} 
                          className={cn(
                            "flex items-center gap-2 text-xs transition-colors duration-300",
                            isHighlighted && "bg-primary/10 p-1 rounded-md ring-1 ring-primary/50"
                          )}
                        >
                            <StatIcon className={cn("h-3 w-3", isHighlighted ? "text-primary" : "text-muted-foreground")} />
                            <span className={cn("whitespace-nowrap", isHighlighted ? "text-primary font-bold" : "text-muted-foreground")}>{stat.attribute}:</span>
                            <span className="font-semibold text-white truncate">{stat.value}</span>
                        </div>
                        )
                    })}
                    </div>
                    <Separator className="my-4 bg-primary/20" />
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="font-cinzel text-lg font-semibold text-golden mb-2">Fated Relationship</h3>
                            <p className="text-sm font-semibold text-white mb-1">{avatar.fatedRelationship.name}</p>
                            {avatar.fatedRelationship.description && <p className="text-sm text-muted-foreground">{avatar.fatedRelationship.description}</p>}
                        </div>
                         {avatar.fatedRelationship.name !== 'N/A' && (
                            <div 
                                className="flex items-center space-x-2 p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Checkbox
                                    id={`fated-${avatar.id}`}
                                    checked={avatar.fatedRelationshipActive}
                                    onCheckedChange={(checked) => onFatedChange(avatar.id, !!checked)}
                                />
                                <Label htmlFor={`fated-${avatar.id}`} className="font-semibold text-primary text-sm cursor-pointer">
                                    Fated
                                </Label>
                            </div>
                        )}
                    </div>
                </div>
                </AccordionContent>
            </AccordionItem>
            ))}
        </Accordion>
    </div>
  );
}
