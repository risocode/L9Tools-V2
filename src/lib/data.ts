import type { Skill } from "@/components/skills/skill-node";

export const mainQuests = [
  {
    id: 'mq1',
    title: 'The Shadow Conspiracy',
    description: 'Uncover the mysterious cult operating in the capital city.',
    objectives: [
      { id: 'mq1-1', text: 'Investigate the sewers', completed: true },
      { id: 'mq1-2', text: 'Find the cultist\'s hideout', completed: false },
      { id: 'mq1-3', text: 'Defeat the cult leader', completed: false },
    ],
  },
  {
    id: 'mq2',
    title: 'Aegis of the Ancients',
    description: 'Reassemble the legendary shield to protect the realm.',
    objectives: [
      { id: 'mq2-1', text: 'Collect the first fragment from the Dragon\'s Peak', completed: true },
      { id: 'mq2-2', text: 'Collect the second fragment from the Sunken City', completed: true },
      { id: 'mq2-3', text: 'Collect the final fragment from the Lich King\'s crypt', completed: false },
      { id: 'mq2-4', text: 'Forge the Aegis at the Sky-Forge', completed: false },
    ],
  },
];

export const sideQuests = [
  {
    id: 'sq1',
    title: 'The Lost Caravan',
    description: 'Find the merchant\'s caravan that went missing in the Whispering Woods.',
    objectives: [
      { id: 'sq1-1', text: 'Locate the caravan wreckage', completed: false },
      { id: 'sq1-2', text: 'Retrieve the merchant\'s goods', completed: false },
    ],
  },
];

export const sampleItems = [
    { id: 'item1', name: 'Blade of the Archon', type: 'Sword', rarity: 'Legendary', level: 60 },
    { id: 'item2', name: 'Dragonscale Helm', type: 'Helm', rarity: 'Epic', level: 58 },
    { id: 'item3', name: 'Shadowstep Legguards', type: 'Legs', rarity: 'Epic', level: 58 },
    { id: 'item4', name: 'Greater Healing Potion', type: 'Consumable', rarity: 'Rare', level: 50 },
    { id: 'item5', name: 'Goblin-forged Dagger', type: 'Dagger', rarity: 'Common', level: 15 },
];

export const warriorSkills: Skill[] = [
    { id: 'w1', name: 'Mighty Swing', description: 'A powerful basic attack.', icon: 'swords', maxLevel: 5, tier: 1 },
    { id: 'w2', name: 'Shield Block', description: 'Increase block chance for a short duration.', icon: 'shield', maxLevel: 3, tier: 1 },
    { id: 'w3', name: 'Charge', description: 'Charge at an enemy, stunning them.', icon: 'swords', maxLevel: 1, tier: 2, dependencies: ['w1'] },
    { id: 'w4', name: 'Toughness', description: 'Passively increases maximum health.', icon: 'shield', maxLevel: 5, tier: 2, dependencies: ['w2'] },
    { id: 'w5', name: 'Whirlwind', description: 'Attack all nearby enemies in a spinning motion.', icon: 'swords', maxLevel: 5, tier: 3, dependencies: ['w3'] },
    { id: 'w6', name: 'Last Stand', description: 'Temporarily gain a massive amount of health.', icon: 'shield', maxLevel: 1, tier: 4, dependencies: ['w4', 'w5'] },
];

export const mageSkills: Skill[] = [
    { id: 'm1', name: 'Firebolt', description: 'Hurl a bolt of fire at an enemy.', icon: 'sparkles', maxLevel: 5, tier: 1 },
    { id: 'm2', name: 'Ice Armor', description: 'Cover yourself in frost, increasing armor.', icon: 'shield', maxLevel: 3, tier: 1 },
    { id: 'm3', name: 'Blink', description: 'Teleport a short distance.', icon: 'sparkles', maxLevel: 1, tier: 2, dependencies: ['m1'] },
    { id: 'm4', name: 'Arcane Intellect', description: 'Passively increases maximum mana.', icon: 'sparkles', maxLevel: 5, tier: 2, dependencies: ['m2'] },
    { id: 'm5', name: 'Meteor', description: 'Summon a meteor from the sky.', icon: 'sparkles', maxLevel: 5, tier: 3, dependencies: ['m3'] },
    { id: 'm6', name: 'Time Warp', description: 'Increase haste for all party members.', icon: 'sparkles', maxLevel: 1, tier: 4, dependencies: ['m4', 'm5'] },
];

export const rogueSkills: Skill[] = [
    { id: 'r1', name: 'Sinister Strike', description: 'A vicious strike that generates combo points.', icon: 'swords', maxLevel: 5, tier: 1 },
    { id: 'r2', name: 'Stealth', description: 'Enter stealth, making you invisible to most enemies.', icon: 'shield', maxLevel: 1, tier: 1 },
    { id: 'r3', name: 'Eviscerate', description: 'A powerful finishing move that consumes combo points.', icon: 'swords', maxLevel: 5, tier: 2, dependencies: ['r1'] },
    { id: 'r4', name: 'Fleet Footed', description: 'Passively increases movement speed.', icon: 'shield', maxLevel: 3, tier: 2, dependencies: ['r2'] },
    { id: 'r5', name: 'Shadow Dance', description: 'Allows use of stealth abilities while not in stealth.', icon: 'swords', maxLevel: 1, tier: 3, dependencies: ['r3', 'r4'] },
    { id: 'r6', name: 'Cloak of Shadows', description: 'Instantly removes all harmful spell effects.', icon: 'shield', maxLevel: 1, tier: 4, dependencies: ['r5'] },
];
