import Phaser from 'phaser';
import { WIDTH, HEIGHT, SOUND_KEYS, playSound, unlockAudio } from '../shared';
import { Theme } from '../config/theme';
import { MissionResult } from '../data/battleConfig';
import { getMissionById } from '../data/missions';
import { getGold, getXp } from '../state/PlayerProfile';

export class MissionCompleteScene extends Phaser.Scene {
  private missionResult!: MissionResult;

  constructor() {
    super('MissionCompleteScene');
  }

  init(data: { missionResult: MissionResult }) {
    this.missionResult = data.missionResult;
  }

  create() {
    this.cameras.main.fadeIn(200);
    this.createBackground();

    const mission = getMissionById(this.missionResult.missionId);
    const outcome = this.missionResult.outcome;

    this.createOutcomeHeader(outcome);

    if (mission) {
      this.addText(WIDTH / 2, 190, mission.title, '28px', Theme.ui.textTitle, true);
      this.addText(WIDTH / 2, 228, mission.description, '15px', Theme.ui.textSecondary);
    }

    this.addText(WIDTH / 2, 280, `Turns: ${this.missionResult.turns}`, '17px', Theme.ui.textDescription);

    if (outcome === 'victory') {
      this.createRewards();
    } else {
      const message = outcome === 'abort' ? 'Mission Aborted' : 'Mission Failed';
      this.addText(WIDTH / 2, 340, message, '20px', Theme.status.defeat);
    }

    this.createButtons(outcome);
  }

  private createBackground() {
    this.add.image(WIDTH / 2, HEIGHT / 2, 'arena_bg').setDisplaySize(WIDTH, HEIGHT);
  }

  private createOutcomeHeader(outcome: string) {
    let label: string;
    let color: string;

    if (outcome === 'victory') {
      label = 'VICTORY';
      color = Theme.status.victory;
    } else if (outcome === 'abort') {
      label = 'MISSION ABORTED';
      color = Theme.status.warning;
    } else {
      label = 'DEFEATED';
      color = Theme.status.defeat;
    }

    this.addText(WIDTH / 2, 120, label, '46px', color, true, '#000000', 6);
  }

  private createRewards() {
    const gold = this.missionResult.goldEarned;
    const xp = this.missionResult.xpEarned;
    const totalGold = getGold();
    const totalXP = getXp();

    this.addText(WIDTH / 2, 330, 'Rewards', '20px', Theme.ui.textTitle, true);

    this.addText(WIDTH / 2, 370, `+${gold} Gold`, '22px', Theme.reward.gold);
    this.addText(WIDTH / 2, 398, `+${xp} XP`, '22px', Theme.reward.xp);

    this.addText(WIDTH / 2, 440, `Total Gold: ${totalGold}`, '15px', Theme.ui.textDescription);
    this.addText(WIDTH / 2, 462, `Total XP: ${totalXP}`, '15px', Theme.ui.textDescription);
  }

  private createButtons(outcome: string) {
    const mapBtn = this.createButton(WIDTH / 2, 560, 'Continue to World Map', () => {
      this.scene.start('WorldMapScene');
    });

    if (outcome === 'defeat' || outcome === 'abort') {
      this.createButton(WIDTH / 2, 630, 'Retry Mission', () => {
        this.scene.start('HexConquestScene', {
          battleConfig: this.registry.get('lastBattleConfig'),
          returnScene: 'WorldMapScene',
        });
      });
    }
  }

  private createButton(x: number, y: number, label: string, callback: () => void) {
    const btnBg = Phaser.Display.Color.HexStringToColor(Theme.button.primary.bg).color;
    const container = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(btnBg, 1);
    bg.fillRoundedRect(-145, -27, 290, 54, 14);
    const text = this.add.text(0, 0, label, {
      fontSize: '20px',
      fontStyle: 'bold',
      color: Theme.button.primary.text,
    }).setOrigin(0.5);
    container.add([bg, text]);
    container.setSize(290, 54);
    container.setInteractive({ useHandCursor: true });
    container.on('pointerdown', () => {
      unlockAudio(this);
      playSound(this, SOUND_KEYS.confirm, 0.35);
      callback();
    });
    return container;
  }

  private addText(
    x: number, y: number, label: string,
    fontSize: string, color: string, bold = false,
    stroke?: string, strokeThickness?: number,
  ) {
    return this.add.text(x, y, label, {
      fontSize,
      fontStyle: bold ? 'bold' : undefined,
      color,
      stroke: stroke ?? '#000000',
      strokeThickness: strokeThickness ?? 3,
      align: 'center',
    }).setOrigin(0.5);
  }
}
