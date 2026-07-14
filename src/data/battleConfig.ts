import { AiDifficulty } from '../shared';
import { MissionObjective } from './missions';

export interface BattleConfig {
  missionId: string;
  boardId: string;
  aiDifficulty: AiDifficulty;
  objective: MissionObjective;
  rewardGold: number;
  rewardXP: number;
}

export interface MissionResult {
  missionId: string;
  victory: boolean;
  goldEarned: number;
  xpEarned: number;
}
