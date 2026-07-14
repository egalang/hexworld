import { MissionResult } from '../data/battleConfig';
import {
  getGold,
  canAfford,
  spendGold,
  addGold,
  addXP,
  getLevel,
  getXpProgress,
  recordMissionVictory,
  recordMissionDefeat,
} from '../state/PlayerProfile';

export class EconomyManager {
  static getGold(): number {
    return getGold();
  }

  static canAfford(amount: number): boolean {
    return canAfford(amount);
  }

  static spendGold(amount: number): boolean {
    return spendGold(amount);
  }

  static earnGold(amount: number): void {
    addGold(amount);
  }

  static earnXP(amount: number): number {
    return addXP(amount);
  }

  static getLevel(): number {
    return getLevel();
  }

  static getXpProgress(): { current: number; needed: number } {
    return getXpProgress();
  }

  static processMissionResult(result: MissionResult): void {
    if (result.outcome === 'victory') {
      recordMissionVictory(result.goldEarned, result.xpEarned);
    } else if (result.outcome === 'defeat') {
      recordMissionDefeat();
    }
  }
}
