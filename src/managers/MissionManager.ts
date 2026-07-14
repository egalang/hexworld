import { MissionDefinition, getMissionById, MISSIONS } from '../data/missions';
import { BattleConfig, MissionResult } from '../data/battleConfig';
import { addMissionGold, addMissionXP, isMissionCompleted, markMissionCompleted } from '../state/MissionProgress';

export class MissionManager {
  getMissionById(id: string): MissionDefinition {
    const mission = getMissionById(id);
    if (!mission) {
      throw new Error(`Mission not found: ${id}`);
    }
    return mission;
  }

  getBattleConfig(missionId: string): BattleConfig {
    const mission = this.getMissionById(missionId);
    return {
      missionId: mission.id,
      boardId: mission.boardId,
      aiDifficulty: mission.aiDifficulty,
      objective: mission.objective,
      rewardGold: mission.rewardGold,
      rewardXP: mission.rewardXP,
    };
  }

  getUnlockedMissions(completedIds: Set<string>): string[] {
    const unlocked = new Set<string>();

    for (const m of MISSIONS) {
      if (m.id.startsWith('training_')) {
        unlocked.add(m.id);
        continue;
      }
    }

    for (const id of completedIds) {
      unlocked.add(id);
      const mission = getMissionById(id);
      if (mission) {
        for (const unlockedId of mission.unlocks) {
          unlocked.add(unlockedId);
        }
      }
    }

    return Array.from(unlocked);
  }

  isMissionUnlocked(missionId: string, completedIds: Set<string>): boolean {
    if (missionId.startsWith('training_')) return true;
    if (completedIds.has(missionId)) return true;

    for (const completedId of completedIds) {
      const mission = getMissionById(completedId);
      if (mission && mission.unlocks.includes(missionId)) {
        return true;
      }
    }
    return false;
  }

  processResult(result: MissionResult): boolean {
    const mission = getMissionById(result.missionId);
    if (!mission) return false;
    if (result.goldEarned < 0 || result.xpEarned < 0) return false;

    if (result.victory && !isMissionCompleted(result.missionId)) {
      addMissionGold(result.goldEarned);
      addMissionXP(result.xpEarned);
      markMissionCompleted(result.missionId);
    }
    return true;
  }
}
