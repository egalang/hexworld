import Phaser from 'phaser';
import {
    BLUE_SOLDIER_KEY,
    RED_SOLDIER_KEY,
    Player,
    Hex,
} from '../shared';
import { BoardManager } from './BoardManager';

const PIECE_OFFSET_X = -25;
const PIECE_OFFSET_Y = -30;

export class UnitManager {
    private selectedUnit: Hex | null = null;

    constructor(
        private scene: Phaser.Scene,
        private boardManager: BoardManager,
    ) {}

    createUnit(hex: Hex, player: Player) {
        const { x, y } = this.boardManager.hexToPixel(hex.q, hex.r);
        const texture = player === 'blue' ? BLUE_SOLDIER_KEY : RED_SOLDIER_KEY;

        const sprite = this.scene.add.image(
            x + PIECE_OFFSET_X,
            y + PIECE_OFFSET_Y,
            texture
        );
        sprite.setDisplaySize(44, 44);
        sprite.setDepth(5);

        hex.piece = sprite;
        hex.owner = player;
    }

    removeUnit(hex: Hex) {
        if (hex.piece) {
            hex.piece.destroy();
            hex.piece = undefined;
        }
    }

    moveUnit(from: Hex, to: Hex, player: Player) {
        this.removeUnit(from);
        from.owner = null;
        this.createUnit(to, player);
    }

    getUnits(): Hex[] {
        const result: Hex[] = [];
        for (const hex of this.boardManager.getTiles()) {
            if (hex.owner) result.push(hex);
        }
        return result;
    }

    getUnitOnTile(q: number, r: number): Hex | undefined {
        const hex = this.boardManager.getTile(q, r);
        return hex?.owner ? hex : undefined;
    }

    selectUnit(hex: Hex | null) {
        this.selectedUnit = hex;
    }

    getSelectedUnit(): Hex | null {
        return this.selectedUnit;
    }

    getUnitCount(player: Player): number {
        const counts = this.boardManager.getCounts();
        return player === 'blue' ? counts.blue : counts.red;
    }
}
