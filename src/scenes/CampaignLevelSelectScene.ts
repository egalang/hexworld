import Phaser from 'phaser';
import {
    COLORS,
    WIDTH,
    HEIGHT,
    CAMPAIGN_MAX_LEVEL,
    getUnlockedCampaignLevel,
    getSavedCampaignStars,
    formatStars,
    unlockAudio,
    playSound,
    SOUND_KEYS,
} from '../shared';

export class CampaignLevelSelectScene extends Phaser.Scene {
    private unlockedLevel = 1;

    constructor() {
        super('CampaignLevelSelectScene');
    }

    create() {
        this.unlockedLevel = getUnlockedCampaignLevel();
        this.input.once('pointerdown', () => unlockAudio(this));

        const g = this.add.graphics();
        g.fillGradientStyle(COLORS.bgTop, COLORS.bgTop, COLORS.bgBottom, COLORS.bgBottom, 1);
        g.fillRect(0, 0, WIDTH, HEIGHT);

        this.add.text(WIDTH / 2, 64, 'CAMPAIGN', {
            fontSize: '36px',
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 7,
        }).setOrigin(0.5);

        this.add.text(WIDTH / 2, 106, `Unlocked up to Level ${this.unlockedLevel}`, {
            fontSize: '17px',
            color: '#eaf7ff',
            stroke: '#000000',
            strokeThickness: 3,
        }).setOrigin(0.5);

        const panel = this.add.graphics();
        panel.fillStyle(0x163d5d, 0.78);
        panel.lineStyle(3, 0xffffff, 0.6);
        panel.fillRoundedRect(24, 135, WIDTH - 48, 475, 18);
        panel.strokeRoundedRect(24, 135, WIDTH - 48, 475, 18);

        this.add.text(WIDTH / 2, 160, 'SELECT LEVEL', {
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
        }).setOrigin(0.5);

        this.createLevelGrid();
        this.createSmallCampaignButton(WIDTH / 2, 680, 'Back to Menu', () => this.scene.start('MenuScene'));
    }

    private createLevelGrid() {
        const cols = 4;
        const cellW = 82;
        const cellH = 70;
        const startX = WIDTH / 2 - (cellW * (cols - 1)) / 2;
        const startY = 215;

        for (let level = 1; level <= CAMPAIGN_MAX_LEVEL; level++) {
            const index = level - 1;
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = startX + col * cellW;
            const y = startY + row * cellH;
            const unlocked = level <= this.unlockedLevel;
            const isNext = level === this.unlockedLevel;
            this.createLevelCard(x, y, level, unlocked, isNext);
        }
    }

    private createLevelCard(x: number, y: number, level: number, unlocked: boolean, isNext: boolean) {
        const card = this.add.container(x, y);
        const bg = this.add.graphics();

        bg.fillStyle(unlocked ? (isNext ? 0xb78a55 : 0xffffff) : 0x777777, unlocked ? (isNext ? 1 : 0.18) : 0.42);
        bg.lineStyle(2, unlocked ? 0xffffff : 0x444444, unlocked ? 0.75 : 0.55);
        bg.fillRoundedRect(-34, -27, 68, 54, 12);
        bg.strokeRoundedRect(-34, -27, 68, 54, 12);

        const title = this.add.text(0, -8, unlocked ? String(level) : '🔒', {
            fontSize: unlocked ? '24px' : '20px',
            fontStyle: 'bold',
            color: unlocked && isNext ? '#ffffff' : unlocked ? '#ffffff' : '#d0d0d0',
            stroke: '#000000',
            strokeThickness: 3,
        }).setOrigin(0.5);

        const savedStars = getSavedCampaignStars(level);
        const subtitle = this.add.text(0, 15, unlocked ? formatStars(savedStars) : 'Locked', {
            fontSize: unlocked ? '11px' : '10px',
            color: unlocked ? '#ffe58a' : '#cccccc',
            stroke: '#000000',
            strokeThickness: 2,
        }).setOrigin(0.5);

        card.add([bg, title, subtitle]);
        card.setSize(68, 54);

        if (unlocked) {
            card.setInteractive({ useHandCursor: true });
            card.on('pointerdown', () => {
                unlockAudio(this);
                playSound(this, SOUND_KEYS.confirm, 0.4);
                this.scene.start('HexConquestScene', { mode: 'campaign', campaignLevel: level });
            });
        } else {
            card.setAlpha(0.75);
        }
    }

    private getDifficultyLabel(level: number) {
        if (level <= 2) return 'Easy';
        if (level <= 5) return 'Normal';
        if (level <= 10) return 'Hard';
        if (level <= 15) return 'Expert';
        return 'Boss';
    }

    private createSmallCampaignButton(x: number, y: number, labelText: string, callback: () => void) {
        const button = this.add.container(x, y);
        const bg = this.add.graphics();
        bg.fillStyle(0xb78a55, 1);
        bg.fillRoundedRect(-150, -27, 300, 54, 14);

        const label = this.add.text(0, 0, labelText, {
            fontSize: '22px',
            fontStyle: 'bold',
            color: '#ffffff',
        }).setOrigin(0.5);

        button.add([bg, label]);
        button.setSize(300, 54);
        button.setInteractive({ useHandCursor: true });
        button.on('pointerdown', () => {
            unlockAudio(this);
            playSound(this, SOUND_KEYS.confirm, 0.35);
            callback();
        });
    }
}