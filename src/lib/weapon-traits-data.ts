/**
 * Weapon traits screen data – weapon info, abilities, trait tree, effects.
 * Replace with API later.
 */

export type WeaponAbility = {
  id: string;
  name: string;
  level: number;
  iconType: 'arrow' | 'target' | 'shield' | 'sword' | 'bow' | 'star';
  costLabel?: string;
  /** Small number shown in left resource column (e.g. 73, 52) */
  resourceValue?: number;
};

export type TraitNodeBranch = 'red' | 'blue' | 'yellow';

export type TraitNode = {
  id: string;
  branch: TraitNodeBranch;
  layer: number; // 0 = root, 1 = first row, etc.
  indexInLayer: number;
  pointCost: number;
  iconType: 'root' | 'arrow' | 'shield' | 'sword' | 'target';
};

export type TraitEffect = {
  statName: string;
  value: string; // e.g. "+10", "+1%"
};

export type WeaponTraitsState = {
  weaponName: string;
  level: number;
  levelProgressPercent: number;
  remainingTraitPoints: number;
  abilities: WeaponAbility[];
  treeNodes: TraitNode[];
  effectsApplied: TraitEffect[];
  resetAllCost: number;
  resetSkillCost: number;
};

const BOW_ABILITIES: WeaponAbility[] = [
  { id: '1', name: 'Strong Shot: Enhance', level: 1, iconType: 'arrow', resourceValue: 42 },
  { id: '2', name: 'Consecutive Shot: Blow', level: 7, iconType: 'arrow', resourceValue: 1 },
  { id: '3', name: 'Snipe: Sharpshooter+', level: 13, iconType: 'target', resourceValue: 40 },
  { id: '4', name: 'Arrow Rain: Enhance', level: 2, iconType: 'arrow', resourceValue: 1 },
  { id: '5', name: 'Archery: Rapid Fire+', level: 12, iconType: 'bow', costLabel: 'E', resourceValue: 73 },
  { id: '6', name: 'Bow Mastery', level: 52, iconType: 'bow', costLabel: 'E', resourceValue: 52 },
];

const TREE_NODES: TraitNode[] = [
  { id: 'root', branch: 'red', layer: 0, indexInLayer: 0, pointCost: 0, iconType: 'root' },
  { id: 'r1', branch: 'red', layer: 1, indexInLayer: 0, pointCost: 1, iconType: 'arrow' },
  { id: 'b1', branch: 'blue', layer: 1, indexInLayer: 1, pointCost: 1, iconType: 'shield' },
  { id: 'y1', branch: 'yellow', layer: 1, indexInLayer: 2, pointCost: 1, iconType: 'target' },
  { id: 'r2', branch: 'red', layer: 2, indexInLayer: 0, pointCost: 1, iconType: 'sword' },
  { id: 'b2', branch: 'blue', layer: 2, indexInLayer: 1, pointCost: 1, iconType: 'shield' },
  { id: 'y2', branch: 'yellow', layer: 2, indexInLayer: 2, pointCost: 1, iconType: 'target' },
  { id: 'r3a', branch: 'red', layer: 3, indexInLayer: 0, pointCost: 1, iconType: 'sword' },
  { id: 'r3b', branch: 'red', layer: 3, indexInLayer: 1, pointCost: 1, iconType: 'sword' },
  { id: 'b3a', branch: 'blue', layer: 3, indexInLayer: 0, pointCost: 1, iconType: 'shield' },
  { id: 'b3b', branch: 'blue', layer: 3, indexInLayer: 1, pointCost: 1, iconType: 'shield' },
  { id: 'y3a', branch: 'yellow', layer: 3, indexInLayer: 0, pointCost: 1, iconType: 'target' },
  { id: 'y3b', branch: 'yellow', layer: 3, indexInLayer: 1, pointCost: 1, iconType: 'target' },
];

const EFFECTS_APPLIED: TraitEffect[] = [
  { statName: 'Ranged Critical Hit', value: '+10' },
  { statName: 'Attack Speed', value: '+1%' },
  { statName: 'MP Recovery in Battle', value: '+9' },
  { statName: 'Ranged Defense Penetration', value: '+16' },
];

export function getBowTraitsState(): WeaponTraitsState {
  return {
    weaponName: 'Bow',
    level: 73,
    levelProgressPercent: 38.69,
    remainingTraitPoints: 3,
    abilities: BOW_ABILITIES,
    treeNodes: TREE_NODES,
    effectsApplied: EFFECTS_APPLIED,
    resetAllCost: 183_000,
    resetSkillCost: 3_000,
  };
}
