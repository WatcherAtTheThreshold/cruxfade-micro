# Cruxfade Micro - Technical Patterns & Decisions

> A seeded roguelike deck-building dungeon crawler with multi-phase boss encounters.

---

## Game Overview
- **Genre/Type:** Seeded roguelike deck-builder / dungeon crawler
- **Core Mechanics:**
  - 4x4 grid exploration with fog-of-war (hidden → discoverable → explored tiles)
  - Turn-based 1v1 card combat with stat rolls (ATK/MAG + d6)
  - Party recruitment system (max 4 members who contribute cards)
  - Multi-phase boss encounters unlocking at grid levels 6, 11, 16
  - Win: Defeat Void Empress (final boss) | Lose: All party members fall
- **Tech Stack:**
  - Vanilla JavaScript ES6 modules (no framework, no build step)
  - HTML5 semantic markup
  - CSS3 with custom properties for theming
  - JSON data files for all game content
  - Seeded PRNG (Linear Congruential Generator) for reproducible runs

## Architecture Patterns

### Module/File Structure
```
js/main.js    (332 lines)  - Bootstrap, game loop, data loading, global API
js/state.js   (3,292 lines) - Complete game state (G object) + all game logic
js/ui.js      (2,150 lines) - DOM rendering, event binding, overlays
js/rng.js     (68 lines)    - Seeded random number generator

index.html    (212 lines)  - Layout structure, quadrant grid
styles.css    (2,400 lines) - Comprehensive styling with CSS variables

data/enemies.json    - 20+ enemy definitions
data/bosses.json     - 3 bosses with multi-phase structures
data/cards.json      - 20+ card definitions with effects
data/items.json      - Consumables & equipment
data/allies.json     - Procedural ally generation by region
data/encounters.json - Grid-level encounter weights & pools
```

### Separation of Concerns
| Module | Responsibility |
|--------|----------------|
| main.js | Orchestration - loads data, initializes game, runs update loop |
| state.js | Single source of truth - G object + ~50 pure state mutation functions |
| ui.js | Presentation - DOM caching, render functions, event handlers |
| rng.js | Determinism - seeded random for reproducible runs |
| data/*.json | Content - all game entities defined declaratively |

### State Management Pattern
- **Pattern used:** Single global state object with controlled mutations
- **How state flows:**
  - All state lives in `G` object (state.js)
  - UI reads from `G`, calls exported functions to mutate
  - Every mutation triggers `renderAll()` for full re-render
  - No two-way binding - unidirectional flow
- **Key state variables:**
  - `G.board.tiles[]` - 16 tiles with type, discovered, explored, consumed
  - `G.party[]` - Array of party members (max 4)
  - `G.hand[]` / `G.deck[]` / `G.discard[]` - Card management
  - `G.combat` - Active combat state (enemy, hp, turn, modifiers)
  - `G.boss` - Boss encounter state (phases, progress)
  - `G.equipment` - Per-member equipment slots

## Design

### Core Game System
```javascript
// Pattern: Centralized state with pure mutation functions
export const G = {
    seed: 0,
    gridLevel: 1,
    board: { tiles: [], player: { r: 1, c: 0 } },
    party: [],
    hand: [],
    combat: { active: false, enemy: null, turn: 'player', ... },
    boss: { active: false, bossId: null, currentPhase: 0, ... },
    over: false,
    victory: false
};

// Controlled mutations via exports
export function movePlayer(newRow, newCol) { /* validates + updates G */ }
export function startCombat(enemyType) { /* sets up G.combat */ }
export function playCard(cardId) { /* executes effect, moves to discard */ }
```

**Key Design Decisions:**
- **Full re-render on state change**: Simple mental model, no diffing complexity
- **Seeded RNG everywhere**: URL `?seed=12345` reproduces identical runs
- **JSON-driven content**: All enemies/cards/items external, easy to tweak/extend
- **Two-click card selection**: Prevents accidental plays on touch devices

### Data-Driven Elements
All game content lives in JSON files, loaded at startup:

```javascript
// enemies.json pattern
{
  "goblin": { "name": "Goblin", "hp": 4, "atk": 2, "description": "..." }
}

// cards.json pattern - effects reference CARD_EFFECTS functions
{
  "shield-bash": {
    "name": "Shield Bash",
    "type": "attack",
    "effect": "shield-bash",  // Maps to CARD_EFFECTS['shield-bash']
    "description": "Deals damage and stuns"
  }
}

// bosses.json pattern - multi-phase encounters
{
  "shadow-lord": {
    "phases": [
      { "type": "fight", "enemies": ["shadow-lieutenant"] },
      { "type": "hazard", "difficulty": 15, "preferredStat": "mag" },
      { "type": "boss-fight" }
    ]
  }
}
```

### UI/Game Phase Management
Four-quadrant layout with context-sensitive encounter area:

```javascript
// ui.js: renderEncounterArea() determines what to show
Screens:
1. Character Selection (initial)
2. Exploration (moving on grid)
3. Encounter (varies by tile type):
   - Fight: Enemy card + Attack/Flee buttons
   - Hazard: Challenge description + Navigate button
   - Item: Preview + Take button
   - Ally: Description + Recruit button
   - Boss: Phase-based encounters
4. Combat Overlay (active 1v1)
5. Equipment Management (modal)
6. Victory/Defeat (end screens)

// All transitions via: renderAll() → conditionally renders sections
```

## Sound

### Audio Architecture
- **Music system:** Not implemented
- **SFX system:** Not implemented
- **Transitions:** N/A

### Audio Files/Formats
```
(No audio assets in current build)
```

## Browser Compatibility

- **Target browsers:** Modern only (ES6 modules, async/await required)
- **Module loading:** Native ES6 modules via `<script type="module">`
- **Responsive approach:** Transform scale from center origin
  ```css
  .wrap { transform: scale(0.85); }
  @media (min-width: 1500px) { .wrap { transform: scale(0.95); } }
  @media (max-width: 700px) { .wrap { transform: scale(0.65); } }
  ```
- **Mobile considerations:**
  - Touch-friendly button sizes (44px minimum)
  - Two-click card selection prevents accidents
  - Viewport meta tag present
  - Grid stacks to single column on narrow screens

---

## What Works Well
- **Data-driven content**: JSON files make adding enemies/cards/bosses trivial without touching code
- **Seeded RNG**: Reproducible runs enable debugging, sharing seeds, speedrunning potential
- **Clean module separation**: State/UI/RNG isolation makes changes predictable
- **Full re-render simplicity**: No stale state bugs, easy to reason about
- **Multi-phase boss system**: Creates dramatic pacing with variety (fights, hazards, choices)

## What We'd Do Differently
- **State.js is too large (3,292 lines)**: Should split into combat.js, party.js, board.js, boss.js
- **No persistence**: Add localStorage for save/resume functionality
- **No audio**: Sound effects would significantly improve game feel
- **Magic numbers scattered**: Combat formulas (damage = atk + d6 - 3) should be configurable
- **No tests**: Core game logic would benefit from unit tests

---

## Key Implementation Details

### Fog of War System
- **Approach:** Three tile states: hidden → discovered (shows "?") → explored (shows icon)
- **Why this way:** Simple boolean flags per tile, no complex visibility calculations
- **Gotchas/Lessons:** Must reveal adjacent tiles when moving (revealAdjacentTilesAsDiscoverable function)

```javascript
// state.js: Lines 327-354
function revealAdjacentTilesAsDiscoverable(centerRow, centerCol) {
    const directions = [
        { dr: -1, dc: 0 }, { dr: 1, dc: 0 },
        { dr: 0, dc: -1 }, { dr: 0, dc: 1 }
    ];
    directions.forEach(({ dr, dc }) => {
        const newRow = centerRow + dr;
        const newCol = centerCol + dc;
        if (inBounds(newRow, newCol)) {
            const tile = G.board.tiles[newRow * 4 + newCol];
            if (!tile.explored) tile.discovered = true;
        }
    });
}
```

### Combat System
- **Approach:** Turn-based with status effects (stun, defend, dodge, damage reduction)
- **Why this way:** Simple alternating turns, effects resolved immediately
- **Gotchas/Lessons:** Enemy turn must check ALL modifiers before dealing damage

```javascript
// state.js: playerAttack() Line 2557
const roll = rollDice(6);
const damage = Math.max(1, player.atk + roll - 3);
G.combat.enemyHp = Math.max(0, G.combat.enemyHp - damage);

// enemyAttack() checks: stunned? dodged? defending? damageReduction?
```

### Boss Encounter System
- **Approach:** Phase array with typed encounters (fight/hazard/boss-fight/party-choice)
- **Why this way:** Declarative phase definitions in JSON, code handles each type
- **Gotchas/Lessons:** Must track enemyIndex within fight phases for sequential minion battles

```javascript
// Boss phase types handled by switch:
case 'fight':     // Sequential minion battles
case 'hazard':    // D20 + stat vs difficulty
case 'boss-fight': // Final 1v1 with boss-final enemy
case 'party-choice': // Narrative decision (placeholder)
```

### Card Effect System
- **Approach:** Card IDs map to CARD_EFFECTS function dictionary
- **Why this way:** New effects just need a function + JSON entry
- **Gotchas/Lessons:** Ally cards have suffixed IDs that must be parsed

```javascript
// state.js: CARD_EFFECTS dictionary (Lines 2126-2318)
const CARD_EFFECTS = {
    'basic-strike': (card) => { /* damage = atk + d6 */ },
    'shield-bash': (card) => { /* damage + stun */ },
    'heal': (card) => { /* restore 4 HP */ },
    'dodge': (card) => { /* set dodgeNext flag */ },
    // ...
};
```

---

## Reusable Code Patterns

### Seeded RNG
```javascript
// rng.js - Linear Congruential Generator
class SeededRandom {
    constructor(seed = 0) {
        this.seed = seed;
        this.current = seed;
    }

    random() {
        this.current = (this.current * 1664525 + 1013904223) % 4294967296;
        return this.current / 4294967296;
    }

    randomInt(min, max) {
        return Math.floor(this.random() * (max - min + 1)) + min;
    }
}

// Initialize from URL seed: ?seed=12345
export function initRNG(seed) {
    rng = new SeededRandom(seed);
}
```

### Weighted Random Selection
```javascript
// Used for encounter types, enemy pools, ally selection
function getWeightedRandom(weights) {
    const entries = Object.entries(weights);
    const total = entries.reduce((sum, [_, w]) => sum + w, 0);
    let roll = randomInt(1, total);

    for (const [key, weight] of entries) {
        roll -= weight;
        if (roll <= 0) return key;
    }
    return entries[0][0];
}
```

### Two-Click Selection Pattern
```javascript
// ui.js: Prevents accidental actions
let selectedCardId = null;

function handleCardClick(cardId, cardElement) {
    if (selectedCardId === cardId) {
        // Second click: execute action
        playCard(cardId);
        selectedCardId = null;
    } else {
        // First click: highlight selection
        selectedCardId = cardId;
        showCardSelectionFeedback(cardElement);
    }
}
```

### CSS Scaling Pattern
```css
/* Responsive scaling from center - cleaner than media query breakpoints */
.wrap {
    transform-origin: center top;
    transform: scale(0.85);
}

@media (min-width: 1300px) { .wrap { transform: scale(0.90); } }
@media (min-width: 1500px) { .wrap { transform: scale(0.95); } }
@media (min-width: 1700px) { .wrap { transform: scale(1.0); } }
@media (min-width: 1920px) { .wrap { transform: scale(1.1); } }
@media (max-width: 900px)  { .wrap { transform: scale(0.75); } }
@media (max-width: 700px)  { .wrap { transform: scale(0.65); } }
```

---

## Performance Considerations

### What Mattered
- **Full re-render**: Acceptable for this scale (16 tiles, 4 party members, 5 cards)
- **JSON loading**: Async fetch at startup, no lazy loading needed
- **DOM caching**: ui.js caches element references to avoid repeated querySelector

### What Didn't Matter
- **Virtual DOM**: Overkill for this size - simple innerHTML replacement works fine
- **Code splitting**: Single-page app with <7KB JS total (gzipped estimate)
- **Image optimization**: Simple icons, no heavy assets

---

## Development Workflow Notes

### Build Process
- **Steps to run:** Open index.html in browser (no build required)
- **Dev server:** Any static file server (e.g., `python -m http.server`)
- **Deployment:** Copy files to any static host

### File Organization
```
cruxfade-micro/
├── index.html           # Entry point
├── styles.css           # All styling
├── js/
│   ├── main.js          # Bootstrap
│   ├── state.js         # Game logic
│   ├── ui.js            # Rendering
│   └── rng.js           # Seeded random
├── data/
│   ├── enemies.json
│   ├── bosses.json
│   ├── cards.json
│   ├── items.json
│   ├── allies.json
│   └── encounters.json
├── images/              # Game assets
└── docs/                # Documentation
```

### Debugging Tips
- **Inspect game state:** `window.CruxfadeMicro.G` in console
- **Force encounter:** Modify `G.board.tiles[index].type` directly
- **Test boss:** Set `G.gridLevel = 6` then trigger door encounter
- **Reproducible bugs:** Note the seed (`G.seed`) to replay exact scenario

---

## Quick Reference: Extending the Game

### Adding New Cards
1. Add entry to `data/cards.json`:
   ```json
   "fireball": {
     "name": "Fireball",
     "type": "attack",
     "effect": "fireball",
     "description": "Deals magic damage to enemy",
     "rarity": "rare"
   }
   ```
2. Add effect function to `CARD_EFFECTS` in state.js:
   ```javascript
   'fireball': (card) => {
       const damage = getPartyLeader().mag + rollDice(6);
       G.combat.enemyHp = Math.max(0, G.combat.enemyHp - damage);
       addLog(`Fireball deals ${damage} magic damage!`);
   }
   ```
3. Add card to an ally's card list in `allies.json` or starting deck

### Adding New Enemies
1. Add entry to `data/enemies.json`:
   ```json
   "fire-drake": {
     "name": "Fire Drake",
     "hp": 8,
     "atk": 4,
     "description": "A small dragon wreathed in flames"
   }
   ```
2. Add to appropriate enemy pool in `data/encounters.json`:
   ```json
   "grid-3": {
     "enemyPools": {
       "rare": ["fire-drake", ...]
     }
   }
   ```

### Adding New Boss
1. Add boss definition to `data/bosses.json` with phases array
2. Add boss-final enemy to `boss-enemies` section
3. Set `unlockLevel` to desired grid level (currently 6, 11, 16 used)

---

## Reference: Previous Reviews

| Game | Genre | Key Patterns | Link |
|------|-------|--------------|------|
| Shadows of the Deck | Deck-builder | Declarative effects, Phase-based state, ES6 modules | [shadows-of-the-deck-review.md](shadows-of-the-deck-review.md) |
| Cruxfade Micro | Roguelike deck-builder | Seeded RNG, Data-driven JSON, Multi-phase bosses | (this document) |
