import Phaser from 'phaser';
import { WIDTH, HEIGHT, SOUND_KEYS, playSound, unlockAudio } from '../shared';
import { Theme } from '../config/theme';
import { getOwnedWeapons, getOwnedSkills, getSkillLevel } from '../state/Inventory';
import { getEquippedWeapon, getEquippedSkills, equipWeapon, isSkillEquipped, equipSkill, unequipSkill } from '../state/Loadout';
import { getWeaponById } from '../data/weapons';
import { getSkillById, SkillDefinition } from '../data/skills';

const PANEL_X = 20;
const PANEL_W = WIDTH - 40;
const BTN_W = 90;
const BTN_X = PANEL_X + PANEL_W - 14 - BTN_W / 2;
const TAB_Y = 140;
const TAB_H = 36;

export class InventoryScene extends Phaser.Scene {
  private activeTab: 'weapons' | 'skills' = 'weapons';
  private tabButtons: Phaser.GameObjects.Container[] = [];
  private itemRows: Phaser.GameObjects.Container[] = [];

  constructor() {
    super('InventoryScene');
  }

  create() {
    const bgColor = Phaser.Display.Color.HexStringToColor(Theme.ui.background).color;
    const g = this.add.graphics();
    g.fillStyle(bgColor, 1);
    g.fillRect(0, 0, WIDTH, HEIGHT);

    this.add.text(WIDTH / 2, 56, 'INVENTORY', {
      fontSize: '28px', fontStyle: 'bold', color: Theme.ui.textTitle,
      stroke: '#000000', strokeThickness: 6,
    }).setOrigin(0.5);

    this.createTabs();
    this.renderItems();
    this.createBackButton();
  }

  private createTabs() {
    for (const b of this.tabButtons) b.destroy();
    this.tabButtons = [];

    const tabs: ('weapons' | 'skills')[] = ['weapons', 'skills'];
    const tabW = PANEL_W / 2;

    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i];
      const x = PANEL_X + tabW * i + tabW / 2;
      const c = this.add.container(x, TAB_Y + TAB_H / 2);

      const bg = this.add.graphics();
      const isActive = tab === this.activeTab;
      const fillColor = Phaser.Display.Color.HexStringToColor(isActive ? Theme.button.primary.bg : Theme.button.disabled.bg).color;
      bg.fillStyle(fillColor, 1);
      bg.fillRoundedRect(-tabW / 2 + 2, -TAB_H / 2, tabW - 4, TAB_H, 8);

      const label = this.add.text(0, 0, tab === 'weapons' ? 'Weapons' : 'Skills', {
        fontSize: '17px', fontStyle: 'bold',
        color: isActive ? Theme.button.primary.text : Theme.button.disabled.text,
      }).setOrigin(0.5);

      c.add([bg, label]);
      c.setSize(tabW, TAB_H);
      c.setInteractive({ useHandCursor: true });
      c.on('pointerdown', () => {
        this.activeTab = tab;
        this.createTabs();
        this.renderItems();
      });

      this.tabButtons.push(c);
    }
  }

  private renderItems() {
    for (const r of this.itemRows) r.destroy();
    this.itemRows = [];

    const ids = this.activeTab === 'weapons' ? getOwnedWeapons() : getOwnedSkills();
    const equippedIds = this.activeTab === 'weapons'
      ? (getEquippedWeapon() ? [getEquippedWeapon()!] : [])
      : getEquippedSkills();

    if (ids.length === 0) {
      this.add.text(WIDTH / 2, 320, 'Nothing owned yet.\nVisit the Shop!', {
        fontSize: '16px', color: Theme.ui.textDescription, align: 'center',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5);
      return;
    }

    const startY = 200;
    const rowH = 70;

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const y = startY + i * rowH;
      const isEquipped = this.activeTab === 'weapons' ? equippedIds.includes(id) : equippedIds.includes(id);

      const def = this.activeTab === 'weapons' ? getWeaponById(id) : getSkillById(id);
      if (!def) continue;

      const c = this.add.container(0, 0);

      const panelColor = Phaser.Display.Color.HexStringToColor(Theme.ui.panel).color;
      const borderColor = Phaser.Display.Color.HexStringToColor(isEquipped ? Theme.reward.weapon : Theme.ui.border).color;

      const bg = this.add.graphics();
      bg.fillStyle(panelColor, 0.9);
      bg.lineStyle(2, borderColor, isEquipped ? 1 : 0.4);
      bg.fillRoundedRect(PANEL_X, y, PANEL_W, rowH - 4, 10);
      bg.strokeRoundedRect(PANEL_X, y, PANEL_W, rowH - 4, 10);
      c.add(bg);

      const nameColor = isEquipped ? Theme.reward.weapon : Theme.ui.text;
      const name = this.add.text(PANEL_X + 14, y + 10, def.name, {
        fontSize: '16px', fontStyle: 'bold', color: nameColor,
        stroke: '#000000', strokeThickness: 2,
      });
      c.add(name);

      const stats = this.activeTab === 'weapons'
        ? `Bonus: +${(def as any).conversionBonus}  Durability: ${(def as any).durability}`
        : (() => {
            const s = def as SkillDefinition;
            const type = s.type.charAt(0).toUpperCase() + s.type.slice(1);
            const levelInfo = s.maxLevel ? `  Lv.${getSkillLevel(s.id)}/${s.maxLevel}` : '';
            return `${type} — ${s.description}${levelInfo}`;
          })();
      const desc = this.add.text(PANEL_X + 14, y + 32, stats, {
        fontSize: '12px', color: Theme.ui.textDescription,
        stroke: '#000000', strokeThickness: 1,
      });
      c.add(desc);

      if (this.activeTab === 'weapons') {
        const btnText = isEquipped ? 'Unequip' : 'Equip';
        const btn = this.createActionButton(BTN_X, y + rowH / 2 - 2, btnText, () => {
          if (isEquipped) {
            equipWeapon(null);
          } else {
            equipWeapon(id);
          }
          this.renderItems();
        });
        c.add(btn);
      } else {
        if (isEquipped) {
          const btn = this.createActionButton(BTN_X, y + rowH / 2 - 2, 'Unequip', () => {
            unequipSkill(id);
            this.renderItems();
          });
          c.add(btn);
        } else {
          const canEquip = getEquippedSkills().length < 2;
          const btn = this.createActionButton(BTN_X, y + rowH / 2 - 2, 'Equip', () => {
            if (!equipSkill(id)) return;
            this.renderItems();
          });
          if (!canEquip) btn.setAlpha(0.4);
          c.add(btn);
        }
      }

      this.itemRows.push(c);
    }
  }

  private createActionButton(x: number, y: number, label: string, cb: () => void) {
    const btnColor = Phaser.Display.Color.HexStringToColor(Theme.button.primary.bg).color;
    const c = this.add.container(x, y);
    const bg = this.add.graphics();
    const hw = BTN_W / 2;
    bg.fillStyle(btnColor, 1);
    bg.fillRoundedRect(-hw, -16, BTN_W, 32, 8);
    const text = this.add.text(0, 0, label, {
      fontSize: '14px', fontStyle: 'bold', color: Theme.button.primary.text,
    }).setOrigin(0.5);
    c.add([bg, text]);
    c.setSize(BTN_W, 32);
    c.setInteractive({ useHandCursor: true });
    c.on('pointerdown', () => {
      unlockAudio(this);
      playSound(this, SOUND_KEYS.confirm, 0.35);
      cb();
    });
    return c;
  }

  private createBackButton() {
    const text = this.add.text(WIDTH / 2, HEIGHT - 40, '< Back to World Map', {
      fontSize: '18px', color: Theme.ui.text,
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    text.on('pointerdown', () => this.scene.start('WorldMapScene'));
  }
}
