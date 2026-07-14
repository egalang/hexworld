import Phaser from 'phaser';
import { WIDTH, HEIGHT, SOUND_KEYS, playSound, unlockAudio } from '../shared';
import { Theme } from '../config/theme';
import { getGold, getLevel } from '../state/PlayerProfile';
import { isWeaponOwned, isSkillOwned, getSkillLevel } from '../state/Inventory';
import { getEquippedWeapon } from '../state/Loadout';
import { WEAPONS, getWeaponById, WeaponDefinition } from '../data/weapons';
import { SKILLS, getSkillById, SkillDefinition } from '../data/skills';
import { WeaponManager } from '../managers/WeaponManager';
import { SkillManager } from '../managers/SkillManager';

const PANEL_X = 16;
const PANEL_W = WIDTH - 32;
const ROW_H = 100;
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
    const bgColor = Phaser.Display.Color.HexStringToColor(Theme.ui.background).color;
    const g = this.add.graphics();
    g.fillStyle(bgColor, 1);
    g.fillRect(0, 0, WIDTH, HEIGHT);

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

    const startY = 130;
    const scrollContent = this.add.container(0, 0);
    const maxVisible = Math.floor((HEIGHT - startY - 80) / ROW_H);

    for (let i = 0; i < items.length; i++) {
      if (i >= maxVisible) break;
      const item = items[i];
      const y = startY + i * ROW_H;
      scrollContent.add(this.createItemRow(item, y));
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

    const panelColor = Phaser.Display.Color.HexStringToColor(Theme.ui.panel).color;
    const borderColor = Phaser.Display.Color.HexStringToColor(
      owned ? Theme.reward.weapon : locked ? Theme.button.disabled.bg : Theme.ui.border
    ).color;

    const bg = this.add.graphics();
    bg.fillStyle(panelColor, 0.9);
    bg.lineStyle(2, borderColor, owned ? 1 : locked ? 0.3 : 0.6);
    bg.fillRoundedRect(PANEL_X, y, PANEL_W, ROW_H - 4, 10);
    bg.strokeRoundedRect(PANEL_X, y, PANEL_W, ROW_H - 4, 10);
    c.add(bg);

    const nameColor = owned ? Theme.reward.weapon : locked ? Theme.button.disabled.text : Theme.ui.text;
    const nameText = this.add.text(PANEL_X + 14, y + 8, item.name, {
      fontSize: '16px', fontStyle: 'bold', color: nameColor,
      stroke: '#000000', strokeThickness: 2,
    });
    c.add(nameText);

    const descText = this.add.text(PANEL_X + 14, y + 30, item.description, {
      fontSize: '12px', color: Theme.ui.textDescription,
      stroke: '#000000', strokeThickness: 1, wordWrap: { width: PANEL_W - 120 },
    });
    c.add(descText);

      const sk = item as SkillDefinition;
      let detail = `Cost: ${item.cost} Gold`;
      if (isWeapon) {
        const w = item as WeaponDefinition;
        detail += `  Bonus: +${w.conversionBonus}  Durability: ${w.durability}`;
      } else if (sk.maxLevel) {
        const lvl = owned ? getSkillLevel(sk.id) : 1;
        detail += `  Level ${lvl}/${sk.maxLevel}  Once per battle`;
      } else {
        detail += `  Once per battle`;
      }
    const detailText = this.add.text(PANEL_X + 14, y + 50, detail, {
      fontSize: '11px', color: Theme.ui.textSecondary,
      stroke: '#000000', strokeThickness: 1,
    });
    c.add(detailText);

    if (levelReq > 0) {
      const reqText = this.add.text(PANEL_X + 14, y + 68, `Requires Level ${levelReq}`, {
        fontSize: '10px', color: locked ? Theme.status.warning : Theme.ui.textDescription,
        stroke: '#000000', strokeThickness: 1,
      });
      c.add(reqText);
    }

    if (owned) {
      if (isWeapon) {
        const isEq = getEquippedWeapon() === item.id;
        const btnText = isEq ? 'Equipped' : 'Equip';
        const btn = this.makeButton(BTN_X, y + ROW_H / 2 - 2, btnText, () => {
                          if (!isEq) {
                            WeaponManager.equip(item.id);
                            this.refresh();
                          }
                        });
                        if (isEq) btn.setAlpha(0.6);
                        c.add(btn);
                      } else {
                        const sk = item as SkillDefinition;
                        if (sk.maxLevel) {
                          const lvl = getSkillLevel(sk.id);
                          if (lvl < sk.maxLevel) {
                            const upgCost = sk.upgradeCost ?? sk.cost;
                            const canAffordUpg = getGold() >= upgCost;
                            const btn = this.makeButton(BTN_X, y + ROW_H / 2 - 2, `Upgrade ${upgCost}g`, () => {
                              if (SkillManager.buy(sk.id)) {
                                playSound(this, SOUND_KEYS.confirm, 0.5);
                                this.refresh();
                              }
                            });
                            if (!canAffordUpg) btn.setAlpha(0.4);
                            c.add(btn);
                          } else {
                            const btn = this.makeButton(BTN_X, y + ROW_H / 2 - 2, 'MAX', () => {});
                            btn.setAlpha(0.5);
                            c.add(btn);
                          }
                        } else {
                          const isEq = SkillManager.isEquipped(item.id);
                          const btnText = isEq ? 'Equipped' : 'Equip';
                          const btn = this.makeButton(BTN_X, y + ROW_H / 2 - 2, btnText, () => {
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
                      const btn = this.makeButton(BTN_X, y + ROW_H / 2 - 2, 'Locked', () => {});
                      btn.setAlpha(0.4);
                      c.add(btn);
                    } else if (buyable) {
                      const btn = this.makeButton(BTN_X, y + ROW_H / 2 - 2, 'Buy', () => {
                        const success = isWeapon ? WeaponManager.buy(item.id) : SkillManager.buy(item.id);
                        if (success) {
                          playSound(this, SOUND_KEYS.confirm, 0.5);
                          this.refresh();
                        }
                      });
                      c.add(btn);
                    } else {
                      const btn = this.makeButton(BTN_X, y + ROW_H / 2 - 2, `${getGold()}/${item.cost}`, () => {});
                      btn.setAlpha(0.4);
                      c.add(btn);
                    }

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

  private createBackButton() {
    const text = this.add.text(WIDTH / 2, HEIGHT - 40, '< Back to World Map', {
      fontSize: '18px', color: Theme.ui.text,
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    text.on('pointerdown', () => this.scene.start('WorldMapScene'));
  }
}
