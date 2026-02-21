/**
 * Format structured stat modifiers for display.
 */

import type { StatModifier, ActiveEffectModifier } from "./types";
import { getStatLabel } from "./types";

export function formatStatValue(mod: StatModifier): string {
  const prefix = mod.value >= 0 ? "+" : "";
  const suffix = mod.unit === "%" ? "%" : "";
  return `${prefix}${mod.value}${suffix}`;
}

export function formatStatLine(mod: ActiveEffectModifier): string {
  const label = getStatLabel(mod.statId);
  const value = formatStatValue(mod);
  return mod.extra ? `${label} ${value} ${mod.extra}` : `${label} ${value}`;
}

export function formatPassiveEffects(
  passiveEffects: StatModifier[]
): Array<{ label: string; value: string }> {
  return passiveEffects.map((mod) => ({
    label: getStatLabel(mod.statId),
    value: formatStatValue(mod),
  }));
}

/** One line for the Active stats block: "Range: 5m", "Cooldown: 45s", "Damage: 125%" */
function formatActiveStatLine(mod: ActiveEffectModifier): { label: string; value: string } {
  const label = getStatLabel(mod.statId);
  const value =
    mod.unit === "%"
      ? `${mod.value}%`
      : mod.extra
        ? `${mod.value}${mod.extra}`
        : String(mod.value);
  return { label, value };
}

/** Only these stats are shown "outside" (main block). All others (Attack Power, All Damage, etc.) are inside the clickable only. */
const OUTSIDE_STATS_ORDER = ["Range", "Cooldown", "Damage"];

export function getActiveStatsLines(
  cooldown: number,
  activeEffects: ActiveEffectModifier[]
): Array<{ label: string; value: string }> {
  const lines: Array<{ label: string; value: string }> = [];
  const fromEffects = activeEffects
    .map(formatActiveStatLine)
    .filter((l) => OUTSIDE_STATS_ORDER.includes(l.label));
  const byLabel = new Map(fromEffects.map((l) => [l.label, l]));
  for (const label of OUTSIDE_STATS_ORDER) {
    if (label === "Cooldown") {
      lines.push({ label: "Cooldown", value: `${cooldown}s` });
    } else {
      const found = byLabel.get(label);
      if (found) {
        lines.push(found);
      }
    }
  }
  return lines;
}
