import Phaser from 'phaser';
import { COLORS, WIDTH, HEIGHT } from '../shared';

export class ProfileScene extends Phaser.Scene {
  constructor() {
    super('ProfileScene');
  }

  create() {
    const g = this.add.graphics();
    g.fillGradientStyle(COLORS.bgTop, COLORS.bgTop, COLORS.bgBottom, COLORS.bgBottom, 1);
    g.fillRect(0, 0, WIDTH, HEIGHT);

    this.add.text(WIDTH / 2, HEIGHT / 2 - 40, 'PLAYER PROFILE', {
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(WIDTH / 2, HEIGHT / 2 + 20, '(Placeholder)', {
      fontSize: '16px',
      color: '#cccccc',
    }).setOrigin(0.5);

    this.createBackButton();
  }

  private createBackButton() {
    const text = this.add.text(WIDTH / 2, HEIGHT - 60, '< Back to World Map', {
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    text.on('pointerdown', () => {
      this.scene.start('WorldMapScene');
    });
  }
}
