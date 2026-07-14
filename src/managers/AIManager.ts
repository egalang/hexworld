import Phaser from 'phaser';
import {
    Player,
    Hex,
    GameMode,
    AiDifficulty,
    AiPersonality,
    BOARD_RADIUS,
    saveAiSettings,
    saveAiMatchResult,
} from '../shared';
import { BoardManager } from './BoardManager';
import { CombatManager } from './CombatManager';
import { UnitManager } from './UnitManager';

export class AIManager {
    private aiPlayer: Player | null = 'red';
    private aiDifficulty: AiDifficulty = 'normal';
    private aiPersonality: AiPersonality = 'balanced';
    private aiResultSaved = false;
    private aiThinking = false;

    constructor(
        private boardManager: BoardManager,
        private combatManager: CombatManager,
        private unitManager: UnitManager,
    ) {}

    getAiPlayer(): Player | null {
        return this.aiPlayer;
    }

    setAiPlayer(player: Player | null) {
        this.aiPlayer = player;
    }

    getDifficulty(): AiDifficulty {
        return this.aiDifficulty;
    }

    setDifficulty(difficulty: AiDifficulty) {
        this.aiDifficulty = difficulty;
    }

    getPersonality(): AiPersonality {
        return this.aiPersonality;
    }

    setPersonality(personality: AiPersonality) {
        this.aiPersonality = personality;
    }

    isThinking(): boolean {
        return this.aiThinking;
    }

    setThinking(thinking: boolean) {
        this.aiThinking = thinking;
    }

    isAiTurn(currentPlayer: Player): boolean {
        return currentPlayer === this.aiPlayer;
    }

    reset() {
        this.aiPlayer = 'red';
        this.aiDifficulty = 'normal';
        this.aiPersonality = 'balanced';
        this.aiResultSaved = false;
        this.aiThinking = false;
    }

    getBestMove(player: Player, mode: GameMode, campaignLevel: number): { from: Hex; to: Hex } | null {
        const moves: { from: Hex; to: Hex; score: number }[] = [];

        for (const from of this.boardManager.getTiles()) {
            if (from.owner !== player) continue;

            for (const to of this.boardManager.getNeighbors(from)) {
                if (to.owner) continue;
                moves.push({ from, to, score: this.scoreMove(from, to, player) });
            }
        }

        if (!moves.length) return null;
        moves.sort((a, b) => b.score - a.score);

        if (mode === 'campaign') {
            const pickFromTop = Math.max(1, 6 - campaignLevel);
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

    scoreMove(from: Hex, to: Hex, player: Player): number {
        const converted = this.combatManager.countCaptureTargets(to, player);
        const centerDistance = Math.abs(to.q) + Math.abs(to.r) + Math.abs(to.s);
        const centerBonus = (BOARD_RADIUS * 3 - centerDistance) * 2;
        const adjacentFriendlies = this.boardManager.getNeighbors(to).filter(n => n.owner === player).length;
        const nearbyEnemies = this.boardManager.getNeighbors(to).filter(n => n.owner && n.owner !== player).length;
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
            score -= this.estimateCounterRisk(from, to, player) * 45;
        }

        return score;
    }

    estimateCounterRisk(from: Hex, to: Hex, player: Player): number {
        const opponent: Player = player === 'blue' ? 'red' : 'blue';
        let worstCounter = 0;

        for (const enemyFrom of this.boardManager.getTiles()) {
            let simulatedOwner = enemyFrom.owner;
            if (enemyFrom.q === from.q && enemyFrom.r === from.r) simulatedOwner = null;
            if (enemyFrom.q === to.q && enemyFrom.r === to.r) simulatedOwner = player;
            if (simulatedOwner !== opponent) continue;

            for (const enemyTo of this.boardManager.getNeighbors(enemyFrom)) {
                let targetOwner = enemyTo.owner;
                if (enemyTo.q === from.q && enemyTo.r === from.r) targetOwner = null;
                if (enemyTo.q === to.q && enemyTo.r === to.r) targetOwner = player;
                if (targetOwner !== null) continue;

                let counter = 0;
                for (const n of this.boardManager.getNeighbors(enemyTo)) {
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

    saveResultIfNeeded(mode: GameMode, winner: Player, turn: number) {
        if (mode !== 'ai' || this.aiResultSaved) return;
        this.aiResultSaved = true;
        saveAiSettings(this.aiDifficulty, this.aiPersonality);
        saveAiMatchResult(winner === 'blue', turn, this.aiDifficulty, this.aiPersonality);
    }
}
