import Phaser from 'phaser';
import { Player, Hex } from '../shared';
import { Theme } from '../config/theme';
import { BoardManager } from './BoardManager';
import { UnitManager } from './UnitManager';

const HEX_BLUE = Phaser.Display.Color.HexStringToColor(Theme.battle.blue).color;
const HEX_RED = Phaser.Display.Color.HexStringToColor(Theme.battle.red).color;
const HEX_NEUTRAL = Phaser.Display.Color.HexStringToColor(Theme.battle.neutral).color;

export type VictoryResult = {
    gameOver: boolean;
    winner: Player | null;
};

export class CombatManager {
    constructor(
        private boardManager: BoardManager,
        private unitManager: UnitManager,
    ) {}

    attack(hex: Hex, player: Player): Hex[] {
        const converted: Hex[] = [];
        for (const n of this.boardManager.getNeighbors(hex)) {
            if (n.owner && n.owner !== player) {
                if (n.hexed && n.hexed !== player) continue;
                this.captureTile(n, player);
                converted.push(n);
            }
        }
        return converted;
    }

    countCaptureTargets(hex: Hex, player: Player): number {
        return this.boardManager.getNeighbors(hex).filter(
            n => n.owner && n.owner !== player && !(n.hexed && n.hexed !== player)
        ).length;
    }

    captureTile(hex: Hex, player: Player) {
        hex.frozen = false;
        hex.owner = player;
        hex.poly?.setFillStyle(player === 'blue' ? HEX_BLUE : HEX_RED, 1);
        this.unitManager.removeUnit(hex);
        this.unitManager.createUnit(hex, player);
    }

    destroyUnit(hex: Hex) {
        hex.owner = null;
        hex.poly?.setFillStyle(HEX_NEUTRAL, 1);
        this.unitManager.removeUnit(hex);
    }

    checkVictory(currentPlayer: Player): VictoryResult {
        const counts = this.boardManager.getCounts();
        if (counts.blue === 0) return { gameOver: true, winner: 'red' };
        if (counts.red === 0) return { gameOver: true, winner: 'blue' };

        const movable = [...this.boardManager.getTiles()].some(
            h => h.owner === currentPlayer && this.boardManager.getNeighbors(h).some(n => !n.owner)
        );
        if (!movable) {
            const winner: Player = counts.blue >= counts.red ? 'blue' : 'red';
            return { gameOver: true, winner };
        }

        return { gameOver: false, winner: null };
    }
}
