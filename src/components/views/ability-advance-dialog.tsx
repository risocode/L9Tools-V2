"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLevelData, formatStatLine, formatPassiveEffects, getActiveStatsLines } from "@/lib/ability-level-data";
import type { StatModifier, ActiveEffectModifier } from "@/lib/ability-level-data";

const LEVEL_OPTIONS = [20, 40, 60, 80, 90, 100, 120] as const;
const LEVEL_TO_GRADE: Record<number, string> = {
  20: "Apprentice",
  40: "Intermediate",
  60: "Advance",
  80: "Expert",
  90: "Maestro",
  100: "Master",
  120: "Master I",
};
const GRADE_TABS = LEVEL_OPTIONS.map((l) => ({ level: l, grade: LEVEL_TO_GRADE[l] }));

export type EffectInfo = {
  abilityName: string;
  grade: string;
  durationSec: number;
  effectLines: string[];
};

/** Green underline = positive effects; Red underline = negative effects. Only these terms are clickable/highlighted. */
const GREEN_TERMS = [
  "Attack Power",
  "All Damage",
  "Damage to Monsters",
  "Attack Speed",
  "Accuracy",
  "Cripple hit",
  "Defence Power",
  "Damage Received",
  "Critical Hit Damage",
  "Critical Hit",
  "Skill Damage",
  "Potion Recover Rate",
  "Basic Attack Life Absorb",
  "Cooldown",
  "Evasion",
  "MP Consumption",
  "Max HP",
  "Movement Speed",
  "Status Effect Resistance",
];

const RED_TERMS = [
  "Movement Speed",
  "Bleed",
  "MP Consumption",
  "Spell Infusion",
  "Stun",
  "Defense Power",
  "Burn",
  "Magic Damage Received",
  "Restrain",
  "Healing Received",
  "Install Bomb",
  "Disarm",
  "Venom",
  "Sleep",
  "Attack Speed",
  "Endurance",
  "Shield Defense",
];

const ALL_CLICKABLE_TERMS = [...new Set([...GREEN_TERMS, ...RED_TERMS])].sort(
  (a, b) => b.length - a.length
);
const CLICKABLE_REGEX = new RegExp(
  `(${ALL_CLICKABLE_TERMS.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
  "g"
);

function getTermColor(term: string): "green" | "red" {
  return RED_TERMS.includes(term) ? "red" : "green";
}

/** Stats shown only outside (main block). Never show these inside the clickable popover. */
function isOutsideOnlyLine(line: string): boolean {
  if (line.startsWith("Range ")) return true;
  if (line.startsWith("Cooldown ")) return true;
  if (line.startsWith("Damage ") && !line.startsWith("Damage to "))
    return true;
  return false;
}

/** Renders description with only green/red list terms highlighted. Green = positive, red = negative. Clickable when effectInfo passed. Popover shows only effect lines that belong "inside" (excludes Range, Cooldown, Damage). */
export function renderDescriptionWithHighlights(
  text: string,
  effectInfo?: EffectInfo,
  clickable?: boolean
) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let key = 0;
  const makeClickable = clickable !== false && effectInfo;
  while ((match = CLICKABLE_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const term = match[1];
    const color = getTermColor(term);
    const isGreen = color === "green";
    const underlineClass = isGreen
      ? "underline text-green-500"
      : "underline text-red-500";
    const hoverClass = isGreen ? "hover:text-green-400" : "hover:text-red-400";
    if (makeClickable) {
      const insideOnlyLines = effectInfo!.effectLines.filter(
        (line) => !isOutsideOnlyLine(line)
      );
      const linesForTerm = insideOnlyLines.filter((line) => {
        if (line.startsWith(term) || line.includes(term)) return true;
        if (term === "Damage to Monsters" && line.startsWith("Damage to "))
          return true;
        return false;
      });
      parts.push(
        <Popover key={key++}>
          <PopoverTrigger asChild>
            <span
              role="button"
              tabIndex={0}
              className={`${underlineClass} cursor-pointer ${hoverClass}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  (e.target as HTMLElement).click();
                }
              }}
            >
              {term}
            </span>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto max-w-[280px] rounded-lg border-white/20 bg-black/95 p-3 text-popover-foreground shadow-lg"
            align="start"
            side="top"
          >
            <div className="space-y-1.5 text-xs">
              <p className="font-semibold text-white">
                {effectInfo!.abilityName}: {effectInfo!.grade}
              </p>
              {effectInfo!.durationSec > 0 && (
                <p className="text-muted-foreground">Duration: {effectInfo!.durationSec} sec</p>
              )}
              <ul className="list-disc list-inside space-y-0.5 text-green-400">
                {linesForTerm.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>
          </PopoverContent>
        </Popover>
      );
    } else {
      parts.push(
        <span key={key++} className={underlineClass}>
          {term}
        </span>
      );
    }
    lastIndex = CLICKABLE_REGEX.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return <>{parts.length ? parts : text}</>;
}

export interface AbilityAdvanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ability: { id: string; name: string; category: string };
  currentLevel: number;
  categoryColor: string;
  categoryImage: string;
}

export function AbilityAdvanceDialog({
  open,
  onOpenChange,
  ability,
  currentLevel,
  categoryColor,
  categoryImage,
}: AbilityAdvanceDialogProps) {
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<number>(LEVEL_OPTIONS[0]); // right panel grade

  const currentGrade = LEVEL_TO_GRADE[currentLevel] ?? "Apprentice";
  const currentData = getLevelData(ability.category, ability.name, currentLevel);
  const selectedData = getLevelData(ability.category, ability.name, selectedGradeLevel);
  const selectedGrade = LEVEL_TO_GRADE[selectedGradeLevel] ?? "Apprentice";

  const selectedIndex = GRADE_TABS.findIndex((g) => g.level === selectedGradeLevel);
  const canPrev = selectedIndex > 0;
  const canNext = selectedIndex < GRADE_TABS.length - 1 && selectedIndex >= 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col bg-black/95 border-white/10 p-0 gap-0"
        hideCloseButton
      >
        <div className="relative flex items-center justify-center border-b border-white/10 px-4 py-3 shrink-0">
          <DialogHeader className="flex-1 flex items-center justify-center">
            <DialogTitle className="text-lg font-bold text-white uppercase tracking-wide text-center">
              Ability Advanced
            </DialogTitle>
          </DialogHeader>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md p-2 text-red-500 hover:text-red-400 hover:bg-red-500/20 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Grade tabs with vertical separators */}
        <div className="flex flex-wrap items-center justify-center gap-0 px-4 py-2 border-b border-white/10 shrink-0">
          {GRADE_TABS.map(({ level, grade }, idx) => (
            <React.Fragment key={level}>
              {idx > 0 && <span className="w-px h-4 bg-white/20 mx-0.5" aria-hidden />}
              <button
                type="button"
                onClick={() => setSelectedGradeLevel(level)}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold uppercase transition-colors rounded-none first:rounded-l last:rounded-r",
                  selectedGradeLevel === level
                    ? "bg-white/20 text-white"
                    : "text-muted-foreground hover:bg-white/10"
                )}
              >
                {grade}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Two panels */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 overflow-auto">
          {/* Left - Ability Info (current tier, purple accent) */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold text-white uppercase">Ability Info</h3>
            <AbilityPanelCard
              ability={ability}
              grade={currentGrade}
              level={currentLevel}
              categoryColor={categoryColor}
              categoryImage={categoryImage}
              cooldown={currentData.cooldown}
              activeDesc={currentData.activeDesc}
              passiveEffects={currentData.passiveEffects}
              durationSec={currentData.durationSec}
              activeEffects={currentData.activeEffects}
              variant="current"
            />
          </div>

          {/* Right - Target grade (gray accent); chevrons at far left and right */}
          <div className="flex flex-col gap-3 relative">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => canPrev && setSelectedGradeLevel(GRADE_TABS[selectedIndex - 1].level)}
                disabled={!canPrev}
                className="p-2 rounded-md text-muted-foreground hover:text-white hover:bg-white/10 disabled:opacity-30 shrink-0"
                aria-label="Previous grade"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h3 className="text-sm font-bold text-white uppercase flex-1 text-center">Compare to grade</h3>
              <button
                type="button"
                onClick={() => canNext && setSelectedGradeLevel(GRADE_TABS[selectedIndex + 1].level)}
                disabled={!canNext}
                className="p-2 rounded-md text-muted-foreground hover:text-white hover:bg-white/10 disabled:opacity-30 shrink-0"
                aria-label="Next grade"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <AbilityPanelCard
              ability={ability}
              grade={selectedGrade}
              level={selectedGradeLevel}
              categoryColor={categoryColor}
              categoryImage={categoryImage}
              cooldown={selectedData.cooldown}
              activeDesc={selectedData.activeDesc}
              passiveEffects={selectedData.passiveEffects}
              durationSec={selectedData.durationSec}
              activeEffects={selectedData.activeEffects}
              variant="target"
            />
          </div>
        </div>

        {/* Bottom - Advancement Requirements + Advance button (muted, decorative border) */}
        <div className="shrink-0 border-t border-white/10 px-4 py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold text-white uppercase mb-1">Advancement Requirements</h3>
            <p className="text-xs text-muted-foreground">Advance information not found.</p>
          </div>
          <Button
            variant="outline"
            className="border-2 border-white/20 bg-white/5 text-muted-foreground opacity-70 cursor-not-allowed shrink-0 rounded-md px-6"
            disabled
          >
            Advance
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AbilityPanelCard({
  ability,
  grade,
  level,
  categoryColor,
  categoryImage,
  cooldown,
  activeDesc,
  passiveEffects,
  durationSec,
  activeEffects,
  variant,
}: {
  ability: { name: string; category: string };
  grade: string;
  level: number;
  categoryColor: string;
  categoryImage: string;
  cooldown: number;
  activeDesc: string;
  passiveEffects: StatModifier[];
  durationSec: number;
  activeEffects: ActiveEffectModifier[];
  variant: "current" | "target";
}) {
  const isCurrent = variant === "current";
  const effectInfo: EffectInfo = {
    abilityName: ability.name,
    grade,
    durationSec,
    effectLines: activeEffects.map(formatStatLine),
  };
  return (
    <div
      className={cn(
        "rounded-lg overflow-hidden",
        isCurrent
          ? "border-2 border-purple-500/60 bg-white/5 shadow-[0_0_12px_rgba(168,85,247,0.15)]"
          : "border border-white/20 bg-white/5"
      )}
    >
      {/* Ability icon + name block: current = purple ornate frame, target = gray frame */}
      <div className="p-4 flex flex-col items-center gap-1.5">
        <div
          className={cn(
            "w-24 h-24 rounded-xl flex items-center justify-center flex-shrink-0",
            isCurrent ? "border-2 border-purple-500/50 bg-black/40" : "border border-white/20 bg-black/30"
          )}
        >
          <Image src={categoryImage} alt={ability.name} width={72} height={72} className="object-contain" unoptimized />
        </div>
        <span
          className={cn(
            "text-[10px] font-medium uppercase tracking-wide opacity-90",
            !isCurrent && "text-muted-foreground"
          )}
          style={isCurrent ? { color: categoryColor } : undefined}
        >
          {ability.category}
        </span>
        <span className="text-base font-bold text-white uppercase tracking-wide">{ability.name}</span>
        <span
          className={cn(
            "text-xs font-semibold",
            isCurrent ? "text-purple-400" : "text-muted-foreground"
          )}
        >
          {grade}
        </span>
        <span className="text-[10px] text-muted-foreground">Max Level {level}</span>
      </div>
      {/* Active / Passive */}
      <div className="px-3 pb-3 space-y-2">
        <div className="rounded border border-white/10 bg-black/30 p-2">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center shrink-0">
                <Image src={categoryImage} alt="" width={16} height={16} className="object-contain" unoptimized />
              </div>
              <span className="text-xs font-semibold text-white truncate">{ability.name}: {grade} Active</span>
            </div>
          </div>
          {getActiveStatsLines(cooldown, activeEffects).map(({ label, value }) => (
            <p key={label} className="text-[10px] text-muted-foreground mb-0.5">
              {label}: {value}
            </p>
          ))}
          <p className="text-[10px] text-foreground leading-snug">
            {renderDescriptionWithHighlights(activeDesc, effectInfo)}
          </p>
        </div>
        <div className="rounded border border-white/10 bg-black/30 p-2">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center shrink-0">
                <Image src={categoryImage} alt="" width={16} height={16} className="object-contain" unoptimized />
              </div>
              <span className="text-xs font-semibold text-white truncate">{ability.name}: {grade} Passive</span>
            </div>
          </div>
          <p className="text-[10px] text-foreground leading-snug">
            {formatPassiveEffects(passiveEffects).map(({ label, value }, i) => (
              <React.Fragment key={i}>
                {i > 0 && ", "}
                {label} <span className="text-green-500">{value}</span>
              </React.Fragment>
            ))}
          </p>
        </div>
      </div>
    </div>
  );
}
