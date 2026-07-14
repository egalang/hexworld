import Phaser from 'phaser';
import { HexConquestScene } from './scenes/HexConquestScene';
import { BootScene } from './scenes/BootScene';
import { PreloaderScene } from './scenes/PreLoaderScene';
import { MenuScene } from './scenes/MenuScene';
import { OnlineLobbyScene } from './scenes/OnlineLobbyScene';
import { AiSetupScene } from './scenes/AISetupScene';
import { CampaignLevelSelectScene } from './scenes/CampaignLevelSelectScene';
import {
  WIDTH,
  HEIGHT,
  BOARD_RADIUS,
  HEX_SIZE,
  SQRT3,
  BLUE_SOLDIER_KEY,
  RED_SOLDIER_KEY,
  SOUND_KEYS,
  COLORS,
  DEFAULT_PVP_SERVER_URL,
  preloadSoundEffects,
  unlockAudio,
  playSound,
  saveReconnectSession,
  clearReconnectSession,
  CAMPAIGN_MAX_LEVEL,
  saveUnlockedCampaignLevel,
  getUnlockedCampaignLevel,
  getSavedCampaignStars,
  saveCampaignStars,
  getCampaignObjective,
  formatStars,
  getSavedAiSettings,
  saveAiSettings,
  getAiStats,
  saveAiMatchResult,
  AI_DIFFICULTIES,
  AI_PERSONALITIES,
  formatAiDifficulty,
  formatAiPersonality,
  getAiDifficultyDescription,
  getAiPersonalityDescription,
  type Player,
  type Owner,
  type GameMode,
  type Hex,
  type OnlineRoomState,
  type CampaignObjective,
  type AiDifficulty,
  type AiPersonality,
} from './shared';

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