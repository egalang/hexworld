const PROFILE_KEY = 'hex_player_profile';

export interface PlayerStats {
  missionsWon: number;
  missionsLost: number;
  totalGoldEarned: number;
  totalXPEarned: number;
}

export interface PlayerProfileData {
  name: string;
  level: number;
  xp: number;
  gold: number;
  completedMissions: string[];
  statistics: PlayerStats;
}

function xpForLevel(level: number): number {
  return level * 100;
}

function defaultProfile(): PlayerProfileData {
  return {
    name: 'Commander',
    level: 1,
    xp: 0,
    gold: 0,
    completedMissions: [],
    statistics: {
      missionsWon: 0,
      missionsLost: 0,
      totalGoldEarned: 0,
      totalXPEarned: 0,
    },
  };
}

function migrateOldData(): void {
  const oldGold = localStorage.getItem('hex_mission_gold');
  const oldXP = localStorage.getItem('hex_mission_xp');
  const oldCompleted = localStorage.getItem('hex_mission_completed');

  if (oldGold !== null || oldXP !== null || oldCompleted !== null) {
    const profile = loadRaw();

    if (oldGold !== null) {
      profile.gold += Math.max(0, Math.floor(Number(oldGold)));
      localStorage.removeItem('hex_mission_gold');
    }

    if (oldXP !== null) {
      const xp = Math.max(0, Math.floor(Number(oldXP)));
      profile.xp += xp;
      profile.statistics.totalXPEarned += xp;
      localStorage.removeItem('hex_mission_xp');
    }

    if (oldCompleted !== null) {
      try {
        const parsed = JSON.parse(oldCompleted);
        if (Array.isArray(parsed)) {
          for (const id of parsed) {
            if (typeof id === 'string' && !profile.completedMissions.includes(id)) {
              profile.completedMissions.push(id);
            }
          }
        }
      } catch {
        // ignore corrupt data
      }
      localStorage.removeItem('hex_mission_completed');
    }

    saveRaw(profile);
  }
}

function loadRaw(): PlayerProfileData {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return defaultProfile();
    const parsed = JSON.parse(raw) as Partial<PlayerProfileData>;
    return {
      name: typeof parsed.name === 'string' ? parsed.name : defaultProfile().name,
      level: typeof parsed.level === 'number' && parsed.level >= 1 ? parsed.level : defaultProfile().level,
      xp: typeof parsed.xp === 'number' && parsed.xp >= 0 ? parsed.xp : defaultProfile().xp,
      gold: typeof parsed.gold === 'number' && parsed.gold >= 0 ? parsed.gold : defaultProfile().gold,
      completedMissions: Array.isArray(parsed.completedMissions) ? parsed.completedMissions : defaultProfile().completedMissions,
      statistics: {
        missionsWon: typeof parsed.statistics?.missionsWon === 'number' ? parsed.statistics.missionsWon : defaultProfile().statistics.missionsWon,
        missionsLost: typeof parsed.statistics?.missionsLost === 'number' ? parsed.statistics.missionsLost : defaultProfile().statistics.missionsLost,
        totalGoldEarned: typeof parsed.statistics?.totalGoldEarned === 'number' ? parsed.statistics.totalGoldEarned : defaultProfile().statistics.totalGoldEarned,
        totalXPEarned: typeof parsed.statistics?.totalXPEarned === 'number' ? parsed.statistics.totalXPEarned : defaultProfile().statistics.totalXPEarned,
      },
    };
  } catch {
    return defaultProfile();
  }
}

function saveRaw(data: PlayerProfileData): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(data));
}

let cached: PlayerProfileData | null = null;

function getData(): PlayerProfileData {
  if (!cached) {
    migrateOldData();
    cached = loadRaw();
  }
  return cached;
}

function commit(): void {
  if (cached) saveRaw(cached);
}

export function getProfile(): PlayerProfileData {
  return getData();
}

export function getGold(): number {
  return getData().gold;
}

export function addGold(amount: number): void {
  const data = getData();
  const amt = Math.max(0, Math.floor(amount));
  data.gold += amt;
  data.statistics.totalGoldEarned += amt;
  commit();
}

export function spendGold(amount: number): boolean {
  const data = getData();
  const amt = Math.max(0, Math.floor(amount));
  if (data.gold < amt) return false;
  data.gold -= amt;
  commit();
  return true;
}

export function canAfford(amount: number): boolean {
  return getData().gold >= Math.max(0, Math.floor(amount));
}

export function addXP(amount: number): number {
  const data = getData();
  const amt = Math.max(0, Math.floor(amount));
  data.xp += amt;
  data.statistics.totalXPEarned += amt;

  let levelsGained = 0;
  while (data.xp >= xpForLevel(data.level)) {
    data.xp -= xpForLevel(data.level);
    data.level++;
    levelsGained++;
  }

  commit();
  return levelsGained;
}

export function getLevel(): number {
  return getData().level;
}

export function getXp(): number {
  return getData().xp;
}

export function getXpToNextLevel(): number {
  return xpForLevel(getData().level);
}

export function getXpProgress(): { current: number; needed: number } {
  const data = getData();
  return { current: data.xp, needed: xpForLevel(data.level) };
}

export function getCompletedMissionIds(): string[] {
  return [...getData().completedMissions];
}

export function isMissionCompleted(id: string): boolean {
  return getData().completedMissions.includes(id);
}

export function markMissionCompleted(id: string): void {
  const data = getData();
  if (!data.completedMissions.includes(id)) {
    data.completedMissions.push(id);
    commit();
  }
}

export function recordMissionVictory(gold: number, xp: number): void {
  const data = getData();
  data.statistics.missionsWon++;
  addGold(gold);
  addXP(xp);
  commit();
}

export function recordMissionDefeat(): void {
  const data = getData();
  data.statistics.missionsLost++;
  commit();
}

export function setName(name: string): void {
  getData().name = name;
  commit();
}

export function getName(): string {
  return getData().name;
}

export function getStatistics(): PlayerStats {
  return { ...getData().statistics };
}

export function resetProfile(): void {
  localStorage.removeItem(PROFILE_KEY);
  cached = null;
}
