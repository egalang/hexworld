# =======================================
# WORLD MAP PHILOSOPHY
# =======================================

## Vision

The World Map is the player's headquarters.

It is **not** a graph.

It is **not** a pathfinding map.

It is **not** a travel system.

Instead, it is a collection of interactive hexagonal tiles that act as entry points into different parts of the game.

Each tile represents a destination.

Examples

- Mission
- Weapon Shop
- Skill Shop
- Player Profile
- Inventory
- Settings
- Arena
- Future Events

Clicking a tile immediately loads the appropriate scene.

---

## Design Goals

The World Map should

- feel like a living headquarters
- be visually attractive
- be easy to expand
- require minimal game logic
- be completely data driven

The World Map is primarily a presentation layer.

Game logic belongs elsewhere.

---

## Responsibilities

The WorldMapScene should only

- render the map
- display tiles
- display labels
- display icons/buildings
- detect tile selection
- dispatch the selected tile action

The World Map should not contain mission logic, shop logic, inventory logic, or player logic.

---

## Tile Behavior

Every tile performs one action.

Examples

Mission Tile

↓

Launch Mission Scene

Weapon Shop

↓

Launch Weapon Shop Scene

Skill Shop

↓

Launch Skill Shop Scene

Player Profile

↓

Launch Profile Scene

Settings

↓

Launch Settings Scene

Future tile types can be added without modifying the World Map architecture.

---

## Unlocking

Tiles are never connected by paths.

Instead, each tile determines whether it is available.

Examples

Unlocked

Locked

Hidden

Future implementations may unlock tiles based on

- completed missions
- player level
- owned items
- achievements
- story progression

Unlocking affects availability only.

It does not create movement paths.

---

## World Map Data

The entire map should be generated from data.

Example

```ts
export interface WorldTile {

    id: string;

    title: string;

    type: WorldTileType;

    q: number;

    r: number;

    iconId: string;

    buildingId?: string;

    action: WorldTileAction;

    actionId?: string;

    unlocked: boolean;
}
```

The WorldMapScene should not hardcode tile locations.

All tiles should be loaded from `worldMap.ts`.

---

## Placeholder Policy

The MVP will use simple placeholders.

Examples

- Colored hexes
- Emoji
- Simple icons
- Labels

Example

🟦 Mission

🟪 Weapon Shop

🟩 Skill Shop

🟨 Player

⬜ Settings

Gameplay must never depend on artwork.

Artwork should be replaceable without changing gameplay code.

---

## Future Evolution

The final game will replace placeholder icons with illustrated buildings.

Examples

Mission

↓

Castle

Dungeon

Village

Camp

Weapon Shop

↓

Blacksmith

Forge

Armory

Skill Shop

↓

Mage Tower

Temple

Library

Player

↓

Headquarters

Barracks

Castle

These are purely visual upgrades.

Gameplay should remain unchanged.

Only the artwork changes.
