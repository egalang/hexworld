import Phaser from 'phaser';
import { WIDTH, HEIGHT, playSound, SOUND_KEYS, unlockAudio } from '../shared';
import { WORLD_TILES, TILE_COLORS } from '../data/worldMap';
import { axialToPixel, drawHex, computeMapBounds } from '../data/hexUtils';

const HEX_SIZE = 35;

export class WorldMapScene extends Phaser.Scene {
  constructor() {
    super('WorldMapScene');
  }

  create() {
    this.add.image(0, 0, 'worldmap_bg').setOrigin(0, 0).setDisplaySize(WIDTH, HEIGHT);

    this.add.image(WIDTH, 0, 'worldmap_title').setOrigin(1, 0).setDisplaySize(200,200);

    const bounds = computeMapBounds(WORLD_TILES, HEX_SIZE);
    const mapCenterX = (bounds.minX + bounds.maxX) / 2;
    const mapCenterY = (bounds.minY + bounds.maxY) / 2;
    const offsetX = WIDTH / 2 - mapCenterX;
    const offsetY = HEIGHT / 2 - mapCenterY;

    const hexGraphics = this.add.graphics();

    for (const tile of WORLD_TILES) {
      const pos = axialToPixel(tile.q, tile.r, HEX_SIZE);
      const screenX = pos.x + offsetX;
      const screenY = pos.y + offsetY + 30;

      const baseColor = Phaser.Display.Color.HexStringToColor(TILE_COLORS[tile.type]).color;
      const fillColor = tile.unlocked ? baseColor : Phaser.Display.Color.GetColor(
        Phaser.Display.Color.ValueToColor(baseColor).red >> 1,
        Phaser.Display.Color.ValueToColor(baseColor).green >> 1,
        Phaser.Display.Color.ValueToColor(baseColor).blue >> 1,
      );

      drawHex(hexGraphics, { x: screenX, y: screenY }, HEX_SIZE, fillColor, 0x000000);

      this.add.text(screenX, screenY - 6, tile.iconId, {
        fontSize: '16px',
      }).setOrigin(0.5);

      this.add.text(screenX, screenY + 12, tile.title, {
        fontSize: '9px',
        fontStyle: 'bold',
        color: '#000000',
        stroke: '#ffffff',
        strokeThickness: 2,
        align: 'center',
      }).setOrigin(0.5);

      if (tile.unlocked) {
        const zone = this.add.zone(screenX, screenY, HEX_SIZE * 1.8, HEX_SIZE * 1.8)
          .setInteractive({ useHandCursor: true });

        zone.on('pointerover', () => {
          zone.setScale(1.15);
        });

        zone.on('pointerout', () => {
          zone.setScale(1);
        });

        zone.on('pointerdown', () => {
          unlockAudio(this);
          playSound(this, SOUND_KEYS.confirm, 0.35);
          this.dispatchTileAction(tile.action, tile.actionId);
        });
      }
    }
  }

  private dispatchTileAction(action: string, actionId?: string) {
    if (action === 'scene' && actionId) {
      this.scene.start(actionId);
    }
  }
}
