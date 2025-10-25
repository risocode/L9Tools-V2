
"use client";

import Image from "next/image";
import { Clock, MapPin, RefreshCw, Star } from "lucide-react";
import type { Boss } from "@/types";
import { ProcessedBoss, BossTimer } from "./boss-timer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button";
import { ScrollArea } from "../ui/scroll-area";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { cn } from "@/lib/utils";

interface BossAccordionProps {
  bosses: ProcessedBoss[];
  onOpenMap: (boss: Boss) => void;
  onOpenTimeDialog: (boss: Boss) => void;
  onResetTimer: (boss: Boss) => void;
  className?: string;
}

export const BossAccordion = React.memo(function BossAccordion({
  bosses,
  onOpenMap,
  onOpenTimeDialog,
  onResetTimer,
  className,
}: BossAccordionProps) {

  if (bosses.length === 0) {
    return null;
  }

  return (
    <ScrollArea className={cn("h-full", className)}>
      <Accordion type="multiple" className="w-full">
        {bosses.map((boss) => (
          <AccordionItem key={boss.id} value={boss.id} className="border-b-white/5">
            <AccordionTrigger className="hover:no-underline hover:bg-white/5 px-2 py-2">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                 <div className="relative h-[90px] w-[70px] flex-shrink-0">
                    <Image
                      src="/l9rs/bhframe.png"
                      alt="Boss frame"
                      fill
                      sizes="70px"
                      className="absolute inset-0 z-10"
                      priority
                    />
                    <div className="absolute inset-0 w-[70px] h-[80px] top-1 overflow-hidden">
                      <Image 
                        src={boss.image}
                        alt={boss.name} 
                        width={70}
                        height={90}
                        className="object-contain px-2 pt-3 pb-2" 
                        data-ai-hint="fantasy character"
                      />
                    </div>
                </div>
                <div className="flex-1 min-w-0 text-left text-shadow-soft flex-shrink">
                  <p className="font-cinzel font-bold text-xs text-silver truncate">{`Lvl ${boss.level}`}</p>
                  <p className="font-cinzel font-bold text-sm text-crimson text-glow-crimson truncate">{boss.name}</p>
                </div>
                <div className="w-auto min-w-[140px] flex items-center justify-center pr-1">
                  <BossTimer boss={boss} />
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="p-4 space-y-4 bg-black/20">
                <div className="flex justify-between items-center">
                    <p className="font-roboto text-sm text-silver text-shadow-soft">Location:</p>
                    <p className="font-roboto text-sm text-silver text-shadow-soft">{boss.location}</p>
                </div>
                <div className="flex justify-around items-center pt-2">
                    <Button variant="ghost" size="icon" onClick={() => onOpenMap(boss)} disabled={!boss.map} title="View Map" className="icon-glow-purple-on-hover">
                        <MapPin className="h-5 w-5 text-silver" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Set Time of Death" onClick={() => onOpenTimeDialog(boss)} className="icon-glow-purple-on-hover relative">
                        {!boss.isFixedSpawn && boss.level >= 90 && (
                             <span className="absolute top-0 right-0 text-amber-gold text-xs font-bold" style={{ textShadow: '0 0 5px black' }}>PRO</span>
                        )}
                        <Clock className="h-5 w-5 text-silver" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onResetTimer(boss)} disabled={boss.isFixedSpawn || !boss.respawnTime} title="Reset Timer" className="icon-glow-purple-on-hover">
                        <RefreshCw className="h-5 w-5 text-silver" />
                    </Button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </ScrollArea>
  );
});
