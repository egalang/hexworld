import Phaser from 'phaser';
import { WIDTH, HEIGHT } from '../shared';
import { Theme } from '../config/theme';
import { MISSIONS } from '../data/missions';
import {
  getProfile,
  getName,
  getLevel,
  getGold,
  getXpProgress,
  getCompletedMissionIds,
  getStatistics,
} from '../state/PlayerProfile';

export class ProfileScene extends Phaser.Scene {
  constructor() {
    super('ProfileScene');
  }

  create() {
    const bgColor = Phaser.Display.Color.HexStringToColor(Theme.ui.background).color;
    const panelColor = Phaser.Display.Color.HexStringToColor(Theme.ui.panel).color;
    const borderColor = Phaser.Display.Color.HexStringToColor(Theme.ui.border).color;

    const g = this.add.graphics();
    g.fillStyle(bgColor, 1);
    g.fillRect(0, 0, WIDTH, HEIGHT);

    const profile = getProfile();
    const xpProgress = getXpProgress();
    const completedIds = getCompletedMissionIds();
    const stats = getStatistics();

    this.addText(WIDTH / 2, 56, 'COMMANDER PROFILE', '26px', Theme.ui.textTitle, true);

    const portraitY = 110;
    const portrait = this.add.graphics();
    portrait.fillStyle(borderColor, 0.8);
    portrait.fillCircle(WIDTH / 2, portraitY, 38);
    portrait.fillStyle(panelColor, 1);
    portrait.fillCircle(WIDTH / 2, portraitY, 34);

    this.addText(WIDTH / 2, portraitY + 50, getName(), '22px', Theme.ui.text, true);

    const panel = this.add.graphics();
    panel.fillStyle(panelColor, 0.92);
    panel.lineStyle(2, borderColor, 0.6);
    panel.fillRoundedRect(20, 190, WIDTH - 40, 380, 16);
    panel.strokeRoundedRect(20, 190, WIDTH - 40, 380, 16);

    this.addText(WIDTH / 2, 220, `Level ${getLevel()}`, '28px', Theme.brand.goldLight, true);

    this.drawXpBar(WIDTH / 2, 260, xpProgress);

    this.addText(WIDTH / 2, 295, `Gold: ${getGold()}`, '20px', Theme.reward.gold, true);

    const totalMissions = MISSIONS.length;
    const completedCount = completedIds.length;
    this.addText(WIDTH / 2, 330, `Campaign: ${completedCount} / ${totalMissions} Missions`, '17px', Theme.ui.textSecondary);

    const lineY = 360;
    const line = this.add.graphics();
    line.lineStyle(1, borderColor, 0.3);
    line.beginPath();
    line.moveTo(50, lineY);
    line.lineTo(WIDTH - 50, lineY);
    line.strokePath();

    this.addText(WIDTH / 2, 385, 'Statistics', '18px', Theme.ui.textTitle, true);

    const statData = [
      { label: 'Missions Won', value: String(stats.missionsWon), color: Theme.status.victory },
      { label: 'Missions Lost', value: String(stats.missionsLost), color: Theme.status.defeat },
      { label: 'Total Gold Earned', value: String(stats.totalGoldEarned), color: Theme.reward.gold },
      { label: 'Total XP Earned', value: String(stats.totalXPEarned), color: Theme.reward.xp },
    ];

    const statStartY = 420;
    for (let i = 0; i < statData.length; i++) {
      const y = statStartY + i * 32;
      this.addText(36, y, statData[i].label, '15px', Theme.ui.text, false, undefined, undefined, 'left');
      this.addText(WIDTH - 36, y, statData[i].value, '15px', statData[i].color, true, '#000000', 2, 'right');
    }

    this.createBackButton();
  }

  private drawXpBar(cx: number, y: number, progress: { current: number; needed: number }) {
    const barWidth = 280;
    const barHeight = 18;
    const x = cx - barWidth / 2;
    const fraction = progress.needed > 0 ? Math.min(progress.current / progress.needed, 1) : 0;
    const borderColor = Phaser.Display.Color.HexStringToColor(Theme.ui.border).color;
    const goldInt = Phaser.Display.Color.HexStringToColor(Theme.brand.gold).color;
    const goldLightInt = Phaser.Display.Color.HexStringToColor(Theme.brand.goldLight).color;

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.5);
    bg.fillRoundedRect(x, y, barWidth, barHeight, 6);

    if (fraction > 0) {
      const fill = this.add.graphics();
      fill.fillStyle(goldInt, 1);
      if (fraction > 0.5) {
        fill.fillStyle(goldLightInt, 1);
      }
      fill.fillRoundedRect(x + 2, y + 2, Math.max(4, (barWidth - 4) * fraction), barHeight - 4, 4);
    }

    const border = this.add.graphics();
    border.lineStyle(2, borderColor, 0.6);
    border.strokeRoundedRect(x, y, barWidth, barHeight, 6);

    this.addText(cx, y + barHeight / 2, `${progress.current} / ${progress.needed} XP`, '11px', '#ffffff');
  }

  private createBackButton() {
    const text = this.add.text(WIDTH / 2, HEIGHT - 40, '< Back to World Map', {
      fontSize: '18px',
      color: Theme.ui.text,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    text.on('pointerdown', () => {
      this.scene.start('WorldMapScene');
    });
  }

  private addText(
    x: number, y: number, label: string,
    fontSize: string, color: string, bold = false,
    stroke?: string, strokeThickness?: number,
    align: 'left' | 'center' | 'right' = 'center',
  ) {
    const originX = align === 'left' ? 0 : align === 'right' ? 1 : 0.5;
    return this.add.text(x, y, label, {
      fontSize,
      fontStyle: bold ? 'bold' : undefined,
      color,
      stroke: stroke ?? '#000000',
      strokeThickness: strokeThickness ?? 3,
      align,
    }).setOrigin(originX, 0.5);
  }
}
