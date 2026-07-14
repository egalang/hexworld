import Phaser from 'phaser';
import { HexConquestScene } from './scenes/HexConquestScene';
import { BootScene } from './scenes/BootScene';
import { PreloaderScene } from './scenes/PreLoaderScene';
import { MenuScene } from './scenes/MenuScene';
import { OnlineLobbyScene } from './scenes/OnlineLobbyScene';
import { AiSetupScene } from './scenes/AISetupScene';
import { CampaignLevelSelectScene } from './scenes/CampaignLevelSelectScene';
import { WorldMapScene } from './scenes/WorldMapScene';
import { ProfileScene } from './scenes/ProfileScene';
import { InventoryScene } from './scenes/InventoryScene';
import { SettingsScene } from './scenes/SettingsScene';
import { ShopScene } from './scenes/ShopScene';
import {
  WIDTH,
  HEIGHT,
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
    scene: [BootScene, PreloaderScene, MenuScene, WorldMapScene, ProfileScene, InventoryScene, SettingsScene, ShopScene, AiSetupScene, CampaignLevelSelectScene, OnlineLobbyScene, HexConquestScene],
};

new Phaser.Game(config);