import Phaser from 'phaser';
import { WIDTH, HEIGHT, playSound, SOUND_KEYS, unlockAudio } from '../shared';
import { WORLD_TILES, WorldTile } from '../data/worldMap';
import { MusicManager } from './MusicManager';
import { axialToPixel, computeMapBounds } from '../data/hexUtils';
import { MissionManager } from '../managers/MissionManager';
import { getCompletedMissionIds } from '../state/PlayerProfile';
import { getMissionById, MissionDefinition } from '../data/missions';

const HEX_SIZE = 35;

const TILE_IMAGE_MAP: Partial<Record<WorldTile['type'], string>> = {
  mission: 'tile_mission',
  profile: 'tile_profile',
  inventory: 'tile_inventory',
  settings: 'tile_settings',
  training: 'tile_training',
  pvp: 'tile_pvp',
};

export class WorldMapScene extends Phaser.Scene {
  private missionManager = new MissionManager();

  constructor() {
    super('WorldMapScene');
  }

  create() {
    this.input.once('pointerdown', () => MusicManager.play(this));
    this.add.image(0, 0, 'worldmap_bg').setOrigin(0, 0).setDisplaySize(WIDTH, HEIGHT);

    this.add.image(WIDTH, 0, 'worldmap_title').setOrigin(1, 0).setDisplaySize(200,200);

    const completedIds = new Set(getCompletedMissionIds());
    const unlockedMissions = new Set(this.missionManager.getUnlockedMissions(completedIds));

    const bounds = computeMapBounds(WORLD_TILES, HEX_SIZE);
    const mapCenterX = (bounds.minX + bounds.maxX) / 2;
    const mapCenterY = (bounds.minY + bounds.maxY) / 2;
    const offsetX = WIDTH / 2 - mapCenterX;
    const offsetY = HEIGHT / 2 - mapCenterY;

    const tooltipBg = this.add.graphics().setDepth(100);
    const tooltipText = this.add.text(0, 0, '', {
      fontSize: '11px',
      color: '#ffffff',
      align: 'center',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(100).setVisible(false);

    for (const tile of WORLD_TILES) {
      const pos = axialToPixel(tile.q, tile.r, HEX_SIZE);
      const screenX = pos.x + offsetX;
      const screenY = pos.y + offsetY + 30;

      const isUnlocked = tile.missionId
        ? unlockedMissions.has(tile.missionId)
        : tile.unlocked;

      const tileImageKey = TILE_IMAGE_MAP[tile.type] ?? (
        tile.type === 'shop'
          ? tile.shopCategory === 'skills' ? 'tile_skill_shop' : 'tile_weapon_shop'
          : null
      );
      const image = tileImageKey
        ? this.add.image(screenX, screenY, tileImageKey).setScale(0.2)
        : null;

      const isCompleted = tile.missionId ? completedIds.has(tile.missionId) : false;
      if (isCompleted) {
        this.add.text(screenX + 16, screenY - 16, '✅', { fontSize: '12px' }).setOrigin(0.5);
      } else if (!isUnlocked) {
        this.add.text(screenX + 16, screenY - 16, '🔒', { fontSize: '12px' }).setOrigin(0.5);
      }

      if (image && !isUnlocked) image.setAlpha(0.5);

      const zone = this.add.zone(screenX, screenY, HEX_SIZE * 1.8, HEX_SIZE * 1.8)
        .setInteractive({ useHandCursor: isUnlocked });

      zone.on('pointerover', () => {
        if (image) image.setScale(0.25);

        const lines = [`${tile.iconId} ${tile.title}`, `Type: ${tile.type}`];
        if (tile.missionId) lines.push(`Mission: ${tile.missionId}`);
        if (!isUnlocked) lines.push('🔒 Locked');
        tooltipText.setText(lines.join('\n'));

        const tipX = screenX;
        const tipY = screenY - HEX_SIZE - 20;
        tooltipText.setPosition(tipX, tipY);

        const bounds = tooltipText.getBounds();
        const pad = 8;
        tooltipBg.clear();
        tooltipBg.fillStyle(0x000000, 0.8);
        tooltipBg.fillRoundedRect(
          tipX - bounds.width / 2 - pad,
          tipY - bounds.height / 2 - pad,
          bounds.width + pad * 2,
          bounds.height + pad * 2,
          6,
        );
        tooltipBg.setVisible(true);
        tooltipText.setVisible(true);
      });

      zone.on('pointerout', () => {
        if (image) image.setScale(0.2);
        tooltipBg.setVisible(false);
        tooltipText.setVisible(false);
      });

      if (isUnlocked) {
        zone.on('pointerdown', () => {
          unlockAudio(this);
          playSound(this, SOUND_KEYS.confirm, 0.35);
          if (tile.missionId) {
            const mission = getMissionById(tile.missionId);
            if (mission) {
              this.showMissionPopup(mission);
              return;
            }
          }
          this.dispatchTileAction(tile);
        });
      }
    }
  }

  private showMissionPopup(mission: MissionDefinition) {
    const imgKey = `mission_img_${mission.id}`;
    if (!this.textures.exists(imgKey)) {
      return;
    }

    const popup = this.add.container(0, 0).setDepth(200);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, WIDTH, HEIGHT);
    overlay.setInteractive(new Phaser.Geom.Rectangle(0, 0, WIDTH, HEIGHT), Phaser.Geom.Rectangle.Contains);
    popup.add(overlay);

    const img = this.add.image(0, 0, imgKey);
    const maxW = WIDTH - 60;
    const maxH = HEIGHT - 120;
    const scale = Math.min(maxW / img.width, maxH / img.height, 1);
    img.setScale(scale);
    img.setPosition(WIDTH / 2, HEIGHT / 2);
    popup.add(img);

    const maskShape = this.add.graphics();
    maskShape.fillStyle(0xffffff);
    maskShape.fillRoundedRect(
      WIDTH / 2 - img.displayWidth / 2,
      HEIGHT / 2 - img.displayHeight / 2,
      img.displayWidth,
      img.displayHeight,
      17,
    );
    const mask = maskShape.createGeometryMask();
    img.setMask(mask);
    maskShape.setAlpha(0);
    popup.add(maskShape);

    const border = this.add.graphics();
    border.lineStyle(12, 0x3B1F0B, 1);
    border.strokeRoundedRect(
      WIDTH / 2 - (img.displayWidth + 2) / 2,
      HEIGHT / 2 - (img.displayHeight + 2) / 2,
      img.displayWidth + 2,
      img.displayHeight + 2,
      17,
    );
    popup.add(border);

    const closeBtn = this.add.text(WIDTH / 2 + img.displayWidth / 2 + 8, HEIGHT / 2 - img.displayHeight / 2 - 8, '✕', {
      fontSize: '24px', fontStyle: 'bold', color: '#ffffff',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    popup.add(closeBtn);

    const txtColor = '#ffffff';
    const txtStroke = '#000000';

    const titleText = this.add.text(WIDTH / 2, HEIGHT / 2 - img.displayHeight / 2 + 30, mission.title, {
      fontSize: '26px', fontStyle: 'bold', color: txtColor,
      stroke: txtStroke, strokeThickness: 5,
    }).setOrigin(0.5);
    popup.add(titleText);

    const descText = this.add.text(WIDTH / 2, HEIGHT / 2 - img.displayHeight / 2 + 60, mission.description, {
      fontSize: '14px', color: txtColor,
      stroke: txtStroke, strokeThickness: 3,
    }).setOrigin(0.5);
    popup.add(descText);

    const storyText = this.add.text(WIDTH / 2, HEIGHT / 2 + img.displayHeight / 2 - 120, mission.story || '', {
      fontSize: '13px', color: txtColor,
      stroke: txtStroke, strokeThickness: 3,
      wordWrap: { width: maxW - 20 }, align: 'center', lineSpacing: 4,
    }).setOrigin(0.5, 1);
    popup.add(storyText);

    const btnC = this.add.container(WIDTH / 2, HEIGHT / 2 + img.displayHeight / 2 - 50);
    const btnBg = this.add.graphics();
    const btnW = 200;
    const btnH = 48;
    btnBg.fillStyle(0x3B1F0B, 1);
    btnBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 10);
    btnBg.lineStyle(2, 0xc5a55a, 1);
    btnBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 10);
    const btnText = this.add.text(0, 0, 'START MISSION', {
      fontSize: '17px', fontStyle: 'bold', color: '#c5a55a',
    }).setOrigin(0.5);
    btnC.add([btnBg, btnText]);
    btnC.setSize(btnW, btnH);
    btnC.setInteractive({ useHandCursor: true });
    btnC.on('pointerdown', () => {
      popup.destroy();
      const config = this.missionManager.getBattleConfig(mission.id);
      this.scene.start('HexConquestScene', { battleConfig: config, returnScene: 'WorldMapScene' });
    });
    popup.add(btnC);

    const destroyPopup = () => popup.destroy();
    closeBtn.on('pointerdown', destroyPopup);
    overlay.on('pointerdown', destroyPopup);
  }

  private dispatchTileAction(tile: WorldTile) {
    if (tile.action === 'scene' && tile.actionId) {
      if (tile.missionId) {
        const config = this.missionManager.getBattleConfig(tile.missionId);
        this.scene.start(tile.actionId, { battleConfig: config, returnScene: 'WorldMapScene' });
      } else if (tile.actionId === 'ShopScene') {
        this.scene.start(tile.actionId, { category: tile.shopCategory ?? 'weapons' });
      } else {
        this.scene.start(tile.actionId);
      }
    }
  }
}
