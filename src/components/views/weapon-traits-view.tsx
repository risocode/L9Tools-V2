"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Swords,
  Shield,
  Target,
  Crosshair,
  Zap,
  Coins,
  Info,
  ChevronUp,
} from "lucide-react";
import { getBowTraitsState } from "@/lib/weapon-traits-data";
import type { WeaponAbility, TraitNode, TraitNodeBranch } from "@/lib/weapon-traits-data";

const BRANCH_COLORS: Record<TraitNodeBranch, string> = {
  red: "bg-red-600/80 border-red-400/50",
  blue: "bg-blue-600/80 border-blue-400/50",
  yellow: "bg-amber-500/80 border-amber-400/50",
};

function AbilityIcon({ type }: { type: WeaponAbility["iconType"] }) {
  const className = "h-4 w-4 text-white/80 shrink-0";
  switch (type) {
    case "arrow":
      return <Zap className={className} />;
    case "target":
      return <Target className={className} />;
    case "shield":
      return <Shield className={className} />;
    case "sword":
      return <Swords className={className} />;
    case "bow":
      return <Crosshair className={className} />;
    default:
      return <Crosshair className={className} />;
  }
}

function NodeIcon({ type }: { type: TraitNode["iconType"] }) {
  const className = "h-4 w-4 text-white/90";
  switch (type) {
    case "root":
      return <Zap className={className} />;
    case "arrow":
      return <Zap className={className} />;
    case "shield":
      return <Shield className={className} />;
    case "sword":
      return <Swords className={className} />;
    case "target":
      return <Target className={className} />;
    default:
      return <Zap className={className} />;
  }
}

function DiamondLevel({ level, progress }: { level: number; progress: number }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-muted-foreground">Level</span>
      <div className="relative flex items-center justify-center w-10 h-10 shrink-0">
        <div className="absolute inset-0 rotate-45 rounded-sm bg-emerald-600/90 border border-emerald-400/60 shadow-inner" />
        <span className="relative text-sm font-bold text-white -rotate-45">{level}</span>
      </div>
      <span className="text-sm font-medium text-emerald-400">{progress.toFixed(2)}%</span>
    </div>
  );
}

export function WeaponTraitsView() {
  const [selectedAbilityId, setSelectedAbilityId] = useState<string>("5");
  const state = useMemo(() => getBowTraitsState(), []);

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Top header: weapon name */}
      <div className="shrink-0 px-4 pt-2 pb-1 text-center border-b border-white/10">
        <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-wide uppercase">
          {state.weaponName}
        </h1>
        <div className="mt-1 h-px w-24 mx-auto bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
      </div>

      {/* Main: left | tree | right */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-3 p-3 md:p-4">
        {/* Left panel */}
        <Card className="shrink-0 w-full lg:w-64 xl:w-72 flex flex-col bg-black/70 border border-white/10 overflow-hidden">
          <div className="p-3 space-y-3 border-b border-white/10">
            <DiamondLevel level={state.level} progress={state.levelProgressPercent} />
            <div>
              <p className="text-xs text-muted-foreground">Remaining Trait Points</p>
              <p className="text-lg font-semibold text-emerald-400">{state.remainingTraitPoints}</p>
            </div>
          </div>
          <ScrollArea className="flex-1 min-h-[180px]">
            <div className="p-2 space-y-0.5">
              {state.abilities.map((ability) => (
                <button
                  key={ability.id}
                  type="button"
                  onClick={() => setSelectedAbilityId(ability.id)}
                  className={cn(
                    "w-full flex items-center gap-1.5 px-2 py-2 rounded-md text-left transition-colors",
                    selectedAbilityId === ability.id
                      ? "bg-amber-500/20 border border-amber-500/50"
                      : "hover:bg-white/5 border border-transparent"
                  )}
                >
                  {/* Left resource column */}
                  <div className="flex flex-col items-center shrink-0 w-6 text-[10px] text-muted-foreground">
                    <AbilityIcon type={ability.iconType} />
                    {ability.resourceValue != null && (
                      <span className="flex items-center gap-0.5">
                        {ability.resourceValue}
                        {ability.costLabel && (
                          <span className="text-[9px] opacity-80">{ability.costLabel}</span>
                        )}
                      </span>
                    )}
                  </div>
                  <div className="w-8 h-8 rounded flex items-center justify-center bg-white/10 shrink-0">
                    <AbilityIcon type={ability.iconType} />
                  </div>
                  <span className="flex-1 min-w-0 text-xs text-white/90 truncate">{ability.name}</span>
                  <span className="text-xs font-medium text-emerald-400 shrink-0">{ability.level}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </Card>

        {/* Center: trait tree */}
        <div className="flex-1 min-w-0 flex items-center justify-center bg-black/40 rounded-lg border border-white/10 relative overflow-hidden">
          {/* Subtle pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `radial-gradient(circle at 50% 50%, white 1px, transparent 1px)`,
              backgroundSize: "24px 24px",
            }}
          />
          <TraitTree nodes={state.treeNodes} />
        </div>

        {/* Right panel: effects applied */}
        <Card className="shrink-0 w-full lg:w-56 xl:w-64 flex flex-col bg-black/70 border border-white/10 overflow-hidden">
          <div className="p-3 border-b border-white/10">
            <h3 className="text-sm font-semibold text-primary">See Effects Applied</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Traits Effect</p>
          </div>
          <ScrollArea className="flex-1 min-h-[120px]">
            <ul className="p-3 space-y-2">
              {state.effectsApplied.map((effect, i) => (
                <li key={i} className="flex items-baseline justify-between gap-2 text-xs">
                  <span className="text-muted-foreground">{effect.statName}</span>
                  <span className="text-emerald-400 font-medium shrink-0">{effect.value}</span>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </Card>
      </div>

      {/* Bottom bar: reset buttons */}
      <div className="shrink-0 flex items-center justify-center gap-4 p-3 border-t border-white/10 bg-black/30">
        <Button
          variant="outline"
          className="border-2 border-amber-700/60 bg-black/60 text-white hover:bg-amber-500/20 hover:border-amber-500/50 min-w-[140px]"
        >
          <div className="flex flex-col items-center py-1">
            <span className="text-sm font-medium">Reset All</span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Coins className="h-3.5 w-3.5 text-amber-500" />
              {state.resetAllCost.toLocaleString()}
            </span>
          </div>
        </Button>
        <Button
          variant="outline"
          className="border-2 border-amber-700/60 bg-black/60 text-white hover:bg-amber-500/20 hover:border-amber-500/50 min-w-[140px]"
        >
          <div className="flex flex-col items-center py-1">
            <span className="text-sm font-medium">Reset Skill</span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Coins className="h-3.5 w-3.5 text-amber-500" />
              {state.resetSkillCost.toLocaleString()}
            </span>
          </div>
        </Button>
        <button
          type="button"
          className="w-9 h-9 rounded-full border-2 border-amber-700/60 bg-black/60 flex items-center justify-center text-white hover:bg-amber-500/20 hover:border-amber-500/50"
          aria-label="Information"
        >
          <div className="flex flex-col items-center -mt-0.5">
            <ChevronUp className="h-3 w-3" />
            <Info className="h-3.5 w-3.5" />
          </div>
        </button>
      </div>
    </div>
  );
}

function TraitTree({ nodes }: { nodes: TraitNode[] }) {
  const root = nodes.find((n) => n.layer === 0);
  const layer1 = nodes.filter((n) => n.layer === 1);
  const layer2 = nodes.filter((n) => n.layer === 2);
  const layer3 = nodes.filter((n) => n.layer === 3);

  const DiamondNode = ({
    node,
    size = "md",
  }: {
    node: TraitNode;
    size?: "sm" | "md";
  }) => (
    <div className="flex flex-col items-center gap-0.5">
      <div
        className={cn(
          "flex items-center justify-center shrink-0 border rotate-45",
          node.layer === 0
            ? "w-10 h-10 bg-white/20 border-white/30"
            : cn(
                size === "sm" ? "w-8 h-8" : "w-9 h-9",
                "border-2",
                BRANCH_COLORS[node.branch]
              )
        )}
      >
        <span className="-rotate-45">
          <NodeIcon type={node.iconType} />
        </span>
      </div>
      {node.pointCost > 0 && (
        <span className="text-[10px] text-muted-foreground">{node.pointCost}p</span>
      )}
    </div>
  );

  return (
    <div className="relative w-full max-w-2xl mx-auto py-6 flex flex-col items-center gap-4">
      {/* SVG connector lines (behind nodes) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        preserveAspectRatio="none"
      >
        <line x1="50%" y1="12%" x2="22%" y2="28%" stroke="rgba(239,68,68,0.4)" strokeWidth="1" />
        <line x1="50%" y1="12%" x2="50%" y2="28%" stroke="rgba(59,130,246,0.4)" strokeWidth="1" />
        <line x1="50%" y1="12%" x2="78%" y2="28%" stroke="rgba(245,158,11,0.4)" strokeWidth="1" />
        <line x1="22%" y1="44%" x2="22%" y2="60%" stroke="rgba(239,68,68,0.35)" strokeWidth="1" />
        <line x1="50%" y1="44%" x2="50%" y2="60%" stroke="rgba(59,130,246,0.35)" strokeWidth="1" />
        <line x1="78%" y1="44%" x2="78%" y2="60%" stroke="rgba(245,158,11,0.35)" strokeWidth="1" />
        <line x1="22%" y1="60%" x2="15%" y2="78%" stroke="rgba(239,68,68,0.3)" strokeWidth="1" />
        <line x1="22%" y1="60%" x2="29%" y2="78%" stroke="rgba(239,68,68,0.3)" strokeWidth="1" />
        <line x1="50%" y1="60%" x2="43%" y2="78%" stroke="rgba(59,130,246,0.3)" strokeWidth="1" />
        <line x1="50%" y1="60%" x2="57%" y2="78%" stroke="rgba(59,130,246,0.3)" strokeWidth="1" />
        <line x1="78%" y1="60%" x2="71%" y2="78%" stroke="rgba(245,158,11,0.3)" strokeWidth="1" />
        <line x1="78%" y1="60%" x2="85%" y2="78%" stroke="rgba(245,158,11,0.3)" strokeWidth="1" />
      </svg>
      <div className="relative z-10 flex flex-col items-center gap-4">
      {/* Layer 0: root */}
      {root && <DiamondNode node={root} size="md" />}

      {/* Layer 1: 3 nodes */}
      <div className="flex justify-center gap-8 md:gap-12">
        {layer1.map((node) => (
          <DiamondNode key={node.id} node={node} />
        ))}
      </div>

      {/* Layer 2: 3 nodes */}
      <div className="flex justify-center gap-8 md:gap-12">
        {layer2.map((node) => (
          <DiamondNode key={node.id} node={node} />
        ))}
      </div>

      {/* Layer 3: 6 nodes (2 per branch) */}
      <div className="flex justify-center gap-4 md:gap-8">
        {["red", "blue", "yellow"].map((branch) => (
          <div key={branch} className="flex gap-4">
            {layer3
              .filter((n) => n.branch === branch)
              .map((node) => (
                <DiamondNode key={node.id} node={node} size="sm" />
              ))}
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}
