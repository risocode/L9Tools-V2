
"use client";

import { useState, useRef } from 'react';
import type { ElementType } from 'react';
import Image from "next/image";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { cn } from '@/lib/utils';
import type { AvatarData, Grade } from '@/types';
import { Wind, Zap, Forward, Swords, Shield, Dna, MinusCircle, HeartPulse, ShieldCheck, Gem, Target, Star } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { calculateTotalStat } from '@/lib/avatars/utils';

interface AvatarAccordionProps {
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

export function AvatarAccordion({ avatars, onFatedChange, highlightStats, className }: AvatarAccordionProps) {
  const [expandedValue, setExpandedValue] = useState<string | undefined>(undefined);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const previousExpandedRef = useRef<string | undefined>(undefined);

  if (avatars.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-center text-muted-foreground p-8">
        No avatars match the current filters.
      </div>
    );
  }

  const handleValueChange = (value: string | undefined) => {
    // Closing accordion
    if (!value) {
      setExpandedValue(undefined);
      previousExpandedRef.current = undefined;
      return;
    }

    const itemElement = itemRefs.current[value];
    if (!itemElement) {
      // Element not found, just expand immediately
      setExpandedValue(value);
      previousExpandedRef.current = value;
      return;
    }

    const scrollViewport = itemElement.closest('[data-radix-scroll-area-viewport]') as HTMLElement;
    if (!scrollViewport) {
      // No scroll viewport, just expand
      setExpandedValue(value);
      previousExpandedRef.current = value;
      return;
    }

    const isSwitching = previousExpandedRef.current && previousExpandedRef.current !== value;

    if (isSwitching) {
      // Switching avatars: close previous, then scroll, then expand new
      setExpandedValue(undefined);
      previousExpandedRef.current = undefined;
      
      // Wait for close animation to start, then scroll and expand
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Get positions relative to the viewport
          const viewportRect = scrollViewport.getBoundingClientRect();
          const elementRect = itemElement.getBoundingClientRect();
          const currentScroll = scrollViewport.scrollTop;
          const elementOffsetTop = elementRect.top - viewportRect.top + currentScroll;
          
          // Scroll smoothly to position
          scrollViewport.scrollTo({
            top: elementOffsetTop,
            behavior: 'smooth'
          });
          
          // Wait for scroll to start, then expand smoothly
          setTimeout(() => {
            setExpandedValue(value);
            previousExpandedRef.current = value;
            
            // After expansion, ensure avatar name stays at top
            setTimeout(() => {
              // Re-get the element position after expansion (layout may have changed)
              const updatedElement = itemRefs.current[value];
              if (updatedElement) {
                const viewportRectAfter = scrollViewport.getBoundingClientRect();
                const elementRectAfter = updatedElement.getBoundingClientRect();
                const currentScrollAfter = scrollViewport.scrollTop;
                const elementOffsetTopAfter = elementRectAfter.top - viewportRectAfter.top + currentScrollAfter;
                
                // Re-scroll to keep avatar name at top
                scrollViewport.scrollTo({
                  top: elementOffsetTopAfter,
                  behavior: 'smooth'
                });
              }
            }, 250); // Wait for accordion expand animation to complete
          }, 150);
        });
      });
    } else {
      // Opening fresh avatar: scroll first, then expand
      const viewportRect = scrollViewport.getBoundingClientRect();
      const elementRect = itemElement.getBoundingClientRect();
      const currentScroll = scrollViewport.scrollTop;
      const elementOffsetTop = elementRect.top - viewportRect.top + currentScroll;
      
      // Scroll smoothly to position
      scrollViewport.scrollTo({
        top: elementOffsetTop,
        behavior: 'smooth'
      });
      
      // Wait for scroll to start, then expand smoothly
      setTimeout(() => {
        setExpandedValue(value);
        previousExpandedRef.current = value;
        
        // After expansion, ensure avatar name stays at top
        setTimeout(() => {
          // Re-get the element position after expansion (layout may have changed)
          const updatedElement = itemRefs.current[value];
          if (updatedElement) {
            const viewportRectAfter = scrollViewport.getBoundingClientRect();
            const elementRectAfter = updatedElement.getBoundingClientRect();
            const currentScrollAfter = scrollViewport.scrollTop;
            const elementOffsetTopAfter = elementRectAfter.top - viewportRectAfter.top + currentScrollAfter;
            
            // Re-scroll to keep avatar name at top
            scrollViewport.scrollTo({
              top: elementOffsetTopAfter,
              behavior: 'smooth'
            });
          }
        }, 250); // Wait for accordion expand animation to complete
      }, 150);
    }
  };

  return (
    <div className={cn("p-2 space-y-2", className)}>
        <Accordion type="single" collapsible className="w-full space-y-2" value={expandedValue} onValueChange={handleValueChange}>
            {avatars.map((avatar) => {
              const hasFatedBonus = avatar.fatedRelationshipActive && avatar.fatedRelationship.description;
              const itemValue = `item-${avatar.id}`;
              
              return (
              <AccordionItem 
                key={avatar.id} 
                value={itemValue} 
                className="border-b-white/5 bg-black/20 rounded-lg"
              >
                  <AccordionTrigger 
                    className="hover:no-underline p-4"
                    ref={(el) => {
                      itemRefs.current[itemValue] = el;
                    }}
                  >
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
                      <div className="flex-1 text-left min-w-0">
                      <p className={cn("text-base font-bold font-cinzel truncate", gradeStyles[avatar.grade]?.color)}>
                          {avatar.name}
                      </p>
                      </div>
                  </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 pt-0">
                  <div className="bg-black/30 p-4 rounded-md border border-primary/10">
                      <h3 className="font-cinzel text-base font-semibold text-golden mb-3">
                        {hasFatedBonus ? "Total Stats (with Fated)" : "Base Stats"}
                      </h3>
                      <div className="grid grid-cols-1 gap-2 mb-4">
                      {avatar.stats.map(stat => {
                          const StatIcon = icons[stat.icon] || Star;
                          const isHighlighted = highlightStats.includes(stat.attribute);
                          const statCalculation = calculateTotalStat(
                            stat.value,
                            avatar.fatedRelationship.description,
                            stat.attribute,
                            !!avatar.fatedRelationshipActive
                          );
                          const hasBonus = statCalculation.bonus !== 0;
                          const showBonus = hasBonus && avatar.fatedRelationshipActive;
                          
                          return (
                            <div 
                              key={stat.attribute} 
                              className={cn(
                                "flex items-center gap-2 text-xs transition-colors",
                                isHighlighted && "bg-primary/10 p-1 rounded-md ring-1 ring-primary/50"
                              )}
                            >
                                <StatIcon className={cn(
                                  "h-3 w-3 transition-colors",
                                  isHighlighted ? "text-primary" : "text-muted-foreground"
                                )} />
                                <span className={cn(
                                  "whitespace-nowrap transition-colors",
                                  isHighlighted ? "text-primary font-bold" : showBonus ? "text-yellow-400 font-bold" : "text-muted-foreground"
                                )}>{stat.attribute}:</span>
                                <span className="font-semibold text-white truncate">
                                  {showBonus ? (
                                    <span className="flex items-center gap-1">
                                      <span className="line-through text-muted-foreground/60">{stat.value}</span>
                                      <span className="text-yellow-400 font-bold">{statCalculation.formattedTotal}</span>
                                    </span>
                                  ) : (
                                    stat.value
                                  )}
                                </span>
                            </div>
                          )
                      })}
                      </div>
                        <Separator className="my-4 bg-primary/20" />
                         <div className="flex justify-between items-center">
                            <div>
                                <h3 className="font-cinzel text-base font-semibold text-golden mb-2">Fated Relationship</h3>
                                <p className="text-xs font-semibold text-white mb-1">{avatar.fatedRelationship.name}</p>
                                {avatar.fatedRelationship.description && <p className="text-xs text-muted-foreground">{avatar.fatedRelationship.description}</p>}
                            </div>
                             {avatar.fatedRelationship.name !== 'N/A' && (
                                <div 
                                    className={cn(
                                      "flex items-center space-x-2 p-2 rounded-lg transition-all duration-300",
                                      avatar.fatedRelationshipActive 
                                        ? "bg-yellow-400/10 hover:bg-yellow-400/20 border border-yellow-400/30" 
                                        : "bg-primary/5 hover:bg-primary/10"
                                    )}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Checkbox
                                        id={`fated-mobile-${avatar.id}`}
                                        checked={avatar.fatedRelationshipActive}
                                        onCheckedChange={(checked) => onFatedChange(avatar.id, !!checked)}
                                    />
                                    <Label htmlFor={`fated-mobile-${avatar.id}`} className={cn(
                                      "font-semibold text-xs cursor-pointer transition-colors",
                                      avatar.fatedRelationshipActive ? "text-yellow-400" : "text-primary"
                                    )}>
                                        Fated
                                    </Label>
                                </div>
                            )}
                        </div>
                    </div>
                    </AccordionContent>
                </AccordionItem>
                );
            })}
        </Accordion>
    </div>
  );
}
