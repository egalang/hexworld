const INVENTORY_KEY = 'hexworld_inventory';

export interface InventoryData {
  ownedWeapons: string[];
  ownedSkills: string[];
  skillUpgrades: Record<string, number>;
}

function defaultInventory(): InventoryData {
  return { ownedWeapons: [], ownedSkills: [], skillUpgrades: {} };
}

function load(): InventoryData {
  try {
    const raw = localStorage.getItem(INVENTORY_KEY);
    if (!raw) return defaultInventory();
    const d = JSON.parse(raw) as Partial<InventoryData>;
    return {
      ownedWeapons: Array.isArray(d.ownedWeapons) ? d.ownedWeapons : [],
      ownedSkills: Array.isArray(d.ownedSkills) ? d.ownedSkills : [],
      skillUpgrades: (d.skillUpgrades && typeof d.skillUpgrades === 'object') ? d.skillUpgrades : {},
    };
  } catch {
    return defaultInventory();
  }
}

function save(data: InventoryData): void {
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(data));
}

let cached: InventoryData | null = null;

function getData(): InventoryData {
  if (!cached) cached = load();
  return cached;
}

function commit(): void {
  if (cached) save(cached);
}

export function resetInventory(): void {
  localStorage.removeItem(INVENTORY_KEY);
  cached = null;
}

export function ownWeapon(id: string): void {
  const d = getData();
  if (!d.ownedWeapons.includes(id)) {
    d.ownedWeapons.push(id);
    commit();
  }
}

export function ownSkill(id: string): void {
  const d = getData();
  if (!d.ownedSkills.includes(id)) {
    d.ownedSkills.push(id);
    commit();
  }
}

export function isWeaponOwned(id: string): boolean {
  return getData().ownedWeapons.includes(id);
}

export function isSkillOwned(id: string): boolean {
  return getData().ownedSkills.includes(id);
}

export function getOwnedWeapons(): string[] {
  return [...getData().ownedWeapons];
}

export function getOwnedSkills(): string[] {
  return [...getData().ownedSkills];
}

export function removeWeapon(id: string): void {
  const d = getData();
  d.ownedWeapons = d.ownedWeapons.filter(w => w !== id);
  commit();
}

export function removeSkill(id: string): void {
  const d = getData();
  d.ownedSkills = d.ownedSkills.filter(s => s !== id);
  commit();
}

export function getSkillLevel(id: string): number {
  return getData().skillUpgrades[id] ?? 1;
}

export function setUpgradeLevel(id: string, level: number): void {
  const d = getData();
  d.skillUpgrades[id] = level;
  commit();
}
