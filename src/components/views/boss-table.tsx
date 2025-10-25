
"use client";

import Image from "next/image";
import { Clock, MapPin, RefreshCw, Star } from "lucide-react";
import type { Boss } from "@/types";
import { ProcessedBoss, BossTimer } from "./boss-timer";
import { Button } from "@/components/ui/button";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Table, TableBody } from "../ui/table";
import { cn } from "@/lib/utils";

interface BossTableProps {
  bosses: ProcessedBoss[];
  onOpenMap: (boss: Boss) => void;
  onOpenTimeDialog: (boss: Boss) => void;
  onResetTimer: (boss: Boss) => void;
  className?: string;
}

export const BossTable = React.memo(function BossTable({
  bosses,
  onOpenMap,
  onOpenTimeDialog,
  onResetTimer,
  className,
}: BossTableProps) {
  
  if (bosses.length === 0) {
    return null;
  }

  return (
    <Table className={cn(className)}>
      <TableBody>
        {bosses.map((boss: ProcessedBoss) => (
            <tr key={boss.id} className="flex items-center p-4 border-b border-b-white/5 hover:bg-white/5">
                {/* Boss Cell */}
                <td className="w-[35%] flex items-center gap-3">
                    <div className="relative h-[100px] w-[80px] flex-shrink-0">
                         <Image
                          src="/l9rs/bhframe.png"
                          alt="Boss frame"
                          fill
                          sizes="80px"
                          className="absolute inset-0 z-10"
                          priority
                        />
                        <div className="absolute inset-0 w-[80px] h-[90px] overflow-hidden">
                          <Image 
                            src={boss.image}
                            alt={boss.name} 
                            width={80}
                            height={100}
                            className="object-contain px-2 pt-4 pb-2" 
                            data-ai-hint="fantasy character" 
                          />
                        </div>
                    </div>
                    <div className="text-shadow-soft">
                        <p className="font-cinzel font-bold text-sm text-silver">{`Lvl ${boss.level}`}</p>
                        <p className="font-cinzel font-bold text-lg text-crimson text-glow-crimson truncate">{boss.name}</p>
                    </div>
                </td>
                {/* Location Cell */}
                <td className="w-[25%] flex items-center text-base text-silver text-shadow-soft">
                    {boss.location}
                </td>
                {/* Spawn Time Cell */}
                <td className="w-[25%] flex items-center justify-center">
                    <BossTimer boss={boss} />
                </td>
                {/* Actions Cell */}
                <td className="w-[15%] flex items-center justify-center">
                    <div className="flex justify-center gap-1 md:gap-2">
                        <Button variant="ghost" size="icon" onClick={() => onOpenMap(boss)} disabled={!boss.map} title="View Map" className="icon-glow-purple-on-hover">
                            <MapPin className="h-4 w-4 text-silver" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Set Time of Death" onClick={() => onOpenTimeDialog(boss)} className="icon-glow-purple-on-hover relative">
                            {!boss.isFixedSpawn && boss.level >= 90 && (
                                <span className="absolute top-0 right-0 text-amber-gold text-xs font-bold" style={{ textShadow: '0 0 5px black' }}>PRO</span>
                            )}
                            <Clock className="h-4 w-4 text-silver" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onResetTimer(boss)} disabled={boss.isFixedSpawn || !boss.respawnTime} title="Reset Timer" className="icon-glow-purple-on-hover">
                            <RefreshCw className="h-4 w-4 text-silver" />
                        </Button>
                    </div>
                </td>
            </tr>
        ))}
      </TableBody>
    </Table>
  );
});
