import Phaser from 'phaser';
import {
    SQRT3,
    HEX_SIZE,
    BOARD_RADIUS,
    WIDTH,
    GameMode,
    Owner,
    Hex,
} from '../shared';

export class BoardManager {
    private hexes = new Map<string, Hex>();
    private boardCenterX = (WIDTH / 2) + 25;
    private boardCenterY = 475;

    createBoard(mode: GameMode, campaignLevel: number) {
        this.hexes.clear();

        for (let q = -BOARD_RADIUS; q <= BOARD_RADIUS; q++) {
            const r1 = Math.max(-BOARD_RADIUS, -q - BOARD_RADIUS);
            const r2 = Math.min(BOARD_RADIUS, -q + BOARD_RADIUS);
            for (let r = r1; r <= r2; r++) {
                const s = -q - r;
                const owner = this.getInitialOwner(q, r, s, mode, campaignLevel);
                const hex: Hex = { q, r, s, owner, frozen: false, hexed: null };
                this.hexes.set(this.key(q, r), hex);
            }
        }
    }

    getTile(q: number, r: number): Hex | undefined {
        return this.hexes.get(this.key(q, r));
    }

    getNeighbors(hex: Hex): Hex[] {
        const dirs = [
            [1, 0], [1, -1], [0, -1],
            [-1, 0], [-1, 1], [0, 1],
        ];
        return dirs
            .map(([dq, dr]) => this.hexes.get(this.key(hex.q + dq, hex.r + dr)))
            .filter((h): h is Hex => Boolean(h));
    }

    getDistance(a: Hex, b: Hex): number {
        return (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.s - b.s)) / 2;
    }

    getTiles(): IterableIterator<Hex> {
        return this.hexes.values();
    }

    resetBoard() {
        this.hexes.clear();
    }

    getCounts(): { blue: number; red: number } {
        let blue = 0;
        let red = 0;
        for (const h of this.hexes.values()) {
            if (h.owner === 'blue') blue++;
            if (h.owner === 'red') red++;
        }
        return { blue, red };
    }

    key(q: number, r: number): string {
        return `${q},${r}`;
    }

    hexToPixel(q: number, r: number): { x: number; y: number } {
        const x = this.boardCenterX + HEX_SIZE * SQRT3 * (q + r / 2);
        const y = this.boardCenterY + HEX_SIZE * 1.5 * r;
        return { x, y };
    }

    getHexPoints(size: number): Phaser.Types.Math.Vector2Like[] {
        const pts: Phaser.Types.Math.Vector2Like[] = [];
        for (let i = 0; i < 6; i++) {
            const angle = Phaser.Math.DegToRad(60 * i - 30);
            pts.push({ x: size * Math.cos(angle), y: size * Math.sin(angle) });
        }
        return pts;
    }

    private getInitialOwner(q: number, _r: number, s: number, mode: GameMode, campaignLevel: number): Owner {
        if (q <= -3 || s >= 3) return 'blue';
        if (q >= 3 || s <= -3) return 'red';

        if (mode === 'campaign' && campaignLevel >= 3 && (q === 2 || s === -2) && Phaser.Math.Between(0, 100) < 24) {
            return 'red';
        }

        if (mode === 'campaign' && campaignLevel >= 5 && (q === -2 || s === 2) && Phaser.Math.Between(0, 100) < 12) {
            return null;
        }

        return null;
    }
}
