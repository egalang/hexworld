# HexWorld Development Roadmap

> **Version:** 4.1
>
> **Project Vision**
>
> HexWorld is a turn-based tactical strategy game with RPG progression built around:
>
> ```
> Explore → Battle → Earn Gold → Upgrade → Unlock → Repeat
> ```

---

# Development Philosophy

## Priorities

1. Gameplay
2. Player Experience
3. Content
4. Architecture
5. Polish

Architecture should support gameplay—not delay it.

---

# Core Design Principles

## Everything is Data

Game content should **never** be hardcoded inside managers.

Managers implement **behavior** — Data defines **content**.

```
MissionManager → missions.ts
WeaponManager  → weapons.ts
SkillManager   → skills.ts
```

## Definitions vs Player State

Never mix game definitions with player progress.

- **Definitions** (weapons.ts, skills.ts, missions.ts) — static data, never modified
- **State** (PlayerProfile.ts, Inventory.ts, Loadout.ts, Settings.ts) — persisted to localStorage, player-owned data

## Stable IDs Everywhere

Always use string IDs, never array indices.

Examples: `weapon_iron_sword`, `skill_kick`, `mission_01`, `training_01`

---

# Actual Folder Structure

```
src/
├── config/
│   ├── colors.ts       # Color palette constants (50 exact hex constants)
│   └── theme.ts        # Semantic Theme object composing colors
├── data/
│   ├── battleConfig.ts # BattleConfig / MissionResult interfaces
│   ├── hexUtils.ts     # Hex math utilities
│   ├── missions.ts     # 18 mission definitions (3 training + 15 campaign), linear unlock chain
│   ├── weapons.ts      # 4 weapon definitions (conversionBonus, durability, imageUrl)
│   ├── skills.ts       # 5 skill definitions (kick, blink, freeze, teleport, hex)
│   └── worldMap.ts     # 30 world map tiles (hex-based navigation)
├── state/
│   ├── PlayerProfile.ts # Commander level, XP, gold, stats, completed missions
│   ├── Inventory.ts     # Owned weapon/skill IDs + skillUpgrades + weaponDurability maps
│   ├── Loadout.ts       # Currently equipped weapon (1 slot) + skills (2 slots)
│   ├── MissionProgress.ts # Legacy (deprecated, auto-migrated to PlayerProfile)
│   └── Settings.ts      # Music/SFX volume, fullscreen toggle, player name
├── managers/
│   ├── BoardManager.ts  # Hex grid creation, neighbors, pixel coords
│   ├── UnitManager.ts   # Unit sprites creation/destruction/movement
│   ├── CombatManager.ts # Attack/convert logic (respects hexed tiles), victory checking
│   ├── TurnManager.ts   # Turn/player tracking
│   ├── AIManager.ts     # AI move scoring (skips frozen pieces, hexed tiles)
│   ├── MissionManager.ts # Mission lookup, unlock logic (data-driven via startsUnlocked), result processing
│   ├── EconomyManager.ts # Gold/XP operations (static wrapper over PlayerProfile)
│   ├── WeaponManager.ts  # Weapon purchase, equip, query, durability init (static)
│   └── SkillManager.ts   # Skill purchase, equip, query, upgrade (static)
└── scenes/
    ├── BootScene.ts
    ├── PreLoaderScene.ts # Logo fills full screen, progress bar + loading text overlaid
    ├── MenuScene.ts      # Bypassed — game flow is Boot → Preloader → WorldMap
    ├── MusicManager.ts   # Background music controller
    ├── WorldMapScene.ts  # Navigation hub, locked tiles at 50% opacity
    ├── ProfileScene.ts   # Commander stats display
    ├── InventoryScene.ts # Owned items, equip/unequip, shows current/max durability
    ├── ShopScene.ts      # Buy/Repair/Info for weapons, Buy/Upgrade/Equip for skills
    ├── SettingsScene.ts  # Music/SFX volume controls, fullscreen toggle, player name editor
    ├── AiSetupScene.ts   # AI difficulty/personality selection
    ├── CampaignLevelSelectScene.ts
    ├── OnlineLobbyScene.ts # PvP room list
    ├── HexConquestScene.ts # Main gameplay, combined action bar, weapon durability degradation
    └── MissionCompleteScene.ts # Post-mission result display
```

---

# MVP Gameplay Loop

```
Launch Game → World Map → Choose Mission → Battle → Victory → Gold → Shop → Next Mission
```

---

# Completed Milestones

## Milestone 1 — World Map

- `src/data/worldMap.ts` — 30 data-driven hexagonal tiles
- `WorldMapScene.ts` — renders tiles, handles navigation, unlock states, locked tiles at 50% alpha
- `src/data/hexUtils.ts` — axial-to-pixel conversion, hex rendering

## Milestone 2 — Battle Configuration System

- `src/data/missions.ts` — 18 mission definitions (3 training + 15 campaign) in a linear unlock chain, each with optional `story` and `imagePath` fields
- `src/data/battleConfig.ts` — `BattleConfig` / `MissionResult` interfaces
- `MissionManager.ts` — mission lookup, data-driven unlock logic via `startsUnlocked` field, result processing
- `MissionCompleteScene.ts` — dedicated scene for post-mission results (victory/defeat/abort)
- World map missions launch into HexConquestScene with `BattleConfig`
- Rewards granted once (duplicate prevention via flag)
- Unlocks are data-driven via `unlocks[]` array with `startsUnlocked` for initial missions

## Milestone 3 — Commander Progression

- `PlayerProfile.ts` — level, XP (level * 100 formula), gold, completed missions, statistics
- `EconomyManager.ts` — static wrapper for gold/XP operations
- `ProfileScene.ts` — portrait, level, XP bar, gold, campaign progress, statistics table
- Auto-migration from legacy `MissionProgress` localStorage keys
- `MissionManager.processResult()` and `MissionCompleteScene` updated to use PlayerProfile
- `WorldMapScene` reads completed missions from PlayerProfile

## Milestone 4 — Equipment Management

- **`src/data/weapons.ts`** — 4 weapons with `conversionBonus`, `durability`, `requiredLevel`, `cost`, optional `imageUrl`. Bronze Sword requires level 2.
- **`src/data/skills.ts`** — 5 skills sorted weakest→strongest: Hex (150g/lv1, upgradeable lv1→3), Freeze (250g/lv2, upgradeable lv2→4), Kick (350g/lv4), Blink (500g/lv5), Teleport (650g/lv6)
- **`src/state/Inventory.ts`** — persistent owned weapon/skill IDs + `skillUpgrades` map + `weaponDurability` map (tracks current durability per weapon)
- **`src/state/Loadout.ts`** — persistent equipped weapon (1 slot) + skills (2 slots)
- **`WeaponManager.ts`** — static: `buy`, `equip`, `canBuy`, `getConversionBonus`, `isOwned`; initializes durability on buy
- **`SkillManager.ts`** — static: `buy` (handles upgrades), `equip`, `unequip`, `canBuy` (checks gold + level), `getLevel`, `slotsAvailable`
- **`InventoryScene.ts`** — tabbed UI (Weapons/Skills), owned items with Equip/Unequip, shows current/max durability for weapons
- **`ShopScene.ts`** — states: Locked, Available, Buy, Owned (Equip/Repair/MAX), Upgrade. Repair costs 50% of weapon price. Info button opens image popup with rounded corners and brown border. Upgrade button dims on insufficient level or gold.
- **`worldMap.ts`** — shopCategory field on shop tiles
- **`HexConquestScene.ts`** — combined action bar, weapon durability degradation per use, auto-unequip on break, weapon/skill resets to unselected after each move
- **`CombatManager.ts`** — respects `hexed` tiles on conversion, clears `frozen` on capture
- **`AIManager.ts`** — skips frozen pieces and hexed tiles in move generation/scoring

## Milestone 5 — Settings

- **`src/state/Settings.ts`** — `SettingsData` with `musicVolume`, `sfxVolume`, `fullscreen`, `playerName`, persisted to localStorage
- **`SettingsScene.ts`** — Music volume (0–100% steps), SFX volume (0–100% steps), fullscreen toggle (ON/OFF), player name editor (prompt), back to world map
- **`MusicManager.ts`** — background music playback controller

## Milestone 6 — Mission Popup & Story Content

- **`src/data/missions.ts`** — all 18 missions now have `story` (lore text) and `imagePath` (background image filename) fields
- **`WorldMapScene.ts`** — clicking an unlocked mission tile opens a full-image popup with title, description, story, and START MISSION button; uses same rounded-corner mask (17px radius) + 12px brown border (`#3B1F0B`) style as weapon info popup
- **`MissionCompleteScene.ts`** — victory uses `mission_success.png`, defeat/abort uses `mission_failed.png` as full-screen background images with matching rounded-corner mask and brown border
- **`PreLoaderScene.ts`** — dynamically loads all mission images (`mission_img_{id}`) from `imagePath` field; also loads `mission_success` and `mission_failed` textures; logo displayed fullscreen via `setDisplaySize(WIDTH, HEIGHT)`
- **`src/scenes/ShopScene.ts`** — panel rows use 0px gap between them (`currentY += rowHeight` without extra spacing)
- **Android deployment** — Capacitor configured (`capacitor.config.ts`; `assets/icon.png` + `assets/splash.png` for app icon/splash generation via `npx capacitor-assets generate`); starting gold set in `PlayerProfile.ts` (`gold: 500` in `defaultProfile()`)


---

# Equipment System Detail

## Weapon Properties

```ts
{
  id: "weapon_iron_sword",
  name: "Iron Sword",
  description: "Convert 1 extra tile per move.",
  cost: 100,
  conversionBonus: 1,
  durability: 5,
  requiredLevel: 1,
  imageUrl?: "https://...",
}
```

## Skill Properties

```ts
// Basic skills (no upgrade)
{
  id: "skill_kick",
  name: "Kick",
  description: "Kick opponent to nearest empty tile, then move in.",
  cost: 350, requiredLevel: 4, type: "kick",
}

// Upgradeable skills (maxLevel + upgradeCost + upgradeLevelReq)
// getRequiredLevelForLevel(def, level) = def.requiredLevel + (level-1) * def.upgradeLevelReq
{
  id: "skill_hex",
  name: "Hex",
  description: "Mark a vacant tile — only you can ever occupy it.",
  cost: 150, requiredLevel: 1, type: "hex",
  maxLevel: 3, upgradeCost: 150, upgradeLevelReq: 1,
}
{
  id: "skill_freeze",
  name: "Freeze",
  description: "Freeze opponent piece(s) so they cannot be moved.",
  cost: 250, requiredLevel: 2, type: "freeze",
  maxLevel: 3, upgradeCost: 150, upgradeLevelReq: 1,
}
```

## Durability System

- Each weapon has a `durability` stat (max durability from definition)
- Current durability is persisted in `Inventory.weaponDurability` map
- Each use in battle (when weapon is active) decrements durability by 1
- When durability reaches 0, weapon is auto-unequipped
- Shop shows "Repair" (50% of weapon cost) for damaged owned weapons, restores to max
- Inventory/Shop display shows `current/max` durability

## Item States

| State     | Shop                           | Inventory                | Battle                        |
|-----------|--------------------------------|--------------------------|-------------------------------|
| Locked    | Dimmed, not buyable            | N/A                      | N/A                           |
| Available | Buy button                     | N/A                      | N/A                           |
| Owned     | Equip/Repair/Upgrade/MAX/Info  | Shown in list with level | N/A                           |
| Equipped  | "Equipped" badge               | Highlighted border       | Shows in skill bar (if unused)|

## Battle Integration

When it's blue's turn:
1. **Combined bar** (y=190): shows equipped weapon (if durability > 0) + unused equipped skills side by side. No "Normal" button. Default state: weapon unselected, no skill active.
2. Tapping the weapon toggles it on/off. Active weapon provides `pendingConversionBonus` for extra conversions.
3. Tapping the skill button cycles through available skills. Enters skill mode with instructions and target highlighting.
4. After skill use, it's added to `usedSkills` and the bar is rebuilt.
5. After any move, weapon/skill resets to unselected, bar is destroyed and rebuilt on next turn.
6. `applyConversionBonus` converts exactly N tiles (not flood-fill).

---

# Skill Details

| Skill     | Type      | Phases | Effect | Upgrade |
|-----------|-----------|--------|--------|---------|
| Hex       | One-phase | Select vacant tile | Claim 1/3/5 vacant tiles. Tile is hexed — only blue can ever occupy it. | Lv1: 1 tile (150g) Lv2: 3 tiles (+150g) Lv3: 5 tiles (+150g). Req lv +1 per upgrade. |
| Freeze    | One-phase | Select red piece adjacent to blue | Freeze 1/3/5 opponent pieces. Frozen can't move. Unfrozen if converted. | Lv1: 1 piece (250g) Lv2: 3 pieces (+150g) Lv3: 5 pieces (+150g). Req lv +1 per upgrade. |
| Kick      | Two-phase | Select red piece → BFS nearest empty → Select blue piece to move in | Opponent displaced, convert from new position | — |
| Blink     | Two-phase | Select blue piece → Select adjacent red piece | Swap positions, convert from new position | — |
| Teleport  | Two-phase | Select blue piece → Select any red piece on board | Swap positions anywhere, convert from new position | — |

## Hex (tile property)
- `hex.hexed: Player | null` — set to `'blue'` by Hex skill
- `CombatManager.attack()` skips conversion of hexed tiles where `hexed !== attacker`
- `AIManager` avoids moving to hexed tiles the AI doesn't own

## Freeze (tile property)
- `hex.frozen: boolean` — set by Freeze skill
- Frozen pieces cannot be selected/moved by their owner
- `CombatManager.captureTile()` clears `frozen`
- `AIManager` skips frozen pieces in move generation

## Upgrade System
- Upgradeable skills have `maxLevel`, `upgradeCost`, and `upgradeLevelReq` fields
- `getRequiredLevelForLevel(def, level)` computes player level requirement for a given skill level
- Formula: `def.requiredLevel + (level - 1) * def.upgradeLevelReq`
- Skill level stored in `Inventory.skillUpgrades` map (defaults to 1)

---

# Mission Data Fields

Each mission definition now includes optional `story` (lore text displayed in the mission popup) and `imagePath` (filename in `/public/assets/`) for the popup background image.

# Mission Unlock System

## Linear Chain

```
training_01 (starts unlocked) → training_02 → training_03 →
mission_01 → mission_02 → mission_03 → mission_04 → mission_05 →
mission_06 → mission_07 → mission_08 → mission_09 → mission_10 →
mission_11 → mission_12 → mission_13 → mission_14 → mission_15
```

- Only `training_01` has `startsUnlocked: true` — all others must be unlocked sequentially.
- Each mission's `unlocks[]` array references exactly the next mission in the chain.
- `MissionManager.getUnlockedMissions()` reads `startsUnlocked` from data + completed missions' `unlocks[]`.
- No special-casing for training missions — fully data-driven.

---

# Scene Flow

```
BootScene → PreLoaderScene (logo, progress bar, loading text) → WorldMapScene
```

- `MenuScene` is registered but bypassed in the main flow; accessible via buttons.
- `PreLoaderScene` layout: logo fills entire screen, progress bar near bottom, loading text below it.

---

# Future Content (post-MVP)

- Fog of War
- Better AI
- Better particles / animations
- Daily missions
- Procedural campaigns
- Achievements
- Boss encounters / elite encounters
- Random events

---

# Development Rules

Every task must:
- preserve existing gameplay
- compile without TypeScript errors
- be manually tested
- reuse existing managers
- avoid unnecessary refactoring
- avoid introducing temporary code
- avoid breaking save compatibility

---

# Definition of Done

A task is complete only when:
- [ ] Compiles successfully
- [ ] No new TypeScript errors
- [ ] Existing gameplay preserved
- [ ] Acceptance criteria satisfied
- [ ] Uses data-driven content where applicable
- [ ] No duplicated logic
- [ ] Manual gameplay test completed
