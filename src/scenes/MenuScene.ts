import Phaser from 'phaser';
import { unlockAudio, playSound, SOUND_KEYS, COLORS, WIDTH, HEIGHT } from '../shared';
import { MusicManager } from './MusicManager';

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