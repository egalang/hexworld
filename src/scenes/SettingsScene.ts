import Phaser from 'phaser';
import { WIDTH, HEIGHT, playSound, SOUND_KEYS } from '../shared';
import { Theme } from '../config/theme';
import { getSettings, updateMusicVolume, updateSfxVolume, toggleFullscreen } from '../state/Settings';
import { getName, setName } from '../state/PlayerProfile';
import { MusicManager } from './MusicManager';

const ROW_START_Y = 110;
const ROW_H = 80;
const BAR_W = 160;
const BAR_H = 16;

export class SettingsScene extends Phaser.Scene {
  private settings = getSettings();

  constructor() {
    super('SettingsScene');
  }

  create() {
    this.add.image(WIDTH / 2, HEIGHT / 2, 'arena_bg').setDisplaySize(WIDTH, HEIGHT);

    this.add.text(WIDTH / 2, 50, 'SETTINGS', {
      fontSize: '28px',
      fontStyle: 'bold',
      color: Theme.ui.textTitle,
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5);

    this.settings = getSettings();

    this.createNameRow();
    this.createVolumeRow(ROW_START_Y, 'Music Volume', this.settings.musicVolume, (v) => {
      updateMusicVolume(v);
      MusicManager.setVolume(v);
      this.refresh();
    });
    this.createVolumeRow(ROW_START_Y + ROW_H, 'SFX Volume', this.settings.sfxVolume, (v) => {
      updateSfxVolume(v);
      this.refresh();
    });
    this.createFullscreenRow(ROW_START_Y + ROW_H * 2);
    this.createBackButton();
  }

  private createNameRow() {
    const y = ROW_START_Y + ROW_H * 3;

    const panelColor = Phaser.Display.Color.HexStringToColor(Theme.ui.panel).color;
    const borderColor = Phaser.Display.Color.HexStringToColor(Theme.ui.border).color;

    const bg = this.add.graphics();
    bg.fillStyle(panelColor, 0.9);
    bg.lineStyle(2, borderColor, 0.5);
    bg.fillRoundedRect(20, y, WIDTH - 40, ROW_H - 4, 10);
    bg.strokeRoundedRect(20, y, WIDTH - 40, ROW_H - 4, 10);

    this.add.text(36, y + 10, 'Player Name', {
      fontSize: '15px',
      fontStyle: 'bold',
      color: Theme.ui.text,
      stroke: '#000000',
      strokeThickness: 2,
    });

    const nameText = this.add.text(36, y + 38, getName(), {
      fontSize: '18px',
      fontStyle: 'bold',
      color: Theme.brand.goldLight,
      stroke: '#000000',
      strokeThickness: 2,
    }).setInteractive({ useHandCursor: true });

    nameText.on('pointerdown', () => {
      playSound(this, SOUND_KEYS.confirm, 0.35);
      const newName = window.prompt('Enter your name:', getName());
      if (newName && newName.trim().length > 0) {
        setName(newName.trim());
        nameText.setText(getName());
      }
    });

    const hint = this.add.text(WIDTH - 36, y + 10, 'Tap to edit', {
      fontSize: '12px',
      color: Theme.ui.textDescription,
      stroke: '#000000',
      strokeThickness: 1,
    }).setOrigin(1, 0);
  }

  private createVolumeRow(y: number, label: string, current: number, onChange: (v: number) => void) {
    const panelColor = Phaser.Display.Color.HexStringToColor(Theme.ui.panel).color;
    const borderColor = Phaser.Display.Color.HexStringToColor(Theme.ui.border).color;

    const bg = this.add.graphics();
    bg.fillStyle(panelColor, 0.9);
    bg.lineStyle(2, borderColor, 0.5);
    bg.fillRoundedRect(20, y, WIDTH - 40, ROW_H - 4, 10);
    bg.strokeRoundedRect(20, y, WIDTH - 40, ROW_H - 4, 10);

    this.add.text(36, y + 8, label, {
      fontSize: '15px',
      fontStyle: 'bold',
      color: Theme.ui.text,
      stroke: '#000000',
      strokeThickness: 2,
    });

    const steps = [0, 0.25, 0.5, 0.75, 1];

    const goldInt = Phaser.Display.Color.HexStringToColor(Theme.brand.gold).color;
    const goldLightInt = Phaser.Display.Color.HexStringToColor(Theme.brand.goldLight).color;

    const barX = WIDTH / 2 - BAR_W / 2;
    const barY = y + ROW_H / 2 - BAR_H / 2 + 6;

    const barBg = this.add.graphics();
    barBg.fillStyle(0x000000, 0.5);
    barBg.fillRoundedRect(barX, barY, BAR_W, BAR_H, 6);

    if (current > 0) {
      const fill = this.add.graphics();
      fill.fillStyle(current > 0.5 ? goldLightInt : goldInt, 1);
      fill.fillRoundedRect(barX + 2, barY + 2, Math.max(4, (BAR_W - 4) * current), BAR_H - 4, 4);
    }

    const barBorder = this.add.graphics();
    barBorder.lineStyle(1, borderColor, 0.4);
    barBorder.strokeRoundedRect(barX, barY, BAR_W, BAR_H, 6);

    this.add.text(WIDTH / 2, barY + BAR_H / 2, `${Math.round(current * 100)}%`, {
      fontSize: '11px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1,
    }).setOrigin(0.5);

    const makeStepButton = (bx: number, dir: number) => {
      const btn = this.add.text(bx, barY + BAR_H / 2, dir < 0 ? '<' : '>', {
        fontSize: '22px',
        fontStyle: 'bold',
        color: Theme.ui.text,
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      btn.on('pointerdown', () => {
        playSound(this, SOUND_KEYS.select, 0.35);
        const cur = getSettings()[label === 'Music Volume' ? 'musicVolume' : 'sfxVolume'];
        const curIdx = steps.reduce((best, s, i) => Math.abs(s - cur) < Math.abs(steps[best] - cur) ? i : best, 0);
        const nextIdx = Math.min(steps.length - 1, Math.max(0, curIdx + dir));
        if (nextIdx !== curIdx) {
          onChange(steps[nextIdx]);
        }
      });

      return btn;
    };

    makeStepButton(barX - 22, -1);
    makeStepButton(barX + BAR_W + 22, 1);
  }

  private createFullscreenRow(y: number) {
    const panelColor = Phaser.Display.Color.HexStringToColor(Theme.ui.panel).color;
    const borderColor = Phaser.Display.Color.HexStringToColor(Theme.ui.border).color;

    const bg = this.add.graphics();
    bg.fillStyle(panelColor, 0.9);
    bg.lineStyle(2, borderColor, 0.5);
    bg.fillRoundedRect(20, y, WIDTH - 40, ROW_H - 4, 10);
    bg.strokeRoundedRect(20, y, WIDTH - 40, ROW_H - 4, 10);

    this.add.text(36, y + 22, 'Fullscreen', {
      fontSize: '15px',
      fontStyle: 'bold',
      color: Theme.ui.text,
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0, 0.5);

    const isOn = getSettings().fullscreen;
    const toggleText = this.add.text(WIDTH - 55, y + ROW_H / 2 - 2, isOn ? 'ON' : 'OFF', {
      fontSize: '18px',
      fontStyle: 'bold',
      color: isOn ? Theme.status.victory : Theme.status.defeat,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    toggleText.on('pointerdown', () => {
      playSound(this, SOUND_KEYS.confirm, 0.35);
      this.scale.toggleFullscreen();
      toggleFullscreen();
      this.refresh();
    });
  }

  private createBackButton() {
    const text = this.add.text(WIDTH / 2, HEIGHT - 40, '< Back to World Map', {
      fontSize: '18px',
      color: Theme.ui.text,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    text.on('pointerdown', () => {
      playSound(this, SOUND_KEYS.confirm, 0.35);
      this.scene.start('WorldMapScene');
    });
  }

  private refresh() {
    this.scene.restart();
  }
}
