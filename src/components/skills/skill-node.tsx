"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Plus, Minus, Swords, Sparkles, Shield, type LucideIcon } from "lucide-react";
import { Button } from "../ui/button";

export interface Skill {
  id: string;
  name: string;
  description: string;
  icon: 'swords' | 'sparkles' | 'shield';
  maxLevel: number;
  tier: number;
  dependencies?: string[];
}

const icons: Record<string, LucideIcon> = {
  swords: Swords,
  sparkles: Sparkles,
  shield: Shield
};

interface SkillNodeProps {
  skill: Skill;
  level: number;
  onLevelChange: (newLevel: number) => void;
  canLevelUp: boolean;
  canLevelDown: boolean;
}

export function SkillNode({ skill, level, onLevelChange, canLevelUp, canLevelDown }: SkillNodeProps) {
  const Icon = icons[skill.icon];
  const isMaxLevel = level >= skill.maxLevel;
  const isLocked = level === 0 && !canLevelUp;

  const handleLevelUp = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isMaxLevel && canLevelUp) {
      onLevelChange(level + 1);
    }
  };

  const handleLevelDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (canLevelDown) {
      onLevelChange(level - 1);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-col items-center gap-2">
            <div
              className={cn(
                "relative w-24 h-24 rounded-lg border-2 flex items-center justify-center transition-all duration-300 group",
                isLocked ? "border-muted/20 bg-muted/10 text-muted-foreground/30" : "border-muted",
                level > 0 && "border-primary shadow-lg shadow-primary/20",
                isMaxLevel && "border-yellow-400 bg-yellow-400/10 shadow-yellow-400/20"
              )}
              onContextMenu={handleLevelDown}
            >
              {Icon && <Icon className={cn("w-10 h-10 transition-transform group-hover:scale-110", level > 0 && "text-primary", isMaxLevel && "text-yellow-400")} />}

              {level > 0 && (
                <div className="absolute -bottom-2 -right-2 bg-card border-2 border-primary rounded-full w-8 h-8 flex items-center justify-center font-bold font-headline text-primary">
                  {level}
                </div>
              )}
              
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                 <Button size="icon" variant="ghost" className="w-8 h-8 rounded-full" onClick={handleLevelUp} disabled={isMaxLevel || !canLevelUp}>
                    <Plus className="w-5 h-5"/>
                 </Button>
                 <Button size="icon" variant="ghost" className="w-8 h-8 rounded-full" onClick={handleLevelDown} disabled={!canLevelDown}>
                    <Minus className="w-5 h-5"/>
                 </Button>
              </div>

            </div>
            <p className={cn(
              "text-center text-sm font-semibold truncate w-24",
              isLocked ? "text-muted-foreground/50" : "text-foreground"
            )}>{skill.name}</p>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="font-bold font-headline text-lg">{skill.name} ({level}/{skill.maxLevel})</p>
          <p className="text-sm text-muted-foreground">{skill.description}</p>
          {isLocked && skill.dependencies && (
              <p className="text-xs text-destructive mt-2">Requires max level in prerequisite skills.</p>
          )}
          {!isMaxLevel && canLevelUp && <p className="text-xs text-primary mt-2">Click to level up</p>}
          {canLevelDown && <p className="text-xs text-muted-foreground mt-1">Right-click to level down</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
