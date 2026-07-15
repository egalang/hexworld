import Phaser from 'phaser';
import { getSettings } from './state/Settings';

export const WIDTH = 450;
export const HEIGHT = 800;
export const BOARD_RADIUS = 4;
export const HEX_SIZE = 27.5;
export const SQRT3 = Math.sqrt(3);

export type Player = 'blue' | 'red';
export type Owner = Player | null;
export type GameMode = 'campaign' | 'ai' | 'local' | 'online';

export type Hex = {
  q: number;
  r: number;
  s: number;
  owner: Owner;
  poly?: Phaser.GameObjects.Polygon;
  piece?: Phaser.GameObjects.Image;
  text?: Phaser.GameObjects.Text;
  frozen: boolean;
  hexed: Player | null;
};

export type OnlineRoomState = {
  room_code: string;
  player_id?: string;
  player_color?: Player | null;
  red_joined: boolean;
  current_player: Player;
  turn: number;
  game_over: boolean;
  winner: Player | null;
  counts: { blue: number; red: number };
  cells: { q: number; r: number; s: number; owner: Owner }[];
  updated_at: number;
};

export type OnlineReconnectSession = {
  serverUrl: string;
  roomCode: string;
  playerId: string;
  playerColor: Player;
  savedAt: number;
};

export const BLUE_SOLDIER_KEY = 'blue_soldier';
export const RED_SOLDIER_KEY = 'red_soldier';

export const SOUND_KEYS = {
  select: 'sfx_select',
  move: 'sfx_move',
  convert: 'sfx_convert',
  invalid: 'sfx_invalid',
  confirm: 'sfx_confirm',
  victory: 'sfx_victory',
} as const;

const SOUND_FILES: Record<string, string[]> = {
  [SOUND_KEYS.select]: ['/assets/select.mp3'],
  [SOUND_KEYS.move]: ['/assets/move.mp3'],
  [SOUND_KEYS.convert]: ['/assets/convert.mp3'],
  [SOUND_KEYS.invalid]: ['/assets/invalid.mp3'],
  [SOUND_KEYS.confirm]: ['/assets/confirm.mp3'],
  [SOUND_KEYS.victory]: ['/assets/victory.mp3'],
};

const MUSIC_KEYS = {
  bgm: 'bgm',
};

const MUSIC_FILES: Record<string, string[]> = {
  [MUSIC_KEYS.bgm]: ['/assets/music.mp3'],
};

export function preloadSoundEffects(scene: Phaser.Scene) {
    for (const [key, paths] of Object.entries(SOUND_FILES)) {
        if (!scene.cache.audio.exists(key)) {
            scene.load.audio(key, paths);
        }
    }

    for (const [key, paths] of Object.entries(MUSIC_FILES)) {
        if (!scene.cache.audio.exists(key)) {
            scene.load.audio(key, paths);
        }
    }
}

export function unlockAudio(scene: Phaser.Scene) {
  try {
    const soundManager = scene.sound as unknown as {
      unlock?: () => void;
      context?: AudioContext;
      mute?: boolean;
    };

    soundManager.mute = false;
    soundManager.unlock?.();

    if (soundManager.context?.state === 'suspended') {
      void soundManager.context.resume();
    }
  } catch {
    // Audio unlock should never block gameplay.
  }
}

export function playSound(scene: Phaser.Scene, key: string, volume?: number) {
  try {
    unlockAudio(scene);
    if (!scene.cache.audio.exists(key)) return;
    const base = volume ?? 1;
    scene.sound.play(key, { volume: base * getSettings().sfxVolume });
  } catch {
    // Missing, locked, or unsupported audio should never break gameplay.
  }
}

export const DEFAULT_PVP_SERVER_URL = 'http://hex-conquest-pvp-alb-1620546806.ap-southeast-2.elb.amazonaws.com';

const ONLINE_RECONNECT_KEY = 'hex_online_reconnect_session';
const ONLINE_RECONNECT_MAX_AGE_MS = 1000 * 60 * 60 * 6;

function normalizeServerUrl(url: string) {
  return url.trim().replace(/\/+$/, '');
}

function isPlayer(value: unknown): value is Player {
  return value === 'blue' || value === 'red';
}

function getReconnectSession(): OnlineReconnectSession | null {
  try {
    const raw = localStorage.getItem(ONLINE_RECONNECT_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<OnlineReconnectSession>;
    if (!parsed.serverUrl || !parsed.roomCode || !parsed.playerId || !isPlayer(parsed.playerColor)) {
      localStorage.removeItem(ONLINE_RECONNECT_KEY);
      return null;
    }

    const savedAt = Number(parsed.savedAt || 0);
    if (!savedAt || Date.now() - savedAt > ONLINE_RECONNECT_MAX_AGE_MS) {
      localStorage.removeItem(ONLINE_RECONNECT_KEY);
      return null;
    }

    return {
      serverUrl: normalizeServerUrl(parsed.serverUrl),
      roomCode: parsed.roomCode.trim().toUpperCase(),
      playerId: parsed.playerId,
      playerColor: parsed.playerColor,
      savedAt,
    };
  } catch {
    localStorage.removeItem(ONLINE_RECONNECT_KEY);
    return null;
  }
}

export function saveReconnectSession(session: Omit<OnlineReconnectSession, 'savedAt'>) {
  localStorage.setItem(ONLINE_RECONNECT_KEY, JSON.stringify({
    ...session,
    serverUrl: normalizeServerUrl(session.serverUrl),
    roomCode: session.roomCode.trim().toUpperCase(),
    savedAt: Date.now(),
  }));
}

export function clearReconnectSession() {
  localStorage.removeItem(ONLINE_RECONNECT_KEY);
}

export const CAMPAIGN_MAX_LEVEL = 20;
const CAMPAIGN_PROGRESS_KEY = 'hex_campaign_unlocked_level';

export function getUnlockedCampaignLevel(): number {
  const raw = Number(localStorage.getItem(CAMPAIGN_PROGRESS_KEY) || '1');
  if (!Number.isFinite(raw)) return 1;
  return Phaser.Math.Clamp(Math.floor(raw), 1, CAMPAIGN_MAX_LEVEL);
}

export function saveUnlockedCampaignLevel(level: number) {
  const current = getUnlockedCampaignLevel();
  const next = Phaser.Math.Clamp(Math.floor(level), 1, CAMPAIGN_MAX_LEVEL);
  if (next > current) {
    localStorage.setItem(CAMPAIGN_PROGRESS_KEY, String(next));
  }
}

export function getCampaignLevelTitle(level: number): string {
  if (level <= 2) return 'Training Grounds';
  if (level <= 4) return 'Red Expansion';
  if (level <= 7) return 'Broken Frontline';
  if (level <= 10) return 'Center Clash';
  if (level <= 14) return 'Enemy Surge';
  return 'Final Dominion';
}

type CampaignObjectiveType =
  | 'eliminate_red'
  | 'win_within_turns'
  | 'control_territory'
  | 'hold_center'
  | 'survive_turns';

export type CampaignObjective = {
  type: CampaignObjectiveType;
  title: string;
  description: string;
  target?: number;
  starTurnLimit?: number;
  starTerritoryPercent?: number;
};

const CAMPAIGN_STARS_KEY = 'hex_campaign_level_stars';

const CAMPAIGN_OBJECTIVES: Record<number, CampaignObjective> = {
  1: { type: 'eliminate_red', title: 'First Contact', description: 'Eliminate all Red territories.', starTurnLimit: 28, starTerritoryPercent: 65 },
  2: { type: 'win_within_turns', title: 'Quick Victory', description: 'Defeat Red within 20 turns.', target: 20, starTurnLimit: 16, starTerritoryPercent: 65 },
  3: { type: 'control_territory', title: 'Territory Push', description: 'Control at least 60% of the board.', target: 60, starTurnLimit: 24, starTerritoryPercent: 70 },
  4: { type: 'hold_center', title: 'Central Control', description: 'Control the center hex for 3 turns.', target: 3, starTurnLimit: 24, starTerritoryPercent: 65 },
  5: { type: 'eliminate_red', title: 'Outnumbered', description: 'Win against a stronger Red opening.', starTurnLimit: 30, starTerritoryPercent: 68 },
  6: { type: 'control_territory', title: 'Dominance', description: 'Control at least 70% of the board.', target: 70, starTurnLimit: 26, starTerritoryPercent: 80 },
  7: { type: 'win_within_turns', title: 'Blitz', description: 'Defeat Red within 15 turns.', target: 15, starTurnLimit: 12, starTerritoryPercent: 70 },
  8: { type: 'survive_turns', title: 'Survival Line', description: 'Survive for 25 turns.', target: 25, starTurnLimit: 25, starTerritoryPercent: 60 },
  9: { type: 'control_territory', title: 'Expansion Master', description: 'Control at least 75% of the board.', target: 75, starTurnLimit: 32, starTerritoryPercent: 82 },
  10: { type: 'hold_center', title: 'Fortress Core', description: 'Control the center hex for 5 turns.', target: 5, starTurnLimit: 30, starTerritoryPercent: 72 },
  11: { type: 'eliminate_red', title: 'Divide and Conquer', description: 'Eliminate all Red territories.', starTurnLimit: 28, starTerritoryPercent: 72 },
  12: { type: 'control_territory', title: 'Efficient Commander', description: 'Control at least 70% of the board.', target: 70, starTurnLimit: 24, starTerritoryPercent: 80 },
  13: { type: 'survive_turns', title: 'Border War', description: 'Survive for 30 turns.', target: 30, starTurnLimit: 30, starTerritoryPercent: 60 },
  14: { type: 'hold_center', title: 'Superior Position', description: 'Control the center hex for 6 turns.', target: 6, starTurnLimit: 28, starTerritoryPercent: 75 },
  15: { type: 'eliminate_red', title: 'Comeback King', description: 'Eliminate all Red territories.', starTurnLimit: 32, starTerritoryPercent: 75 },
  16: { type: 'hold_center', title: 'No Retreat', description: 'Control the center hex for 7 turns.', target: 7, starTurnLimit: 30, starTerritoryPercent: 78 },
  17: { type: 'win_within_turns', title: 'Attrition', description: 'Defeat Red within 30 turns.', target: 30, starTurnLimit: 24, starTerritoryPercent: 78 },
  18: { type: 'win_within_turns', title: 'Surgical Strike', description: 'Defeat Red within 25 turns.', target: 25, starTurnLimit: 20, starTerritoryPercent: 80 },
  19: { type: 'control_territory', title: 'World Domination', description: 'Control at least 85% of the board.', target: 85, starTurnLimit: 32, starTerritoryPercent: 90 },
  20: { type: 'eliminate_red', title: 'Final Conquest', description: 'Eliminate Red and dominate the board.', starTurnLimit: 20, starTerritoryPercent: 80 },
};

export function getCampaignObjective(level: number): CampaignObjective {
  return CAMPAIGN_OBJECTIVES[level] ?? CAMPAIGN_OBJECTIVES[1];
}

function getCampaignStarsMap(): Record<string, number> {
  try {
    const raw = localStorage.getItem(CAMPAIGN_STARS_KEY);
    return raw ? JSON.parse(raw) as Record<string, number> : {};
  } catch {
    return {};
  }
}

export function getSavedCampaignStars(level: number): number {
  const stars = getCampaignStarsMap()[String(level)] ?? 0;
  return Phaser.Math.Clamp(Number(stars) || 0, 0, 3);
}

export function saveCampaignStars(level: number, stars: number) {
  const map = getCampaignStarsMap();
  const key = String(level);
  const current = Phaser.Math.Clamp(Number(map[key]) || 0, 0, 3);
  const next = Phaser.Math.Clamp(Math.floor(stars), 0, 3);
  if (next > current) {
    map[key] = next;
    localStorage.setItem(CAMPAIGN_STARS_KEY, JSON.stringify(map));
  }
}

export type AiDifficulty = 'easy' | 'normal' | 'hard' | 'expert';
export type AiPersonality = 'balanced' | 'aggressive' | 'defensive' | 'center' | 'chaotic';

type AiStats = {
  wins: number;
  losses: number;
  streak: number;
  bestWinTurns: number | null;
  lastDifficulty: AiDifficulty;
  lastPersonality: AiPersonality;
};

const AI_SETTINGS_KEY = 'hex_ai_settings';
const AI_STATS_KEY = 'hex_ai_stats';

export const AI_DIFFICULTIES: AiDifficulty[] = ['easy', 'normal', 'hard', 'expert'];
export const AI_PERSONALITIES: AiPersonality[] = ['balanced', 'aggressive', 'defensive', 'center', 'chaotic'];

export function formatAiDifficulty(value: AiDifficulty) {
  if (value === 'easy') return 'Easy';
  if (value === 'normal') return 'Normal';
  if (value === 'hard') return 'Hard';
  return 'Expert';
}

export function formatAiPersonality(value: AiPersonality) {
  if (value === 'balanced') return 'Balanced';
  if (value === 'aggressive') return 'Aggressive';
  if (value === 'defensive') return 'Defensive';
  if (value === 'center') return 'Center Control';
  return 'Chaotic';
}

function isAiDifficulty(value: unknown): value is AiDifficulty {
  return value === 'easy' || value === 'normal' || value === 'hard' || value === 'expert';
}

function isAiPersonality(value: unknown): value is AiPersonality {
  return value === 'balanced' || value === 'aggressive' || value === 'defensive' || value === 'center' || value === 'chaotic';
}

export function getSavedAiSettings(): { difficulty: AiDifficulty; personality: AiPersonality } {
  try {
    const raw = localStorage.getItem(AI_SETTINGS_KEY);
    const parsed = raw ? JSON.parse(raw) as Record<string, unknown> : {};
    const difficulty = isAiDifficulty(parsed.difficulty) ? parsed.difficulty : 'normal';
    const personality = isAiPersonality(parsed.personality) ? parsed.personality : 'balanced';
    return { difficulty, personality };
  } catch {
    return { difficulty: 'normal', personality: 'balanced' };
  }
}

export function saveAiSettings(difficulty: AiDifficulty, personality: AiPersonality) {
  localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify({ difficulty, personality }));
}

export function getAiStats(): AiStats {
  try {
    const raw = localStorage.getItem(AI_STATS_KEY);
    const parsed = raw ? JSON.parse(raw) as Partial<AiStats> : {};
    const settings = getSavedAiSettings();
    return {
      wins: Number(parsed.wins) || 0,
      losses: Number(parsed.losses) || 0,
      streak: Number(parsed.streak) || 0,
      bestWinTurns: typeof parsed.bestWinTurns === 'number' ? parsed.bestWinTurns : null,
      lastDifficulty: isAiDifficulty(parsed.lastDifficulty) ? parsed.lastDifficulty : settings.difficulty,
      lastPersonality: isAiPersonality(parsed.lastPersonality) ? parsed.lastPersonality : settings.personality,
    };
  } catch {
    const settings = getSavedAiSettings();
    return { wins: 0, losses: 0, streak: 0, bestWinTurns: null, lastDifficulty: settings.difficulty, lastPersonality: settings.personality };
  }
}

export function saveAiMatchResult(playerWon: boolean, turns: number, difficulty: AiDifficulty, personality: AiPersonality) {
  const stats = getAiStats();
  if (playerWon) {
    stats.wins += 1;
    stats.streak = Math.max(1, stats.streak + 1);
    stats.bestWinTurns = stats.bestWinTurns === null ? turns : Math.min(stats.bestWinTurns, turns);
  } else {
    stats.losses += 1;
    stats.streak = Math.min(-1, stats.streak - 1);
  }
  stats.lastDifficulty = difficulty;
  stats.lastPersonality = personality;
  localStorage.setItem(AI_STATS_KEY, JSON.stringify(stats));
}

export function getAiDifficultyDescription(value: AiDifficulty) {
  if (value === 'easy') return 'Learns slowly and sometimes chooses weak moves.';
  if (value === 'normal') return 'Uses the current balanced strategy.';
  if (value === 'hard') return 'Stronger scoring with fewer random mistakes.';
  return 'Scores position and checks likely counterplay.';
}

export function getAiPersonalityDescription(value: AiPersonality) {
  if (value === 'aggressive') return 'Prioritizes big conversions.';
  if (value === 'defensive') return 'Protects territory and avoids risky trades.';
  if (value === 'center') return 'Fights hard for the middle of the board.';
  if (value === 'chaotic') return 'More random and unpredictable.';
  return 'Balanced conversions, center control, and safety.';
}

export function formatStars(stars: number) {
  return '★'.repeat(stars) + '☆'.repeat(3 - stars);
}

export { Theme } from './config/theme';
