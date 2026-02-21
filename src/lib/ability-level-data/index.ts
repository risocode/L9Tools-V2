/**
 * Per-level ability stats by category. One file per category under this folder:
 * - combat.ts   → Combat abilities
 * - recon.ts    → Recon (add when you have data)
 * - spell.ts    → Spell (add when you have data)
 * - etc.
 * Replace with backend/API when available.
 */

import type { LevelData } from "./types";
import { getDefaultLevelData } from "./defaults";
import { getCombatLevelData } from "./combat";

const CATEGORY_GETTERS: Record<string, (abilityName: string, level: number) => LevelData> = {
  Combat: getCombatLevelData,
  // Add when you have data: Recon: getReconLevelData, Spell: getSpellLevelData, ...
};

/**
 * Returns level-based stats for an ability. Uses category-specific data when available,
 * otherwise returns default (Attack Power / All Damage style).
 */
export function getLevelData(
  category: string,
  abilityName: string,
  level: number
): LevelData {
  const getter = CATEGORY_GETTERS[category];
  if (getter) {
    return getter(abilityName, level);
  }
  return getDefaultLevelData(level);
}

export type { LevelData, StatId, StatModifier, ActiveEffectModifier } from "./types";
export { LEVELS, getLevelKey, STAT_IDS, STAT_LABELS, getStatLabel } from "./types";
export { formatStatValue, formatStatLine, formatPassiveEffects, getActiveStatsLines } from "./format";
