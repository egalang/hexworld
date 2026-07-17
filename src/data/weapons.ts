export interface WeaponDefinition {
  id: string;
  name: string;
  description: string;
  cost: number;
  conversionBonus: number;
  durability: number;
  requiredLevel: number;
  imageUrl?: string;
}

export const WEAPONS: WeaponDefinition[] = [
  {
    id: 'weapon_iron_sword',
    name: 'Coral Sword',
    description: 'Convert 1 extra tile per move.',
    cost: 100,
    conversionBonus: 1,
    durability: 5,
    requiredLevel: 1,
    imageUrl: 'https://cards.scryfall.io/grid/front/1/3/13e81e32-7246-46b9-872e-cde77cedd197.webp?1783906606',
  },
  {
    id: 'weapon_steel_blade',
    name: 'Bronze Sword',
    description: 'Convert 2 extra tiles per move.',
    cost: 300,
    conversionBonus: 2,
    durability: 5,
    requiredLevel: 3,
    imageUrl: 'https://cards.scryfall.io/grid/front/0/b/0b33162d-8d8f-4312-b31e-04ce86e3b914.webp?1783931515',
  },
  {
    id: 'weapon_flame_brand',
    name: 'Buster Sword',
    description: 'Convert 3 extra tiles per move.',
    cost: 600,
    conversionBonus: 3,
    durability: 4,
    requiredLevel: 5,
    imageUrl: 'https://cards.scryfall.io/grid/front/3/7/374d7383-a1a7-4eea-91f7-290180e14cc9.webp?1783906560',
  },
  {
    id: 'weapon_thunder_hammer',
    name: 'Sword of Kaldra',
    description: 'Convert 4 extra tiles per move.',
    cost: 1000,
    conversionBonus: 4,
    durability: 3,
    requiredLevel: 7,
    imageUrl: 'https://cards.scryfall.io/grid/front/3/a/3a665bff-b57a-450c-9310-932b0686a03e.webp?1783944501',
  },
];

export function getWeaponById(id: string): WeaponDefinition | undefined {
  return WEAPONS.find(w => w.id === id);
}
