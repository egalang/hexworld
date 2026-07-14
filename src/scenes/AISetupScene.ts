import {
    getSavedAiSettings,
    formatAiPersonality,
    COLORS,
    WIDTH,
    HEIGHT,
    SOUND_KEYS,
    unlockAudio,
    playSound,
    AI_DIFFICULTIES,
    AI_PERSONALITIES,
    formatAiDifficulty,
    AiDifficulty,
    AiPersonality,
    getAiDifficultyDescription,
    getAiPersonalityDescription,
    getAiStats,
    saveAiSettings,
} from '../shared';

export class AiSetupScene extends Phaser.Scene {
    private difficulty: AiDifficulty = 'normal';
    private personality: AiPersonality = 'balanced';
    private statusText!: Phaser.GameObjects.Text;
    private statsText!: Phaser.GameObjects.Text;
    private difficultyLabel!: Phaser.GameObjects.Text;
    private personalityLabel!: Phaser.GameObjects.Text;

    constructor() {
        super('AiSetupScene');
    }

    create() {
        const settings = getSavedAiSettings();
        this.difficulty = settings.difficulty;
        this.personality = settings.personality;
        this.input.once('pointerdown', () => unlockAudio(this));

        const g = this.add.graphics();
        g.fillGradientStyle(COLORS.bgTop, COLORS.bgTop, COLORS.bgBottom, COLORS.bgBottom, 1);
        g.fillRect(0, 0, WIDTH, HEIGHT);

        this.add.text(WIDTH / 2, 64, 'PLAYER VS AI', {
            fontSize: '34px',
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 7,
        }).setOrigin(0.5);

        this.add.text(WIDTH / 2, 105, 'Customize the Red commander.', {
            fontSize: '16px',
            color: '#eaf7ff',
            stroke: '#000000',
            strokeThickness: 3,
        }).setOrigin(0.5);

        const panel = this.add.graphics();
        panel.fillStyle(0x163d5d, 0.78);
        panel.lineStyle(3, 0xffffff, 0.6);
        panel.fillRoundedRect(24, 135, WIDTH - 48, 420, 18);
        panel.strokeRoundedRect(24, 135, WIDTH - 48, 420, 18);

        this.statsText = this.add.text(WIDTH / 2, 166, '', {
            fontSize: '15px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center',
            wordWrap: { width: 370 },
        }).setOrigin(0.5);

        this.add.text(WIDTH / 2, 220, 'Difficulty', {
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
        }).setOrigin(0.5);

        this.difficultyLabel = this.add.text(WIDTH / 2, 258, '', {
            fontSize: '22px',
            fontStyle: 'bold',
            color: '#ffe58a',
            stroke: '#000000',
            strokeThickness: 4,
        }).setOrigin(0.5);

        this.createSmallAiButton(WIDTH / 2 - 120, 258, '◀', () => this.changeDifficulty(-1));
        this.createSmallAiButton(WIDTH / 2 + 120, 258, '▶', () => this.changeDifficulty(1));

        this.add.text(WIDTH / 2, 325, 'Personality', {
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
        }).setOrigin(0.5);

        this.personalityLabel = this.add.text(WIDTH / 2, 363, '', {
            fontSize: '22px',
            fontStyle: 'bold',
            color: '#ffe58a',
            stroke: '#000000',
            strokeThickness: 4,
        }).setOrigin(0.5);

        this.createSmallAiButton(WIDTH / 2 - 120, 363, '◀', () => this.changePersonality(-1));
        this.createSmallAiButton(WIDTH / 2 + 120, 363, '▶', () => this.changePersonality(1));

        this.statusText = this.add.text(WIDTH / 2, 455, '', {
            fontSize: '14px',
            color: '#eaf7ff',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center',
            wordWrap: { width: 370 },
        }).setOrigin(0.5);

        this.createWideAiButton(WIDTH / 2, 610, 'Start Match', () => this.startMatch());
        this.createWideAiButton(WIDTH / 2, 685, 'Back to Menu', () => this.scene.start('MenuScene'));

        this.refreshLabels();
    }

    private changeDifficulty(delta: number) {
        const current = AI_DIFFICULTIES.indexOf(this.difficulty);
        const next = (current + delta + AI_DIFFICULTIES.length) % AI_DIFFICULTIES.length;
        this.difficulty = AI_DIFFICULTIES[next];
        playSound(this, SOUND_KEYS.select, 0.35);
        this.refreshLabels();
    }

    private changePersonality(delta: number) {
        const current = AI_PERSONALITIES.indexOf(this.personality);
        const next = (current + delta + AI_PERSONALITIES.length) % AI_PERSONALITIES.length;
        this.personality = AI_PERSONALITIES[next];
        playSound(this, SOUND_KEYS.select, 0.35);
        this.refreshLabels();
    }

    private refreshLabels() {
        const stats = getAiStats();
        this.difficultyLabel.setText(formatAiDifficulty(this.difficulty));
        this.personalityLabel.setText(formatAiPersonality(this.personality));
        this.statsText.setText(
            `Record: ${stats.wins}W - ${stats.losses}L  |  Streak: ${stats.streak}\nBest Win: ${stats.bestWinTurns ?? '-'} turns`
        );
        this.statusText.setText(`${getAiDifficultyDescription(this.difficulty)}\n${getAiPersonalityDescription(this.personality)}`);
    }

    private startMatch() {
        saveAiSettings(this.difficulty, this.personality);
        playSound(this, SOUND_KEYS.confirm, 0.45);
        this.scene.start('HexConquestScene', {
            mode: 'ai',
            campaignLevel: 1,
            aiDifficulty: this.difficulty,
            aiPersonality: this.personality,
        });
    }

    private createSmallAiButton(x: number, y: number, labelText: string, callback: () => void) {
        const button = this.add.container(x, y);
        const bg = this.add.graphics();
        bg.fillStyle(0xb78a55, 1);
        bg.fillRoundedRect(-34, -24, 68, 48, 12);
        const label = this.add.text(0, 0, labelText, {
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#ffffff',
        }).setOrigin(0.5);
        button.add([bg, label]);
        button.setSize(68, 48);
        button.setInteractive({ useHandCursor: true });
        button.on('pointerdown', () => {
            unlockAudio(this);
            callback();
        });
    }

    private createWideAiButton(x: number, y: number, labelText: string, callback: () => void) {
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
