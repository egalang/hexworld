# HexWorld MVP Development Roadmap

> **Version:** 2.0
>
> **Project Vision**
>
> HexWorld is a turn-based tactical strategy game with RPG progression built around a simple but addictive gameplay loop:
>
> ```
> Explore → Battle → Earn Gold → Upgrade → Unlock → Repeat
> ```
>
> The objective of this roadmap is **not** to build every planned feature.
>
> The objective is to build a **complete, polished MVP** that demonstrates the game's core loop while establishing a scalable, data-driven architecture that can support future campaigns, expansions, multiplayer, and procedural content.

---

# Development Philosophy

## Priorities

The order of importance is:

1. Gameplay
2. Player Experience
3. Content
4. Architecture
5. Polish

Architecture should support gameplay—not delay it.

---

# Core Design Principles

## Everything is Data

Game content should **never** be hardcoded inside managers whenever possible.

Managers implement **behavior**.

Data defines **content**.

Example:

```
MissionManager
        ↓
missions.ts

WeaponManager
        ↓
weapons.ts

SkillManager
        ↓
skills.ts

WorldMapManager
        ↓
worldMap.ts
```

Managers know **HOW**.

Data knows **WHAT**.

---

## Definitions vs Player State

Never mix game definitions with player progress.

Example

### Weapon Definition

```
Laser Rifle

Damage: 15

Range: 2

Cost: 500
```

↓

```
weapons.ts
```

---

### Player State

```
Player owns Laser Rifle

Equipped

Kills: 23
```

↓

```
PlayerProfile
```

---

The same applies to

- missions
- enemies
- skills
- upgrades
- achievements

---

## Stable IDs Everywhere

Never reference objects by array position.

Always use IDs.

Example

```
weapon_laser_mk1

skill_double_attack

mission_forest_001

shop_weapon_basic

enemy_bandit_archer

node_weapon_shop
```

This makes save files, balancing, and future content much easier.

---

# Folder Structure

```
src/

├── data/
│
│   worldMap.ts
│   missions.ts
│   weapons.ts
│   skills.ts
│   enemies.ts
│   shops.ts
│   balance.ts
│   achievements.ts
│
├── managers/
│
│   BoardManager.ts
│   CombatManager.ts
│   UnitManager.ts
│   TurnManager.ts
│   AIManager.ts
│   MissionManager.ts
│   EconomyManager.ts
│   WeaponManager.ts
│   SkillManager.ts
│   SaveManager.ts
│   ShopManager.ts
│
├── scenes/
│
├── state/
│
│   GameState.ts
│   PlayerProfile.ts
│
└── shared/
```

---

# MVP Gameplay Loop

```
Launch Game

↓

Main Menu

↓

World Map

↓

Choose Mission

↓

Play Tactical Battle

↓

Victory

↓

Receive Gold

↓

Visit Shop

↓

Buy Weapon / Skill

↓

Unlock Next Mission

↓

Repeat
```

Everything developed should support this loop.

---

# Development Rules

Every task must

- preserve existing gameplay
- compile without TypeScript errors
- be manually tested
- reuse existing managers
- avoid unnecessary refactoring
- avoid introducing temporary code
- avoid breaking save compatibility (once saves exist)

Every completed task should result in a playable milestone.

---

# =======================================
# MILESTONE 1
# WORLD MAP
# =======================================

## Goal

Create a lightweight world map that acts as the game's navigation hub.

---

## Task 1.1

Create

```
src/data/worldMap.ts
```

The world map must be completely data driven.

Example

```ts
{
    id: "mission_01",

    type: "MISSION",

    title: "Forest Patrol",

    missionId: "mission_001",

    icon: "mission",

    links: [
        "weapon_shop"
    ]
}
```

Acceptance Criteria

- no hardcoded nodes
- map generated from data
- IDs used throughout

---

## Task 1.2

Implement WorldMapManager

Responsibilities

- load map definition
- build graph
- highlight node
- move selection
- validate links

Acceptance Criteria

Player can navigate the world map.

---

## Task 1.3

Implement node types

Required

- Start
- Mission
- Weapon Shop
- Skill Shop
- Player
- Settings

Acceptance Criteria

Each node opens the correct destination.

# =======================================
# MILESTONE 2
# BATTLE CONFIGURATION SYSTEM
# =======================================

## Goal

Create a lightweight, data-driven battle configuration system that allows the World Map to launch HexCon battles.

The HexCon battle engine remains responsible for all gameplay mechanics.

The Battle Configuration System is responsible only for:

- selecting a battle
- configuring battle parameters
- launching the HexCon engine
- receiving the battle result
- granting rewards
- unlocking campaign progress

It must never implement battle mechanics.

---

# Design Rules

A battle configuration **may** define

- battle map
- AI difficulty
- victory criteria
- rewards
- mission title
- mission description

A battle configuration **must not** define

- movement rules
- combat rules
- troop conversion
- trap behavior
- AI algorithms
- turn order

Those belong exclusively to the HexCon battle engine.

---

## Task 2.1

Create

```
src/data/missions.ts
```

This file contains mission definitions only.

Example

```ts
{
    id: "mission_forest",

    title: "Capture the Forest",

    description:
        "Secure the surrounding territory.",

    boardId: "forest",

    aiDifficulty: "NORMAL",

    objective: "CONTROL",

    rewardGold: 100,

    rewardXP: 20
}
```

Acceptance Criteria

- Mission definitions are data only.
- No executable logic.
- Stable IDs used throughout.

---

## Task 2.2

Implement MissionManager

Responsibilities

- load mission definitions
- retrieve mission by ID
- validate mission IDs
- provide BattleConfig

MissionManager must not

- control gameplay
- modify battle rules
- perform combat

Acceptance Criteria

MissionManager returns a valid BattleConfig.

---

## Task 2.3

Create BattleConfig

BattleConfig is the contract between the campaign and HexCon.

Example

```ts
{
    boardId,

    aiDifficulty,

    objective,

    rewardGold,

    rewardXP
}
```

Acceptance Criteria

HexCon launches using BattleConfig.

No battle logic is duplicated.

---

## Task 2.4

World Map Integration

Selecting a mission node should

```
Select Mission

↓

MissionManager

↓

BattleConfig

↓

HexCon Battle
```

Acceptance Criteria

Mission launches directly from the World Map.

---

## Task 2.5

Mission Completion

Support

- Victory
- Defeat
- Abort

The HexCon engine determines the result.

MissionManager only processes it.

Acceptance Criteria

Mission exits correctly.

---

## Task 2.6

Rewards

Grant

- Gold
- XP

Only after victory.

Rewards must only be granted once.

Acceptance Criteria

Duplicate rewards are impossible.

---

## Task 2.7

Mission Unlocks

Completing a mission may unlock one or more connected missions.

Unlocks should be entirely data-driven.

Example

```ts
unlocks: [
    "mission_forest_02"
]
```

Acceptance Criteria

No hardcoded unlock logic.

---

# MVP Scope

This milestone intentionally excludes

- cutscenes
- branching dialogue
- scripted events
- custom battle rules
- procedural missions
- mission scripting
- random objectives
- multiple victory paths

The objective is simply to connect

```
World Map

↓

Mission

↓

HexCon Battle

↓

Rewards

↓

Next Mission
```

using clean, reusable, data-driven code.

---

# Definition of Done

A player can

- select a mission from the World Map
- launch a HexCon battle
- complete the battle
- receive rewards
- unlock the next mission

without modifying the HexCon battle engine.

---

# =======================================
# MILESTONE 3
# PLAYER PROGRESSION
# =======================================

## Task 3.1

Create

```
PlayerProfile
```

Stores

- gold
- XP
- level
- owned weapons
- owned skills
- completed missions
- settings

Acceptance Criteria

Profile survives scene changes.

---

## Task 3.2

EconomyManager

Responsibilities

- earn gold
- spend gold
- affordability
- rewards

Acceptance Criteria

Negative gold impossible.

---

# =======================================
# MILESTONE 4
# WEAPONS
# =======================================

## Task 4.1

Create

```
src/data/weapons.ts
```

Definitions only.

Each weapon

```
id

name

cost

damage

range

description
```

Acceptance Criteria

Weapons loaded from data.

---

## Task 4.2

WeaponManager

Responsibilities

- purchase
- equip
- ownership
- damage modifiers

Acceptance Criteria

Weapons work without hardcoded values.

---

## Task 4.3

Weapon Shop

Display

- owned
- locked
- purchasable

Acceptance Criteria

Buying updates PlayerProfile.

---

# =======================================
# MILESTONE 5
# SKILLS
# =======================================

## Task 5.1

Create

```
src/data/skills.ts
```

Definitions only.

---

## Task 5.2

SkillManager

Responsibilities

- unlock
- equip
- activate
- cooldown

Acceptance Criteria

Skills function entirely from data.

---

## Task 5.3

Skill Shop

Purchase

Unlock

Equip

Acceptance Criteria

PlayerProfile updates correctly.

---

# =======================================
# MILESTONE 6
# SAVING
# =======================================

## Task 6.1

SaveManager

Persist

- PlayerProfile
- completed missions
- unlocked weapons
- unlocked skills
- settings

Acceptance Criteria

Progress restored after restart.

---

## Task 6.2

Autosave

Trigger after

- mission complete
- purchase
- settings change

Acceptance Criteria

No manual save required.

---

# =======================================
# MILESTONE 7
# SETTINGS
# =======================================

Implement

Game Settings

- music volume
- SFX volume
- fullscreen

Player Settings

- player name
- preferred color

Acceptance Criteria

Settings persist.

---

# =======================================
# FUTURE CONTENT
# =======================================

These are intentionally postponed until after MVP.

- Fog of War
- Better AI
- Better particles
- Advanced animations
- Multiplayer
- Daily missions
- Procedural campaigns
- Achievements
- Boss encounters
- Elite enemies
- Random events

---

# Expansion Strategy

The engine should support adding content without modifying managers.

Adding a new campaign should require only new data files.

Example

```
campaigns/

    campaign_01/

        worldMap.ts

        missions.ts

        enemies.ts

    campaign_02/

        worldMap.ts

        missions.ts

        enemies.ts
```

No changes to MissionManager.

No changes to WorldMapManager.

Only new data.

---

# Definition of MVP

The MVP is complete when a player can

- launch the game
- navigate the world map
- play several tactical missions
- earn gold
- purchase weapons
- purchase skills
- unlock new missions
- save progress
- continue playing

without any placeholder functionality.

---

# Definition of Done

A task is complete only when

- [ ] Compiles successfully
- [ ] No new TypeScript errors
- [ ] Existing gameplay preserved
- [ ] Acceptance criteria satisfied
- [ ] Uses data-driven content where applicable
- [ ] No duplicated logic
- [ ] Manual gameplay test completed
- [ ] Changes committed to source control