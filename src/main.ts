import Phaser from 'phaser';
import blueSoldierUrl from '/assets/blue_01.png';
import redSoldierUrl from '/assets/red_01.png';
import { HexConquestScene } from './scenes/HexConquestScene';

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


type OnlineReconnectSession = {
  serverUrl: string;
  roomCode: string;
  playerId: string;
  playerColor: Player;
  savedAt: number;
};

export const WIDTH = 450;
export const HEIGHT = 800;
export const BOARD_RADIUS = 4;
export const HEX_SIZE = 27.5;
export const SQRT3 = Math.sqrt(3);

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

function preloadSoundEffects(scene: Phaser.Scene) {
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
      volume?: number;
    };

    soundManager.mute = false;
    soundManager.volume = Math.max(soundManager.volume ?? 1, 0.85);
    soundManager.unlock?.();

    if (soundManager.context?.state === 'suspended') {
      void soundManager.context.resume();
    }
  } catch {
    // Audio unlock should never block gameplay.
  }
}

export function playSound(scene: Phaser.Scene, key: string, volume = 0.55) {
  try {
    unlockAudio(scene);
    if (!scene.cache.audio.exists(key)) return;
    scene.sound.play(key, { volume });
  } catch {
    // Missing, locked, or unsupported audio should never break gameplay.
  }
}

const DEFAULT_PVP_SERVER_URL = 'http://hex-conquest-pvp-alb-1620546806.ap-southeast-2.elb.amazonaws.com';

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

function getUnlockedCampaignLevel(): number {
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

function getCampaignLevelTitle(level: number): string {
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
  6: { type: 'control_territory', title: 'Dominance', description: 'Control at least 70% of the board.', target: 70, starTurnLimit: 26, starTerritoryPercent: 78 },
  7: { type: 'win_within_turns', title: 'Blitz', description: 'Defeat Red within 15 turns.', target: 15, starTurnLimit: 12, starTerritoryPercent: 70 },
  8: { type: 'survive_turns', title: 'Survival Line', description: 'Survive for 25 turns.', target: 25, starTurnLimit: 25, starTerritoryPercent: 55 },
  9: { type: 'control_territory', title: 'Expansion Master', description: 'Control at least 75% of the board.', target: 75, starTurnLimit: 28, starTerritoryPercent: 82 },
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

function getSavedCampaignStars(level: number): number {
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

const AI_DIFFICULTIES: AiDifficulty[] = ['easy', 'normal', 'hard', 'expert'];
const AI_PERSONALITIES: AiPersonality[] = ['balanced', 'aggressive', 'defensive', 'center', 'chaotic'];

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

function getAiDifficultyDescription(value: AiDifficulty) {
  if (value === 'easy') return 'Learns slowly and sometimes chooses weak moves.';
  if (value === 'normal') return 'Uses the current balanced strategy.';
  if (value === 'hard') return 'Stronger scoring with fewer random mistakes.';
  return 'Scores position and checks likely counterplay.';
}

function getAiPersonalityDescription(value: AiPersonality) {
  if (value === 'aggressive') return 'Prioritizes big conversions.';
  if (value === 'defensive') return 'Protects territory and avoids risky trades.';
  if (value === 'center') return 'Fights hard for the middle of the board.';
  if (value === 'chaotic') return 'More random and unpredictable.';
  return 'Balanced conversions, center control, and safety.';
}

export function formatStars(stars: number) {
  return '★'.repeat(stars) + '☆'.repeat(3 - stars);
}

export const COLORS = {
  bgTop: 0x1db9e8,
  bgBottom: 0x163d5d,
  empty: 0xf1f5e9,
  emptyStroke: 0x1a1a1a,
  blue: 0x1889ff,
  blueDark: 0x003d8f,
  red: 0xff2a2a,
  redDark: 0x8f0000,
  selected: 0xffdf40,
  valid: 0x7cff83,
  panel: 0xffffff,
  text: '#ffffff',
};

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    this.cameras.main.setBackgroundColor("#163d5d");

    // Load ONLY the logo
    this.load.image("game-logo", "/assets/logo.png");
  }

  create() {
    this.cameras.main.fadeIn(200);

    this.scene.start("PreloaderScene");
  }
}

export class PreloaderScene extends Phaser.Scene {
  private progressBar!: Phaser.GameObjects.Graphics;

  constructor() {
    super("PreloaderScene");
  }

  preload() {
    this.cameras.main.setBackgroundColor("#000000");

    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    //
    // Main loading UI container
    //
    const ui = this.add.container(centerX, centerY);

    //
    // Logo
    //
    const logo = this.add.image(0, -170, "game-logo")
      .setOrigin(0.5)
      .setScale(0.35);

    //
    // Title
    //
    const title = this.add.text(
      0,
      10,
      "HEX CONQUEST",
      {
        fontSize: "42px",
        fontStyle: "bold",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 8,
      }
    ).setOrigin(0.5);

    //
    // Loading text
    //
    const loadingText = this.add.text(
      0,
      70,
      "Loading... 0%",
      {
        fontSize: "20px",
        color: "#ffffff",
      }
    ).setOrigin(0.5);

    //
    // Progress box
    //
    const box = this.add.graphics();

    box.fillStyle(0xffffff, 0.20);
    box.fillRoundedRect(
      -170,
      120,
      340,
      22,
      11
    );

    //
    // Progress bar
    //
    this.progressBar = this.add.graphics();

    //
    // Add everything to the container
    //
    ui.add([
      logo,
      title,
      loadingText,
      box,
      this.progressBar,
    ]);

    //
    // Update progress
    //
    this.load.on("progress", (value: number) => {

      this.progressBar.clear();

      this.progressBar.fillStyle(0xffffff);

      this.progressBar.fillRoundedRect(
        -165,
        125,
        330 * value,
        12,
        6
      );

      loadingText.setText(`Loading ${Math.round(value * 100)}%`);
    });

    this.load.on("complete", () => {
      this.progressBar.destroy();
      box.destroy();
    });

    //
    // Load all game assets
    //
    preloadSoundEffects(this);

    if (!this.textures.exists(BLUE_SOLDIER_KEY)) {
      this.load.image(BLUE_SOLDIER_KEY, blueSoldierUrl);
    }

    if (!this.textures.exists(RED_SOLDIER_KEY)) {
      this.load.image(RED_SOLDIER_KEY, redSoldierUrl);
    }

    // Future assets...
    // this.load.image(...)
    // this.load.audio(...)
    // this.load.atlas(...)
    // this.load.spritesheet(...)
  }

  create() {
    this.scene.start("MenuScene");
  }
}

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    this.input.once('pointerdown', () => MusicManager.play(this));
    this.createBackground();

    this.add.text(WIDTH / 2, 76, 'HEX CONQUEST', {
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 7,
    }).setOrigin(0.5);

    this.add.text(WIDTH / 2, 118, 'Move 1 hex. Convert adjacent enemies.', {
      fontSize: '16px',
      color: '#eaf7ff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.add.text(WIDTH / 2, 177, 'SELECT GAME MODE', {
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.createMenuButton(225, 'Campaign', 'Complete levels with increasing difficulty', () => {
      this.scene.start('CampaignLevelSelectScene');
    });

    this.createMenuButton(315, 'Play Against AI', 'Choose difficulty and AI personality', () => {
      this.scene.start('AiSetupScene');
    });

    this.createMenuButton(405, 'Local 2 Player', 'Blue and Red take turns on one device', () => {
      this.scene.start('HexConquestScene', { mode: 'local', campaignLevel: 1 });
    });

    this.createMenuButton(495, 'Play Against Online Player', 'Create or join a private room code', () => {
      this.scene.start('OnlineLobbyScene');
    });

    this.add.text(WIDTH / 2, 690, 'Tip: Press R during a match to restart.', {
      fontSize: '15px',
      color: '#eaf7ff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
  }

  private createBackground() {
    const g = this.add.graphics();
    g.fillGradientStyle(COLORS.bgTop, COLORS.bgTop, COLORS.bgBottom, COLORS.bgBottom, 1);
    g.fillRect(0, 0, WIDTH, HEIGHT);
  }

  private createMenuButton(y: number, title: string, subtitle: string, callback: () => void) {
    const button = this.add.container(WIDTH / 2, y);

    const bg = this.add.graphics();
    bg.fillStyle(0x163d5d, 0.82);
    bg.lineStyle(3, 0xffffff, 0.58);
    bg.fillRoundedRect(-185, -36, 370, 72, 16);
    bg.strokeRoundedRect(-185, -36, 370, 72, 16);

    const titleText = this.add.text(0, -10, title, {
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);

    const subtitleText = this.add.text(0, 17, subtitle, {
      fontSize: '13px',
      color: '#dff5ff',
    }).setOrigin(0.5);

    button.add([bg, titleText, subtitleText]);
    button.setSize(370, 72);
    button.setInteractive({ useHandCursor: true });

    button.on('pointerover', () => {
      button.setScale(1.03);
    });

    button.on('pointerout', () => {
      button.setScale(1);
    });

    button.on('pointerdown', () => {
      unlockAudio(this);
      playSound(this, SOUND_KEYS.confirm, 0.35);
      callback();
    });
  }
}


export class AiSetupScene extends Phaser.Scene {
  private difficulty: AiDifficulty = 'normal';
  private personality: AiPersonality = 'balanced';
  private statusText!: Phaser.GameObjects.Text;
  private statsText!: Phaser.GameObjects.Text;
  private difficultyLabel!: Phaser.GameObjects.Text;
  private personalityLabel!: Phaser.GameObjects.Text;

  constructor() {
    super('AiSetupScene');
  }

  create() {
    const settings = getSavedAiSettings();
    this.difficulty = settings.difficulty;
    this.personality = settings.personality;
    this.input.once('pointerdown', () => unlockAudio(this));

    const g = this.add.graphics();
    g.fillGradientStyle(COLORS.bgTop, COLORS.bgTop, COLORS.bgBottom, COLORS.bgBottom, 1);
    g.fillRect(0, 0, WIDTH, HEIGHT);

    this.add.text(WIDTH / 2, 64, 'PLAYER VS AI', {
      fontSize: '34px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 7,
    }).setOrigin(0.5);

    this.add.text(WIDTH / 2, 105, 'Customize the Red commander.', {
      fontSize: '16px',
      color: '#eaf7ff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    const panel = this.add.graphics();
    panel.fillStyle(0x163d5d, 0.78);
    panel.lineStyle(3, 0xffffff, 0.6);
    panel.fillRoundedRect(24, 135, WIDTH - 48, 420, 18);
    panel.strokeRoundedRect(24, 135, WIDTH - 48, 420, 18);

    this.statsText = this.add.text(WIDTH / 2, 166, '', {
      fontSize: '15px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
      wordWrap: { width: 370 },
    }).setOrigin(0.5);

    this.add.text(WIDTH / 2, 220, 'Difficulty', {
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.difficultyLabel = this.add.text(WIDTH / 2, 258, '', {
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#ffe58a',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.createSmallAiButton(WIDTH / 2 - 120, 258, '◀', () => this.changeDifficulty(-1));
    this.createSmallAiButton(WIDTH / 2 + 120, 258, '▶', () => this.changeDifficulty(1));

    this.add.text(WIDTH / 2, 325, 'Personality', {
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.personalityLabel = this.add.text(WIDTH / 2, 363, '', {
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#ffe58a',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.createSmallAiButton(WIDTH / 2 - 120, 363, '◀', () => this.changePersonality(-1));
    this.createSmallAiButton(WIDTH / 2 + 120, 363, '▶', () => this.changePersonality(1));

    this.statusText = this.add.text(WIDTH / 2, 455, '', {
      fontSize: '14px',
      color: '#eaf7ff',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
      wordWrap: { width: 370 },
    }).setOrigin(0.5);

    this.createWideAiButton(WIDTH / 2, 610, 'Start Match', () => this.startMatch());
    this.createWideAiButton(WIDTH / 2, 685, 'Back to Menu', () => this.scene.start('MenuScene'));

    this.refreshLabels();
  }

  private changeDifficulty(delta: number) {
    const current = AI_DIFFICULTIES.indexOf(this.difficulty);
    const next = (current + delta + AI_DIFFICULTIES.length) % AI_DIFFICULTIES.length;
    this.difficulty = AI_DIFFICULTIES[next];
    playSound(this, SOUND_KEYS.select, 0.35);
    this.refreshLabels();
  }

  private changePersonality(delta: number) {
    const current = AI_PERSONALITIES.indexOf(this.personality);
    const next = (current + delta + AI_PERSONALITIES.length) % AI_PERSONALITIES.length;
    this.personality = AI_PERSONALITIES[next];
    playSound(this, SOUND_KEYS.select, 0.35);
    this.refreshLabels();
  }

  private refreshLabels() {
    const stats = getAiStats();
    this.difficultyLabel.setText(formatAiDifficulty(this.difficulty));
    this.personalityLabel.setText(formatAiPersonality(this.personality));
    this.statsText.setText(
      `Record: ${stats.wins}W - ${stats.losses}L  |  Streak: ${stats.streak}\nBest Win: ${stats.bestWinTurns ?? '-'} turns`
    );
    this.statusText.setText(`${getAiDifficultyDescription(this.difficulty)}\n${getAiPersonalityDescription(this.personality)}`);
  }

  private startMatch() {
    saveAiSettings(this.difficulty, this.personality);
    playSound(this, SOUND_KEYS.confirm, 0.45);
    this.scene.start('HexConquestScene', {
      mode: 'ai',
      campaignLevel: 1,
      aiDifficulty: this.difficulty,
      aiPersonality: this.personality,
    });
  }

  private createSmallAiButton(x: number, y: number, labelText: string, callback: () => void) {
    const button = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(0xb78a55, 1);
    bg.fillRoundedRect(-34, -24, 68, 48, 12);
    const label = this.add.text(0, 0, labelText, {
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);
    button.add([bg, label]);
    button.setSize(68, 48);
    button.setInteractive({ useHandCursor: true });
    button.on('pointerdown', () => {
      unlockAudio(this);
      callback();
    });
  }

  private createWideAiButton(x: number, y: number, labelText: string, callback: () => void) {
    const button = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(0xb78a55, 1);
    bg.fillRoundedRect(-150, -27, 300, 54, 14);
    const label = this.add.text(0, 0, labelText, {
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);
    button.add([bg, label]);
    button.setSize(300, 54);
    button.setInteractive({ useHandCursor: true });
    button.on('pointerdown', () => {
      unlockAudio(this);
      playSound(this, SOUND_KEYS.confirm, 0.35);
      callback();
    });
  }
}


export class CampaignLevelSelectScene extends Phaser.Scene {
  private unlockedLevel = 1;

  constructor() {
    super('CampaignLevelSelectScene');
  }

  create() {
    this.unlockedLevel = getUnlockedCampaignLevel();
    this.input.once('pointerdown', () => unlockAudio(this));

    const g = this.add.graphics();
    g.fillGradientStyle(COLORS.bgTop, COLORS.bgTop, COLORS.bgBottom, COLORS.bgBottom, 1);
    g.fillRect(0, 0, WIDTH, HEIGHT);

    this.add.text(WIDTH / 2, 64, 'CAMPAIGN', {
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 7,
    }).setOrigin(0.5);

    this.add.text(WIDTH / 2, 106, `Unlocked up to Level ${this.unlockedLevel}`, {
      fontSize: '17px',
      color: '#eaf7ff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    const panel = this.add.graphics();
    panel.fillStyle(0x163d5d, 0.78);
    panel.lineStyle(3, 0xffffff, 0.6);
    panel.fillRoundedRect(24, 135, WIDTH - 48, 475, 18);
    panel.strokeRoundedRect(24, 135, WIDTH - 48, 475, 18);

    this.add.text(WIDTH / 2, 160, 'SELECT LEVEL', {
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.createLevelGrid();
    this.createSmallCampaignButton(WIDTH / 2, 680, 'Back to Menu', () => this.scene.start('MenuScene'));
  }

  private createLevelGrid() {
    const cols = 4;
    const cellW = 82;
    const cellH = 70;
    const startX = WIDTH / 2 - (cellW * (cols - 1)) / 2;
    const startY = 215;

    for (let level = 1; level <= CAMPAIGN_MAX_LEVEL; level++) {
      const index = level - 1;
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = startX + col * cellW;
      const y = startY + row * cellH;
      const unlocked = level <= this.unlockedLevel;
      const isNext = level === this.unlockedLevel;
      this.createLevelCard(x, y, level, unlocked, isNext);
    }
  }

  private createLevelCard(x: number, y: number, level: number, unlocked: boolean, isNext: boolean) {
    const card = this.add.container(x, y);
    const bg = this.add.graphics();

    bg.fillStyle(unlocked ? (isNext ? 0xb78a55 : 0xffffff) : 0x777777, unlocked ? (isNext ? 1 : 0.18) : 0.42);
    bg.lineStyle(2, unlocked ? 0xffffff : 0x444444, unlocked ? 0.75 : 0.55);
    bg.fillRoundedRect(-34, -27, 68, 54, 12);
    bg.strokeRoundedRect(-34, -27, 68, 54, 12);

    const title = this.add.text(0, -8, unlocked ? String(level) : '🔒', {
      fontSize: unlocked ? '24px' : '20px',
      fontStyle: 'bold',
      color: unlocked && isNext ? '#ffffff' : unlocked ? '#ffffff' : '#d0d0d0',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    const savedStars = getSavedCampaignStars(level);
    const subtitle = this.add.text(0, 15, unlocked ? formatStars(savedStars) : 'Locked', {
      fontSize: unlocked ? '11px' : '10px',
      color: unlocked ? '#ffe58a' : '#cccccc',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    card.add([bg, title, subtitle]);
    card.setSize(68, 54);

    if (unlocked) {
      card.setInteractive({ useHandCursor: true });
      card.on('pointerdown', () => {
        unlockAudio(this);
        playSound(this, SOUND_KEYS.confirm, 0.4);
        this.scene.start('HexConquestScene', { mode: 'campaign', campaignLevel: level });
      });
    } else {
      card.setAlpha(0.75);
    }
  }

  private getDifficultyLabel(level: number) {
    if (level <= 2) return 'Easy';
    if (level <= 5) return 'Normal';
    if (level <= 10) return 'Hard';
    if (level <= 15) return 'Expert';
    return 'Boss';
  }

  private createSmallCampaignButton(x: number, y: number, labelText: string, callback: () => void) {
    const button = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(0xb78a55, 1);
    bg.fillRoundedRect(-150, -27, 300, 54, 14);

    const label = this.add.text(0, 0, labelText, {
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);

    button.add([bg, label]);
    button.setSize(300, 54);
    button.setInteractive({ useHandCursor: true });
    button.on('pointerdown', () => {
      unlockAudio(this);
      playSound(this, SOUND_KEYS.confirm, 0.35);
      callback();
    });
  }
}

type OnlineRoomSummary = {
  room_code: string;
  red_joined?: boolean;
  game_over?: boolean;
  current_player?: Player;
  turn?: number;
  counts?: { blue: number; red: number };
  updated_at?: number;
};

function getRoomCodeFromUnknown(value: unknown): string | null {
  if (typeof value === 'string') return value.trim().toUpperCase() || null;
  if (!value || typeof value !== 'object') return null;

  const record = value as Record<string, unknown>;
  const possible = record.room_code ?? record.roomCode ?? record.code ?? record.id;
  return typeof possible === 'string' ? possible.trim().toUpperCase() || null : null;
}

function parseRoomList(payload: unknown): OnlineRoomSummary[] {
  const source = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object'
      ? ((payload as Record<string, unknown>).rooms ?? (payload as Record<string, unknown>).available_rooms ?? [])
      : [];

  if (!Array.isArray(source)) return [];

  const seen = new Set<string>();
  const rooms: OnlineRoomSummary[] = [];

  for (const item of source) {
    const code = getRoomCodeFromUnknown(item);
    if (!code || seen.has(code)) continue;
    seen.add(code);

    const record = item && typeof item === 'object' ? item as Partial<OnlineRoomSummary> : {};
    rooms.push({
      room_code: code,
      red_joined: Boolean(record.red_joined),
      game_over: Boolean(record.game_over),
      current_player: record.current_player,
      turn: typeof record.turn === 'number' ? record.turn : undefined,
      counts: record.counts,
      updated_at: typeof record.updated_at === 'number' ? record.updated_at : undefined,
    });
  }

  return rooms.sort((a, b) => (b.updated_at ?? 0) - (a.updated_at ?? 0));
}

function isRoomJoinable(room: OnlineRoomSummary | undefined) {
  return Boolean(room && !room.red_joined && !room.game_over);
}

function getRoomStatus(room: OnlineRoomSummary) {
  if (room.game_over) return 'Finished';
  if (room.red_joined) return 'In Progress';
  return 'Waiting';
}

function getRoomStatusColor(room: OnlineRoomSummary) {
  if (room.game_over) return '#c7c7c7';
  if (room.red_joined) return '#7cc3ff';
  return '#7cff83';
}

function countJoinableRooms(rooms: OnlineRoomSummary[]) {
  return rooms.filter(isRoomJoinable).length;
}

export class OnlineLobbyScene extends Phaser.Scene {
  private serverUrl = DEFAULT_PVP_SERVER_URL;
  private statusText!: Phaser.GameObjects.Text;
  private selectedRoomCode = '';
  private availableRooms: OnlineRoomSummary[] = [];
  private roomRows: Phaser.GameObjects.Container[] = [];
  private joinButton?: Phaser.GameObjects.Container;
  private joinButtonBg?: Phaser.GameObjects.Graphics;
  private joinButtonLabel?: Phaser.GameObjects.Text;
  private refreshEvent?: Phaser.Time.TimerEvent;

  constructor() {
    super('OnlineLobbyScene');
  }

  create() {
    this.input.once('pointerdown', () => unlockAudio(this));
    const g = this.add.graphics();
    g.fillGradientStyle(COLORS.bgTop, COLORS.bgTop, COLORS.bgBottom, COLORS.bgBottom, 1);
    g.fillRect(0, 0, WIDTH, HEIGHT);

    this.add.text(WIDTH / 2, 72, 'ONLINE PVP', {
      fontSize: '34px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 7,
    }).setOrigin(0.5);

    this.add.text(WIDTH / 2, 116, 'Browse rooms. Join only rooms marked Waiting.', {
      fontSize: '15px',
      color: '#eaf7ff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    const panel = this.add.graphics();
    panel.fillStyle(0x163d5d, 0.78);
    panel.lineStyle(3, 0xffffff, 0.6);
    panel.fillRoundedRect(24, 145, WIDTH - 48, 300, 18);
    panel.strokeRoundedRect(24, 145, WIDTH - 48, 300, 18);

    this.statusText = this.add.text(WIDTH / 2, 172, 'Loading rooms...', {
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
      wordWrap: { width: 370 },
    }).setOrigin(0.5);

    this.createLobbyButton(500, 'Create Room', () => this.createRoom());

    const join = this.createLobbyButton(590, 'Join Room', () => this.joinSelectedRoom(), false);
    this.joinButton = join.button;
    this.joinButtonBg = join.bg;
    this.joinButtonLabel = join.label;

    this.createLobbyButton(680, 'Back to Menu', () => this.scene.start('MenuScene'));

    this.loadAvailableRooms();
    this.refreshEvent = this.time.addEvent({
      delay: 3500,
      loop: true,
      callback: () => this.loadAvailableRooms(false),
    });
  }

  shutdown() {
    this.refreshEvent?.remove(false);
  }

  private createLobbyButton(y: number, labelText: string, callback: () => void, enabled = true) {
    const button = this.add.container(WIDTH / 2, y);
    const bg = this.add.graphics();
    const label = this.add.text(0, 0, labelText, {
      fontSize: '23px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);

    button.add([bg, label]);
    button.setSize(310, 58);
    button.on('pointerdown', () => {
      unlockAudio(this);
      if (enabled || button.getData('enabled')) {
        callback();
      } else {
        playSound(this, SOUND_KEYS.invalid, 0.35);
      }
    });

    this.setButtonEnabled(button, bg, label, enabled);
    return { button, bg, label };
  }

  private setButtonEnabled(
    button: Phaser.GameObjects.Container,
    bg: Phaser.GameObjects.Graphics,
    label: Phaser.GameObjects.Text,
    enabled: boolean
  ) {
    bg.clear();
    bg.fillStyle(enabled ? 0xb78a55 : 0x7f7f7f, enabled ? 1 : 0.72);
    bg.fillRoundedRect(-155, -29, 310, 58, 14);
    label.setAlpha(enabled ? 1 : 0.58);
    button.setAlpha(enabled ? 1 : 0.86);
    button.setData('enabled', enabled);
    button.setInteractive({ useHandCursor: enabled });
  }

  private setStatus(text: string) {
    this.statusText.setText(text);
  }

  private async loadAvailableRooms(showLoading = true) {
    if (showLoading) this.setStatus('Loading rooms...');

    try {
      const rooms = await this.fetchAvailableRooms();
      this.availableRooms = rooms;

      if (this.selectedRoomCode && !rooms.some(room => room.room_code === this.selectedRoomCode)) {
        this.selectedRoomCode = '';
      }

      this.renderRoomList();
      this.updateJoinButton();

      const joinableCount = countJoinableRooms(rooms);
      const selectedRoom = this.getSelectedRoom();

      if (!rooms.length) {
        this.setStatus('No rooms yet. Create a room to start.');
      } else if (selectedRoom) {
        const status = getRoomStatus(selectedRoom);
        this.setStatus(
          isRoomJoinable(selectedRoom)
            ? `Selected ${selectedRoom.room_code} — Waiting. Ready to join.`
            : `Selected ${selectedRoom.room_code} — ${status}. Cannot join.`
        );
      } else {
        this.setStatus(`Rooms: ${rooms.length} total, ${joinableCount} waiting. Select a Waiting room to join.`);
      }
    } catch (error) {
      this.availableRooms = [];
      this.selectedRoomCode = '';
      this.renderRoomList();
      this.updateJoinButton();
      this.setStatus(`Could not load rooms.\n${String(error).slice(0, 120)}`);
    }
  }

  private async fetchAvailableRooms() {
    // Prefer /rooms/list because it should return all rooms: Waiting, In Progress, and Finished.
    // Fallback endpoints are kept for older backend deployments.
    const endpoints = ['/rooms/list', '/rooms/available', '/rooms'];
    let lastError = '';

    for (const endpoint of endpoints) {
      try {
        const res = await fetch(`${this.serverUrl}${endpoint}`);
        if (!res.ok) {
          lastError = await res.text();
          continue;
        }

        const payload = await res.json();
        return parseRoomList(payload);
      } catch (error) {
        lastError = String(error);
      }
    }

    throw new Error(lastError || 'Room list endpoint is unavailable.');
  }

  private renderRoomList() {
    for (const row of this.roomRows) row.destroy();
    this.roomRows = [];

    const header = this.add.container(WIDTH / 2, 207);
    const headerRoom = this.add.text(-140, 0, 'ROOM', {
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#dff5ff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0, 0.5);
    const headerTurn = this.add.text(-25, 0, 'TURN', {
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#dff5ff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0, 0.5);
    const headerStatus = this.add.text(70, 0, 'STATUS', {
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#dff5ff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0, 0.5);
    header.add([headerRoom, headerTurn, headerStatus]);
    this.roomRows.push(header);

    const maxRows = 6;
    const rooms = this.availableRooms.slice(0, maxRows);

    if (!rooms.length) {
      const empty = this.add.text(WIDTH / 2, 295, 'No rooms found.', {
        fontSize: '18px',
        color: '#dff5ff',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5);
      const holder = this.add.container(0, 0, [empty]);
      this.roomRows.push(holder);
      return;
    }

    rooms.forEach((room, index) => {
      const y = 238 + index * 35;
      const selected = room.room_code === this.selectedRoomCode;
      const joinable = isRoomJoinable(room);
      const status = getRoomStatus(room);
      const row = this.add.container(WIDTH / 2, y);

      const bg = this.add.graphics();
      bg.fillStyle(selected ? COLORS.selected : 0xffffff, selected ? 0.92 : 0.14);
      bg.lineStyle(2, selected ? 0xffffff : 0xdff5ff, selected ? 0.9 : 0.28);
      bg.fillRoundedRect(-180, -16, 360, 32, 10);
      bg.strokeRoundedRect(-180, -16, 360, 32, 10);

      const textColor = selected ? '#102235' : '#ffffff';
      const strokeColor = selected ? '#ffffff' : '#000000';
      const statusColor = selected ? '#102235' : getRoomStatusColor(room);

      const roomText = this.add.text(-165, 0, room.room_code, {
        fontSize: '16px',
        fontStyle: selected ? 'bold' : 'normal',
        color: textColor,
        stroke: strokeColor,
        strokeThickness: selected ? 1 : 3,
      }).setOrigin(0, 0.5);

      const turnText = this.add.text(-55, 0, String(room.turn ?? '-'), {
        fontSize: '16px',
        color: textColor,
        stroke: strokeColor,
        strokeThickness: selected ? 1 : 3,
      }).setOrigin(0, 0.5);

      const statusText = this.add.text(30, 0, status, {
        fontSize: '15px',
        fontStyle: joinable ? 'bold' : 'normal',
        color: statusColor,
        stroke: strokeColor,
        strokeThickness: selected ? 1 : 3,
      }).setOrigin(0, 0.5);

      row.add([bg, roomText, turnText, statusText]);
      row.setSize(360, 32);
      row.setInteractive({ useHandCursor: true });
      row.on('pointerdown', () => {
        playSound(this, joinable ? SOUND_KEYS.select : SOUND_KEYS.invalid, joinable ? 0.45 : 0.28);
        this.selectedRoomCode = room.room_code;
        this.renderRoomList();
        this.updateJoinButton();
        this.setStatus(joinable
          ? `Selected ${room.room_code} — Waiting. Ready to join.`
          : `Selected ${room.room_code} — ${status}. Cannot join.`
        );
      });

      this.roomRows.push(row);
    });
  }

  private getSelectedRoom() {
    return this.availableRooms.find(room => room.room_code === this.selectedRoomCode);
  }

  private updateJoinButton() {
    if (!this.joinButton || !this.joinButtonBg || !this.joinButtonLabel) return;
    this.setButtonEnabled(
      this.joinButton,
      this.joinButtonBg,
      this.joinButtonLabel,
      isRoomJoinable(this.getSelectedRoom())
    );
  }

  private async createRoom() {
    try {
      this.setStatus('Creating room...');

      const res = await fetch(`${this.serverUrl}/rooms/create`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error(await res.text());

      const state: OnlineRoomState = await res.json();
      playSound(this, SOUND_KEYS.confirm, 0.55);
      if (state.player_id && state.player_color) {
        saveReconnectSession({
          serverUrl: this.serverUrl,
          roomCode: state.room_code,
          playerId: state.player_id,
          playerColor: state.player_color,
        });
      }
      this.scene.start('HexConquestScene', {
        mode: 'online',
        onlineServerUrl: this.serverUrl,
        roomCode: state.room_code,
        playerId: state.player_id,
        playerColor: state.player_color,
      });
    } catch (error) {
      this.setStatus(`Create room failed:\n${String(error).slice(0, 160)}`);
    }
  }

  private async joinSelectedRoom() {
    const selectedRoom = this.getSelectedRoom();
    if (!this.selectedRoomCode || !isRoomJoinable(selectedRoom)) {
      playSound(this, SOUND_KEYS.invalid, 0.35);
      if (selectedRoom) {
        this.setStatus(`Selected ${selectedRoom.room_code} — ${getRoomStatus(selectedRoom)}. Cannot join.`);
      }
      return;
    }

    try {
      const code = this.selectedRoomCode.trim().toUpperCase();
      this.setStatus(`Joining ${code}...`);

      const res = await fetch(`${this.serverUrl}/rooms/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_code: code }),
      });

      if (!res.ok) throw new Error(await res.text());

      const state: OnlineRoomState = await res.json();
      playSound(this, SOUND_KEYS.confirm, 0.55);
      if (state.player_id && state.player_color) {
        saveReconnectSession({
          serverUrl: this.serverUrl,
          roomCode: state.room_code,
          playerId: state.player_id,
          playerColor: state.player_color,
        });
      }
      this.scene.start('HexConquestScene', {
        mode: 'online',
        onlineServerUrl: this.serverUrl,
        roomCode: state.room_code,
        playerId: state.player_id,
        playerColor: state.player_color,
      });
    } catch (error) {
      this.setStatus(`Join room failed:\n${String(error).slice(0, 160)}`);
      this.loadAvailableRooms(false);
    }
  }
}

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: WIDTH,
    height: HEIGHT,
    parent: 'game',
    backgroundColor: '#101826',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BootScene, PreloaderScene, MenuScene, AiSetupScene, CampaignLevelSelectScene, OnlineLobbyScene, HexConquestScene],
};

new Phaser.Game(config);

class MusicManager {
    private static music: Phaser.Sound.BaseSound | null = null;

    static play(scene: Phaser.Scene) {
        unlockAudio(scene);

        if (this.music?.isPlaying) return;

        this.music = scene.sound.add('bgm', {
            loop: true,
            volume: 0.25
        });

        this.music.play();
    }

    static stop() {
        this.music?.stop();
        this.music?.destroy();
        this.music = null;
    }
}
