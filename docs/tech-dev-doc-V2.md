# Cruxfade-Micro: Technical Development Reference

Technical patterns and implementation guidance for the current Cruxfade-Micro campaign system.

---

## Current Game Architecture

### Campaign Structure
**15-Level Campaign with Regional Progression:**
- **Grids 1-5**: Forest Region → Shadow Lord Boss (Grid 6)
- **Grids 7-10**: Mountain Region → Crystal Tyrant Boss (Grid 11) 
- **Grids 12-15**: Void Region → Void Empress Boss (Grid 16)
- **Victory**: Only final boss ends game, others continue campaign

### Core Systems Implemented
- **Multi-phase Boss Encounters** with minions, hazards, and final battles
- **Fog of War System** with tile discovery and exploration mechanics
- **JSON-Driven Content** for enemies, encounters, items, and bosses
- **Equipment System** separate from consumables with visual management
- **5-Card Hand Limit** with overflow selection and two-click card system
- **Party Leadership** with dynamic switching and ally management
- **Seeded RNG** for reproducible runs with shareable seeds

---

## Layout Architecture

### 4-Section Layout Structure (Unchanged)
```
┌─────────────────┬─────────────────┐
│  EXPLORATION    │   PARTY/UI      │
│     GRID        │    STATUS       │
│    (4x4)        │   (persistent)  │
├─────────────────┼─────────────────┤
│   PARTY CARDS   │  ENCOUNTERS     │
│  (overlapped    │  (boss phases,  │
│   leadership)   │  combat, items) │
└─────────────────┴─────────────────┘
```

### Target Aspect Ratio
- **3:2 or 5:3 ratio** optimized for horizontal mobile orientation
- **Fixed container** with responsive scaling: `width: min(1200px, 94vw)`
- **4x4 grid system** with fog of war discovery mechanics

---

## Data Architecture

### JSON-Driven Content System
```
/data/
  enemies.json     - Enemy stats including boss minions
  encounters.json  - Grid-level weights and regional enemy pools  
  items.json       - Equipment/consumables with loot tables
  bosses.json      - Multi-phase boss encounters with rewards
```

### Data Loading Pattern
```javascript
// In main.js
async function loadGameData() {
    const enemies = await fetch('./data/enemies.json').then(r => r.json());
    const encounters = await fetch('./data/encounters.json').then(r => r.json());
    const items = await fetch('./data/items.json').then(r => r.json());
    const bosses = await fetch('./data/bosses.json').then(r => r.json());
    
    return { enemies, encounters, items, bosses };
}

// In state.js
let GAME_DATA = { enemies: {}, encounters: null, items: null, bosses: null };
export function setGameData(gameData) {
    GAME_DATA = gameData;
}
```

---

## Game State Management

### Single Source of Truth Pattern
```javascript
// state.js - Global game state
export const G = {
    seed: 0,
    gridLevel: 1,
    board: {
        tiles: [],           // 16 tiles for 4x4 grid
        seen: new Set(),     // Fog of war tracking
        player: { r: 1, c: 0 }  // Left edge start position
    },
    party: [/* leader first */],
    deck: [], hand: [], discard: [],
    equipment: { /* memberId: [items] */ },
    boss: {
        active: false, bossId: null, currentPhase: 0,
        phaseComplete: false, defeated: false, enemyIndex: 0
    },
    combat: { active: false, /* combat state */ },
    keyFound: false, over: false, victory: false
};
```

### State Mutation Pattern
```javascript
// Pure functions for controlled state changes
export function movePlayer(newRow, newCol) { /* ... */ }
export function damagePartyMember(memberId, damage) { /* ... */ }
export function addPartyMember(memberData) { /* ... */ }
```

---

## Fog of War System

### Tile State Management
```javascript
// Each tile has discovery/exploration state
{
    type: 'fight',           // Actual encounter type
    row: 1, col: 1,         // Grid position
    discovered: true,       // Player can see "?" icon
    explored: false,        // Player sees actual content  
    consumed: false,        // Encounter completed
    combatEngaged: false    // Combat interaction tracking
}
```

### Discovery Mechanics
- **Hidden**: Player doesn't know tile exists
- **Discovered**: Shows "?" icon, can move to it  
- **Explored**: Shows actual encounter type and content
- **Adjacent Revelation**: Moving to a tile reveals adjacent tiles as discoverable

---

## Boss Encounter System

### Multi-Phase Structure
```javascript
// bosses.json structure
"shadow-lord": {
    "unlockLevel": 6,
    "phases": [
        {
            "type": "fight",
            "enemies": ["shadow-wisp", "shadow-wisp", "goblin"],
            "sequentialFights": true
        },
        {
            "type": "hazard", 
            "difficulty": 15,
            "preferredStat": "mag"
        },
        {
            "type": "boss-fight",
            "enemy": "shadow-lord-final"
        }
    ]
}
```

### Boss State Flow
1. **Grid Generation**: `shouldTriggerBoss()` checks unlock levels
2. **Phase Progression**: `startBossPhase()` → `completeBossPhase()` → `defeatBoss()`
3. **Campaign Continuation**: Boss tile converts to door, party heals/upgrades
4. **Victory Handling**: Only final boss (`gameComplete: true`) ends game

---

## Combat System

### Turn-Based Combat Flow
```javascript
// Combat state tracking
G.combat = {
    active: true,
    enemy: { /* enemy data */ },
    playerHp: 25, enemyHp: 12,
    turn: 'player',  // 'player' or 'enemy'
    bossPhase: phase  // Boss-specific data if applicable
};
```

### Combat Actions
- **Player Attack**: `playerAttack()` → damage calculation → turn switch
- **Enemy Attack**: `enemyAttack()` → damage → party leadership switching if leader falls
- **Card Effects**: Enhanced combat through card system integration
- **Flee System**: Dice-based escape with consequences

---

## Card System Architecture

### 5-Card Hand Limit with Overflow
```javascript
const MAX_HAND_SIZE = 5;

export function addCardToHand(card) {
    if (G.hand.length < MAX_HAND_SIZE) {
        G.hand.push(card);
        return { success: true, overflow: null };
    }
    return { success: false, overflow: card };
}
```

### Two-Click Card Selection
- **First Click**: Visual selection with feedback
- **Second Click**: Execute card effect
- **Click Away**: Deselects card without using

### Card Effect System
```javascript
const CARD_EFFECTS = {
    'basic-strike': (card) => { /* enhanced attack */ },
    'shield-bash': (card) => { /* damage + stun */ },
    'track': (card) => { /* reveal fog of war */ }
};
```

---

## Equipment vs Consumables

### Separate Item Systems
```javascript
// items.json structure
{
    "consumables": {
        "health-potion": { "stat": "hp", "boost": 8 }
    },
    "equipment": {
        "iron-sword": { 
            "slot": "weapon", 
            "statBonus": { "atk": 20 }
        }
    }
}
```

### Equipment Management
- **Slots**: weapon, armor, accessory per party member
- **Visual Management**: Click equipment slots to manage gear
- **Stat Integration**: Equipment modifies base stats dynamically
- **Party Member Equipment**: Each ally has independent equipment slots

---

## Regional Encounter System

### Grid-Level Configuration
```javascript
// encounters.json pattern
"grid-7": {
    "name": "Mountain Pass",
    "region": "mountain", 
    "encounterWeights": {
        "fight": 4, "hazard": 4, "item": 2, "ally": 1
    },
    "enemyPools": {
        "common": ["orc-champion", "goblin"],
        "rare": ["orc-champion"] 
    }
}
```

### Difficulty Scaling
- **Grid 1-5**: Tutorial → Forest enemies → Shadow Lord
- **Grid 7-10**: Mountain region → Crystal Tyrant  
- **Grid 12-15**: Void region → Void Empress
- **Boss Levels**: 6, 11, 16 trigger multi-phase encounters

---

## Technical Implementation Notes

### Module Architecture
- **main.js**: Initialization, data loading, game loop, victory conditions
- **state.js**: All game logic, state management, boss system
- **ui.js**: DOM manipulation, event handling, overlay management  
- **rng.js**: Seeded random number generation for reproducible runs

### Error Handling
- **Graceful Degradation**: Missing JSON files use fallback systems
- **Data Validation**: Enemy types validated against loaded data
- **Combat Safety**: Extensive error handling in boss encounter system

### Performance Considerations
- **DOM Caching**: UI elements cached on initialization
- **Event Delegation**: Single event handler for encounter actions
- **State Synchronization**: `updateGame()` renders all UI after state changes

---

## Key Technical Patterns

### Boss Encounter Tile Management
```javascript
// Boss defeat converts boss tile to door
const bossTile = G.board.tiles.find(tile => tile.type === 'boss-encounter');
if (bossTile) {
    bossTile.type = 'door';
    bossTile.consumed = false;
    G.keyFound = true;
}
```

### Campaign Progression Logic  
```javascript
// Victory only on final boss
if (bossData.victoryRewards.gameComplete) {
    G.victory = true;
    G.over = true;
} else {
    // Heal party, reset boss state, continue campaign
}
```

### Fog of War Revelation
```javascript
function revealAdjacentTilesAsDiscoverable(centerRow, centerCol) {
    // Mark adjacent tiles as discovered (show "?")
    // Player can move to discovered tiles to explore them
}
```

---

## Development Workflow

### Content Addition Pattern
1. **Add to JSON files** (enemies, encounters, items, bosses)
2. **Test data loading** with graceful error handling
3. **Verify game logic** integration with new content
4. **No code changes needed** for most content additions

### Testing Approach
- **Console Commands**: Quick access to any grid level or boss encounter  
- **Seed System**: Reproducible runs for testing specific scenarios
- **Debug Logging**: Comprehensive logging for boss encounters and combat

The current architecture supports easy content expansion through JSON files while maintaining clean separation between game logic and content data.