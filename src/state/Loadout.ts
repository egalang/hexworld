const LOADOUT_KEY = 'hexworld_loadout';

export interface LoadoutData {
  equippedWeapon: string | null;
  equippedSkills: string[];
}

function defaultLoadout(): LoadoutData {
  return { equippedWeapon: null, equippedSkills: [] };
}

function load(): LoadoutData {
  try {
    const raw = localStorage.getItem(LOADOUT_KEY);
    if (!raw) return defaultLoadout();
    const d = JSON.parse(raw) as Partial<LoadoutData>;
    return {
      equippedWeapon: typeof d.equippedWeapon === 'string' ? d.equippedWeapon : null,
      equippedSkills: Array.isArray(d.equippedSkills) ? d.equippedSkills.slice(0, 2) : [],
    };
  } catch {
    return defaultLoadout();
  }
}

function save(data: LoadoutData): void {
  localStorage.setItem(LOADOUT_KEY, JSON.stringify(data));
}

let cached: LoadoutData | null = null;

function getData(): LoadoutData {
  if (!cached) cached = load();
  return cached;
}

function commit(): void {
  if (cached) save(cached);
}

export function getEquippedWeapon(): string | null {
  return getData().equippedWeapon;
}

export function equipWeapon(id: string | null): void {
  const d = getData();
  d.equippedWeapon = id;
  commit();
}

export function getEquippedSkills(): string[] {
  return [...getData().equippedSkills];
}

export function equipSkill(id: string): boolean {
  const d = getData();
  if (d.equippedSkills.length >= 2) return false;
  if (d.equippedSkills.includes(id)) return false;
  d.equippedSkills.push(id);
  commit();
  return true;
}

export function unequipSkill(id: string): void {
  const d = getData();
  d.equippedSkills = d.equippedSkills.filter(s => s !== id);
  commit();
}

export function isSkillEquipped(id: string): boolean {
  return getData().equippedSkills.includes(id);
}

export function isWeaponEquipped(): boolean {
  return getData().equippedWeapon !== null;
}

export function resetLoadout(): void {
  localStorage.removeItem(LOADOUT_KEY);
  cached = null;
}
