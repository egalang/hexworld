# HexWorld Development Roadmap

> **Version:** 4.0
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
- **State** (PlayerProfile.ts, Inventory.ts, Loadout.ts) — persisted to localStorage, player-owned data

## Stable IDs Everywhere

Always use string IDs, never array indices.

Examples: `weapon_iron_sword`, `skill_kick`, `mission_01`, `training_01`

---

# Actual Folder Structure

```
src/
├── config/
│   ├── colors.ts       # Color palette constants (50+ raw hex strings)
│   └── theme.ts        # Semantic Theme object composing colors
├── data/
│   ├── battleConfig.ts # BattleConfig / MissionResult interfaces
│   ├── hexUtils.ts     # Hex math utilities
│   ├── missions.ts     # 15 campaign + 3 training mission definitions
│   ├── weapons.ts      # 4 weapon definitions (conversionBonus, durability)
│   ├── skills.ts       # 5 skill definitions (kick, blink, freeze, teleport, hex)
│   └── worldMap.ts     # 31 world map tiles (hex-based navigation)
├── state/
│   ├── PlayerProfile.ts # Commander level, XP, gold, stats, completed missions
│   ├── Inventory.ts     # Owned weapon/skill IDs + skillUpgrades map
│   ├── Loadout.ts       # Currently equipped weapon + skills (max 2)
│   └── MissionProgress.ts # Legacy (deprecated, auto-migrated to PlayerProfile)
├── managers/
│   ├── BoardManager.ts  # Hex grid creation, neighbors, pixel coords
│   ├── UnitManager.ts   # Unit sprites creation/destruction/movement
│   ├── CombatManager.ts # Attack/convert logic (respects hexed tiles), victory checking
│   ├── TurnManager.ts   # Turn/player tracking
│   ├── AIManager.ts     # AI move scoring (skips frozen pieces, hexed tiles)
│   ├── MissionManager.ts # Mission lookup, unlock logic, result processing
│   ├── EconomyManager.ts # Gold/XP operations (static wrapper over PlayerProfile)
│   ├── WeaponManager.ts  # Weapon purchase, equip, query (static)
│   └── SkillManager.ts   # Skill purchase, equip, query, upgrade (static)
└── scenes/
    ├── BootScene.ts
    ├── PreLoaderScene.ts
    ├── MenuScene.ts         # Bypassed — game flow is Boot → Preloader → WorldMap
    ├── WorldMapScene.ts     # Navigation hub, music starts here
    ├── ProfileScene.ts      # Commander stats display
    ├── InventoryScene.ts    # Owned items, equip/unequip, shows skill level
    ├── ShopScene.ts         # Buy/Upgrade weapons/skills, Locked/Available/Owned/Max
    ├── SettingsScene.ts     # Placeholder
    ├── AiSetupScene.ts      # AI difficulty/personality selection
    ├── CampaignLevelSelectScene.ts
    ├── OnlineLobbyScene.ts  # PvP room list
    ├── HexConquestScene.ts  # Main gameplay, action bar + skill bar, skill modes
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

- `src/data/worldMap.ts` — 31 data-driven hexagonal tiles
- `WorldMapScene.ts` — renders tiles, handles navigation, unlock states
- `src/data/hexUtils.ts` — axial-to-pixel conversion, hex rendering

## Milestone 2 — Battle Configuration System

- `src/data/missions.ts` — 18 mission definitions (3 training + 15 campaign)
- `src/data/battleConfig.ts` — `BattleConfig` / `MissionResult` interfaces
- `MissionManager.ts` — mission lookup, unlock graph, result processing
- `MissionCompleteScene.ts` — dedicated scene for post-mission results (victory/defeat/abort)
- World map missions launch into HexConquestScene with `BattleConfig`
- Rewards granted once (duplicate prevention via flag)
- Unlocks are data-driven via `unlocks[]` array

## Milestone 3 — Commander Progression

- `PlayerProfile.ts` — level, XP (level * 100 formula), gold, completed missions, statistics
- `EconomyManager.ts` — static wrapper for gold/XP operations
- `ProfileScene.ts` — portrait, level, XP bar, gold, campaign progress, statistics table
- Auto-migration from legacy `MissionProgress` localStorage keys
- `MissionManager.processResult()` and `MissionCompleteScene` updated to use PlayerProfile
- `WorldMapScene` reads completed missions from PlayerProfile

## Milestone 4 — Equipment Management

- **`src/data/weapons.ts`** — 4 weapons with `conversionBonus`, `durability`, `requiredLevel`, `cost`
- **`src/data/skills.ts`** — 5 skills: Kick (200g/lv2), Blink (400g/lv4), Freeze (300g/lv3, upgradeable to lv3), Teleport (500g/lv5), Hex (600g/lv6)
- **`src/state/Inventory.ts`** — persistent owned weapon/skill IDs + `skillUpgrades` map for upgradeable skills
- **`src/state/Loadout.ts`** — persistent equipped weapon (1 slot) + skills (2 slots)
- **`WeaponManager.ts`** — static: `buy`, `equip`, `canBuy`, `getConversionBonus`, `isOwned`
- **`SkillManager.ts`** — static: `buy` (handles upgrades), `equip`, `unequip`, `canBuy`, `getLevel`, `slotsAvailable`
- **`InventoryScene.ts`** — tabbed UI (Weapons/Skills), owned items with Equip/Unequip, level display for upgradeable skills
- **`ShopScene.ts`** — states: Locked, Available, Owned (Equip), Upgrade, MAX
- **`worldMap.ts`** — shopCategory field on shop tiles
- **`HexConquestScene.ts`** — permanent action bar (weapon + Normal) + skill bar (unused skills). Skill mode system: `enterSkillMode`/`exitSkillMode`/`handleSkillTap`/`execute*`. Uses index-based selection, `usedSkills` Set. Normal default selection.
- **`CombatManager.ts`** — respects `hexed` tiles on conversion, clears `frozen` on capture
- **`AIManager.ts`** — skips frozen pieces and hexed tiles in move generation/scoring

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
}
```

## Skill Properties

```ts
// Basic skills
{
  id: "skill_kick",
  name: "Kick",
  description: "Kick opponent to nearest empty tile, then move in.",
  cost: 200, requiredLevel: 2, type: "kick",
}

// Upgradeable skills (maxLevel + upgradeCost)
{
  id: "skill_freeze",
  name: "Freeze",
  description: "Freeze opponent piece(s) so they cannot be moved.",
  cost: 300, requiredLevel: 3, type: "freeze",
  maxLevel: 3, upgradeCost: 200,
}
```

## Item States

| State     | Shop                | Inventory                | Battle                        |
|-----------|---------------------|--------------------------|-------------------------------|
| Locked    | Dimmed, not buyable | N/A                      | N/A                           |
| Available | Buy button          | N/A                      | N/A                           |
| Owned     | Equip/Upgrade/MAX   | Shown in list with level | N/A                           |
| Equipped  | "Equipped" badge    | Highlighted border       | Shows in skill bar (if unused)|

## Battle Integration

When it's blue's turn:
1. **Action bar** (y=218): shows equipped weapon + Normal as toggle buttons. Defaults to Normal.
2. **Skill bar** (y=250): shows unused equipped skills (filtered by `usedSkills` Set).
3. Clicking a skill enters skill mode: shows instructions, highlights valid targets, two-phase interaction for some skills.
4. After skill use, it's added to `usedSkills` and the bar is rebuilt.
5. Normal/weapon move uses `pendingConversionBonus` for extra conversions. `applyConversionBonus` converts exactly N tiles (not flood-fill).

---

# Skill Details

| Skill     | Type      | Phases | Effect |
|-----------|-----------|--------|--------|
| Kick      | Two-phase | Select red piece → BFS nearest empty → Select blue piece to move in | Opponent displaced, convert from new position |
| Blink     | Two-phase | Select blue piece → Select adjacent red piece | Swap positions, convert from new position |
| Freeze    | One-phase | Select red piece adjacent to blue | Freeze 1/3/5 pieces (by level). Frozen pieces can't move. Unfrozen if converted. |
| Teleport  | Two-phase | Select blue piece → Select any red piece on board | Swap positions anywhere, convert from new position |
| Hex       | One-phase | Select vacant tile | Claim tile permanently — only blue can ever occupy it. Visual: cyan stroke. |

## Hex (tile property)
- `hex.hexed: Player | null` — set to `'blue'` by Hex skill
- `CombatManager.attack()` skips conversion of hexed tiles where `hexed !== attacker`
- `AIManager` avoids moving to hexed tiles the AI doesn't own

## Freeze (tile property)
- `hex.frozen: boolean` — set by Freeze skill
- Frozen pieces cannot be selected/moved by their owner
- `CombatManager.captureTile()` clears `frozen`
- `AIManager` skips frozen pieces in move generation

---

# Remaining Milestones

## Milestone 5 — Settings

- Music volume, SFX volume, fullscreen toggle
- Player name editor
- Persist settings to localStorage

## Future Content (post-MVP)

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
