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
    COLORS,
    getCampaignObjective,
    getSavedAiSettings,
    saveReconnectSession,
    clearReconnectSession,
    formatAiDifficulty,
    formatAiPersonality,
} from '../shared';
import { BoardManager } from '../managers/BoardManager';
import { UnitManager } from '../managers/UnitManager';
import { CombatManager } from '../managers/CombatManager';
import { TurnManager } from '../managers/TurnManager';
import { AIManager } from '../managers/AIManager';

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

    constructor() {
        super('HexConquestScene');
    }

    private aiInitDifficulty?: AiDifficulty;
    private aiInitPersonality?: AiPersonality;

    init(data: {
        mode?: GameMode;
        campaignLevel?: number;
        onlineServerUrl?: string;
        roomCode?: string;
        playerId?: string;
        playerColor?: Player | null;
        aiDifficulty?: AiDifficulty;
        aiPersonality?: AiPersonality;
    }) {
        this.mode = data.mode ?? 'ai';
        this.campaignLevel = data.campaignLevel ?? 1;
        this.aiInitDifficulty = data.aiDifficulty;
        this.aiInitPersonality = data.aiPersonality;

        this.onlineServerUrl = data.onlineServerUrl ?? '';
        this.roomCode = data.roomCode ?? '';
        this.playerId = data.playerId ?? '';
        this.playerColor = data.playerColor ?? null;
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
        g.fillGradientStyle(COLORS.bgTop, COLORS.bgTop, COLORS.bgBottom, COLORS.bgBottom, 1);
        g.fillRect(0, 0, WIDTH, HEIGHT);

        this.add.text(WIDTH / 2, 42, 'HEX CONQUEST', {
            fontSize: '34px',
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
        }).setOrigin(0.5);

        const modeLabel = this.getModeLabel();
        this.add.text(WIDTH / 2, 78, modeLabel, {
            fontSize: '16px',
            color: '#eaf7ff',
            stroke: '#000000',
            strokeThickness: 3,
        }).setOrigin(0.5);
    }

    private getModeLabel() {
        if (this.mode === 'campaign') return `Level ${this.campaignLevel}: ${getCampaignObjective(this.campaignLevel).title}`;
        if (this.mode === 'ai') return `AI ${formatAiDifficulty(this.aiManager.getDifficulty())} — ${formatAiPersonality(this.aiManager.getPersonality())}`;
        if (this.mode === 'local') return 'Local 2 Player';
        if (this.mode === 'online') return `Online PvP Room ${this.roomCode}`;
        return 'Online Multiplayer';
    }

    private createHeader() {
        const panel = this.add.graphics();
        panel.fillStyle(0x163d5d, 0.78);
        panel.lineStyle(3, 0xffffff, 0.6);
        panel.fillRoundedRect(24, 105, WIDTH - 48, 100, 18);
        panel.strokeRoundedRect(24, 105, WIDTH - 48, 100, 18);

        this.statusText = this.add.text(WIDTH / 2, 129, '', {
            fontSize: '22px',
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center',
        }).setOrigin(0.5);

        this.countText = this.add.text(WIDTH / 2, 171, '', {
            fontSize: '16px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center',
            wordWrap: { width: WIDTH - 60 },
        }).setOrigin(0.5);
    }

    private createBottomButtons() {
        this.createSmallButton(WIDTH / 2 - 93, 740, 'Menu', () => this.backToMenu());
        this.createSmallButton(WIDTH / 2 + 93, 740, this.mode === 'online' ? 'Leave' : 'Restart', () => this.restartGame());
    }

    private createSmallButton(x: number, y: number, labelText: string, callback: () => void) {
        const button = this.add.container(x, y);
        const bg = this.add.graphics();
        bg.fillStyle(0xb78a55, 1);
        bg.fillRoundedRect(-78, -27, 156, 54, 14);

        const label = this.add.text(0, 0, labelText, {
            fontSize: '22px',
            fontStyle: 'bold',
            color: '#ffffff',
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
        const fill = hex.owner === 'blue' ? COLORS.blue : hex.owner === 'red' ? COLORS.red : COLORS.empty;

        const poly = this.add.polygon(x, y, points, fill, 1);
        poly.setStrokeStyle(2, COLORS.emptyStroke, 1);
        poly.setInteractive(new Phaser.Geom.Polygon(this.boardManager.getHexPoints(HEX_SIZE - 1)), Phaser.Geom.Polygon.Contains);
        poly.on('pointerdown', () => this.handleHexTap(hex));
        hex.poly = poly;

        if (hex.owner) this.unitManager.createUnit(hex, hex.owner);
    }

    private handleHexTap(hex: Hex) {
        if (this.turnManager.isGameOver() || this.aiManager.isThinking() || this.onlineSubmittingMove || this.onlineAnimating) return;

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
        hex.poly?.setStrokeStyle(5, COLORS.selected, 1);

        for (const n of this.boardManager.getNeighbors(hex)) {
            if (!n.owner) {
                this.validMoves.add(this.boardManager.key(n.q, n.r));
                n.poly?.setFillStyle(COLORS.valid, 1);
                this.createMovePreview(n, this.turnManager.getCurrentPlayer());
            }
        }
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
        from.poly?.setFillStyle(COLORS.empty, 1);
        target.poly?.setFillStyle(mover === 'blue' ? COLORS.blue : COLORS.red, 1);
        playSound(this, SOUND_KEYS.move, 0.5);

        this.unitManager.selectUnit(null);
        this.clearHighlights();

        const converted = this.combatManager.attack(target, mover);
        if (converted.length > 0) playSound(this, SOUND_KEYS.convert, 0.5);
        this.flashConversions(target, converted);

        this.time.delayedCall(250, () => {
            if (this.checkVictory()) return;

            this.turnManager.nextPlayer();
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

        move.from.poly?.setStrokeStyle(5, COLORS.selected, 1);
        move.to.poly?.setFillStyle(COLORS.valid, 1);

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
        toHex.poly?.setFillStyle(mover === 'blue' ? COLORS.blue : COLORS.red, 1);

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
            this.statusText.setColor('#ffffff');
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
            this.statusText.setColor(winner === 'blue' ? '#7cc3ff' : '#ff8f8f');
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
        this.saveAiResultIfNeeded(winner);
        this.statusText.setText(`${winner.toUpperCase()} WINS!`);
        this.statusText.setColor(winner === 'blue' ? '#7cc3ff' : '#ff8f8f');

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
        this.statusText.setColor(winner === 'blue' ? '#7cc3ff' : '#ff8f8f');
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
        bg.fillStyle(0xb78a55, 1);
        bg.fillRoundedRect(-145, -27, 290, 54, 14);

        const label = this.add.text(0, 0, labelText, {
            fontSize: '22px',
            fontStyle: 'bold',
            color: '#ffffff',
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
            this.statusText.setColor('#ff8f8f');
            this.countText.setText(`Turn ${this.turnManager.getTurn()}    Blue ${counts.blue}  |  Red ${counts.red}`);
            return;
        }

        if (this.mode === 'online') {
            const turnText = this.turnManager.getCurrentPlayer() === this.playerColor ? 'YOUR TURN' : `${this.turnManager.getCurrentPlayer().toUpperCase()}'S TURN`;
            const colorText = this.playerColor ? `You are ${this.playerColor.toUpperCase()}` : 'Online PvP';
            this.statusText.setText(turnText);
            this.statusText.setColor(this.turnManager.getCurrentPlayer() === 'blue' ? '#7cc3ff' : '#ff8f8f');
            this.countText.setText(`Room ${this.roomCode}  ${colorText}\nTurn ${this.turnManager.getTurn()}  Blue ${counts.blue} | Red ${counts.red}`);
            return;
        }

        this.statusText.setText(`${this.turnManager.getCurrentPlayer().toUpperCase()}'S TURN`);
        this.statusText.setColor(this.turnManager.getCurrentPlayer() === 'blue' ? '#7cc3ff' : '#ff8f8f');

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
            const fill = h.owner === 'blue' ? COLORS.blue : h.owner === 'red' ? COLORS.red : COLORS.empty;
            h.poly?.setFillStyle(fill, 1);
            h.poly?.setStrokeStyle(2, COLORS.emptyStroke, 1);
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
