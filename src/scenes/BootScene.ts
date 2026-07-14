import Phaser from 'phaser';

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
