/**
 * Combat ability level data. One file per category – add or edit abilities here.
 * Polish Weapon, Hunting Strategy have full data; others fall back to default until filled in.
 */

import type { LevelData } from "./types";
import { type LevelKey, getLevelKey } from "./types";
import { getDefaultLevelData } from "./defaults";

/** Hunting Strategy – in-game text: Damage to Monsters (5 sec, stacks 5×), Defense Power */
const HUNTING_STRATEGY_ACTIVE_DESC =
  "Increases attacks' Damage to Monsters for 5 sec. Stacks up to 5 times. The effect lasts even when the skill duration ends.";

const HUNTING_STRATEGY: Record<LevelKey, LevelData> = {
  20: {
    cooldown: 40,
    activeDesc: HUNTING_STRATEGY_ACTIVE_DESC,
    passiveEffects: [{ statId: "DefensePower", value: 15, unit: "flat" }],
    durationSec: 5,
    activeEffects: [{ statId: "DamageToNormalMonster", value: 1, unit: "%" }],
  },
  40: {
    cooldown: 42,
    activeDesc: HUNTING_STRATEGY_ACTIVE_DESC,
    passiveEffects: [{ statId: "DefensePower", value: 25, unit: "flat" }],
    durationSec: 5,
    activeEffects: [
      { statId: "DamageToNormalMonster", value: 1.5, unit: "%" },
      { statId: "DamageToEliteMonster", value: 1, unit: "%" },
    ],
  },
  60: {
    cooldown: 44,
    activeDesc: HUNTING_STRATEGY_ACTIVE_DESC,
    passiveEffects: [{ statId: "DefensePower", value: 35, unit: "flat" }],
    durationSec: 5,
    activeEffects: [
      { statId: "DamageToNormalMonster", value: 2, unit: "%" },
      { statId: "DamageToEliteMonster", value: 1.5, unit: "%" },
    ],
  },
  80: {
    cooldown: 46,
    activeDesc: HUNTING_STRATEGY_ACTIVE_DESC,
    passiveEffects: [{ statId: "DefensePower", value: 47, unit: "flat" }],
    durationSec: 5,
    activeEffects: [
      { statId: "DamageToNormalMonster", value: 3, unit: "%" },
      { statId: "DamageToEliteMonster", value: 2, unit: "%" },
    ],
  },
  90: {
    cooldown: 48,
    activeDesc: HUNTING_STRATEGY_ACTIVE_DESC,
    passiveEffects: [{ statId: "DefensePower", value: 63, unit: "flat" }],
    durationSec: 5,
    activeEffects: [
      { statId: "DamageToNormalMonster", value: 4, unit: "%" },
      { statId: "DamageToEliteMonster", value: 2.5, unit: "%" },
      { statId: "DamageToBossMonsters", value: 0.5, unit: "%" },
    ],
  },
  100: {
    cooldown: 50,
    activeDesc: HUNTING_STRATEGY_ACTIVE_DESC,
    passiveEffects: [{ statId: "DefensePower", value: 87, unit: "flat" }],
    durationSec: 5,
    activeEffects: [
      { statId: "DamageToNormalMonster", value: 5, unit: "%" },
      { statId: "DamageToEliteMonster", value: 2.5, unit: "%" },
      { statId: "DamageToBossMonsters", value: 1, unit: "%" },
    ],
  },
  120: {
    cooldown: 50,
    activeDesc: HUNTING_STRATEGY_ACTIVE_DESC,
    passiveEffects: [{ statId: "DefensePower", value: 87, unit: "flat" }],
    durationSec: 5,
    activeEffects: [
      { statId: "DamageToNormalMonster", value: 5, unit: "%" },
      { statId: "DamageToEliteMonster", value: 2.5, unit: "%" },
      { statId: "DamageToBossMonsters", value: 1, unit: "%" },
    ],
  },
};

/** Polish Weapon – Attack Power / All Damage style */
const POLISH_WEAPON: Record<LevelKey, LevelData> = {
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

/** Wild Dance – table: Cooldown 52s, Attack Speed 10% (N attacks), All Damage at 80+, Max HP passive */
const WILD_DANCE: Record<LevelKey, LevelData> = {
  20: {
    cooldown: 52,
    activeDesc: "When attacking, increases Attack Speed for 15 attacks.",
    passiveEffects: [{ statId: "MaxHP", value: 250, unit: "flat" }],
    durationSec: 0,
    activeEffects: [{ statId: "AttackSpeed", value: 10, unit: "%" }],
  },
  40: {
    cooldown: 52,
    activeDesc: "When attacking, increases Attack Speed for 20 attacks.",
    passiveEffects: [{ statId: "MaxHP", value: 400, unit: "flat" }],
    durationSec: 0,
    activeEffects: [{ statId: "AttackSpeed", value: 10, unit: "%"}],
  },
  60: {
    cooldown: 52,
    activeDesc: "When attacking, increases Attack Speed for 25 attacks.",
    passiveEffects: [{ statId: "MaxHP", value: 550, unit: "flat" }],
    durationSec: 0,
    activeEffects: [{ statId: "AttackSpeed", value: 10, unit: "%",}],
  },
  80: {
    cooldown: 52,
    activeDesc: "When attacking, increases Attack Speed for 30 attacks. Also increases All Damage.",
    passiveEffects: [{ statId: "MaxHP", value: 800, unit: "flat" }],
    durationSec: 0,
    activeEffects: [
      { statId: "AttackSpeed", value: 10, unit: "%"},
      { statId: "AllDamage", value: 2, unit: "%" },
    ],
  },
  90: {
    cooldown: 52,
    activeDesc: "When attacking, increases Attack Speed for 40 attacks. Also increases All Damage.",
    passiveEffects: [{ statId: "MaxHP", value: 1200, unit: "flat" }],
    durationSec: 0,
    activeEffects: [
      { statId: "AttackSpeed", value: 10, unit: "%"},
      { statId: "AllDamage", value: 4, unit: "%" },
    ],
  },
  100: {
    cooldown: 52,
    activeDesc: "When attacking, increases Attack Speed for 50 attacks. Also increases All Damage.",
    passiveEffects: [{ statId: "MaxHP", value: 1800, unit: "flat" }],
    durationSec: 0,
    activeEffects: [
      { statId: "AttackSpeed", value: 10, unit: "%"},
      { statId: "AllDamage", value: 6, unit: "%" },
    ],
  },
  120: {
    cooldown: 52,
    activeDesc: "When attacking, increases Attack Speed for 50 attacks. Also increases All Damage.",
    passiveEffects: [{ statId: "MaxHP", value: 1800, unit: "flat" }],
    durationSec: 0,
    activeEffects: [
      { statId: "AttackSpeed", value: 10, unit: "%"},
      { statId: "AllDamage", value: 6, unit: "%" },
    ],
  },
};

/** Earth Shock – table: Range 5, Cooldown 45s, Damage 125–150%, Movement Speed -30 to -55%, Endurance Ignore passive */
const EARTH_SHOCK_ACTIVE_DESC =
  "Deals Physical Damage to targets within the fan-shaped range before the caster and significantly reduces their Movement Speed. (Up to 5 targets)";

const EARTH_SHOCK: Record<LevelKey, LevelData> = {
  20: {
    cooldown: 45,
    activeDesc: EARTH_SHOCK_ACTIVE_DESC,
    passiveEffects: [{ statId: "EnduranceIgnore", value: 10, unit: "flat" }],
    durationSec: 0,
    activeEffects: [
      { statId: "Range", value: 5, unit: "flat", extra: "m" },
      { statId: "PhysicalDamage", value: 125, unit: "%" },
      { statId: "MovementSpeed", value: -30, unit: "%" },
    ],
  },
  40: {
    cooldown: 45,
    activeDesc: EARTH_SHOCK_ACTIVE_DESC,
    passiveEffects: [{ statId: "EnduranceIgnore", value: 15, unit: "flat" }],
    durationSec: 0,
    activeEffects: [
      { statId: "Range", value: 5, unit: "flat", extra: "m" },
      { statId: "PhysicalDamage", value: 130, unit: "%" },
      { statId: "MovementSpeed", value: -35, unit: "%" },
    ],
  },
  60: {
    cooldown: 45,
    activeDesc: EARTH_SHOCK_ACTIVE_DESC,
    passiveEffects: [{ statId: "EnduranceIgnore", value: 20, unit: "flat" }],
    durationSec: 0,
    activeEffects: [
      { statId: "Range", value: 5, unit: "flat", extra: "m" },
      { statId: "PhysicalDamage", value: 135, unit: "%" },
      { statId: "MovementSpeed", value: -40, unit: "%" },
    ],
  },
  80: {
    cooldown: 45,
    activeDesc: EARTH_SHOCK_ACTIVE_DESC,
    passiveEffects: [{ statId: "EnduranceIgnore", value: 28, unit: "flat" }],
    durationSec: 0,
    activeEffects: [
      { statId: "Range", value: 5, unit: "flat", extra: "m" },
      { statId: "PhysicalDamage", value: 140, unit: "%" },
      { statId: "MovementSpeed", value: -45, unit: "%" },
    ],
  },
  90: {
    cooldown: 45,
    activeDesc: EARTH_SHOCK_ACTIVE_DESC,
    passiveEffects: [{ statId: "EnduranceIgnore", value: 39, unit: "flat" }],
    durationSec: 0,
    activeEffects: [
      { statId: "Range", value: 5, unit: "flat", extra: "m" },
      { statId: "PhysicalDamage", value: 145, unit: "%" },
      { statId: "MovementSpeed", value: -50, unit: "%" },
    ],
  },
  100: {
    cooldown: 45,
    activeDesc: EARTH_SHOCK_ACTIVE_DESC,
    passiveEffects: [{ statId: "EnduranceIgnore", value: 55, unit: "flat" }],
    durationSec: 0,
    activeEffects: [
      { statId: "Range", value: 5, unit: "flat", extra: "m" },
      { statId: "PhysicalDamage", value: 150, unit: "%" },
      { statId: "MovementSpeed", value: -55, unit: "%" },
    ],
  },
  120: {
    cooldown: 45,
    activeDesc: EARTH_SHOCK_ACTIVE_DESC,
    passiveEffects: [{ statId: "EnduranceIgnore", value: 55, unit: "flat" }],
    durationSec: 0,
    activeEffects: [
      { statId: "Range", value: 5, unit: "flat", extra: "m" },
      { statId: "PhysicalDamage", value: 150, unit: "%" },
      { statId: "MovementSpeed", value: -55, unit: "%" },
    ],
  },
};

/** All Combat abilities: add new entries here with full level data when available */
const COMBAT_DATA: Record<string, Record<LevelKey, LevelData>> = {
  "Polish Weapon": POLISH_WEAPON,
  "Hunting Strategy": HUNTING_STRATEGY,
  "Wild Dance": WILD_DANCE,
  "Earth Shock": EARTH_SHOCK,
  // Terreno's Power, Disarm, Chase – use default until data is added
};

export function getCombatLevelData(abilityName: string, level: number): LevelData {
  const key = getLevelKey(level);
  const abilityData = COMBAT_DATA[abilityName];
  if (abilityData?.[key]) {
    return abilityData[key];
  }
  return getDefaultLevelData(level);
}
