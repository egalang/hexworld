import Phaser from 'phaser';
import { 
    preloadSoundEffects, 
    BLUE_SOLDIER_KEY,
    RED_SOLDIER_KEY,
} from '../shared';
import blueSoldierUrl from '/assets/blue_01.png';
import redSoldierUrl from '/assets/red_01.png';
import worldmapBgUrl from '/assets/worldmap_bg.png';
import worldmapTitleUrl from '/assets/worldmap_title.png';
import missionUrl from '/assets/mission.png';
import weaponShopUrl from '/assets/weapon_shop.png';
import profileUrl from '/assets/profile.png';
import inventoryUrl from '/assets/inventory.png';
import settingsUrl from '/assets/settings.png';
import barracksUrl from '/assets/barracks.png';
import arenaUrl from '/assets/arena.png';
import skillShopUrl from '/assets/skill_shop.png';
import arenaBgUrl from '/assets/arena_bg.png';
import battleBgUrl from '/assets/battle_bg.png';

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
    const logo = this.add.image(0, -40, "game-logo")
      .setOrigin(0.5)
      .setScale(0.35);

    //
    // Loading text
    //
    const loadingText = this.add.text(
      0,
      20,
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
      55,
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
        60,
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

    if (!this.textures.exists('worldmap_bg')) {
      this.load.image('worldmap_bg', worldmapBgUrl);
    }

    if (!this.textures.exists('worldmap_title')) {
      this.load.image('worldmap_title', worldmapTitleUrl);
    }

    if (!this.textures.exists('tile_mission')) {
      this.load.image('tile_mission', missionUrl);
    }

    if (!this.textures.exists('tile_weapon_shop')) {
      this.load.image('tile_weapon_shop', weaponShopUrl);
    }

    if (!this.textures.exists('tile_profile')) {
      this.load.image('tile_profile', profileUrl);
    }

    if (!this.textures.exists('tile_inventory')) {
      this.load.image('tile_inventory', inventoryUrl);
    }

    if (!this.textures.exists('tile_settings')) {
      this.load.image('tile_settings', settingsUrl);
    }

    if (!this.textures.exists('tile_training')) {
      this.load.image('tile_training', barracksUrl);
    }

    if (!this.textures.exists('tile_pvp')) {
      this.load.image('tile_pvp', arenaUrl);
    }

    if (!this.textures.exists('tile_skill_shop')) {
      this.load.image('tile_skill_shop', skillShopUrl);
    }

    if (!this.textures.exists('arena_bg')) {
      this.load.image('arena_bg', arenaBgUrl);
    }

    if (!this.textures.exists('battle_bg')) {
      this.load.image('battle_bg', battleBgUrl);
    }
  }

  create() {
    this.scene.start("WorldMapScene");
  }
}

