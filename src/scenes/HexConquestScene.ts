import Phaser from 'phaser';
import {
    getAiStats,
    saveUnlockedCampaignLevel,
    saveCampaignStars,
    CAMPAIGN_MAX_LEVEL,
    formatStars,
    OnlineRoomState,
    Owner,
    BLUE_SOLDIER_KEY,
    RED_SOLDIER_KEY,
    HEX_SIZE,
    SOUND_KEYS,
    playSound,
    unlockAudio,
    WIDTH,
    HEIGHT,
    Player,
    Hex,
    GameMode,
    AiDifficulty,
    AiPersonality,
    CampaignObjective,
    getCampaignObjective,
    getSavedAiSettings,
    saveReconnectSession,
    clearReconnectSession,
    formatAiDifficulty,
    formatAiPersonality,
} from '../shared';
import { BattleConfig, MissionResult } from '../data/battleConfig';
import { MissionManager } from '../managers/MissionManager';
import { BoardManager } from '../managers/BoardManager';
import { UnitManager } from '../managers/UnitManager';
import { CombatManager } from '../managers/CombatManager';
import { TurnManager } from '../managers/TurnManager';
import { AIManager } from '../managers/AIManager';
import { Theme } from '../config/theme';
import { WeaponManager } from '../managers/WeaponManager';
import { SkillManager } from '../managers/SkillManager';
import { getSkillLevel } from '../state/Inventory';

const hexColor = (c: string) => Phaser.Display.Color.HexStringToColor(c).color;
const BATTLE_BLUE = hexColor(Theme.battle.blue);
const BATTLE_RED = hexColor(Theme.battle.red);
const BATTLE_NEUTRAL = hexColor(Theme.battle.neutral);
const BATTLE_STROKE = hexColor(Theme.battle.neutralStroke);
const BATTLE_SELECTED = hexColor(Theme.battle.selected);
const BATTLE_VALID = hexColor(Theme.battle.valid);
const UI_PANEL_BG = hexColor(Theme.ui.panel);
const BTN_BG = hexColor(Theme.button.primary.bg);

export class HexConquestScene extends Phaser.Scene {
    private boardManager!: BoardManager;
    private unitManager!: UnitManager;
    private combatManager!: CombatManager;
    private turnManager!: TurnManager;
    private aiManager!: AIManager;
    private mode: GameMode = 'ai';
    private campaignLevel = 1;
    private statusText!: Phaser.GameObjects.Text;
    private countText!: Phaser.GameObjects.Text;
    private validMoves = new Set<string>();
    private previewTexts: Phaser.GameObjects.Text[] = [];
    private endButtons: Phaser.GameObjects.Container[] = [];

    private onlineServerUrl = '';
    private roomCode = '';
    private playerId = '';
    private playerColor: Player | null = null;
    private pollingEvent?: Phaser.Time.TimerEvent;
    private onlineSubmittingMove = false;
    private onlineInteracting = false;
    private onlineAnimating = false;
    private lastAppliedOnlineUpdate = 0;
    private victorySoundPlayed = false;
    private centerHoldTurns = 0;
    private lastObjectiveTurnTracked = 0;
    private actionBarContainer: Phaser.GameObjects.Container | null = null;
    private skillBarContainer: Phaser.GameObjects.Container | null = null;
    private pendingConversionBonus = 0;
    private pendingSkillId: string | null = null;
    private selectedActionIndex = 1;
    private currentWeaponDurability = 0;

    private skillMode: 'kick' | 'blink' | 'freeze' | 'teleport' | 'hex' | null = null;
    private skillModePhase: 'select_target' | 'select_destination' | 'select_source' | 'select_mover' | null = null;
    private skillModeHex: Hex | null = null;
    private kickDestination: Hex | null = null;
    private usedSkills = new Set<string>();

    constructor() {
        super('HexConquestScene');
    }

    private aiInitDifficulty?: AiDifficulty;
    private aiInitPersonality?: AiPersonality;
    private missionManager = new MissionManager();
    private battleConfig?: BattleConfig;
    private returnScene = '';
    private isMissionMode = false;
    private rewardsGranted = false;

    init(data: {
        mode?: GameMode;
        campaignLevel?: number;
        onlineServerUrl?: string;
        roomCode?: string;
        playerId?: string;
        playerColor?: Player | null;
        aiDifficulty?: AiDifficulty;
        aiPersonality?: AiPersonality;
        battleConfig?: BattleConfig;
        returnScene?: string;
    }) {
        this.mode = data.mode ?? 'ai';
        this.campaignLevel = data.campaignLevel ?? 1;
        this.aiInitDifficulty = data.aiDifficulty;
        this.aiInitPersonality = data.aiPersonality;

        this.onlineServerUrl = data.onlineServerUrl ?? '';
        this.roomCode = data.roomCode ?? '';
        this.playerId = data.playerId ?? '';
        this.playerColor = data.playerColor ?? null;

        this.battleConfig = data.battleConfig;
        this.returnScene = data.returnScene ?? '';
        this.isMissionMode = !!data.battleConfig;
        if (this.isMissionMode) {
            this.aiInitDifficulty = this.battleConfig!.aiDifficulty;
        }
    }

    private applyAiInitData() {
        const savedAiSettings = getSavedAiSettings();
        const aiPlayer = this.mode === 'local' || this.mode === 'online' ? null : 'red';
        this.aiManager.setAiPlayer(aiPlayer);
        this.aiManager.setDifficulty(this.aiInitDifficulty ?? savedAiSettings.difficulty);
        this.aiManager.setPersonality(this.aiInitPersonality ?? savedAiSettings.personality);
    }

    private resetState() {
        this.boardManager?.resetBoard();
        this.unitManager?.selectUnit(null);
        this.turnManager?.reset();
        this.aiManager?.reset();
        this.validMoves.clear();
        this.previewTexts = [];
        this.endButtons = [];
        this.pollingEvent = undefined;
        this.onlineSubmittingMove = false;
        this.onlineInteracting = false;
        this.onlineAnimating = false;
        this.lastAppliedOnlineUpdate = 0;
        this.victorySoundPlayed = false;
        this.centerHoldTurns = 0;
        this.lastObjectiveTurnTracked = 0;
        this.rewardsGranted = false;
        this.destroyActionBar();
        this.destroySkillBar();
        this.pendingConversionBonus = 0;
        this.pendingSkillId = null;
        this.selectedActionIndex = 1;
        this.skillMode = null;
        this.skillModePhase = null;
        this.skillModeHex = null;
        this.kickDestination = null;
        this.usedSkills.clear();
        const w = WeaponManager.getEquipped();
        this.currentWeaponDurability = w?.durability ?? 0;
    }

    create() {
        this.input.once('pointerdown', () => unlockAudio(this));
        this.resetState();
        this.boardManager = new BoardManager();
        this.unitManager = new UnitManager(this, this.boardManager);
        this.combatManager = new CombatManager(this.boardManager, this.unitManager);
        this.turnManager = new TurnManager();
        this.aiManager = new AIManager(this.boardManager, this.combatManager, this.unitManager);
        this.applyAiInitData();
        this.createBackground();
        this.createHeader();
        this.createBoard();
        this.createActionBar();
        this.createSkillBar();
        this.createBottomButtons();
        this.input.keyboard?.off('keydown-R');
        this.input.keyboard?.on('keydown-R', () => this.restartGame());
        this.updateHud();

        if (this.mode === 'online') {
            this.startOnlinePolling();
        }
    }

    private createBackground() {
        const g = this.add.graphics();
        g.fillStyle(UI_PANEL_BG, 1);
        g.fillRect(0, 0, WIDTH, HEIGHT);

        this.add.text(WIDTH / 2, 42, 'HEX CONQUEST', {
            fontSize: '34px',
            fontStyle: 'bold',
            color: Theme.ui.textTitle,
            stroke: '#000000',
            strokeThickness: 6,
        }).setOrigin(0.5);

        const modeLabel = this.getModeLabel();
        this.add.text(WIDTH / 2, 78, modeLabel, {
            fontSize: '16px',
            color: Theme.ui.textSecondary,
            stroke: '#000000',
            strokeThickness: 3,
        }).setOrigin(0.5);
    }

    private getModeLabel() {
        if (this.isMissionMode) return `Mission: ${this.battleConfig!.missionId}`;
        if (this.mode === 'campaign') return `Level ${this.campaignLevel}: ${getCampaignObjective(this.campaignLevel).title}`;
        if (this.mode === 'ai') return `AI ${formatAiDifficulty(this.aiManager.getDifficulty())} — ${formatAiPersonality(this.aiManager.getPersonality())}`;
        if (this.mode === 'local') return 'Local 2 Player';
        if (this.mode === 'online') return `Online PvP Room ${this.roomCode}`;
        return 'Online Multiplayer';
    }

    private createHeader() {
        const border = hexColor(Theme.brand.gold);
        const panel = this.add.graphics();
        panel.fillStyle(UI_PANEL_BG, 0.92);
        panel.lineStyle(3, border, 0.7);
        panel.fillRoundedRect(24, 105, WIDTH - 48, 100, 18);
        panel.strokeRoundedRect(24, 105, WIDTH - 48, 100, 18);

        this.statusText = this.add.text(WIDTH / 2, 129, '', {
            fontSize: '22px',
            fontStyle: 'bold',
            color: Theme.ui.text,
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center',
        }).setOrigin(0.5);

        this.countText = this.add.text(WIDTH / 2, 171, '', {
            fontSize: '16px',
            color: Theme.ui.text,
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center',
            wordWrap: { width: WIDTH - 60 },
        }).setOrigin(0.5);
    }

    private createBottomButtons() {
        if (this.isMissionMode) {
            this.createSmallButton(WIDTH / 2 - 93, 740, 'World Map', () => {
                const result: MissionResult = {
                    missionId: this.battleConfig!.missionId,
                    victory: false,
                    goldEarned: 0,
                    xpEarned: 0,
                    outcome: 'abort',
                    turns: this.turnManager.getTurn(),
                };
                this.registry.set('lastBattleConfig', this.battleConfig);
                this.time.removeAllEvents();
                this.tweens.killAll();
                this.scene.start('MissionCompleteScene', { missionResult: result });
            });
            this.createSmallButton(WIDTH / 2 + 93, 740, 'Restart', () => this.restartGame());
        } else {
            this.createSmallButton(WIDTH / 2 - 93, 740, 'Menu', () => this.backToMenu());
            this.createSmallButton(WIDTH / 2 + 93, 740, this.mode === 'online' ? 'Leave' : 'Restart', () => this.restartGame());
        }
    }

    private createActionBar() {
        this.destroyActionBar();
        if (this.mode !== 'ai' && this.mode !== 'campaign' && this.mode !== 'local') return;
        if (this.turnManager.getCurrentPlayer() !== 'blue') return;
        if (this.aiManager.getAiPlayer() === 'blue') return;

        const weapon = WeaponManager.getEquipped();
        if (!weapon) return;

        const barY = 218;
        const c = this.add.container(0, 0);

        const g = this.add.graphics();
        const barBg = Phaser.Display.Color.HexStringToColor(Theme.ui.panel).color;
        const barBorder = Phaser.Display.Color.HexStringToColor(Theme.brand.gold).color;
        g.fillStyle(barBg, 0.92);
        g.lineStyle(1, barBorder, 0.5);
        g.fillRoundedRect(20, barY - 14, WIDTH - 40, 28, 8);
        g.strokeRoundedRect(20, barY - 14, WIDTH - 40, 28, 8);
        c.add(g);

        type ActionItem = { label: string; bonus: number };
        const items: ActionItem[] = [];
        if (weapon) items.push({ label: `⚔ ${weapon.name}+${weapon.conversionBonus}`, bonus: weapon.conversionBonus });
        items.push({ label: 'Normal', bonus: 0 });

        if (this.selectedActionIndex >= items.length) this.selectedActionIndex = items.length - 1;

        const btnW = Math.min(100, (WIDTH - 60) / items.length - 4);
        const totalW = items.length * (btnW + 4);
        const startX = (WIDTH - totalW) / 2 + btnW / 2 + 2;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const bx = startX + i * (btnW + 4);
            const isActive = i === this.selectedActionIndex;
            const btnBg = this.add.graphics();
            const fill = Phaser.Display.Color.HexStringToColor(isActive ? Theme.button.primary.bg : Theme.button.disabled.bg).color;
            const txtColor = isActive ? Theme.button.primary.text : Theme.ui.textSecondary;
            btnBg.fillStyle(fill, 1);
            btnBg.fillRoundedRect(bx - btnW / 2, barY - 10, btnW, 20, 5);
            c.add(btnBg);

            let displayLabel = item.label;
            if (isActive) displayLabel = `▸ ${item.label}`;
            const txt = this.add.text(bx, barY, displayLabel, {
                fontSize: '10px', fontStyle: 'bold', color: txtColor,
                stroke: '#000000', strokeThickness: 1,
            }).setOrigin(0.5);
            c.add(txt);

            const zone = this.add.zone(bx, barY, btnW, 20).setInteractive({ useHandCursor: true });
            c.add(zone);

            zone.on('pointerdown', () => {
                this.selectedActionIndex = i;
                this.pendingConversionBonus = item.bonus;
                this.createActionBar();
            });
        }

        c.setDepth(40);
        this.actionBarContainer = c;
    }

    private destroyActionBar() {
        if (this.actionBarContainer) {
            this.actionBarContainer.destroy();
            this.actionBarContainer = null;
        }
    }

    private createSkillBar() {
        this.destroySkillBar();
        if (this.mode !== 'ai' && this.mode !== 'campaign' && this.mode !== 'local') return;
        if (this.turnManager.getCurrentPlayer() !== 'blue') return;
        if (this.aiManager.getAiPlayer() === 'blue') return;

        const skills = SkillManager.getEquipped().filter(s => !this.usedSkills.has(s.id));
        if (skills.length === 0) return;

        const barY = 250;
        const c = this.add.container(0, 0);

        const g = this.add.graphics();
        const barBg = Phaser.Display.Color.HexStringToColor(Theme.ui.panel).color;
        const barBorder = Phaser.Display.Color.HexStringToColor(Theme.reward.skill).color;
        g.fillStyle(barBg, 0.92);
        g.lineStyle(1, barBorder, 0.5);
        g.fillRoundedRect(20, barY - 14, WIDTH - 40, 28, 8);
        g.strokeRoundedRect(20, barY - 14, WIDTH - 40, 28, 8);
        c.add(g);

        const btnW = Math.min(120, (WIDTH - 60) / skills.length - 4);
        const totalW = skills.length * (btnW + 4);
        const startX = (WIDTH - totalW) / 2 + btnW / 2 + 2;

        for (let i = 0; i < skills.length; i++) {
            const sk = skills[i];
            const bx = startX + i * (btnW + 4);
            const btnBg = this.add.graphics();
            const fill = Phaser.Display.Color.HexStringToColor(Theme.button.secondary.bg).color;
            btnBg.fillStyle(fill, 1);
            btnBg.fillRoundedRect(bx - btnW / 2, barY - 10, btnW, 20, 5);
            c.add(btnBg);

            let label = `✨ ${sk.name}`;
            if (this.skillMode && this.pendingSkillId === sk.id) {
                label = `▸ ${sk.name}`;
            }
            const txt = this.add.text(bx, barY, label, {
                fontSize: '10px', fontStyle: 'bold', color: Theme.reward.skill,
                stroke: '#000000', strokeThickness: 1,
            }).setOrigin(0.5);
            c.add(txt);

            const zone = this.add.zone(bx, barY, btnW, 20).setInteractive({ useHandCursor: true });
            c.add(zone);

            zone.on('pointerdown', () => {
                if (this.usedSkills.has(sk.id)) return;
                if (this.skillMode) {
                    this.exitSkillMode();
                } else {
                    this.enterSkillMode(sk.type, sk.id);
                }
            });
        }

        c.setDepth(40);
        this.skillBarContainer = c;
    }

    private destroySkillBar() {
        if (this.skillBarContainer) {
            this.skillBarContainer.destroy();
            this.skillBarContainer = null;
        }
    }

    private enterSkillMode(type: 'kick' | 'blink' | 'freeze' | 'teleport' | 'hex', skillId: string) {
        if (this.usedSkills.has(skillId)) return;
        this.skillMode = type;
        this.pendingSkillId = skillId;
        this.clearHighlights();

        if (type === 'kick') {
            this.skillModePhase = 'select_target';
            this.statusText.setText('KICK — Select an opponent piece to kick');
            this.statusText.setColor(Theme.status.info);
            for (const h of this.boardManager.getTiles()) {
                if (h.owner !== 'blue') continue;
                for (const n of this.boardManager.getNeighbors(h)) {
                    if (n.owner === 'red') {
                        n.poly?.setStrokeStyle(4, BATTLE_VALID, 1);
                    }
                }
            }
        } else if (type === 'blink') {
            this.skillModePhase = 'select_source';
            this.statusText.setText('BLINK — Select your piece to swap');
            this.statusText.setColor(Theme.status.info);
            for (const h of this.boardManager.getTiles()) {
                if (h.owner !== 'blue') continue;
                const hasEnemyNeighbor = this.boardManager.getNeighbors(h).some(n => n.owner === 'red');
                if (hasEnemyNeighbor) {
                    h.poly?.setStrokeStyle(4, BATTLE_VALID, 1);
                }
            }
        } else if (type === 'freeze') {
            this.skillModePhase = 'select_target';
            this.statusText.setText('FREEZE — Select an opponent piece to freeze');
            this.statusText.setColor(Theme.status.info);
            for (const h of this.boardManager.getTiles()) {
                if (h.owner !== 'blue') continue;
                for (const n of this.boardManager.getNeighbors(h)) {
                    if (n.owner === 'red') {
                        n.poly?.setStrokeStyle(4, BATTLE_VALID, 1);
                    }
                }
            }
        } else if (type === 'teleport') {
            this.skillModePhase = 'select_source';
            this.statusText.setText('TELEPORT — Select your piece to swap');
            this.statusText.setColor(Theme.status.info);
            for (const h of this.boardManager.getTiles()) {
                if (h.owner === 'blue') {
                    h.poly?.setStrokeStyle(4, BATTLE_VALID, 1);
                }
            }
        } else if (type === 'hex') {
            this.skillModePhase = 'select_target';
            this.statusText.setText('HEX — Select a vacant tile to claim');
            this.statusText.setColor(Theme.status.info);
            for (const h of this.boardManager.getTiles()) {
                if (!h.owner) {
                    h.poly?.setStrokeStyle(4, BATTLE_VALID, 1);
                }
            }
        }

        this.createSkillBar();
    }

    private exitSkillMode() {
        this.skillMode = null;
        this.pendingSkillId = null;
        this.skillModePhase = null;
        this.skillModeHex = null;
        this.kickDestination = null;
        this.clearHighlights();
        this.updateHud();
    }

    private findNearestEmpty(from: Hex): Hex | null {
        const visited = new Set<string>();
        visited.add(this.boardManager.key(from.q, from.r));
        let queue = [from];
        while (queue.length > 0) {
            const next: Hex[] = [];
            for (const h of queue) {
                for (const n of this.boardManager.getNeighbors(h)) {
                    const k = this.boardManager.key(n.q, n.r);
                    if (visited.has(k)) continue;
                    visited.add(k);
                    if (!n.owner) return n;
                    next.push(n);
                }
            }
            queue = next;
        }
        return null;
    }

    private handleSkillTap(hex: Hex) {
        const mover: Player = 'blue';

        if (this.skillMode === 'kick') {
            if (this.skillModePhase === 'select_target') {
                if (hex.owner !== 'red') {
                    this.shakeInvalid(hex);
                    return;
                }
                const adjacentToBlue = this.boardManager.getNeighbors(hex).some(n => n.owner === 'blue');
                if (!adjacentToBlue) {
                    this.shakeInvalid(hex);
                    return;
                }

                const nearest = this.findNearestEmpty(hex);
                if (!nearest) {
                    this.shakeInvalid(hex);
                    return;
                }

                this.skillModeHex = hex;
                this.kickDestination = nearest;
                this.skillModePhase = 'select_mover';
                this.clearHighlights();

                this.combatManager.destroyUnit(hex);
                this.combatManager.captureTile(nearest, 'red');
                hex.owner = null;
                hex.poly?.setFillStyle(BATTLE_NEUTRAL, 1);
                this.unitManager.removeUnit(hex);

                this.statusText.setText('KICK — Select your piece to move in');
                this.statusText.setColor(Theme.status.info);
                hex.poly?.setStrokeStyle(4, BATTLE_SELECTED, 1);
                for (const n of this.boardManager.getNeighbors(hex)) {
                    if (n.owner === 'blue') {
                        n.poly?.setStrokeStyle(4, BATTLE_VALID, 1);
                    }
                }
                return;
            }

            if (this.skillModePhase === 'select_mover') {
                if (hex.owner !== 'blue' || !this.skillModeHex) {
                    this.shakeInvalid(hex);
                    return;
                }
                const targetHex = this.skillModeHex;
                if (!this.boardManager.getNeighbors(targetHex).some(h => h.q === hex.q && h.r === hex.r)) {
                    this.shakeInvalid(hex);
                    return;
                }
                this.executeKickMove(hex, targetHex);
                return;
            }
        }

        if (this.skillMode === 'blink') {
            if (this.skillModePhase === 'select_source') {
                if (hex.owner !== 'blue') {
                    this.shakeInvalid(hex);
                    return;
                }
                const hasEnemyNeighbor = this.boardManager.getNeighbors(hex).some(n => n.owner === 'red');
                if (!hasEnemyNeighbor) {
                    this.shakeInvalid(hex);
                    return;
                }

                this.skillModeHex = hex;
                this.skillModePhase = 'select_target';
                this.clearHighlights();
                this.statusText.setText('BLINK — Select an opponent piece to swap with');
                this.statusText.setColor(Theme.status.info);
                hex.poly?.setStrokeStyle(4, BATTLE_SELECTED, 1);
                for (const n of this.boardManager.getNeighbors(hex)) {
                    if (n.owner === 'red') {
                        n.poly?.setStrokeStyle(4, BATTLE_VALID, 1);
                    }
                }
                return;
            }

            if (this.skillModePhase === 'select_target') {
                if (hex.owner !== 'red') {
                    this.shakeInvalid(hex);
                    return;
                }
                if (!this.boardManager.getNeighbors(this.skillModeHex!).some(h => h.q === hex.q && h.r === hex.r)) {
                    this.shakeInvalid(hex);
                    return;
                }
                if (!this.skillModeHex) return;
                this.executeBlink(this.skillModeHex, hex);
                return;
            }
        }

        if (this.skillMode === 'freeze') {
            if (hex.owner !== 'red') {
                this.shakeInvalid(hex);
                return;
            }
            const adjacentToBlue = this.boardManager.getNeighbors(hex).some(n => n.owner === 'blue');
            if (!adjacentToBlue) {
                this.shakeInvalid(hex);
                return;
            }
            this.executeFreeze(hex);
            return;
        }

        if (this.skillMode === 'teleport') {
            if (this.skillModePhase === 'select_source') {
                if (hex.owner !== 'blue') {
                    this.shakeInvalid(hex);
                    return;
                }
                this.skillModeHex = hex;
                this.skillModePhase = 'select_target';
                this.clearHighlights();
                this.statusText.setText('TELEPORT — Select an opponent piece to swap with');
                this.statusText.setColor(Theme.status.info);
                hex.poly?.setStrokeStyle(4, BATTLE_SELECTED, 1);
                for (const h of this.boardManager.getTiles()) {
                    if (h.owner === 'red') {
                        h.poly?.setStrokeStyle(4, BATTLE_VALID, 1);
                    }
                }
                return;
            }

            if (this.skillModePhase === 'select_target') {
                if (hex.owner !== 'red') {
                    this.shakeInvalid(hex);
                    return;
                }
                if (!this.skillModeHex) return;
                this.executeTeleport(this.skillModeHex, hex);
                return;
            }
        }

        if (this.skillMode === 'hex') {
            if (hex.owner !== null) {
                this.shakeInvalid(hex);
                return;
            }
            this.executeHex(hex);
            return;
        }

        this.shakeInvalid(hex);
    }

    private executeKickMove(source: Hex, targetHex: Hex) {
        const mover: Player = 'blue';
        this.unitManager.moveUnit(source, targetHex, mover);
        source.poly?.setFillStyle(BATTLE_NEUTRAL, 1);
        targetHex.poly?.setFillStyle(BATTLE_BLUE, 1);
        this.unitManager.selectUnit(null);
        this.clearHighlights();

        const converted = this.combatManager.attack(targetHex, mover);
        if (converted.length > 0) playSound(this, SOUND_KEYS.convert, 0.5);
        this.flashConversions(targetHex, converted);

        if (this.pendingSkillId) this.usedSkills.add(this.pendingSkillId);
        this.exitSkillMode();
        playSound(this, SOUND_KEYS.move, 0.5);
        this.time.delayedCall(250, () => {
            if (this.checkVictory()) return;
            this.turnManager.nextPlayer();
            this.updateHud();
            if (this.turnManager.getCurrentPlayer() === this.aiManager.getAiPlayer()) {
                this.time.delayedCall(500, () => this.runAiTurn());
            }
        });
    }

    private executeBlink(source: Hex, target: Hex) {
        const mover: Player = 'blue';
        const targetOwner = target.owner;
        this.combatManager.destroyUnit(target);
        this.combatManager.destroyUnit(source);
        source.owner = null;
        source.poly?.setFillStyle(BATTLE_NEUTRAL, 1);
        this.unitManager.removeUnit(source);
        this.combatManager.captureTile(source, targetOwner!);
        this.combatManager.captureTile(target, mover);

        const converted = this.combatManager.attack(target, mover);
        if (converted.length > 0) playSound(this, SOUND_KEYS.convert, 0.5);
        this.flashConversions(target, converted);

        if (this.pendingSkillId) this.usedSkills.add(this.pendingSkillId);
        this.exitSkillMode();
        playSound(this, SOUND_KEYS.move, 0.5);
        this.time.delayedCall(250, () => {
            if (this.checkVictory()) return;
            this.turnManager.nextPlayer();
            this.updateHud();
            if (this.turnManager.getCurrentPlayer() === this.aiManager.getAiPlayer()) {
                this.time.delayedCall(500, () => this.runAiTurn());
            }
        });
    }

    private executeTeleport(source: Hex, target: Hex) {
        const mover: Player = 'blue';
        const targetOwner = target.owner;
        this.combatManager.destroyUnit(target);
        this.combatManager.destroyUnit(source);
        source.owner = null;
        source.poly?.setFillStyle(BATTLE_NEUTRAL, 1);
        this.unitManager.removeUnit(source);
        this.combatManager.captureTile(source, targetOwner!);
        this.combatManager.captureTile(target, mover);

        const converted = this.combatManager.attack(target, mover);
        if (converted.length > 0) playSound(this, SOUND_KEYS.convert, 0.5);
        this.flashConversions(target, converted);

        if (this.pendingSkillId) this.usedSkills.add(this.pendingSkillId);
        this.exitSkillMode();
        playSound(this, SOUND_KEYS.move, 0.5);
        this.time.delayedCall(250, () => {
            if (this.checkVictory()) return;
            this.turnManager.nextPlayer();
            this.updateHud();
            if (this.turnManager.getCurrentPlayer() === this.aiManager.getAiPlayer()) {
                this.time.delayedCall(500, () => this.runAiTurn());
            }
        });
    }

    private executeHex(hex: Hex) {
        this.clearHighlights();
        hex.hexed = 'blue';
        this.combatManager.captureTile(hex, 'blue');

        if (this.pendingSkillId) this.usedSkills.add(this.pendingSkillId);
        this.exitSkillMode();
        playSound(this, SOUND_KEYS.convert, 0.5);
        this.time.delayedCall(250, () => {
            if (this.checkVictory()) return;
            this.turnManager.nextPlayer();
            this.updateHud();
            if (this.turnManager.getCurrentPlayer() === this.aiManager.getAiPlayer()) {
                this.time.delayedCall(500, () => this.runAiTurn());
            }
        });
    }

    private executeFreeze(target: Hex) {
        this.clearHighlights();

        const freezeLevel = (() => {
            for (const sk of SkillManager.getEquipped()) {
                if (sk.type === 'freeze') return getSkillLevel(sk.id);
            }
            return 1;
        })();

        const frozen: Hex[] = [target];
        target.frozen = true;

        if (freezeLevel >= 2) {
            const adjacent = this.boardManager.getNeighbors(target).filter(n => n.owner === 'red' && !n.frozen);
            const count = Math.min(2, adjacent.length);
            for (let i = 0; i < count; i++) {
                adjacent[i].frozen = true;
                frozen.push(adjacent[i]);
            }
        }

        if (freezeLevel >= 3) {
            const moreAdjacent: Hex[] = [];
            for (const f of frozen) {
                for (const n of this.boardManager.getNeighbors(f)) {
                    if (n.owner === 'red' && !n.frozen && !frozen.includes(n)) {
                        moreAdjacent.push(n);
                    }
                }
            }
            const count = Math.min(freezeLevel === 3 ? 5 - frozen.length : 0, moreAdjacent.length);
            for (let i = 0; i < count; i++) {
                moreAdjacent[i].frozen = true;
                frozen.push(moreAdjacent[i]);
            }
        }

        for (const f of frozen) {
            f.poly?.setStrokeStyle(3, 0x88ccff, 1);
        }

        this.statusText.setText(`FREEZE — ${frozen.length} piece(s) frozen!`);
        this.statusText.setColor(Theme.status.info);

        if (this.pendingSkillId) this.usedSkills.add(this.pendingSkillId);
        this.exitSkillMode();
        playSound(this, SOUND_KEYS.confirm, 0.5);
        this.time.delayedCall(250, () => {
            if (this.checkVictory()) return;
            this.turnManager.nextPlayer();
            this.updateHud();
            if (this.turnManager.getCurrentPlayer() === this.aiManager.getAiPlayer()) {
                this.time.delayedCall(500, () => this.runAiTurn());
            }
        });
    }

    private createSmallButton(x: number, y: number, labelText: string, callback: () => void) {
        const button = this.add.container(x, y);
        const bg = this.add.graphics();
        bg.fillStyle(BTN_BG, 1);
        bg.fillRoundedRect(-78, -27, 156, 54, 14);

        const label = this.add.text(0, 0, labelText, {
            fontSize: '22px',
            fontStyle: 'bold',
            color: Theme.button.primary.text,
        }).setOrigin(0.5);

        button.add([bg, label]);
        button.setSize(156, 54);
        button.setInteractive({ useHandCursor: true });
        button.on('pointerdown', () => {
            unlockAudio(this);
            playSound(this, SOUND_KEYS.confirm, 0.35);
            callback();
        });
        return button;
    }

    private createBoard() {
        this.unitManager.selectUnit(null);
        this.validMoves.clear();
        this.previewTexts = [];

        this.boardManager.createBoard(this.mode, this.campaignLevel);
        for (const hex of this.boardManager.getTiles()) {
            this.drawHex(hex);
        }
    }

    private drawHex(hex: Hex) {
        const { x, y } = this.boardManager.hexToPixel(hex.q, hex.r);
        const points = this.boardManager.getHexPoints(HEX_SIZE - 1).flatMap(p => [p.x, p.y]);
        const fill = hex.owner === 'blue' ? BATTLE_BLUE : hex.owner === 'red' ? BATTLE_RED : BATTLE_NEUTRAL;

        const poly = this.add.polygon(x, y, points, fill, 1);
        poly.setStrokeStyle(2, BATTLE_STROKE, 1);
        poly.setInteractive(new Phaser.Geom.Polygon(this.boardManager.getHexPoints(HEX_SIZE - 1)), Phaser.Geom.Polygon.Contains);
        poly.on('pointerdown', () => this.handleHexTap(hex));
        hex.poly = poly;

        if (hex.owner) this.unitManager.createUnit(hex, hex.owner);
    }

    private handleHexTap(hex: Hex) {
        if (this.turnManager.isGameOver() || this.aiManager.isThinking() || this.onlineSubmittingMove || this.onlineAnimating) return;

        if (this.skillMode) {
            this.handleSkillTap(hex);
            return;
        }

        if (this.mode === 'online') {
            if (!this.playerColor) return;
            if (this.turnManager.getCurrentPlayer() !== this.playerColor) {
                this.shakeInvalid(hex);
                return;
            }
        } else if (this.turnManager.getCurrentPlayer() === this.aiManager.getAiPlayer()) {
            return;
        }

        if (hex.owner === this.turnManager.getCurrentPlayer()) {
            if (hex.frozen) {
                this.shakeInvalid(hex);
                return;
            }
            this.selectHex(hex);
            return;
        }

        const sel = this.unitManager.getSelectedUnit();
        if (sel && !hex.owner && this.validMoves.has(this.boardManager.key(hex.q, hex.r))) {
            if (this.mode === 'online') {
                this.submitOnlineMove(sel, hex);
            } else {
                this.moveSelectedTo(hex);
            }
            return;
        }

        this.shakeInvalid(hex);
    }

    private selectHex(hex: Hex) {
        if (this.mode === 'online') {
            this.onlineInteracting = true;
        }

        playSound(this, SOUND_KEYS.select, 0.42);
        this.clearHighlights();
        this.unitManager.selectUnit(hex);
        hex.poly?.setStrokeStyle(5, BATTLE_SELECTED, 1);

        for (const n of this.boardManager.getNeighbors(hex)) {
            if (!n.owner) {
                this.validMoves.add(this.boardManager.key(n.q, n.r));
                n.poly?.setFillStyle(BATTLE_VALID, 1);
                this.createMovePreview(n, this.turnManager.getCurrentPlayer());
            }
        }
    }

    private applyConversionBonus(center: Hex, player: Player, bonus: number, alreadyConverted: Hex[]): Hex[] {
        if (bonus <= 0) return [];
        const visited = new Set<string>();
        visited.add(this.boardManager.key(center.q, center.r));
        for (const h of alreadyConverted) {
            visited.add(this.boardManager.key(h.q, h.r));
        }

        const candidates: Hex[] = [];
        const seen = new Set<string>();
        const allConverted = [center, ...alreadyConverted];
        for (const h of allConverted) {
            for (const n of this.boardManager.getNeighbors(h)) {
                const k = this.boardManager.key(n.q, n.r);
                if (visited.has(k)) continue;
                if (seen.has(k)) continue;
                seen.add(k);
                if (n.owner && n.owner !== player) {
                    candidates.push(n);
                }
            }
        }

        const extra: Hex[] = [];
        const count = Math.min(bonus, candidates.length);
        for (let i = 0; i < count; i++) {
            this.combatManager.captureTile(candidates[i], player);
            extra.push(candidates[i]);
        }
        return extra;
    }

    private createMovePreview(target: Hex, player: Player) {
        const captureCount = this.combatManager.countCaptureTargets(target, player);
        if (captureCount <= 0) return;

        const { x, y } = this.boardManager.hexToPixel(target.q, target.r);

        const preview = this.add.text(x, y, `+${captureCount}`, {
            fontSize: '19px',
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 5,
        }).setOrigin(0.5);

        preview.setDepth(20);
        this.previewTexts.push(preview);

        this.tweens.add({
            targets: preview,
            y: y - 4,
            duration: 450,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });
    }

    private moveSelectedTo(target: Hex) {
        const from = this.unitManager.getSelectedUnit();
        if (!from) return;
        const mover: Player = this.turnManager.getCurrentPlayer();

        this.unitManager.moveUnit(from, target, mover);
        from.poly?.setFillStyle(BATTLE_NEUTRAL, 1);
        target.poly?.setFillStyle(mover === 'blue' ? BATTLE_BLUE : BATTLE_RED, 1);
        playSound(this, SOUND_KEYS.move, 0.5);

        this.unitManager.selectUnit(null);
        this.clearHighlights();

        const converted = this.combatManager.attack(target, mover);
        const bonusConverted = this.applyConversionBonus(target, mover, this.pendingConversionBonus, converted);

        if (this.pendingConversionBonus > 0 && this.currentWeaponDurability > 0) {
            this.currentWeaponDurability--;
            if (this.currentWeaponDurability <= 0) {
                WeaponManager.equip(null);
            }
        }

        this.pendingConversionBonus = 0;
        this.selectedActionIndex = 1;
        const allConverted = [...converted, ...bonusConverted];
        if (allConverted.length > 0) playSound(this, SOUND_KEYS.convert, 0.5);
        this.flashConversions(target, allConverted);

        this.time.delayedCall(250, () => {
            if (this.checkVictory()) return;

            this.turnManager.nextPlayer();
            const w = WeaponManager.getEquipped();
            if (!w) this.currentWeaponDurability = 0;
            this.updateHud();

            if (this.checkVictory()) return;

            if (this.turnManager.getCurrentPlayer() === this.aiManager.getAiPlayer()) {
                this.time.delayedCall(500, () => this.runAiTurn());
            }
        });
    }

    private flashConversions(center: Hex, converted: Hex[]) {
        const all = [center, ...converted];
        for (const h of all) {
            if (!h.poly) continue;
            this.tweens.add({
                targets: h.poly,
                scaleX: 1.12,
                scaleY: 1.12,
                duration: 100,
                yoyo: true,
                ease: 'Sine.easeOut',
            });
            if (h.piece) {
                this.tweens.add({
                    targets: h.piece,
                    y: h.piece.y - 8,
                    duration: 100,
                    yoyo: true,
                    ease: 'Sine.easeOut',
                });
            }
        }
    }

    private runAiTurn() {
        if (this.turnManager.isGameOver() || !this.aiManager.isAiTurn(this.turnManager.getCurrentPlayer()) || this.aiManager.isThinking()) return;

        const move = this.aiManager.getBestMove(this.aiManager.getAiPlayer()!, this.mode, this.campaignLevel);
        if (!move) {
            this.checkVictory();
            return;
        }

        this.aiManager.setThinking(true);
        this.clearHighlights();
        this.updateHud();

        move.from.poly?.setStrokeStyle(5, BATTLE_SELECTED, 1);
        move.to.poly?.setFillStyle(BATTLE_VALID, 1);

        this.time.delayedCall(350, () => {
            this.unitManager.selectUnit(move.from);
            this.validMoves.clear();
            this.validMoves.add(this.boardManager.key(move.to.q, move.to.r));
            this.aiManager.setThinking(false);
            this.moveSelectedTo(move.to);
        });
    }



    private async startOnlinePolling() {
        await this.pollOnlineState();

        this.pollingEvent = this.time.addEvent({
            delay: 2200,
            loop: true,
            callback: () => this.pollOnlineState(),
        });
    }

    private async pollOnlineState() {
        if (this.mode !== 'online' || !this.roomCode || !this.onlineServerUrl) return;

        // Prevent incoming polling data from clearing the player's current selection
        // or overwriting the board while a move is being submitted.
        if (this.onlineSubmittingMove || this.onlineInteracting) return;

        try {
            const res = await fetch(
                `${this.onlineServerUrl}/rooms/${this.roomCode}/state?player_id=${encodeURIComponent(this.playerId)}`
            );

            if (!res.ok) throw new Error(await res.text());

            const state: OnlineRoomState = await res.json();
            this.applyOnlineState(state);
        } catch (error) {
            this.countText.setText(`PvP sync error: ${String(error).slice(0, 80)}`);
        }
    }

    private async submitOnlineMove(from: Hex, to: Hex) {
        if (!this.onlineServerUrl || !this.roomCode || !this.playerId) return;
        if (this.onlineSubmittingMove) return;

        this.onlineSubmittingMove = true;
        this.onlineInteracting = false;
        this.unitManager.selectUnit(null);
        this.clearHighlights();
        this.statusText.setText('SUBMITTING MOVE...');
        playSound(this, SOUND_KEYS.move, 0.45);

        try {
            const res = await fetch(`${this.onlineServerUrl}/rooms/${this.roomCode}/move`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    player_id: this.playerId,
                    from_q: from.q,
                    from_r: from.r,
                    to_q: to.q,
                    to_r: to.r,
                }),
            });

            if (!res.ok) throw new Error(await res.text());

            const state: OnlineRoomState = await res.json();
            this.applyOnlineState(state, true);
        } catch (error) {
            this.statusText.setText('MOVE FAILED');
            this.countText.setText(String(error).slice(0, 100));
        } finally {
            this.onlineSubmittingMove = false;

            // Give the backend response a short moment to settle before polling resumes.
            this.time.delayedCall(350, () => {
                this.onlineInteracting = false;
            });
        }
    }


    private applyOnlineCellsWithAnimation(state: OnlineRoomState) {
        const oldOwners = new Map<string, Owner>();
        for (const h of this.boardManager.getTiles()) {
            oldOwners.set(this.boardManager.key(h.q, h.r), h.owner);
        }

        const changedCells = state.cells.filter(cell => {
            const previous = oldOwners.get(this.boardManager.key(cell.q, cell.r));
            return previous !== cell.owner;
        });

        if (!changedCells.length) return;

        const fromCell = changedCells.find(cell => {
            const previous = oldOwners.get(this.boardManager.key(cell.q, cell.r));
            return previous !== null && cell.owner === null;
        });

        const toCell = changedCells.find(cell => {
            const previous = oldOwners.get(this.boardManager.key(cell.q, cell.r));
            return previous === null && cell.owner !== null;
        });

        const mover = toCell?.owner ?? null;
        const fromHex = fromCell ? this.boardManager.getTile(fromCell.q, fromCell.r) : undefined;
        const toHex = toCell ? this.boardManager.getTile(toCell.q, toCell.r) : undefined;

        const canAnimateMove = Boolean(
            fromHex &&
            toHex &&
            mover &&
            oldOwners.get(this.boardManager.key(fromHex!.q, fromHex!.r)) === mover &&
            this.boardManager.getNeighbors(fromHex!).some(n => n.q === toHex!.q && n.r === toHex!.r)
        );

        if (!canAnimateMove || !fromHex || !toHex || !mover) {
            this.applyOnlineCellsInstant(state.cells);
            return;
        }

        this.onlineAnimating = true;

        const convertedHexes: Hex[] = [];
        const toKey = this.boardManager.key(toHex.q, toHex.r);
        const fromKey = this.boardManager.key(fromHex.q, fromHex.r);

        for (const cell of state.cells) {
            const k = this.boardManager.key(cell.q, cell.r);
            if (k === fromKey || k === toKey) continue;

            const h = this.boardManager.getTile(cell.q, cell.r);
            if (!h || h.owner === cell.owner) continue;

            const previous = oldOwners.get(k);
            if (cell.owner) {
                this.combatManager.captureTile(h, cell.owner);
            } else {
                this.combatManager.destroyUnit(h);
            }

            if (previous && previous !== mover && h.owner === mover) {
                convertedHexes.push(h);
            }
        }

        const fromPos = this.boardManager.hexToPixel(fromHex.q, fromHex.r);
        const toPos = this.boardManager.hexToPixel(toHex.q, toHex.r);
        const pieceOffsetX = -25;
        const pieceOffsetY = -30;
        const texture = mover === 'blue' ? BLUE_SOLDIER_KEY : RED_SOLDIER_KEY;

        this.combatManager.destroyUnit(fromHex);

        this.unitManager.removeUnit(toHex);
        toHex.owner = mover;
        toHex.poly?.setFillStyle(mover === 'blue' ? BATTLE_BLUE : BATTLE_RED, 1);

        const movingPiece = this.add.image(
            fromPos.x + pieceOffsetX,
            fromPos.y + pieceOffsetY,
            texture
        );
        movingPiece.setDisplaySize(44, 44);
        movingPiece.setDepth(30);

        playSound(this, SOUND_KEYS.move, 0.45);
        if (convertedHexes.length > 0) {
            this.time.delayedCall(150, () => playSound(this, SOUND_KEYS.convert, 0.45));
        }

        this.tweens.add({
            targets: movingPiece,
            x: toPos.x + pieceOffsetX,
            y: toPos.y + pieceOffsetY,
            duration: 260,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                movingPiece.destroy();
                this.combatManager.captureTile(toHex, mover);
                this.flashConversions(toHex, convertedHexes);
                this.onlineAnimating = false;
            },
        });
    }

    private applyOnlineCellsInstant(cells: OnlineRoomState['cells']) {
        for (const cell of cells) {
            const h = this.boardManager.getTile(cell.q, cell.r);
            if (!h || h.owner === cell.owner) continue;

            if (cell.owner) {
                this.combatManager.captureTile(h, cell.owner);
            } else {
                this.combatManager.destroyUnit(h);
            }
        }
    }

    private applyOnlineState(state: OnlineRoomState, force = false) {
        if (!force && this.onlineSubmittingMove) return;

        // Avoid applying stale poll responses after a newer state has already arrived.
        if (!force && state.updated_at && state.updated_at < this.lastAppliedOnlineUpdate) return;
        if (state.updated_at) this.lastAppliedOnlineUpdate = state.updated_at;

        this.roomCode = state.room_code;
        this.turnManager.setCurrentPlayer(state.current_player);
        this.turnManager.setTurn(state.turn);
        this.turnManager.setGameOverState(state.game_over);

        if (state.player_id) this.playerId = state.player_id;
        if (state.player_color) this.playerColor = state.player_color;

        if (this.playerId && this.playerColor && this.roomCode && this.onlineServerUrl) {
            saveReconnectSession({
                serverUrl: this.onlineServerUrl,
                roomCode: this.roomCode,
                playerId: this.playerId,
                playerColor: this.playerColor,
            });
        }

        this.applyOnlineCellsWithAnimation(state);

        this.clearHighlights();

        if (this.mode === 'online' && this.turnManager.getCurrentPlayer() !== this.playerColor) {
            this.onlineInteracting = false;
            this.unitManager.selectUnit(null);
        }

        if (!state.red_joined) {
            this.statusText.setText(`ROOM ${state.room_code}`);
            this.statusText.setColor(Theme.ui.text);
            this.countText.setText('Waiting for Player 2 to join...');
            return;
        }

        if (state.game_over) {
            clearReconnectSession();
            if (!this.victorySoundPlayed) {
                playSound(this, SOUND_KEYS.victory, 0.65);
                this.victorySoundPlayed = true;
            }
            const winner = state.winner ?? 'blue';
            this.statusText.setText(`${winner.toUpperCase()} WINS!`);
            this.statusText.setColor(winner === 'blue' ? Theme.status.victory : Theme.status.defeat);
            this.countText.setText(`Room ${state.room_code}  Blue ${state.counts.blue} | Red ${state.counts.red}`);
            return;
        }

        this.updateHud();
    }

    private saveAiResultIfNeeded(winner: Player) {
        this.aiManager.saveResultIfNeeded(this.mode, winner, this.turnManager.getTurn());
    }

    private checkVictory(): boolean {
        if (this.mode === 'campaign') {
            this.updateCampaignObjectiveTracking();

            if (this.isCampaignObjectiveComplete()) {
                this.finishCampaignGame('blue', 'OBJECTIVE COMPLETE!');
                return true;
            }

            if (this.hasCampaignObjectiveFailed()) {
                this.finishCampaignGame('red', 'OBJECTIVE FAILED');
                return true;
            }
        }

        const result = this.combatManager.checkVictory(this.turnManager.getCurrentPlayer());
        if (result.gameOver && result.winner) {
            this.handleCombatVictory(result.winner);
            return true;
        }
        return false;
    }

    private handleCombatVictory(winner: Player) {
        this.turnManager.setGameOver()
        if (!this.victorySoundPlayed) {
            playSound(this, SOUND_KEYS.victory, 0.65);
            this.victorySoundPlayed = true;
        }

        const counts = this.boardManager.getCounts();
        this.statusText.setText(`${winner.toUpperCase()} WINS!`);
        this.statusText.setColor(winner === 'blue' ? Theme.status.victory : Theme.status.defeat);

        if (this.isMissionMode) {
            const won = winner === 'blue';
            const result: MissionResult = {
                missionId: this.battleConfig!.missionId,
                victory: won,
                goldEarned: won ? this.battleConfig!.rewardGold : 0,
                xpEarned: won ? this.battleConfig!.rewardXP : 0,
                outcome: won ? 'victory' : 'defeat',
                turns: this.turnManager.getTurn(),
            };
            this.missionManager.processResult(result);
            this.registry.set('lastBattleConfig', this.battleConfig);
            this.time.removeAllEvents();
            this.tweens.killAll();
            this.scene.start('MissionCompleteScene', { missionResult: result });
            return;
        }

        if (this.mode === 'ai') {
            const rematch = this.createWideButton(WIDTH / 2, 585, 'Rematch', () => {
                this.scene.start('HexConquestScene', {
                    mode: 'ai',
                    campaignLevel: 1,
                    aiDifficulty: this.aiManager.getDifficulty(),
                    aiPersonality: this.aiManager.getPersonality(),
                });
            });
            const setup = this.createWideButton(WIDTH / 2, 650, 'Change AI Setup', () => this.scene.start('AiSetupScene'));
            const menu = this.createWideButton(WIDTH / 2, 715, 'Main Menu', () => this.scene.start('MenuScene'));
            this.endButtons.push(rematch, setup, menu);
            return;
        }

        if (this.mode === 'campaign' && winner === 'blue') {
            this.saveCampaignWinResults();
        }

        this.countText.setText(`Final Score  Blue ${counts.blue}  |  Red ${counts.red}`);
        this.clearHighlights();
        this.showEndButtons(winner);
    }

    private getCampaignObjectiveProgressText(objective: CampaignObjective) {
        if (objective.type === 'eliminate_red') {
            return objective.description;
        }

        if (objective.type === 'win_within_turns') {
            return `${objective.description} (${Math.max(0, (objective.target ?? 0) - this.turnManager.getTurn() + 1)} turns left)`;
        }

        if (objective.type === 'control_territory') {
            return `${objective.description} (${this.getBlueTerritoryPercent()}% / ${objective.target}%)`;
        }

        if (objective.type === 'hold_center') {
            return `${objective.description} (${this.centerHoldTurns} / ${objective.target})`;
        }

        if (objective.type === 'survive_turns') {
            return `${objective.description} (${Math.min(this.turnManager.getTurn(), objective.target ?? this.turnManager.getTurn())} / ${objective.target})`;
        }

        return objective.description;
    }

    private updateCampaignObjectiveTracking() {
        if (this.mode !== 'campaign' || this.lastObjectiveTurnTracked === this.turnManager.getTurn()) return;

        const center = this.boardManager.getTile(0, 0);
        this.centerHoldTurns = center?.owner === 'blue' ? this.centerHoldTurns + 1 : 0;
        this.lastObjectiveTurnTracked = this.turnManager.getTurn();
    }

    private getBlueTerritoryPercent() {
        const counts = this.boardManager.getCounts();
        const total = [...this.boardManager.getTiles()].length || 1;
        return Math.round((counts.blue / total) * 100);
    }

    private isCampaignObjectiveComplete() {
        const objective = getCampaignObjective(this.campaignLevel);
        const counts = this.boardManager.getCounts();

        if (counts.red === 0 && counts.blue > 0) return true;

        if (objective.type === 'control_territory') {
            return this.getBlueTerritoryPercent() >= (objective.target ?? 0);
        }

        if (objective.type === 'hold_center') {
            return this.centerHoldTurns >= (objective.target ?? 0);
        }

        if (objective.type === 'survive_turns') {
            return this.turnManager.getTurn() >= (objective.target ?? 0) && counts.blue > 0;
        }

        if (objective.type === 'win_within_turns') {
            return counts.red === 0 && this.turnManager.getTurn() <= (objective.target ?? Number.MAX_SAFE_INTEGER);
        }

        return false;
    }

    private hasCampaignObjectiveFailed() {
        const objective = getCampaignObjective(this.campaignLevel);
        const counts = this.boardManager.getCounts();

        if (counts.blue === 0) return true;

        if (objective.type === 'win_within_turns') {
            return this.turnManager.getTurn() > (objective.target ?? Number.MAX_SAFE_INTEGER) && counts.red > 0;
        }

        return false;
    }

    private finishCampaignGame(winner: Player, headline: string) {
        this.turnManager.setGameOver()
        if (!this.victorySoundPlayed) {
            playSound(this, SOUND_KEYS.victory, 0.65);
            this.victorySoundPlayed = true;
        }

        const objective = getCampaignObjective(this.campaignLevel);
        const stars = winner === 'blue' ? this.saveCampaignWinResults() : 0;

        this.statusText.setText(winner === 'blue' ? headline : `${headline} — RED WINS`);
        this.statusText.setColor(winner === 'blue' ? Theme.status.victory : Theme.status.defeat);
        this.countText.setText(
            winner === 'blue'
                ? `${objective.title} complete!  ${formatStars(stars)}`
                : `${objective.description}\nBlue ${this.boardManager.getCounts().blue} | Red ${this.boardManager.getCounts().red}`
        );

        this.clearHighlights();
        this.showEndButtons(winner);
    }

    private saveCampaignWinResults() {
        const objective = getCampaignObjective(this.campaignLevel);
        const stars = this.calculateCampaignStars(objective);
        saveCampaignStars(this.campaignLevel, stars);
        saveUnlockedCampaignLevel(Math.min(this.campaignLevel + 1, CAMPAIGN_MAX_LEVEL));
        return stars;
    }

    private calculateCampaignStars(objective: CampaignObjective) {
        let stars = 1;

        if (objective.starTurnLimit && this.turnManager.getTurn() <= objective.starTurnLimit) {
            stars++;
        }

        if (objective.starTerritoryPercent && this.getBlueTerritoryPercent() >= objective.starTerritoryPercent) {
            stars++;
        }

        return Phaser.Math.Clamp(stars, 1, 3);
    }

    private showEndButtons(winner: Player) {
        for (const b of this.endButtons) b.destroy();
        this.endButtons = [];

        if (this.isMissionMode) {
            const mapButton = this.createWideButton(WIDTH / 2, 620, 'Return to World Map', () => {
                this.scene.start('WorldMapScene');
            });
            this.endButtons.push(mapButton);
            if (winner === 'red') {
                const retry = this.createWideButton(WIDTH / 2, 685, 'Retry', () => this.restartGame());
                this.endButtons.push(retry);
            }
            return;
        }

        if (this.mode === 'campaign' && winner === 'blue') {
            const unlockedNext = Math.min(this.campaignLevel + 1, CAMPAIGN_MAX_LEVEL);
            saveUnlockedCampaignLevel(unlockedNext);

            if (this.campaignLevel < CAMPAIGN_MAX_LEVEL) {
                const next = this.createWideButton(WIDTH / 2, 620, `Next Level ${this.campaignLevel + 1}`, () => {
                    this.scene.start('HexConquestScene', {
                        mode: 'campaign',
                        campaignLevel: this.campaignLevel + 1,
                    });
                });
                this.endButtons.push(next);
            }

            const levels = this.createWideButton(WIDTH / 2, 685, 'Level Select', () => {
                this.scene.start('CampaignLevelSelectScene');
            });
            this.endButtons.push(levels);
            return;
        }

        if (this.mode === 'campaign' && winner === 'red') {
            const retry = this.createWideButton(WIDTH / 2, 620, `Retry Level ${this.campaignLevel}`, () => this.restartGame());
            const levels = this.createWideButton(WIDTH / 2, 685, 'Level Select', () => {
                this.scene.start('CampaignLevelSelectScene');
            });
            this.endButtons.push(retry, levels);
        }
    }

    private createWideButton(x: number, y: number, labelText: string, callback: () => void) {
        const button = this.add.container(x, y);
        const bg = this.add.graphics();
        bg.fillStyle(BTN_BG, 1);
        bg.fillRoundedRect(-145, -27, 290, 54, 14);

        const label = this.add.text(0, 0, labelText, {
            fontSize: '22px',
            fontStyle: 'bold',
            color: Theme.button.primary.text,
        }).setOrigin(0.5);

        button.add([bg, label]);
        button.setSize(290, 54);
        button.setInteractive({ useHandCursor: true });
        button.on('pointerdown', () => {
            unlockAudio(this);
            playSound(this, SOUND_KEYS.confirm, 0.35);
            callback();
        });
        return button;
    }

    private updateHud() {
        const counts = this.boardManager.getCounts();

        if (this.aiManager.isThinking()) {
            this.statusText.setText('RED IS THINKING...');
            this.statusText.setColor(Theme.status.warning);
            this.countText.setText(`Turn ${this.turnManager.getTurn()}    Blue ${counts.blue}  |  Red ${counts.red}`);
            return;
        }

        if (this.mode === 'online') {
            const turnText = this.turnManager.getCurrentPlayer() === this.playerColor ? 'YOUR TURN' : `${this.turnManager.getCurrentPlayer().toUpperCase()}'S TURN`;
            const colorText = this.playerColor ? `You are ${this.playerColor.toUpperCase()}` : 'Online PvP';
            this.statusText.setText(turnText);
            this.statusText.setColor(this.turnManager.getCurrentPlayer() === 'blue' ? Theme.status.info : Theme.status.warning);
            this.countText.setText(`Room ${this.roomCode}  ${colorText}\nTurn ${this.turnManager.getTurn()}  Blue ${counts.blue} | Red ${counts.red}`);
            return;
        }

        const weapon = WeaponManager.getEquipped();
        const weaponLabel = weapon && this.turnManager.getCurrentPlayer() === 'blue'
            ? ` [${weapon.name} +${weapon.conversionBonus} (${this.currentWeaponDurability}/${weapon.durability})]`
            : '';
        this.statusText.setText(`${this.turnManager.getCurrentPlayer().toUpperCase()}'S TURN${weaponLabel}`);
        this.statusText.setColor(this.turnManager.getCurrentPlayer() === 'blue' ? Theme.status.info : Theme.status.warning);

        this.createActionBar();
        this.createSkillBar();

        if (this.mode === 'ai') {
            const stats = getAiStats();
            this.countText.setText(
                `${formatAiDifficulty(this.aiManager.getDifficulty())} ${formatAiPersonality(this.aiManager.getPersonality())} AI\nTurn ${this.turnManager.getTurn()}  Blue ${counts.blue} | Red ${counts.red}  Record ${stats.wins}W-${stats.losses}L`
            );
            return;
        }

        if (this.mode === 'campaign') {
            const objective = getCampaignObjective(this.campaignLevel);
            this.countText.setText(`Objective: ${this.getCampaignObjectiveProgressText(objective)}\nTurn ${this.turnManager.getTurn()}  Blue ${counts.blue} | Red ${counts.red}`);
            return;
        }

        this.countText.setText(`Turn ${this.turnManager.getTurn()}    Blue ${counts.blue}  |  Red ${counts.red}`);
    }

    private clearHighlights() {
        for (const t of this.previewTexts) {
            this.tweens.killTweensOf(t);
            t.destroy();
        }
        this.previewTexts = [];

        this.validMoves.clear();

        for (const h of this.boardManager.getTiles()) {
            const fill = h.owner === 'blue' ? BATTLE_BLUE : h.owner === 'red' ? BATTLE_RED : BATTLE_NEUTRAL;
            h.poly?.setFillStyle(fill, 1);
            h.poly?.setStrokeStyle(2, BATTLE_STROKE, 1);
        }
    }

    private shakeInvalid(hex: Hex) {
        playSound(this, SOUND_KEYS.invalid, 0.38);
        if (!hex.poly) return;
        this.tweens.add({ targets: hex.poly, x: hex.poly.x + 4, duration: 45, yoyo: true, repeat: 2 });
    }

    private restartGame() {
        this.time.removeAllEvents();
        this.tweens.killAll();

        if (this.mode === 'online') {
            clearReconnectSession();
            this.scene.start('OnlineLobbyScene');
            return;
        }

        if (this.isMissionMode) {
            this.resetState();
            this.scene.restart({
                battleConfig: this.battleConfig,
                returnScene: this.returnScene,
            });
            return;
        }

        this.resetState();
        this.scene.restart({
            mode: this.mode,
            campaignLevel: this.campaignLevel,
            aiDifficulty: this.aiManager.getDifficulty(),
            aiPersonality: this.aiManager.getPersonality(),
        });
    }

    private backToMenu() {
        this.time.removeAllEvents();
        this.tweens.killAll();
        this.scene.start('MenuScene');
    }

}
