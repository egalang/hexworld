export type SkillType = 'kick' | 'blink' | 'freeze' | 'teleport' | 'hex';

export function getRequiredLevelForLevel(def: SkillDefinition, level: number): number {
  return def.requiredLevel + (level - 1) * (def.upgradeLevelReq ?? 0);
}

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  cost: number;
  requiredLevel: number;
  type: SkillType;
  maxLevel?: number;
  upgradeCost?: number;
  upgradeLevelReq?: number;
}

export const SKILLS: SkillDefinition[] = [
  {
    id: 'skill_freeze',
    name: 'Freeze',
    description: 'Freeze opponent piece(s) so they cannot be moved while owned by opponent. Freeze ends if the piece is converted.',
    cost: 250,
    requiredLevel: 1,
    type: 'freeze',
    maxLevel: 3,
    upgradeCost: 150,
    upgradeLevelReq: 1,
  },
  {
    id: 'skill_hex',
    name: 'Hex',
    description: 'Mark a vacant tile — only you can ever occupy it this battle.',
    cost: 150,
    requiredLevel: 2,
    type: 'hex',
    maxLevel: 3,
    upgradeCost: 150,
    upgradeLevelReq: 1,
  },
  {
    id: 'skill_kick',
    name: 'Kick',
    description: 'Kick an opponent to the nearest empty tile, then move in with normal conversion.',
    cost: 350,
    requiredLevel: 4,
    type: 'kick',
  },
  {
    id: 'skill_blink',
    name: 'Blink',
    description: 'Swap positions with an opponent piece one tile away. Normal conversion applies.',
    cost: 500,
    requiredLevel: 5,
    type: 'blink',
  },
  {
    id: 'skill_teleport',
    name: 'Teleport',
    description: 'Swap positions with any opponent piece anywhere on the board. Normal conversion applies.',
    cost: 650,
    requiredLevel: 6,
    type: 'teleport',
  },
];

export function getSkillById(id: string): SkillDefinition | undefined {
  return SKILLS.find(s => s.id === id);
}
