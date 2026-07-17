import { getLevel } from '../state/PlayerProfile';
import { getEquippedWeapon, equipWeapon } from '../state/Loadout';
import { isWeaponOwned, ownWeapon, setWeaponDurability } from '../state/Inventory';
import { getWeaponById, WeaponDefinition } from '../data/weapons';
import { EconomyManager } from './EconomyManager';

export class WeaponManager {
  static getEquipped(): WeaponDefinition | null {
    const id = getEquippedWeapon();
    if (!id) return null;
    return getWeaponById(id) ?? null;
  }

  static getConversionBonus(): number {
    const w = WeaponManager.getEquipped();
    return w?.conversionBonus ?? 0;
  }

  static isOwned(id: string): boolean {
    return isWeaponOwned(id);
  }

  static isEquipped(id: string): boolean {
    return getEquippedWeapon() === id;
  }

  static canBuy(id: string): { allowed: boolean; reason?: string } {
    const def = getWeaponById(id);
    if (!def) return { allowed: false, reason: 'Unknown weapon.' };
    if (isWeaponOwned(id)) return { allowed: false, reason: 'Already owned.' };
    if (getLevel() < def.requiredLevel) return { allowed: false, reason: `Requires level ${def.requiredLevel}.` };
    if (!EconomyManager.canAfford(def.cost)) return { allowed: false, reason: 'Not enough gold.' };
    return { allowed: true };
  }

  static buy(id: string): boolean {
    const { allowed } = WeaponManager.canBuy(id);
    if (!allowed) return false;
    const def = getWeaponById(id)!;
    if (!EconomyManager.spendGold(def.cost)) return false;
    ownWeapon(id);
    setWeaponDurability(id, def.durability);
    return true;
  }

  static equip(id: string | null): void {
    equipWeapon(id);
  }
}
