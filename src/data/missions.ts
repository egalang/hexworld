import { AiDifficulty } from '../shared';

export type MissionObjective = 'ELIMINATE' | 'CONTROL';

export interface MissionDefinition {
  id: string;
  title: string;
  description: string;
  story?: string;
  boardId: string;
  aiDifficulty: AiDifficulty;
  objective: MissionObjective;
  rewardGold: number;
  rewardXP: number;
  unlocks: string[];
  startsUnlocked?: boolean;
  imagePath?: string;
}

export const MISSIONS: MissionDefinition[] = [
  // ── Training ───────────────────────────────────────────
  {
    id: "training_01",
    title: "Basic Training",
    description: "Learn the basics of movement and capture.",
    story: "You have just enlisted in the army of Duke Florante. Veteran officers teach new recruits that victory is earned one step at a time. Every tile of land captured weakens the enemy's influence. Your first exercise is a mock battle where you must learn movement, positioning, and how isolated soldiers are defeated. Complete this trial to prove that you deserve to march with Florante's army.",
    boardId: "radius_3",
    aiDifficulty: "easy",
    objective: "ELIMINATE",
    rewardGold: 25,
    rewardXP: 10,
    startsUnlocked: true,
    unlocks: ["training_02"],
    imagePath: "training_01.png",
  },
  {
    id: "training_02",
    title: "Holding Ground",
    description: "Secure and control key territory.",
    story: "A soldier who cannot defend territory cannot defend a kingdom. Your instructor orders your squad to secure several strategic positions before the opposing trainees can reclaim them. Learn that patience and positioning are often stronger than reckless attacks. Hold your ground until victory is certain.",
    boardId: "radius_3",
    aiDifficulty: "easy",
    objective: "CONTROL",
    rewardGold: 25,
    rewardXP: 10,
    unlocks: ["training_03"],
    imagePath: "training_02.png",
  },
  {
    id: "training_03",
    title: "Advance and Capture",
    description: "Push forward and eliminate resistance.",
    story: "Your final examination places you against experienced trainees. Push forward, surround enemy positions, and eliminate their remaining forces. The officers observe every move. Success earns you a place among Florante's regular soldiers as rumors spread of growing unrest within the kingdom.",
    boardId: "radius_3",
    aiDifficulty: "easy",
    objective: "ELIMINATE",
    rewardGold: 50,
    rewardXP: 15,
    unlocks: ["mission_01"],
    imagePath: "training_03.png",
  },

  // ── Campaign ───────────────────────────────────────────
  {
    id: "mission_01",
    title: "Forest Outpost",
    description: "Clear the forest outpost of enemy forces.",
    story: "Bandits loyal to the ambitious Count Adolfo have occupied a forest outpost used by Florante's scouts. Your platoon is ordered to eliminate the invaders before they can report troop movements. This is your first real battle, where hesitation may cost lives.",
    boardId: "radius_4",
    aiDifficulty: "easy",
    objective: "ELIMINATE",
    rewardGold: 75,
    rewardXP: 20,
    unlocks: ["mission_02"],
    imagePath: "mission_01.png",
  },
  {
    id: "mission_02",
    title: "Canyon Watch",
    description: "Control the canyon passage.",
    story: "The narrow canyon controls the safest route toward Crotona. Enemy troops are rushing to occupy it before Florante's army arrives. Secure the passes and prevent hostile forces from surrounding your allies. The battle will be won by controlling the land rather than destroying every opponent.",
    boardId: "radius_4",
    aiDifficulty: "easy",
    objective: "CONTROL",
    rewardGold: 75,
    rewardXP: 20,
    unlocks: ["mission_03"],
    imagePath: "mission_02.png",
  },
  {
    id: "mission_03",
    title: "Riverside Skirmish",
    description: "Secure the river crossing.",
    story: "Enemy reinforcements attempt to cross the river before dawn. Florante commands your squad to stop them. Destroy their advance force before they establish a foothold across the crossing. Every eliminated unit delays Adolfo's growing influence.",
    boardId: "radius_4",
    aiDifficulty: "normal",
    objective: "ELIMINATE",
    rewardGold: 100,
    rewardXP: 25,
    unlocks: ["mission_04"],
    imagePath: "mission_03.png",
  },
  {
    id: "mission_04",
    title: "Hilltop Assault",
    description: "Take the high ground from enemy control.",
    story: "he surrounding hills overlook the road to Crotona. Whoever controls the high ground commands the battlefield. Lead your soldiers uphill and capture every strategic position before the enemy can reinforce their defenses.",
    boardId: "radius_4",
    aiDifficulty: "normal",
    objective: "CONTROL",
    rewardGold: 100,
    rewardXP: 25,
    unlocks: ["mission_05"],
    imagePath: "mission_04.png",
  },
  {
    id: "mission_05",
    title: "Forest Clearing",
    description: "Eliminate all enemy units in the clearing.",
    story: "Adolfo's scouts have gathered inside an open forest clearing. Florante cannot risk spies escaping. Surround the enemy, cut off every retreat, and eliminate the entire force before nightfall.",
    boardId: "radius_4",
    aiDifficulty: "normal",
    objective: "ELIMINATE",
    rewardGold: 125,
    rewardXP: 30,
    unlocks: ["mission_06"],
    imagePath: "mission_05.png",
  },
  {
    id: "mission_06",
    title: "Desert Patrol",
    description: "Rout the enemy patrol in the desert wastes.",
    story: "Your campaign carries you into foreign lands where allies request assistance against raiders secretly supplied by Adolfo's supporters. Hunt down the patrol before they regroup and threaten innocent villages.",
    boardId: "radius_4",
    aiDifficulty: "normal",
    objective: "ELIMINATE",
    rewardGold: 125,
    rewardXP: 30,
    unlocks: ["mission_07"],
    imagePath: "mission_06.png",
  },
  {
    id: "mission_07",
    title: "Oasis Control",
    description: "Capture and hold the vital oasis.",
    story: "The desert is harsh and unforgiving. Control of the oasis is essential for survival. Secure the water source and prevent enemy forces from reclaiming it.",
    boardId: "radius_4",
    aiDifficulty: "hard",
    objective: "CONTROL",
    rewardGold: 150,
    rewardXP: 35,
    unlocks: ["mission_08"],
    imagePath: "mission_07.png"
  },
  {
    id: "mission_08",
    title: "Sandstorm Advance",
    description: "Push through the sandstorm to victory.",
    story: "A sudden sandstorm engulfs the battlefield, reducing visibility and making navigation treacherous. Lead your troops through the storm, using strategy and courage to overcome the enemy forces that lie ahead.",
    boardId: "radius_4",
    aiDifficulty: "hard",
    objective: "ELIMINATE",
    rewardGold: 150,
    rewardXP: 35,
    unlocks: ["mission_09"],
    imagePath: "mission_08.png"
  },
  {
    id: "mission_09",
    title: "Dunes Stand",
    description: "Hold your position against overwhelming odds.",
    story: "The enemy has launched a massive assault on your position in the dunes. Your forces are outnumbered, but with careful planning and steadfast defense, you must hold the line until reinforcements arrive.",
    boardId: "radius_4",
    aiDifficulty: "hard",
    objective: "CONTROL",
    rewardGold: 175,
    rewardXP: 40,
    unlocks: ["mission_10"],
    imagePath: "mission_09.png"
  },
  {
    id: "mission_10",
    title: "Mirage Fortress",
    description: "Storm the fortress hidden in the desert.",
    story: "Hidden beyond shimmering heat lies a fortress supplying Adolfo's distant allies. Destroy its defenders before they can send aid toward Crotona. Your victories are beginning to attract Florante's personal attention.",
    boardId: "radius_4",
    aiDifficulty: "hard",
    objective: "ELIMINATE",
    rewardGold: 200,
    rewardXP: 45,
    unlocks: ["mission_11"],
    imagePath: "mission_10.png"
  },
  {
    id: "mission_11",
    title: "Mountain Pass",
    description: "Fight through the narrow mountain pass.",
    story: "The enemy has fortified a mountain pass, blocking your advance. Navigate the treacherous terrain and eliminate their forces to secure the route for Florante's army.",
    boardId: "radius_4",
    aiDifficulty: "hard",
    objective: "ELIMINATE",
    rewardGold: 200,
    rewardXP: 45,
    unlocks: ["mission_12"],
    imagePath: "mission_11.png"
  },
  {
    id: "mission_12",
    title: "Peak Control",
    description: "Control the highest peaks to secure victory.",
    story: "Signal towers atop the mountains coordinate enemy movements across the kingdom. Capture every peak and silence the beacons. With the high ground secured, Florante prepares for the decisive campaign against Adolfo.",
    boardId: "radius_4",
    aiDifficulty: "expert",
    objective: "CONTROL",
    rewardGold: 225,
    rewardXP: 50,
    unlocks: ["mission_13"],
    imagePath: "mission_12.png"
  },
  {
    id: "mission_13",
    title: "Avalanche Strike",
    description: "Overwhelm the enemy with a decisive attack.",
    story: "The enemy has entrenched themselves in the mountains, but their position is vulnerable. Launch a coordinated strike to break their lines and pave the way for Florante's final assault on Crotona.",
    boardId: "radius_4",
    aiDifficulty: "expert",
    objective: "ELIMINATE",
    rewardGold: 250,
    rewardXP: 55,
    unlocks: ["mission_14"],
    imagePath: "mission_13.png"
  },
  {
    id: "mission_14",
    title: "Summit Fortress",
    description: "Breach the enemy's mountain stronghold.",
    story: "The enemy's last stronghold sits atop the highest peak. Breach their defenses and secure the fortress to ensure Florante's path to victory. This mission will test your strategic acumen and leadership.",
    boardId: "radius_4",
    aiDifficulty: "expert",
    objective: "CONTROL",
    rewardGold: 275,
    rewardXP: 60,
    unlocks: ["mission_15"],
    imagePath: "mission_14.png"
  },
  {
    id: "mission_15",
    title: "Final Conquest",
    description: "End the campaign with total victory.",
    story: "The final battle against Adolfo's forces is at hand. Lead your troops to victory and secure the kingdom for Duke Florante. Every decision counts, and the fate of the realm rests in your hands.",
    boardId: "radius_4",
    aiDifficulty: "expert",
    objective: "ELIMINATE",
    rewardGold: 300,
    rewardXP: 75,
    unlocks: [],
    imagePath: "mission_15.png"
  },
];

export function getMissionById(id: string): MissionDefinition | undefined {
  return MISSIONS.find((m) => m.id === id);
}
