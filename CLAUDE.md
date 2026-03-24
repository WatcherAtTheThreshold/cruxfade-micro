# Cruxfade-Micro — Claude Code Guide

## What This Is

A roguelike deck-crawler with card-based combat on procedurally generated 4x4 grids. Turn-based exploration, fog of war, party management, multi-phase boss fights, and JSON-driven content. This repo is the **reference implementation** for proven patterns used by other projects (especially chronicles). Vanilla JS/HTML/CSS with ES6 modules, no build step, hosted on GitHub Pages.

---

## Tech Stack

- Vanilla JavaScript (ES6 modules via `import`/`export`)
- HTML/CSS (single page, CSS custom properties, CSS Grid layout)
- JSON data files for all game content
- Seeded PRNG (Linear Congruential Generator) for reproducible runs
- No framework, no build step
- GitHub Pages hosting

---

## File Structure

```
cruxfade-micro/
  index.html              — minimal entry, loads main.js as module
  styles.css              — all styling (2400 lines), CSS variables, responsive grid
  js/
    main.js               — bootstrap, data loading, game init, debug API
    state.js              — global state object G, all mutations, game logic (3292 lines)
    ui.js                 — DOM rendering, event handlers, overlay system (2150 lines)
    rng.js                — seeded LCG PRNG (copy-ready for other projects)
  data/
    enemies.json          — 16+ enemy types with stats and descriptions
    encounters.json       — grid-level encounter weights and enemy pools
    items.json            — consumables, equipment, loot tables
    bosses.json           — 3 multi-phase boss encounters + boss-specific enemies
    allies.json           — regional ally systems with procedural naming
    cards.json            — card database mapping to effect functions
  images/
    bosses/               — boss portraits
    enemies/              — enemy portraits
    icons/                — UI icons
    tiles/                — tile encounter icons
    cards/                — card UI backgrounds
  docs/
    structure.md          — architecture guide and patterns
    tech-dev-doc.md       — CSS framework, spacing, animations
    dev-roadmap.md        — 5-phase development plan
    dev-instruction.md    — collaboration guidelines
```

---

## Architecture

### State Management
- **Single global object `G`** holds all game state
- Pure functions mutate `G` in controlled ways
- No side effects until explicit `renderAll()` call
- State shape:
  - `seed` — RNG seed for reproducible runs
  - `gridLevel`, `keyFound` — progression tracking
  - `board` — tiles, player position, seen set
  - `party` — character array (leader always index 0)
  - `deck`, `discard`, `hand` — card system (5-card hard limit)
  - `equipment` — per-character equipment slots
  - `combat` — active flag, enemy, HP, turn, lastRoll
  - `boss` — bossId, currentPhase, phaseComplete, defeated
  - `log` — event message history
  - `over`, `victory` — end conditions

### Render Pipeline
`renderAll()` calls specialized functions in order:
`renderBoard()` → `renderPartyStatus()` → `renderPartyHand()` → `renderEncounterArea()` → `renderGameLog()`

### Event Flow
User action → state mutation function → `renderAll()` → DOM updated

### Data Loading
`main.js` fetches all JSON at startup via `setGameData()`. Hardcoded fallbacks if JSON missing.

---

## Game Systems

### Grid Exploration (4x4 Fog of War)
- Tiles: hidden → discovered ("?", adjacent to player) → explored (actual content visible)
- Tile types: start, fight, hazard, item, ally, key, door, empty, boss-encounter
- Movement: adjacent tiles only (4-directional)
- Player starts left edge, must find key to unlock door to next grid

### Combat (Turn-Based d20)
- Attacker rolls d20 + ATK vs defender roll
- Winner deals damage, loser takes damage
- `tile.combatEngaged` flag prevents leaving fight tiles without engaging
- Actions: Attack, Defend, Flee

### Party System
- Leader = first in array, directs combat
- Allies recruited from regional pools with procedural names
- Fallen members stay in party (marked dead, can't fight)
- If leader dies, next living member becomes leader
- All dead = game over

### Card System (5-Card Hard Limit)
- Start with 2 cards (Strike, Guard)
- Allies merge their cards into deck on recruitment
- Overflow prompts discard choice

### Boss System (Multi-Phase)
- 3 bosses at grids 6, 11, 16
- Each boss: 3-4 phases (minion fights → hazards → final duel)
- Boss defeat: full heal, stat boost, door opens

### Grid Progression
- Grids 1-5: Forest (easy) → Grid 6: Shadow Lord
- Grids 7-10: Mountain (medium) → Grid 11: Crystal Tyrant
- Grids 12-15: Void (hard) → Grid 16: Void Empress (final boss, victory)

---

## Reusable Patterns (Reference for Other Projects)

These patterns are proven and directly adaptable:

| Pattern | File | Description |
|---------|------|-------------|
| **Seeded PRNG** | `js/rng.js` | LCG implementation, seed from URL param, all randomness flows through it |
| **Single state object** | `js/state.js` | `G` object, pure mutation functions, explicit render trigger |
| **DOM caching** | `js/ui.js` | `DOM` object caches selectors at startup, avoids repeated queries |
| **Data-driven content** | `data/*.json` | All game content in JSON, code references by ID |
| **Fog of war** | `js/state.js` | Two-state visibility (discovered vs explored), adjacent-only revelation |
| **Overlay modals** | `js/ui.js` | Centralized `#overlay-system` div, CSS state class toggling |
| **Party as array** | `js/state.js` | Leader at index 0, fallen stay in array, simple leadership switching |
| **Log entries** | `js/state.js` | Append-only `G.log` array, emoji prefixes, auto-scroll render |

---

## Coding Conventions

- ES6 modules (`import`/`export`) loaded directly in browser
- camelCase functions: `movePlayer()`, `startCombat()`, `renderAll()`
- kebab-case IDs in JSON: `shadow-lord`, `iron-sword`, `forest-region`
- CSS custom properties in `:root` for all colors, spacing, sizing
- Component CSS classes: `.tile`, `.card`, `.party-member`, `.overlay`
- State CSS classes: `.player-tile`, `.discovered`, `.explored`, `.consumed`, `.fallen`
- CSS Grid for 4x4 board and 4-section layout with aspect-ratio locks

---

## Key Constraints

- `state.js` is large (3292 lines) — all game logic lives here; read before modifying
- `ui.js` is large (2150 lines) — all rendering and overlays; could benefit from splitting
- Combat engagement tracking (`tile.combatEngaged`) must be respected — player can't skip fights
- Boss phase transitions are sequential — don't allow skipping phases
- Seeded RNG must be used for ALL randomness — never use `Math.random()` directly
- JSON data is fetched at startup — changes to data structure must update both JSON and the code that reads it
- Adjacent tile discovery runs on every move — fog of war logic depends on correct adjacency checks
