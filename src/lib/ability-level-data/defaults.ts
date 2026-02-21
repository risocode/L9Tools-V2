/**
 * Default level data (Attack Power / All Damage style). Used as fallback for abilities
 * that don't have custom data yet.
 */

import type { LevelData } from "./types";
import { LEVELS, type LevelKey, getLevelKey } from "./types";

const DEFAULT_LEVEL_DATA: Record<LevelKey, LevelData> = {
  20: {
    cooldown: 40,
    activeDesc: "Increases Attack Power for a short duration.",
    passiveEffects: [{ statId: "AttackPower", value: 10, unit: "flat" }],
    durationSec: 10,
    activeEffects: [{ statId: "AttackPower", value: 20, unit: "flat" }],
  },
  40: {
    cooldown: 38,
    activeDesc: "Increases Attack Power for a short duration.",
    passiveEffects: [{ statId: "AttackPower", value: 15, unit: "flat" }],
    durationSec: 10,
    activeEffects: [{ statId: "AttackPower", value: 35, unit: "flat" }],
  },
  60: {
    cooldown: 36,
    activeDesc: "Increases Attack Power for a short duration.",
    passiveEffects: [{ statId: "AttackPower", value: 20, unit: "flat" }],
    durationSec: 10,
    activeEffects: [{ statId: "AttackPower", value: 50, unit: "flat" }],
  },
  80: {
    cooldown: 34,
    activeDesc: "Increases Attack Power and All Damage for a short duration.",
    passiveEffects: [{ statId: "AttackPower", value: 28, unit: "flat" }],
    durationSec: 10,
    activeEffects: [
      { statId: "AttackPower", value: 100, unit: "flat" },
      { statId: "AllDamage", value: 2, unit: "%" },
    ],
  },
  90: {
    cooldown: 32,
    activeDesc: "Increases Attack Power and All Damage for a short duration.",
    passiveEffects: [{ statId: "AttackPower", value: 39, unit: "flat" }],
    durationSec: 10,
    activeEffects: [
      { statId: "AttackPower", value: 120, unit: "flat" },
      { statId: "AllDamage", value: 3, unit: "%" },
    ],
  },
  100: {
    cooldown: 30,
    activeDesc: "Increases Attack Power and All Damage for a short duration.",
    passiveEffects: [{ statId: "AttackPower", value: 55, unit: "flat" }],
    durationSec: 10,
    activeEffects: [
      { statId: "AttackPower", value: 150, unit: "flat" },
      { statId: "AllDamage", value: 4, unit: "%" },
    ],
  },
  120: {
    cooldown: 30,
    activeDesc: "Increases Attack Power and All Damage for a short duration.",
    passiveEffects: [{ statId: "AttackPower", value: 55, unit: "flat" }],
    durationSec: 10,
    activeEffects: [
      { statId: "AttackPower", value: 150, unit: "flat" },
      { statId: "AllDamage", value: 4, unit: "%" },
    ],
  },
};

export function getDefaultLevelData(level: number): LevelData {
  return DEFAULT_LEVEL_DATA[getLevelKey(level)];
}
