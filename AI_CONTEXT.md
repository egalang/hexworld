# HexWorld Refactoring Roadmap

> **Project Goal**
>
> Refactor `HexConquestScene` into a modular, maintainable architecture where each game system has a single responsibility. The scene should become an orchestrator that coordinates managers rather than implementing game logic.
>
> **Important Rules**
>
> - Complete **one task at a time**.
> - The game **must compile and run after every task**.
> - Do **not** combine multiple managers into a single refactoring.
> - Preserve existing gameplay and behavior.
> - No new features unless required by the refactoring.
> - Prefer small, incremental commits.

---

# Target Architecture

```
src/
│
├── managers/
│   ├── BoardManager.ts
│   ├── UnitManager.ts
│   ├── CombatManager.ts
│   ├── TurnManager.ts
│   ├── FogManager.ts
│   ├── AIManager.ts
│   ├── AnimationManager.ts
│   ├── EffectsManager.ts
│   ├── SoundManager.ts
│   ├── UIManager.ts
│   ├── InputManager.ts
│   ├── CampaignManager.ts
│   ├── SaveManager.ts
│   └── OnlineManager.ts
│
├── state/
│   └── GameState.ts
│
├── scenes/
│   └── HexConquestScene.ts
│
└── shared/
```

---

# Coding Guidelines

## Every manager should

- Have a single responsibility.
- Own only one subsystem.
- Expose a clean public API.
- Avoid direct dependencies on other managers whenever possible.
- Receive dependencies through constructor injection.
- Never import `HexConquestScene` unless absolutely necessary.

Example:

```ts
export class BoardManager {
    constructor(
        private scene: Phaser.Scene,
        private state: GameState
    ) {}
}
```

---

## Every refactoring task must

- Preserve behavior.
- Preserve save compatibility.
- Preserve AI behavior.
- Preserve multiplayer behavior.
- Preserve campaign progression.
- Compile without TypeScript errors.
- Pass manual gameplay testing.

---

# Phase 1 — Core Infrastructure

---

# Task 1 — Create BoardManager

## Goal

Move all board-related logic out of `HexConquestScene`.

## Responsibilities

- Board generation
- Tile lookup
- Neighbor lookup
- Hex coordinate utilities
- Distance calculations
- Board reset
- Tile ownership lookup

## Public API

```ts
class BoardManager {
    createBoard()
    getTile(q, r)
    getNeighbors(tile)
    getDistance(a, b)
    getTiles()
    resetBoard()
}
```

## Subtasks

- [ ] Create `BoardManager.ts`
- [ ] Move board generation
- [ ] Move coordinate helpers
- [ ] Move neighbor calculations
- [ ] Replace direct board access
- [ ] Verify game still runs

---

# Task 2 — Create UnitManager

## Goal

Move all unit management into its own class.

## Responsibilities

- Unit creation
- Unit removal
- Unit lookup
- Unit movement
- Unit selection
- Unit ownership
- Unit statistics

## Public API

```ts
createUnit()
moveUnit()
removeUnit()
getUnits()
getUnitOnTile()
selectUnit()
```

## Subtasks

- [ ] Create `UnitManager.ts`
- [ ] Move unit collections
- [ ] Move spawn logic
- [ ] Move movement logic
- [ ] Replace scene references
- [ ] Test gameplay

---

# Phase 2 — Gameplay

---

# Task 3 — Create CombatManager

## Goal

Move combat logic into a dedicated manager.

## Responsibilities

- Attack resolution
- Defense
- Damage
- Tile capture
- Unit elimination
- Victory checks

## Public API

```ts
attack()
resolveCombat()
captureTile()
destroyUnit()
checkVictory()
```

## Subtasks

- [ ] Create `CombatManager.ts`
- [ ] Move attack logic
- [ ] Move capture logic
- [ ] Move elimination logic
- [ ] Replace scene references
- [ ] Test combat

---

# Task 4 — Create TurnManager

## Goal

Centralize turn progression.

## Responsibilities

- Turn order
- Current player
- End turn
- Turn counter
- Income
- Production

## Public API

```ts
startTurn()
endTurn()
nextPlayer()
getCurrentPlayer()
```

## Subtasks

- [ ] Create `TurnManager.ts`
- [ ] Move turn state
- [ ] Move income calculations
- [ ] Replace scene logic
- [ ] Test turn progression

---

# Task 5 — Create FogManager

## Goal

Manage fog-of-war independently.

## Responsibilities

- Fog calculations
- Visibility
- Revealed tiles
- Hidden units

## Public API

```ts
updateFog()
reveal()
hide()
isVisible()
```

## Subtasks

- [ ] Create `FogManager.ts`
- [ ] Move visibility calculations
- [ ] Move fog rendering logic
- [ ] Replace scene references
- [ ] Test fog behavior

---

# Phase 3 — Artificial Intelligence

---

# Task 6 — Create AIManager

## Goal

Extract all AI behavior.

## Responsibilities

- AI turn execution
- Target evaluation
- Expansion
- Combat decisions
- Prioritization

## Public API

```ts
takeTurn()
evaluateBoard()
chooseAttack()
chooseMove()
chooseExpansion()
```

## Subtasks

- [ ] Create `AIManager.ts`
- [ ] Move evaluation logic
- [ ] Move heuristics
- [ ] Replace scene AI
- [ ] Test Easy AI
- [ ] Test Medium AI
- [ ] Test Hard AI

---

# Phase 4 — Rendering

---

# Task 7 — Create AnimationManager

## Goal

Own all gameplay animations.

## Responsibilities

- Unit movement
- Combat animation
- Capture animation
- Explosions
- Tile highlighting

## Public API

```ts
animateMove()
animateAttack()
animateCapture()
playExplosion()
highlightTile()
```

## Subtasks

- [ ] Create `AnimationManager.ts`
- [ ] Move tween logic
- [ ] Replace scene animation code
- [ ] Test animations

---

# Task 8 — Create EffectsManager

## Goal

Separate visual effects from gameplay.

## Responsibilities

- Particles
- Glow
- Flash
- Camera shake
- Pulse effects

## Public API

```ts
spawnExplosion()
flashTile()
shakeCamera()
```

## Subtasks

- [ ] Create `EffectsManager.ts`
- [ ] Move particle effects
- [ ] Move camera effects
- [ ] Test visual effects

---

# Task 9 — Expand SoundManager

## Goal

Centralize all sound effects.

## Responsibilities

- Sound playback
- Volume
- Mute
- SFX management

## Public API

```ts
playMove()
playAttack()
playCapture()
playVictory()
```

## Subtasks

- [ ] Move SFX logic
- [ ] Preserve MusicManager integration
- [ ] Test audio

---

# Phase 5 — User Interface

---

# Task 10 — Create UIManager

## Goal

Manage all HUD and interface elements.

## Responsibilities

- HUD
- Buttons
- Panels
- Dialogs
- Tooltips
- Labels

## Public API

```ts
updateHUD()
showDialog()
hideDialog()
updateScores()
showTurnBanner()
```

## Subtasks

- [ ] Create `UIManager.ts`
- [ ] Move HUD creation
- [ ] Move dialog logic
- [ ] Test UI

---

# Task 11 — Create InputManager

## Goal

Centralize player input.

## Responsibilities

- Mouse input
- Keyboard input
- Hover
- Drag
- Selection

## Public API

```ts
registerInput()
onTileClick()
onTileHover()
onUnitClick()
```

## Subtasks

- [ ] Create `InputManager.ts`
- [ ] Move input handlers
- [ ] Replace scene callbacks
- [ ] Test interaction

---

# Phase 6 — Campaign

---

# Task 12 — Create CampaignManager

## Goal

Manage campaign progression.

## Responsibilities

- Level loading
- Unlocks
- Stars
- Objectives
- Mission state

## Public API

```ts
loadLevel()
completeLevel()
unlockNext()
saveProgress()
```

## Subtasks

- [ ] Create `CampaignManager.ts`
- [ ] Move campaign logic
- [ ] Test progression

---

# Task 13 — Create SaveManager

## Goal

Centralize save/load functionality.

## Responsibilities

- Save
- Load
- Serialization
- Local storage

## Public API

```ts
saveGame()
loadGame()
saveCampaign()
loadCampaign()
```

## Subtasks

- [ ] Create `SaveManager.ts`
- [ ] Move serialization
- [ ] Test saves

---

# Phase 7 — Networking

---

# Task 14 — Create OnlineManager

## Goal

Manage multiplayer infrastructure.

## Responsibilities

- Lobby
- Matchmaking
- Polling
- Synchronization

## Public API

```ts
hostGame()
joinGame()
syncTurn()
pollServer()
```

## Subtasks

- [ ] Create `OnlineManager.ts`
- [ ] Move networking logic
- [ ] Test online mode

---

# Phase 8 — Shared Game State

---

# Task 15 — Create GameState

## Goal

Replace scattered scene variables with a shared state object.

## Example

```ts
interface GameState {
    board
    units
    currentPlayer
    selectedUnit
    turn
    scores
    campaign
    fog
}
```

Managers should receive:

```ts
constructor(
    scene: Phaser.Scene,
    state: GameState
)
```

## Rules

- Managers do not own state.
- Managers mutate shared state.
- Scene coordinates manager interactions.

---

# Phase 9 — Dependency Injection

---

# Task 16 — Remove Manager Coupling

## Goal

Pass dependencies explicitly.

Instead of

```ts
new AIManager()
```

use

```ts
new AIManager(
    boardManager,
    combatManager,
    unitManager,
    turnManager,
    state
)
```

## Rules

- No singleton managers.
- No circular imports.
- Constructor injection only.
- Depend on interfaces where practical.

---

# Phase 10 — Scene Cleanup

---

# Task 17 — Reduce HexConquestScene

## Goal

Convert `HexConquestScene` into an orchestrator.

It should only:

- Instantiate managers
- Register Phaser callbacks
- Coordinate managers
- Handle lifecycle methods

The scene should **not** contain business logic.

## Target Size

Current:

- ~2,000+ lines

Goal:

- 300–500 lines

---

# Recommended Execution Order

1. BoardManager
2. UnitManager
3. CombatManager
4. TurnManager
5. FogManager
6. AnimationManager
7. EffectsManager
8. SoundManager
9. UIManager
10. InputManager
11. AIManager
12. CampaignManager
13. SaveManager
14. OnlineManager
15. GameState
16. Dependency Injection
17. Final Scene Cleanup

---

# Definition of Done

Each task is complete only when:

- [ ] TypeScript compiles with zero new errors.
- [ ] Existing gameplay behavior is preserved.
- [ ] No regressions are introduced.
- [ ] No duplicated logic remains.
- [ ] Public APIs are documented.
- [ ] Manager responsibilities are clearly defined.
- [ ] The game launches and is manually tested.
- [ ] Changes are committed before starting the next task.