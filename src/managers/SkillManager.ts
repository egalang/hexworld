import { getLevel } from '../state/PlayerProfile';
import { getEquippedSkills, equipSkill, unequipSkill, isSkillEquipped } from '../state/Loadout';
import { isSkillOwned, ownSkill, getSkillLevel, setUpgradeLevel } from '../state/Inventory';
import { getSkillById, SkillDefinition } from '../data/skills';
import { EconomyManager } from './EconomyManager';

export class SkillManager {
  static getEquipped(): SkillDefinition[] {
    const ids = getEquippedSkills();
    return ids.map(id => getSkillById(id)).filter((s): s is SkillDefinition => !!s);
  }

  static isOwned(id: string): boolean {
    return isSkillOwned(id);
  }

  static isEquipped(id: string): boolean {
    return isSkillEquipped(id);
  }

  static getLevel(id: string): number {
    return getSkillLevel(id);
  }

  static canBuy(id: string): { allowed: boolean; reason?: string } {
    const def = getSkillById(id);
    if (!def) return { allowed: false, reason: 'Unknown skill.' };
    if (getLevel() < def.requiredLevel) return { allowed: false, reason: `Requires level ${def.requiredLevel}.` };

    const owned = isSkillOwned(id);
    if (owned) {
      if (def.maxLevel && def.upgradeCost) {
        const currentLevel = getSkillLevel(id);
        if (currentLevel >= def.maxLevel) return { allowed: false, reason: 'Already at max level.' };
        if (!EconomyManager.canAfford(def.upgradeCost)) return { allowed: false, reason: 'Not enough gold.' };
        return { allowed: true, reason: 'upgrade' };
      }
      return { allowed: false, reason: 'Already owned.' };
    }

    if (!EconomyManager.canAfford(def.cost)) return { allowed: false, reason: 'Not enough gold.' };
    return { allowed: true };
  }

  static buy(id: string): boolean {
    const result = SkillManager.canBuy(id);
    if (!result.allowed) return false;
    const def = getSkillById(id)!;
    const owned = isSkillOwned(id);

    if (owned && def.maxLevel && def.upgradeCost) {
      if (!EconomyManager.spendGold(def.upgradeCost)) return false;
      const nextLevel = getSkillLevel(id) + 1;
      setUpgradeLevel(id, nextLevel);
      return true;
    }

    if (!EconomyManager.spendGold(def.cost)) return false;
    ownSkill(id);
    return true;
  }

  static equip(id: string): boolean {
    return equipSkill(id);
  }

  static unequip(id: string): void {
    unequipSkill(id);
  }

  static slotsAvailable(): boolean {
    return getEquippedSkills().length < 2;
  }
}
