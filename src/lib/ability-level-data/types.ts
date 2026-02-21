/**
 * Shared types for per-level ability stats.
 */

export const STAT_IDS = [
  "AttackPower",
  "AllDamage",
  "DefensePower",
  "MaxHP",
  "AttackSpeed",
  "DamageToNormalMonster",
  "DamageToEliteMonster",
  "DamageToBossMonsters",
  "Range",
  "PhysicalDamage",
  "MovementSpeed",
  "EnduranceIgnore",
] as const;
export type StatId = (typeof STAT_IDS)[number];

export type StatModifier = {
  statId: StatId;
  value: number;
  unit?: "%" | "flat";
};

export type ActiveEffectModifier = StatModifier & { extra?: string };

export const STAT_LABELS: Record<StatId, string> = {
  AttackPower: "Attack Power",
  AllDamage: "All Damage",
  DefensePower: "Defense Power",
  MaxHP: "Max HP",
  AttackSpeed: "Attack Speed",
  DamageToNormalMonster: "Damage to Normal Monster",
  DamageToEliteMonster: "Damage to Elite Monster",
  DamageToBossMonsters: "Damage to Boss Monsters",
  Range: "Range",
  PhysicalDamage: "Damage",
  MovementSpeed: "Movement Speed",
  EnduranceIgnore: "Endurance Ignore",
};

export function getStatLabel(statId: StatId): string {
  return STAT_LABELS[statId];
}

export type LevelData = {
  cooldown: number;
  activeDesc: string;
  passiveEffects: StatModifier[];
  durationSec: number;
  activeEffects: ActiveEffectModifier[];
};

export const LEVELS = [20, 40, 60, 80, 90, 100, 120] as const;
export type LevelKey = (typeof LEVELS)[number];

export function getLevelKey(level: number): LevelKey {
  return (LEVELS as readonly number[]).includes(level) ? (level as LevelKey) : 20;
}
