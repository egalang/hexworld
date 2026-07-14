export interface WeaponDefinition {
  id: string;
  name: string;
  description: string;
  cost: number;
  conversionBonus: number;
  durability: number;
  requiredLevel: number;
}

export const WEAPONS: WeaponDefinition[] = [
  {
    id: 'weapon_iron_sword',
    name: 'Iron Sword',
    description: 'Convert 1 extra tile per move.',
    cost: 100,
    conversionBonus: 1,
    durability: 5,
    requiredLevel: 1,
  },
  {
    id: 'weapon_steel_blade',
    name: 'Steel Blade',
    description: 'Convert 2 extra tiles per move.',
    cost: 300,
    conversionBonus: 2,
    durability: 5,
    requiredLevel: 3,
  },
  {
    id: 'weapon_flame_brand',
    name: 'Flame Brand',
    description: 'Convert 3 extra tiles per move.',
    cost: 600,
    conversionBonus: 3,
    durability: 4,
    requiredLevel: 5,
  },
  {
    id: 'weapon_thunder_hammer',
    name: 'Thunder Hammer',
    description: 'Convert 4 extra tiles per move.',
    cost: 1000,
    conversionBonus: 4,
    durability: 3,
    requiredLevel: 7,
  },
];

export function getWeaponById(id: string): WeaponDefinition | undefined {
  return WEAPONS.find(w => w.id === id);
}
