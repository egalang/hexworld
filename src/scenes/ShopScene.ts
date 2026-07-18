import Phaser from 'phaser';
import { WIDTH, HEIGHT, SOUND_KEYS, playSound, unlockAudio } from '../shared';
import { Theme } from '../config/theme';
import { getGold, getLevel } from '../state/PlayerProfile';
import { isWeaponOwned, isSkillOwned, getSkillLevel, getWeaponDurability, setWeaponDurability } from '../state/Inventory';
import { EconomyManager } from '../managers/EconomyManager';
import { getEquippedWeapon } from '../state/Loadout';
import { WEAPONS, getWeaponById, WeaponDefinition } from '../data/weapons';
import { SKILLS, getSkillById, getRequiredLevelForLevel, SkillDefinition } from '../data/skills';
import { WeaponManager } from '../managers/WeaponManager';
import { SkillManager } from '../managers/SkillManager';

const PANEL_X = 16;
const PANEL_W = WIDTH - 32;
const BTN_X = PANEL_X + PANEL_W - 14 - 50;

type ShopCategory = 'weapons' | 'skills';

export class ShopScene extends Phaser.Scene {
  private category: ShopCategory = 'weapons';
  private goldText!: Phaser.GameObjects.Text;

  constructor() {
    super('ShopScene');
  }

  init(data: { category?: ShopCategory }) {
    this.category = data.category ?? 'weapons';
  }

  create() {
    this.add.image(WIDTH / 2, HEIGHT / 2, 'arena_bg').setDisplaySize(WIDTH, HEIGHT);

    this.add.text(WIDTH / 2, 50, this.category === 'weapons' ? 'WEAPON SHOP' : 'SKILL SHOP', {
      fontSize: '28px', fontStyle: 'bold', color: Theme.ui.textTitle,
      stroke: '#000000', strokeThickness: 6,
    }).setOrigin(0.5);

    this.goldText = this.add.text(WIDTH / 2, 88, `Gold: ${getGold()}`, {
      fontSize: '18px', fontStyle: 'bold', color: Theme.reward.gold,
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5);

    this.renderItems();
    this.createBackButton();
  }

  private renderItems() {
    const items = this.category === 'weapons' ? WEAPONS : SKILLS;

    if (items.length === 0) {
      this.add.text(WIDTH / 2, 300, 'No items available.', {
        fontSize: '16px', color: Theme.ui.textDescription,
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5);
      return;
    }

    const scrollContent = this.add.container(0, 0);
    let currentY = 130;

    for (const item of items) {
      const row = this.createItemRow(item, currentY);
      scrollContent.add(row);
      const rowHeight = (row as any).height ?? 100;
      currentY += rowHeight + 12;
    }
  }

  private createItemRow(item: WeaponDefinition | SkillDefinition, y: number) {
    const c = this.add.container(0, 0);

    const isWeapon = this.category === 'weapons';
    const owned = isWeapon ? isWeaponOwned(item.id) : isSkillOwned(item.id);
    const levelReq = item.requiredLevel;
    const playerLevel = getLevel();
    const locked = playerLevel < levelReq;
    const canAfford = getGold() >= item.cost;
    const buyable = !owned && !locked && canAfford;

    let cursorY = y + 8;

    const nameColor = owned ? Theme.reward.weapon : locked ? Theme.button.disabled.text : Theme.ui.text;
    const nameText = this.add.text(PANEL_X + 14, cursorY, item.name, {
      fontSize: '16px', fontStyle: 'bold', color: nameColor,
      stroke: '#000000', strokeThickness: 2,
    });
    c.add(nameText);
    cursorY += nameText.height + 6;

    const descText = this.add.text(PANEL_X + 14, cursorY, item.description, {
      fontSize: '12px', color: Theme.ui.textDescription,
      stroke: '#000000', strokeThickness: 1, wordWrap: { width: PANEL_W - 120 },
    });
    c.add(descText);
    cursorY += descText.height + 6;

      const sk = item as SkillDefinition;
      let detail = `Cost: ${item.cost} Gold`;
      if (isWeapon) {
        const w = item as WeaponDefinition;
        const dur = owned ? getWeaponDurability(w.id, w.durability) : w.durability;
        detail += `  Bonus: +${w.conversionBonus}  Durability: ${dur}/${w.durability}`;
      } else if (sk.maxLevel) {
        const lvl = owned ? getSkillLevel(sk.id) : 1;
        detail += `  Level ${lvl}/${sk.maxLevel}  Once per battle`;
      } else {
        detail += `  Once per battle`;
      }
    const detailText = this.add.text(PANEL_X + 14, cursorY, detail, {
      fontSize: '11px', color: Theme.ui.textSecondary,
      stroke: '#000000', strokeThickness: 1,
    });
    c.add(detailText);
    cursorY += detailText.height + 4;

    if (levelReq > 0) {
      const sk = item as SkillDefinition;
      let reqLabel = `Requires Level ${levelReq}`;
      if (!isWeapon && sk.maxLevel && sk.upgradeLevelReq) {
        const lvl = owned ? getSkillLevel(sk.id) : 1;
        const nextReq = getRequiredLevelForLevel(sk, lvl + (owned && lvl < sk.maxLevel ? 1 : 0));
        reqLabel = `Requires Level ${nextReq}`;
        if (sk.upgradeLevelReq > 0 && sk.maxLevel > 1) {
          reqLabel += ` (base ${levelReq}, +${sk.upgradeLevelReq}/upgrade)`;
        }
      }
      const reqText = this.add.text(PANEL_X + 14, cursorY, reqLabel, {
        fontSize: '10px', color: locked ? Theme.status.warning : Theme.ui.textDescription,
        stroke: '#000000', strokeThickness: 1,
      });
      c.add(reqText);
    }

    const rowHeight = cursorY - y + 20;

    const panelColor = Phaser.Display.Color.HexStringToColor(Theme.ui.panel).color;
    const borderColor = Phaser.Display.Color.HexStringToColor(
      owned ? Theme.reward.weapon : locked ? Theme.button.disabled.bg : Theme.ui.border
    ).color;

    const bg = this.add.graphics();
    bg.fillStyle(panelColor, 0.9);
    bg.lineStyle(2, borderColor, owned ? 1 : locked ? 0.3 : 0.6);
    bg.fillRoundedRect(PANEL_X, y, PANEL_W, rowHeight, 10);
    bg.strokeRoundedRect(PANEL_X, y, PANEL_W, rowHeight, 10);
    c.addAt(bg, 0);

    if (owned) {
      if (isWeapon) {
        const w = item as WeaponDefinition;
        const dur = getWeaponDurability(w.id, w.durability);
        if (dur < w.durability) {
          const repairCost = Math.ceil(w.cost * 0.5);
          const canRepair = getGold() >= repairCost;
          const btn = this.makeButton(BTN_X, y + rowHeight / 2 - 18, 'Repair', () => {
            if (EconomyManager.spendGold(repairCost)) {
              setWeaponDurability(w.id, w.durability);
              playSound(this, SOUND_KEYS.confirm, 0.5);
              this.refresh();
            }
          });
          if (!canRepair) btn.setAlpha(0.4);
          c.add(btn);
        } else {
          const isEq = getEquippedWeapon() === item.id;
          const btnText = isEq ? 'Equipped' : 'Equip';
          const btn = this.makeButton(BTN_X, y + rowHeight / 2 - 18, btnText, () => {
            if (!isEq) {
              WeaponManager.equip(item.id);
              this.refresh();
            }
          });
          if (isEq) btn.setAlpha(0.6);
          c.add(btn);
        }
      } else {
                        const sk = item as SkillDefinition;
                        if (sk.maxLevel) {
                          const lvl = getSkillLevel(sk.id);
                          if (lvl < sk.maxLevel) {
                            const canUpg = SkillManager.canBuy(sk.id);
                            const btn = this.makeButton(BTN_X, y + rowHeight / 2 - 18, 'Upgrade', () => {
                              if (SkillManager.buy(sk.id)) {
                                playSound(this, SOUND_KEYS.confirm, 0.5);
                                this.refresh();
                              }
                            });
                            if (!canUpg.allowed) btn.setAlpha(0.4);
                            c.add(btn);
                          } else {
                            const btn = this.makeButton(BTN_X, y + rowHeight / 2 - 18, 'MAX', () => {});
                            btn.setAlpha(0.5);
                            c.add(btn);
                          }
                        } else {
                          const isEq = SkillManager.isEquipped(item.id);
                          const btnText = isEq ? 'Equipped' : 'Equip';
                          const btn = this.makeButton(BTN_X, y + rowHeight / 2 - 18, btnText, () => {
                            if (!isEq) {
                              SkillManager.equip(item.id);
                              this.refresh();
                            }
                          });
                          if (isEq || !SkillManager.slotsAvailable()) btn.setAlpha(0.6);
                          c.add(btn);
                        }
                      }
                    } else if (locked) {
                      const btn = this.makeButton(BTN_X, y + rowHeight / 2 - 18, 'Locked', () => {});
                      btn.setAlpha(0.4);
                      c.add(btn);
                    } else if (buyable) {
                      const btn = this.makeButton(BTN_X, y + rowHeight / 2 - 18, 'Buy', () => {
                        const success = isWeapon ? WeaponManager.buy(item.id) : SkillManager.buy(item.id);
                        if (success) {
                          playSound(this, SOUND_KEYS.confirm, 0.5);
                          this.refresh();
                        }
                      });
                      c.add(btn);
                    } else {
                      const btn = this.makeButton(BTN_X, y + rowHeight / 2 - 18, 'Not enough', () => {});
                      btn.setAlpha(0.4);
                      c.add(btn);
                    }

    if (isWeapon) {
      const w = item as WeaponDefinition;
      if (w.imageUrl) {
        const infoBtn = this.makeButton(BTN_X, cursorY - 3, 'Info', () => this.showInfoPopup(w.imageUrl!));
        c.add(infoBtn);
      }
    }

    (c as any).height = cursorY - y + 20;
    return c;
  }

  private makeButton(x: number, y: number, label: string, cb: () => void) {
    const btnColor = Phaser.Display.Color.HexStringToColor(Theme.button.primary.bg).color;
    const disabledColor = Phaser.Display.Color.HexStringToColor(Theme.button.disabled.bg).color;
    const c = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(btnColor, 1);
    bg.fillRoundedRect(-50, -16, 100, 32, 8);
    const text = this.add.text(0, 0, label, {
      fontSize: '14px', fontStyle: 'bold', color: Theme.button.primary.text,
    }).setOrigin(0.5);
    c.add([bg, text]);
    c.setSize(100, 32);
    c.setInteractive({ useHandCursor: true });
    c.on('pointerdown', () => {
      unlockAudio(this);
      cb();
    });
    return c;
  }

  private refresh() {
    this.goldText.setText(`Gold: ${getGold()}`);
    this.scene.restart({ category: this.category });
  }

  private showInfoPopup(url: string) {
    const popup = this.add.container(0, 0).setDepth(200);

    const loadKey = 'popup_' + Date.now();

    const destroyPopup = () => {
      if (this.textures.exists(loadKey)) this.textures.remove(loadKey);
      popup.destroy();
    };

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, WIDTH, HEIGHT);
    overlay.setInteractive(new Phaser.Geom.Rectangle(0, 0, WIDTH, HEIGHT), Phaser.Geom.Rectangle.Contains);
    overlay.on('pointerdown', destroyPopup);
    popup.add(overlay);
    this.load.image(loadKey, url);
    this.load.start();

    const loadingText = this.add.text(WIDTH / 2, HEIGHT / 2, 'Loading...', {
      fontSize: '18px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5);
    popup.add(loadingText);

    const onLoaded = () => {
      loadingText.destroy();
      const tex = this.textures.get(loadKey);
      if (!tex || !tex.key) return;
      const img = this.add.image(0, 0, loadKey);
      const maxW = WIDTH - 60;
      const maxH = HEIGHT - 120;
      const scale = Math.min(maxW / img.width, maxH / img.height, 1);
      img.setScale(scale);
      img.setPosition(WIDTH / 2, HEIGHT / 2);

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
      popup.add(img);

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
      closeBtn.on('pointerdown', destroyPopup);
      popup.add(closeBtn);
    };
    this.load.once(`filecomplete-image-${loadKey}`, onLoaded);
    this.load.once('loaderror', () => { loadingText.setText('Failed to load'); });
  }

  private createBackButton() {
    const text = this.add.text(WIDTH / 2, HEIGHT - 40, '< Back to World Map', {
      fontSize: '18px', color: Theme.ui.text,
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    text.on('pointerdown', () => this.scene.start('WorldMapScene'));
  }
}
