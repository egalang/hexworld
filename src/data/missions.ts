import { AiDifficulty } from '../shared';

export type MissionObjective = 'ELIMINATE' | 'CONTROL';

export interface MissionDefinition {
  id: string;
  title: string;
  description: string;
  boardId: string;
  aiDifficulty: AiDifficulty;
  objective: MissionObjective;
  rewardGold: number;
  rewardXP: number;
  unlocks: string[];
}

export const MISSIONS: MissionDefinition[] = [
  // ── Training ───────────────────────────────────────────
  {
    id: "training_01",
    title: "Basic Training",
    description: "Learn the basics of movement and capture.",
    boardId: "radius_3",
    aiDifficulty: "easy",
    objective: "ELIMINATE",
    rewardGold: 25,
    rewardXP: 10,
    unlocks: ["mission_01"],
  },
  {
    id: "training_02",
    title: "Holding Ground",
    description: "Secure and control key territory.",
    boardId: "radius_3",
    aiDifficulty: "easy",
    objective: "CONTROL",
    rewardGold: 25,
    rewardXP: 10,
    unlocks: ["mission_02"],
  },
  {
    id: "training_03",
    title: "Advance and Capture",
    description: "Push forward and eliminate resistance.",
    boardId: "radius_3",
    aiDifficulty: "easy",
    objective: "ELIMINATE",
    rewardGold: 50,
    rewardXP: 15,
    unlocks: ["mission_03"],
  },

  // ── Track A ────────────────────────────────────────────
  {
    id: "mission_01",
    title: "Forest Outpost",
    description: "Clear the forest outpost of enemy forces.",
    boardId: "radius_4",
    aiDifficulty: "easy",
    objective: "ELIMINATE",
    rewardGold: 75,
    rewardXP: 20,
    unlocks: ["mission_04"],
  },
  {
    id: "mission_04",
    title: "Hilltop Assault",
    description: "Take the high ground from enemy control.",
    boardId: "radius_4",
    aiDifficulty: "normal",
    objective: "CONTROL",
    rewardGold: 100,
    rewardXP: 25,
    unlocks: ["mission_07"],
  },
  {
    id: "mission_07",
    title: "Oasis Control",
    description: "Capture and hold the vital oasis.",
    boardId: "radius_4",
    aiDifficulty: "hard",
    objective: "CONTROL",
    rewardGold: 150,
    rewardXP: 35,
    unlocks: ["mission_10"],
  },
  {
    id: "mission_10",
    title: "Mirage Fortress",
    description: "Storm the fortress hidden in the desert.",
    boardId: "radius_4",
    aiDifficulty: "hard",
    objective: "ELIMINATE",
    rewardGold: 200,
    rewardXP: 45,
    unlocks: ["mission_13"],
  },
  {
    id: "mission_13",
    title: "Avalanche Strike",
    description: "Overwhelm the enemy with a decisive attack.",
    boardId: "radius_4",
    aiDifficulty: "expert",
    objective: "ELIMINATE",
    rewardGold: 250,
    rewardXP: 55,
    unlocks: [],
  },

  // ── Track B ────────────────────────────────────────────
  {
    id: "mission_02",
    title: "Canyon Watch",
    description: "Control the canyon passage.",
    boardId: "radius_4",
    aiDifficulty: "easy",
    objective: "CONTROL",
    rewardGold: 75,
    rewardXP: 20,
    unlocks: ["mission_05"],
  },
  {
    id: "mission_05",
    title: "Forest Clearing",
    description: "Eliminate all enemy units in the clearing.",
    boardId: "radius_4",
    aiDifficulty: "normal",
    objective: "ELIMINATE",
    rewardGold: 125,
    rewardXP: 30,
    unlocks: ["mission_08"],
  },
  {
    id: "mission_08",
    title: "Sandstorm Advance",
    description: "Push through the sandstorm to victory.",
    boardId: "radius_4",
    aiDifficulty: "hard",
    objective: "ELIMINATE",
    rewardGold: 150,
    rewardXP: 35,
    unlocks: ["mission_11"],
  },
  {
    id: "mission_11",
    title: "Mountain Pass",
    description: "Fight through the narrow mountain pass.",
    boardId: "radius_4",
    aiDifficulty: "hard",
    objective: "ELIMINATE",
    rewardGold: 200,
    rewardXP: 45,
    unlocks: ["mission_14"],
  },
  {
    id: "mission_14",
    title: "Summit Fortress",
    description: "Breach the enemy's mountain stronghold.",
    boardId: "radius_4",
    aiDifficulty: "expert",
    objective: "CONTROL",
    rewardGold: 275,
    rewardXP: 60,
    unlocks: [],
  },

  // ── Track C ────────────────────────────────────────────
  {
    id: "mission_03",
    title: "Riverside Skirmish",
    description: "Secure the river crossing.",
    boardId: "radius_4",
    aiDifficulty: "normal",
    objective: "ELIMINATE",
    rewardGold: 100,
    rewardXP: 25,
    unlocks: ["mission_06"],
  },
  {
    id: "mission_06",
    title: "Desert Patrol",
    description: "Rout the enemy patrol in the desert wastes.",
    boardId: "radius_4",
    aiDifficulty: "normal",
    objective: "ELIMINATE",
    rewardGold: 125,
    rewardXP: 30,
    unlocks: ["mission_09"],
  },
  {
    id: "mission_09",
    title: "Dunes Stand",
    description: "Hold your position against overwhelming odds.",
    boardId: "radius_4",
    aiDifficulty: "hard",
    objective: "CONTROL",
    rewardGold: 175,
    rewardXP: 40,
    unlocks: ["mission_12"],
  },
  {
    id: "mission_12",
    title: "Peak Control",
    description: "Control the highest peaks to secure victory.",
    boardId: "radius_4",
    aiDifficulty: "expert",
    objective: "CONTROL",
    rewardGold: 225,
    rewardXP: 50,
    unlocks: ["mission_15"],
  },
  {
    id: "mission_15",
    title: "Final Conquest",
    description: "End the campaign with total victory.",
    boardId: "radius_4",
    aiDifficulty: "expert",
    objective: "ELIMINATE",
    rewardGold: 300,
    rewardXP: 75,
    unlocks: [],
  },
];

export function getMissionById(id: string): MissionDefinition | undefined {
  return MISSIONS.find((m) => m.id === id);
}
