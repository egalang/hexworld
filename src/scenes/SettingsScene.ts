import Phaser from 'phaser';
import { WIDTH, HEIGHT } from '../shared';
import { Theme } from '../config/theme';

export class SettingsScene extends Phaser.Scene {
  constructor() {
    super('SettingsScene');
  }

  create() {
    const g = this.add.graphics();
    g.fillStyle(Phaser.Display.Color.HexStringToColor(Theme.ui.background).color, 1);
    g.fillRect(0, 0, WIDTH, HEIGHT);

    this.add.text(WIDTH / 2, HEIGHT / 2 - 40, 'SETTINGS', {
      fontSize: '28px',
      fontStyle: 'bold',
      color: Theme.ui.textTitle,
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(WIDTH / 2, HEIGHT / 2 + 20, '(Placeholder)', {
      fontSize: '16px',
      color: Theme.ui.textSecondary,
    }).setOrigin(0.5);

    this.createBackButton();
  }

  private createBackButton() {
    const text = this.add.text(WIDTH / 2, HEIGHT - 60, '< Back to World Map', {
      fontSize: '18px',
      color: Theme.ui.text,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    text.on('pointerdown', () => {
      this.scene.start('WorldMapScene');
    });
  }
}
