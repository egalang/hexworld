import Phaser from 'phaser';
import {
    SQRT3,
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
    BOARD_RADIUS,
    Player,
    Hex,
    GameMode,
    AiDifficulty,
    AiPersonality,
    CampaignObjective,
    COLORS,
    getCampaignObjective,
    getSavedAiSettings,
    saveAiMatchResult,
    saveAiSettings,
    saveReconnectSession,
    clearReconnectSession,
    formatAiDifficulty,
    formatAiPersonality,
} from '../shared';

export class HexConquestScene extends Phaser.Scene {
    private hexes = new Map<string, Hex>();
    private currentPlayer: Player = 'blue';
    private selected: Hex | null = null;
    private turn = 1;
    private gameOver = false;
    private mode: GameMode = 'ai';
    private campaignLevel = 1;
    private aiPlayer: Player | null = 'red';
    private aiDifficulty: AiDifficulty = 'normal';
    private aiPersonality: AiPersonality = 'balanced';
    private aiResultSaved = false;
    private aiThinking = false;
    private statusText!: Phaser.GameObjects.Text;
    private countText!: Phaser.GameObjects.Text;
    private boardCenterX = (WIDTH / 2) + 25;
    private boardCenterY = 475;
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
        this.aiPlayer = this.mode === 'local' || this.mode === 'online' ? null : 'red';
        const savedAiSettings = getSavedAiSettings();
        this.aiDifficulty = data.aiDifficulty ?? savedAiSettings.difficulty;
        this.aiPersonality = data.aiPersonality ?? savedAiSettings.personality;

        this.onlineServerUrl = data.onlineServerUrl ?? '';
        this.roomCode = data.roomCode ?? '';
        this.playerId = data.playerId ?? '';
        this.playerColor = data.playerColor ?? null;
    }

    private resetState() {
        this.hexes.clear();
        this.currentPlayer = 'blue';
        this.selected = null;
        this.turn = 1;
        this.gameOver = false;
        this.aiThinking = false;
        this.validMoves.clear();
        this.previewTexts = [];
        this.endButtons = [];
        this.pollingEvent = undefined;
        this.onlineSubmittingMove = false;
        this.onlineInteracting = false;
        this.onlineAnimating = false;
        this.lastAppliedOnlineUpdate = 0;
        this.victorySoundPlayed = false;
        this.aiResultSaved = false;
        this.centerHoldTurns = 0;
        this.lastObjectiveTurnTracked = 0;
    }

    create() {
        this.input.once('pointerdown', () => unlockAudio(this));
        this.resetState();
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
        if (this.mode === 'ai') return `AI ${formatAiDifficulty(this.aiDifficulty)} — ${formatAiPersonality(this.aiPersonality)}`;
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
        this.hexes.clear();
        this.selected = null;
        this.validMoves.clear();
        this.previewTexts = [];

        for (let q = -BOARD_RADIUS; q <= BOARD_RADIUS; q++) {
            const r1 = Math.max(-BOARD_RADIUS, -q - BOARD_RADIUS);
            const r2 = Math.min(BOARD_RADIUS, -q + BOARD_RADIUS);
            for (let r = r1; r <= r2; r++) {
                const s = -q - r;
                const owner = this.getInitialOwner(q, r, s);
                const hex: Hex = { q, r, s, owner };
                this.hexes.set(this.key(q, r), hex);
            }
        }

        for (const hex of this.hexes.values()) {
            this.drawHex(hex);
        }
    }

    private getInitialOwner(q: number, _r: number, s: number): Owner {
        if (q <= -3 || s >= 3) return 'blue';
        if (q >= 3 || s <= -3) return 'red';

        if (this.mode === 'campaign' && this.campaignLevel >= 3 && (q === 2 || s === -2) && Phaser.Math.Between(0, 100) < 24) {
            return 'red';
        }

        if (this.mode === 'campaign' && this.campaignLevel >= 5 && (q === -2 || s === 2) && Phaser.Math.Between(0, 100) < 12) {
            return null;
        }

        return null;
    }

    private drawHex(hex: Hex) {
        const { x, y } = this.hexToPixel(hex.q, hex.r);
        const points = this.getHexPoints(HEX_SIZE - 1).flatMap(p => [p.x, p.y]);
        const fill = hex.owner === 'blue' ? COLORS.blue : hex.owner === 'red' ? COLORS.red : COLORS.empty;

        const poly = this.add.polygon(x, y, points, fill, 1);
        poly.setStrokeStyle(2, COLORS.emptyStroke, 1);
        poly.setInteractive(new Phaser.Geom.Polygon(this.getHexPoints(HEX_SIZE - 1)), Phaser.Geom.Polygon.Contains);
        poly.on('pointerdown', () => this.handleHexTap(hex));
        hex.poly = poly;

        if (hex.owner) this.createPiece(hex);
    }

    private createPiece(hex: Hex) {
        if (!hex.owner) return;

        const { x, y } = this.hexToPixel(hex.q, hex.r);

        const PIECE_OFFSET_X = -25;
        const PIECE_OFFSET_Y = -30;

        const texture = hex.owner === 'blue' ? BLUE_SOLDIER_KEY : RED_SOLDIER_KEY;

        const sprite = this.add.image(
            x + PIECE_OFFSET_X,
            y + PIECE_OFFSET_Y,
            texture
        );

        sprite.setDisplaySize(44, 44);
        sprite.setDepth(5);

        hex.piece = sprite;
    }

    private handleHexTap(hex: Hex) {
        if (this.gameOver || this.aiThinking || this.onlineSubmittingMove || this.onlineAnimating) return;

        if (this.mode === 'online') {
            if (!this.playerColor) return;
            if (this.currentPlayer !== this.playerColor) {
                this.shakeInvalid(hex);
                return;
            }
        } else if (this.currentPlayer === this.aiPlayer) {
            return;
        }

        if (hex.owner === this.currentPlayer) {
            this.selectHex(hex);
            return;
        }

        if (this.selected && !hex.owner && this.validMoves.has(this.key(hex.q, hex.r))) {
            if (this.mode === 'online') {
                this.submitOnlineMove(this.selected, hex);
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
        this.selected = hex;
        hex.poly?.setStrokeStyle(5, COLORS.selected, 1);

        for (const n of this.neighbors(hex)) {
            if (!n.owner) {
                this.validMoves.add(this.key(n.q, n.r));
                n.poly?.setFillStyle(COLORS.valid, 1);
                this.createMovePreview(n, this.currentPlayer);
            }
        }
    }

    private createMovePreview(target: Hex, player: Player) {
        const captureCount = this.countAdjacentEnemies(target, player);
        if (captureCount <= 0) return;

        const { x, y } = this.hexToPixel(target.q, target.r);

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
        if (!this.selected) return;
        const from = this.selected;
        const mover: Player = this.currentPlayer;

        from.owner = null;
        if (from.piece) {
            from.piece.destroy();
            from.piece = undefined;
        }
        from.poly?.setFillStyle(COLORS.empty, 1);

        target.owner = mover;
        target.poly?.setFillStyle(mover === 'blue' ? COLORS.blue : COLORS.red, 1);
        this.createPiece(target);
        playSound(this, SOUND_KEYS.move, 0.5);

        this.selected = null;
        this.clearHighlights();

        const converted = this.convertAdjacent(target, mover);
        if (converted.length > 0) playSound(this, SOUND_KEYS.convert, 0.5);
        this.flashConversions(target, converted);

        this.time.delayedCall(250, () => {
            if (this.checkVictory()) return;

            this.currentPlayer = this.currentPlayer === 'blue' ? 'red' : 'blue';
            this.turn++;
            this.updateHud();

            if (this.checkVictory()) return;

            if (this.currentPlayer === this.aiPlayer) {
                this.time.delayedCall(500, () => this.runAiTurn());
            }
        });
    }

    private convertAdjacent(hex: Hex, player: Player): Hex[] {
        const converted: Hex[] = [];
        for (const n of this.neighbors(hex)) {
            if (n.owner && n.owner !== player) {
                n.owner = player;
                n.poly?.setFillStyle(player === 'blue' ? COLORS.blue : COLORS.red, 1);
                n.piece?.destroy();
                n.piece = undefined;
                this.createPiece(n);
                converted.push(n);
            }
        }
        return converted;
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
        if (this.gameOver || this.currentPlayer !== this.aiPlayer || this.aiThinking) return;

        const move = this.getBestAiMove(this.aiPlayer);
        if (!move) {
            this.checkVictory();
            return;
        }

        this.aiThinking = true;
        this.clearHighlights();
        this.updateHud();

        move.from.poly?.setStrokeStyle(5, COLORS.selected, 1);
        move.to.poly?.setFillStyle(COLORS.valid, 1);

        this.time.delayedCall(350, () => {
            this.selected = move.from;
            this.validMoves.clear();
            this.validMoves.add(this.key(move.to.q, move.to.r));
            this.aiThinking = false;
            this.moveSelectedTo(move.to);
        });
    }

    private getBestAiMove(player: Player): { from: Hex; to: Hex; score: number } | null {
        const moves: { from: Hex; to: Hex; score: number }[] = [];

        for (const from of this.hexes.values()) {
            if (from.owner !== player) continue;

            for (const to of this.neighbors(from)) {
                if (to.owner) continue;
                moves.push({ from, to, score: this.scoreAiMove(from, to, player) });
            }
        }

        if (!moves.length) return null;
        moves.sort((a, b) => b.score - a.score);


        if (this.mode === 'campaign') {
            const pickFromTop = Math.max(1, 6 - this.campaignLevel);
            const maxIndex = Math.min(pickFromTop, moves.length) - 1;
            return moves[Phaser.Math.Between(0, maxIndex)];
        }

        if (this.aiDifficulty === 'easy') {
            const maxIndex = Math.min(moves.length - 1, Math.max(2, Math.floor(moves.length * 0.55)));
            return moves[Phaser.Math.Between(0, maxIndex)];
        }

        if (this.aiDifficulty === 'normal') {
            const maxIndex = Math.min(2, moves.length - 1);
            return moves[Phaser.Math.Between(0, maxIndex)];
        }

        if (this.aiDifficulty === 'hard') {
            const maxIndex = Math.min(1, moves.length - 1);
            return moves[Phaser.Math.Between(0, maxIndex)];
        }

        return moves[0];
    }

    private scoreAiMove(from: Hex, to: Hex, player: Player): number {
        const converted = this.countAdjacentEnemies(to, player);
        const centerDistance = Math.abs(to.q) + Math.abs(to.r) + Math.abs(to.s);
        const centerBonus = (BOARD_RADIUS * 3 - centerDistance) * 2;
        const adjacentFriendlies = this.neighbors(to).filter(n => n.owner === player).length;
        const nearbyEnemies = this.neighbors(to).filter(n => n.owner && n.owner !== player).length;
        const randomBonus = this.aiPersonality === 'chaotic' ? Phaser.Math.Between(0, 85) : Phaser.Math.Between(0, 8);

        let score = converted * 100 + centerBonus + adjacentFriendlies * 8 + randomBonus;

        if (this.aiPersonality === 'aggressive') {
            score += converted * 65 + nearbyEnemies * 10;
        } else if (this.aiPersonality === 'defensive') {
            score += adjacentFriendlies * 22 - nearbyEnemies * 4;
        } else if (this.aiPersonality === 'center') {
            score += centerBonus * 6;
        } else if (this.aiPersonality === 'balanced') {
            score += converted * 18 + centerBonus * 2 + adjacentFriendlies * 10;
        }

        if (this.aiDifficulty === 'easy') {
            score += Phaser.Math.Between(-45, 45);
        } else if (this.aiDifficulty === 'hard') {
            score += converted * 20 + centerBonus * 2;
        } else if (this.aiDifficulty === 'expert') {
            score += converted * 35 + centerBonus * 3 + adjacentFriendlies * 12;
            score -= this.estimateOpponentCounterRisk(from, to, player) * 45;
        }

        return score;
    }

    private estimateOpponentCounterRisk(from: Hex, to: Hex, player: Player): number {
        const opponent: Player = player === 'blue' ? 'red' : 'blue';
        let worstCounter = 0;

        for (const enemyFrom of this.hexes.values()) {
            let simulatedOwner = enemyFrom.owner;
            if (enemyFrom.q === from.q && enemyFrom.r === from.r) simulatedOwner = null;
            if (enemyFrom.q === to.q && enemyFrom.r === to.r) simulatedOwner = player;
            if (simulatedOwner !== opponent) continue;

            for (const enemyTo of this.neighbors(enemyFrom)) {
                let targetOwner = enemyTo.owner;
                if (enemyTo.q === from.q && enemyTo.r === from.r) targetOwner = null;
                if (enemyTo.q === to.q && enemyTo.r === to.r) targetOwner = player;
                if (targetOwner !== null) continue;

                let counter = 0;
                for (const n of this.neighbors(enemyTo)) {
                    let nOwner = n.owner;
                    if (n.q === from.q && n.r === from.r) nOwner = null;
                    if (n.q === to.q && n.r === to.r) nOwner = player;
                    if (nOwner === player) counter++;
                }
                worstCounter = Math.max(worstCounter, counter);
            }
        }

        return worstCounter;
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
        this.selected = null;
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
        for (const h of this.hexes.values()) {
            oldOwners.set(this.key(h.q, h.r), h.owner);
        }

        const changedCells = state.cells.filter(cell => {
            const previous = oldOwners.get(this.key(cell.q, cell.r));
            return previous !== cell.owner;
        });

        if (!changedCells.length) return;

        const fromCell = changedCells.find(cell => {
            const previous = oldOwners.get(this.key(cell.q, cell.r));
            return previous !== null && cell.owner === null;
        });

        const toCell = changedCells.find(cell => {
            const previous = oldOwners.get(this.key(cell.q, cell.r));
            return previous === null && cell.owner !== null;
        });

        const mover = toCell?.owner ?? null;
        const fromHex = fromCell ? this.hexes.get(this.key(fromCell.q, fromCell.r)) : undefined;
        const toHex = toCell ? this.hexes.get(this.key(toCell.q, toCell.r)) : undefined;

        const canAnimateMove = Boolean(
            fromHex &&
            toHex &&
            mover &&
            oldOwners.get(this.key(fromHex!.q, fromHex!.r)) === mover &&
            this.neighbors(fromHex!).some(n => n.q === toHex!.q && n.r === toHex!.r)
        );

        if (!canAnimateMove || !fromHex || !toHex || !mover) {
            this.applyOnlineCellsInstant(state.cells);
            return;
        }

        this.onlineAnimating = true;

        const convertedHexes: Hex[] = [];
        const toKey = this.key(toHex.q, toHex.r);
        const fromKey = this.key(fromHex.q, fromHex.r);

        for (const cell of state.cells) {
            const k = this.key(cell.q, cell.r);
            if (k === fromKey || k === toKey) continue;

            const h = this.hexes.get(k);
            if (!h || h.owner === cell.owner) continue;

            h.owner = cell.owner;
            h.piece?.destroy();
            h.piece = undefined;
            h.poly?.setFillStyle(h.owner === 'blue' ? COLORS.blue : h.owner === 'red' ? COLORS.red : COLORS.empty, 1);
            if (h.owner) this.createPiece(h);

            const previous = oldOwners.get(k);
            if (previous && previous !== mover && h.owner === mover) {
                convertedHexes.push(h);
            }
        }

        const fromPos = this.hexToPixel(fromHex.q, fromHex.r);
        const toPos = this.hexToPixel(toHex.q, toHex.r);
        const pieceOffsetX = -25;
        const pieceOffsetY = -30;
        const texture = mover === 'blue' ? BLUE_SOLDIER_KEY : RED_SOLDIER_KEY;

        fromHex.owner = null;
        fromHex.piece?.destroy();
        fromHex.piece = undefined;
        fromHex.poly?.setFillStyle(COLORS.empty, 1);

        toHex.owner = mover;
        toHex.piece?.destroy();
        toHex.piece = undefined;
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
                toHex.piece?.destroy();
                toHex.piece = undefined;
                this.createPiece(toHex);
                this.flashConversions(toHex, convertedHexes);
                this.onlineAnimating = false;
            },
        });
    }

    private applyOnlineCellsInstant(cells: OnlineRoomState['cells']) {
        for (const cell of cells) {
            const h = this.hexes.get(this.key(cell.q, cell.r));
            if (!h || h.owner === cell.owner) continue;

            h.owner = cell.owner;
            h.piece?.destroy();
            h.piece = undefined;

            const fill = h.owner === 'blue' ? COLORS.blue : h.owner === 'red' ? COLORS.red : COLORS.empty;
            h.poly?.setFillStyle(fill, 1);
            if (h.owner) this.createPiece(h);
        }
    }

    private applyOnlineState(state: OnlineRoomState, force = false) {
        if (!force && this.onlineSubmittingMove) return;

        // Avoid applying stale poll responses after a newer state has already arrived.
        if (!force && state.updated_at && state.updated_at < this.lastAppliedOnlineUpdate) return;
        if (state.updated_at) this.lastAppliedOnlineUpdate = state.updated_at;

        this.roomCode = state.room_code;
        this.currentPlayer = state.current_player;
        this.turn = state.turn;
        this.gameOver = state.game_over;

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

        if (this.mode === 'online' && this.currentPlayer !== this.playerColor) {
            this.onlineInteracting = false;
            this.selected = null;
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
        if (this.mode !== 'ai' || this.aiResultSaved) return;
        this.aiResultSaved = true;
        saveAiSettings(this.aiDifficulty, this.aiPersonality);
        saveAiMatchResult(winner === 'blue', this.turn, this.aiDifficulty, this.aiPersonality);
    }

    private countAdjacentEnemies(hex: Hex, player: Player): number {
        return this.neighbors(hex).filter(n => n.owner && n.owner !== player).length;
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

        const counts = this.getCounts();
        if (counts.blue === 0 || counts.red === 0) {
            this.gameOver = true;
            if (!this.victorySoundPlayed) {
                playSound(this, SOUND_KEYS.victory, 0.65);
                this.victorySoundPlayed = true;
            }

            const winner: Player = counts.blue > 0 ? 'blue' : 'red';
            this.saveAiResultIfNeeded(winner);
            this.statusText.setText(`${winner.toUpperCase()} WINS!`);
            this.statusText.setColor(winner === 'blue' ? '#7cc3ff' : '#ff8f8f');

            if (this.mode === 'ai') {
                const rematch = this.createWideButton(WIDTH / 2, 585, 'Rematch', () => {
                    this.scene.start('HexConquestScene', {
                        mode: 'ai',
                        campaignLevel: 1,
                        aiDifficulty: this.aiDifficulty,
                        aiPersonality: this.aiPersonality,
                    });
                });
                const setup = this.createWideButton(WIDTH / 2, 650, 'Change AI Setup', () => this.scene.start('AiSetupScene'));
                const menu = this.createWideButton(WIDTH / 2, 715, 'Main Menu', () => this.scene.start('MenuScene'));
                this.endButtons.push(rematch, setup, menu);
                return true;
            }

            if (this.mode === 'campaign' && winner === 'blue') {
                this.saveCampaignWinResults();
            }

            this.countText.setText(`Final Score  Blue ${counts.blue}  |  Red ${counts.red}`);
            this.clearHighlights();
            this.showEndButtons(winner);
            return true;
        }

        const movable = [...this.hexes.values()].some(h => h.owner === this.currentPlayer && this.neighbors(h).some(n => !n.owner));
        if (!movable) {
            this.gameOver = true;
            if (!this.victorySoundPlayed) {
                playSound(this, SOUND_KEYS.victory, 0.65);
                this.victorySoundPlayed = true;
            }

            const winner: Player = counts.blue >= counts.red ? 'blue' : 'red';
            this.saveAiResultIfNeeded(winner);
            this.statusText.setText(`NO MOVES — ${winner.toUpperCase()} WINS!`);
            this.statusText.setColor(winner === 'blue' ? '#7cc3ff' : '#ff8f8f');

            if (this.mode === 'campaign' && winner === 'blue') {
                this.saveCampaignWinResults();
            }

            this.countText.setText(`Blue ${counts.blue}  |  Red ${counts.red}`);
            this.clearHighlights();
            this.showEndButtons(winner);
            return true;
        }
        return false;
    }

    private getCampaignObjectiveProgressText(objective: CampaignObjective) {
        if (objective.type === 'eliminate_red') {
            return objective.description;
        }

        if (objective.type === 'win_within_turns') {
            return `${objective.description} (${Math.max(0, (objective.target ?? 0) - this.turn + 1)} turns left)`;
        }

        if (objective.type === 'control_territory') {
            return `${objective.description} (${this.getBlueTerritoryPercent()}% / ${objective.target}%)`;
        }

        if (objective.type === 'hold_center') {
            return `${objective.description} (${this.centerHoldTurns} / ${objective.target})`;
        }

        if (objective.type === 'survive_turns') {
            return `${objective.description} (${Math.min(this.turn, objective.target ?? this.turn)} / ${objective.target})`;
        }

        return objective.description;
    }

    private updateCampaignObjectiveTracking() {
        if (this.mode !== 'campaign' || this.lastObjectiveTurnTracked === this.turn) return;

        const center = this.hexes.get(this.key(0, 0));
        this.centerHoldTurns = center?.owner === 'blue' ? this.centerHoldTurns + 1 : 0;
        this.lastObjectiveTurnTracked = this.turn;
    }

    private getBlueTerritoryPercent() {
        const counts = this.getCounts();
        const total = [...this.hexes.values()].length || 1;
        return Math.round((counts.blue / total) * 100);
    }

    private isCampaignObjectiveComplete() {
        const objective = getCampaignObjective(this.campaignLevel);
        const counts = this.getCounts();

        if (counts.red === 0 && counts.blue > 0) return true;

        if (objective.type === 'control_territory') {
            return this.getBlueTerritoryPercent() >= (objective.target ?? 0);
        }

        if (objective.type === 'hold_center') {
            return this.centerHoldTurns >= (objective.target ?? 0);
        }

        if (objective.type === 'survive_turns') {
            return this.turn >= (objective.target ?? 0) && counts.blue > 0;
        }

        if (objective.type === 'win_within_turns') {
            return counts.red === 0 && this.turn <= (objective.target ?? Number.MAX_SAFE_INTEGER);
        }

        return false;
    }

    private hasCampaignObjectiveFailed() {
        const objective = getCampaignObjective(this.campaignLevel);
        const counts = this.getCounts();

        if (counts.blue === 0) return true;

        if (objective.type === 'win_within_turns') {
            return this.turn > (objective.target ?? Number.MAX_SAFE_INTEGER) && counts.red > 0;
        }

        return false;
    }

    private finishCampaignGame(winner: Player, headline: string) {
        this.gameOver = true;
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
                : `${objective.description}\nBlue ${this.getCounts().blue} | Red ${this.getCounts().red}`
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

        if (objective.starTurnLimit && this.turn <= objective.starTurnLimit) {
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
        const counts = this.getCounts();

        if (this.aiThinking) {
            this.statusText.setText('RED IS THINKING...');
            this.statusText.setColor('#ff8f8f');
            this.countText.setText(`Turn ${this.turn}    Blue ${counts.blue}  |  Red ${counts.red}`);
            return;
        }

        if (this.mode === 'online') {
            const turnText = this.currentPlayer === this.playerColor ? 'YOUR TURN' : `${this.currentPlayer.toUpperCase()}'S TURN`;
            const colorText = this.playerColor ? `You are ${this.playerColor.toUpperCase()}` : 'Online PvP';
            this.statusText.setText(turnText);
            this.statusText.setColor(this.currentPlayer === 'blue' ? '#7cc3ff' : '#ff8f8f');
            this.countText.setText(`Room ${this.roomCode}  ${colorText}\nTurn ${this.turn}  Blue ${counts.blue} | Red ${counts.red}`);
            return;
        }

        this.statusText.setText(`${this.currentPlayer.toUpperCase()}'S TURN`);
        this.statusText.setColor(this.currentPlayer === 'blue' ? '#7cc3ff' : '#ff8f8f');

        if (this.mode === 'ai') {
            const stats = getAiStats();
            this.countText.setText(
                `${formatAiDifficulty(this.aiDifficulty)} ${formatAiPersonality(this.aiPersonality)} AI\nTurn ${this.turn}  Blue ${counts.blue} | Red ${counts.red}  Record ${stats.wins}W-${stats.losses}L`
            );
            return;
        }

        if (this.mode === 'campaign') {
            const objective = getCampaignObjective(this.campaignLevel);
            this.countText.setText(`Objective: ${this.getCampaignObjectiveProgressText(objective)}\nTurn ${this.turn}  Blue ${counts.blue} | Red ${counts.red}`);
            return;
        }

        this.countText.setText(`Turn ${this.turn}    Blue ${counts.blue}  |  Red ${counts.red}`);
    }

    private getCounts() {
        let blue = 0;
        let red = 0;
        for (const h of this.hexes.values()) {
            if (h.owner === 'blue') blue++;
            if (h.owner === 'red') red++;
        }
        return { blue, red };
    }

    private clearHighlights() {
        for (const t of this.previewTexts) {
            this.tweens.killTweensOf(t);
            t.destroy();
        }
        this.previewTexts = [];

        this.validMoves.clear();

        for (const h of this.hexes.values()) {
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
            aiDifficulty: this.aiDifficulty,
            aiPersonality: this.aiPersonality,
        });
    }

    private backToMenu() {
        this.time.removeAllEvents();
        this.tweens.killAll();
        this.scene.start('MenuScene');
    }

    private key(q: number, r: number) {
        return `${q},${r}`;
    }

    private hexToPixel(q: number, r: number) {
        const x = this.boardCenterX + HEX_SIZE * SQRT3 * (q + r / 2);
        const y = this.boardCenterY + HEX_SIZE * 1.5 * r;
        return { x, y };
    }

    private getHexPoints(size: number) {
        const pts: Phaser.Types.Math.Vector2Like[] = [];
        for (let i = 0; i < 6; i++) {
            const angle = Phaser.Math.DegToRad(60 * i - 30);
            pts.push({ x: size * Math.cos(angle), y: size * Math.sin(angle) });
        }
        return pts;
    }

    private neighbors(hex: Hex): Hex[] {
        const dirs = [
            [1, 0], [1, -1], [0, -1],
            [-1, 0], [-1, 1], [0, 1],
        ];
        return dirs
            .map(([dq, dr]) => this.hexes.get(this.key(hex.q + dq, hex.r + dr)))
            .filter((h): h is Hex => Boolean(h));
    }
}
