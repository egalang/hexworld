const MISSION_GOLD_KEY = 'hex_mission_gold';
const MISSION_XP_KEY = 'hex_mission_xp';
const MISSION_COMPLETED_KEY = 'hex_mission_completed';

function readNumber(key: string, fallback: number): number {
  try {
    const raw = localStorage.getItem(key);
    const val = Number(raw);
    return Number.isFinite(val) ? Math.max(0, Math.floor(val)) : fallback;
  } catch {
    return fallback;
  }
}

function writeNumber(key: string, value: number) {
  localStorage.setItem(key, String(Math.max(0, Math.floor(value))));
}

function readStringArray(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string');
  } catch {
    return [];
  }
}

function writeStringArray(key: string, value: string[]) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getMissionGold(): number {
  return readNumber(MISSION_GOLD_KEY, 0);
}

export function addMissionGold(amount: number) {
  const current = getMissionGold();
  writeNumber(MISSION_GOLD_KEY, current + Math.max(0, Math.floor(amount)));
}

export function getMissionXP(): number {
  return readNumber(MISSION_XP_KEY, 0);
}

export function addMissionXP(amount: number) {
  const current = getMissionXP();
  writeNumber(MISSION_XP_KEY, current + Math.max(0, Math.floor(amount)));
}

export function isMissionCompleted(id: string): boolean {
  return readStringArray(MISSION_COMPLETED_KEY).includes(id);
}

export function markMissionCompleted(id: string) {
  const completed = readStringArray(MISSION_COMPLETED_KEY);
  if (!completed.includes(id)) {
    completed.push(id);
    writeStringArray(MISSION_COMPLETED_KEY, completed);
  }
}

export function getCompletedMissionIds(): string[] {
  return readStringArray(MISSION_COMPLETED_KEY);
}

export function resetAllProgress() {
  localStorage.removeItem(MISSION_GOLD_KEY);
  localStorage.removeItem(MISSION_XP_KEY);
  localStorage.removeItem(MISSION_COMPLETED_KEY);
}
