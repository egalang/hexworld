import Phaser from 'phaser';
import { 
    preloadSoundEffects, 
    BLUE_SOLDIER_KEY,
    RED_SOLDIER_KEY,
} from '../shared';
import blueSoldierUrl from '/assets/blue_01.png';
import redSoldierUrl from '/assets/red_01.png';

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

