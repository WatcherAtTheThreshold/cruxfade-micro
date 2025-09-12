# 🎯 Phase 1 Implementation Guide - JSON Data System

**Goal:** Transform hardcoded game data into a flexible JSON-driven system  
**Estimated Time:** 4 hours  
**Files Created:** 3 JSON files in `/data/` folder  
**Files Modified:** `main.js`, `state.js`

---

## 📁 **STEP 0: PREP WORK** (5 mins)

### Create Data Folder Structure
```
cruxfade-micro/
  /data/
    enemies.json      ← Create this
    encounters.json   ← Create this  
    items.json        ← Create this
  /js/
    main.js          ← Modify this
    state.js         ← Modify this
```

### Backup Reminder
- **Back up your current working files!** 
- Test that everything works before starting

---

## ⚔️ **STEP 1: CREATE ENEMIES.JSON** (15 mins)

### Create `/data/enemies.json`
```json
{
  "goblin": {
    "name": "Goblin",
    "hp": 4,
    "atk": 2,
    "description": "A small, vicious creature"
  },
  "orc": {
    "name": "Orc Warrior", 
    "hp": 8,
    "atk": 3,
    "description": "A battle-hardened brute"
  },
  "shadow-wisp": {
    "name": "Shadow Wisp",
    "hp": 3,
    "atk": 2,
    "description": "A dark spirit that phases in and out"
  },
  "orc-champion": {
    "name": "Orc Champion",
    "hp": 12,
    "atk": 4,
    "description": "A battle-hardened warrior with devastating attacks"
  }
}
```

### ✅ **Checkpoint:** File created and saved

---

## 🔧 **STEP 2: ADD DATA LOADER TO MAIN.JS** (30 mins)

### Add to top of main.js (after imports):
```javascript
// ================================================================
// DATA LOADING SYSTEM
// ================================================================

/**
 * Load all game data from JSON files
 */
async function loadGameData() {
    try {
        const [enemiesResponse, encountersResponse, itemsResponse] = await Promise.all([
            fetch('/data/enemies.json'),
            fetch('/data/encounters.json').catch(() => null), // Optional for now
            fetch('/data/items.json').catch(() => null)       // Optional for now
        ]);
        
        const gameData = {
            enemies: await enemiesResponse.json(),
            encounters: encountersResponse ? await encountersResponse.json() : null,
            items: itemsResponse ? await itemsResponse.json() : null
        };
        
        console.log('🎮 Game data loaded:', gameData);
        return gameData;
        
    } catch (error) {
        console.error('❌ Failed to load game data:', error);
        throw error;
    }
}
```

### Modify the `init()` function:
```javascript
/**
 * Initialize the entire game when DOM is loaded
 */
async function init() {
    console.log('🎮 Cruxfade-Micro starting up...');
    
    try {
        // Load game data first
        const gameData = await loadGameData();
        
        // Pass data to state system
        setGameData(gameData);
        
        // Initialize game state
        initializeGame();
        
        // Set up UI event handlers and pass updateGame as callback
        bindEventHandlers(updateGame);
        
        // Initial render of all game elements
        renderAll();
        
        // Add welcome message
        addLogEntry('Welcome to the grid. Find the key to proceed...');
        
        console.log('✅ Game initialized successfully');
        console.log('🎯 Current state:', G);
        
    } catch (error) {
        console.error('🚨 Game initialization failed:', error);
        document.body.innerHTML = '<h1>Failed to load game data. Check console for details.</h1>';
    }
}
```

### ✅ **Checkpoint:** main.js modified, no errors in console

---

## 📊 **STEP 3: UPDATE STATE.JS FOR ENEMY DATA** (20 mins)

### Add to top of state.js (after imports):
```javascript
// ================================================================
// GAME DATA STORAGE
// ================================================================

/**
 * Loaded game data from JSON files
 */
let GAME_DATA = {
    enemies: {},
    encounters: null,
    items: null
};

/**
 * Set the loaded game data
 */
export function setGameData(gameData) {
    GAME_DATA = gameData;
    console.log('📊 Game data set in state:', GAME_DATA);
}
```

### Replace the existing hardcoded ENEMIES object:
```javascript
// ================================================================
// COMBAT SYSTEM FUNCTIONS
// ================================================================

// Remove this old code:
// const ENEMIES = {
//     goblin: { ... },
//     orc: { ... }
// };
```

### Update the `startCombat()` function:
```javascript
/**
 * Start combat with a specific enemy type
 */
export function startCombat(enemyType = 'goblin') {
    const enemyTemplate = GAME_DATA.enemies[enemyType];
    if (!enemyTemplate) {
        console.error('Unknown enemy type:', enemyType);
        console.error('Available enemies:', Object.keys(GAME_DATA.enemies));
        return false;
    }
    
    const player = getPartyLeader();
    if (!player) {
        console.error('No party leader for combat');
        return false;
    }
    
    G.combat.active = true;
    G.combat.enemy = { ...enemyTemplate }; // Copy enemy data
    G.combat.playerHp = player.hp;
    G.combat.enemyHp = enemyTemplate.hp;
    G.combat.turn = 'player';
    G.combat.lastRoll = null;
    
    addLogEntry(`⚔️ Combat started with ${enemyTemplate.name}!`);
    return true;
}
```

### ✅ **Checkpoint:** Test combat with goblin - should work exactly the same!

---

## 🎲 **STEP 4: CREATE ENCOUNTERS.JSON** (45 mins)

### Create `/data/encounters.json`
```json
{
  "grid-1": {
    "name": "Tutorial Grid",
    "encounterWeights": {
      "fight": 3,
      "hazard": 2, 
      "item": 2,
      "ally": 1,
      "empty": 1
    },
    "enemyPools": {
      "common": ["goblin", "shadow-wisp"],
      "rare": ["orc"]
    }
  },
  "grid-2": {
    "name": "Deeper Caves", 
    "encounterWeights": {
      "fight": 4,
      "hazard": 2,
      "item": 2,
      "ally": 1,
      "empty": 1
    },
    "enemyPools": {
      "common": ["goblin", "orc"],
      "rare": ["orc-champion"]
    }
  },
  "grid-3": {
    "name": "Final Depths",
    "encounterWeights": {
      "fight": 5,
      "hazard": 3,
      "item": 1,
      "ally": 1,
      "empty": 0
    },
    "enemyPools": {
      "common": ["orc", "orc-champion"],
      "rare": ["orc-champion"]
    }
  }
}
```

### Update state.js to use encounter data:
```javascript
/**
 * Get a random encounter type based on current grid level
 */
function getRandomEncounterType() {
    // If no encounter data loaded, use defaults
    if (!GAME_DATA.encounters) {
        const encounters = ['fight', 'hazard', 'item', 'ally', 'empty'];
        const weights = [3, 2, 2, 1, 1];
        return getWeightedRandom(encounters, weights);
    }
    
    // Use data-driven encounters
    const gridKey = `grid-${G.gridLevel}`;
    const gridData = GAME_DATA.encounters[gridKey] || GAME_DATA.encounters['grid-1'];
    const weights = gridData.encounterWeights;
    
    const encounters = Object.keys(weights);
    const weightValues = Object.values(weights);
    
    return getWeightedRandom(encounters, weightValues);
}

/**
 * Utility function for weighted random selection
 */
function getWeightedRandom(items, weights) {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < items.length; i++) {
        if (random < weights[i]) {
            return items[i];
        }
        random -= weights[i];
    }
    
    return items[0]; // fallback
}

/**
 * Get a random enemy type based on current grid
 */
export function getRandomEnemyType() {
    if (!GAME_DATA.encounters) {
        return 'goblin'; // fallback
    }
    
    const gridKey = `grid-${G.gridLevel}`;
    const gridData = GAME_DATA.encounters[gridKey] || GAME_DATA.encounters['grid-1'];
    const enemyPools = gridData.enemyPools;
    
    // 80% chance common, 20% chance rare
    const useRare = Math.random() < 0.2;
    const pool = useRare ? enemyPools.rare : enemyPools.common;
    
    return pool[Math.floor(Math.random() * pool.length)];
}
```

### Update ui.js to use random enemy types:
In `renderFightEncounter()`, replace the hardcoded 'goblin':
```javascript
case 'start-combat':
    console.log('⚔️ Starting combat...');
    const enemyType = getRandomEnemyType(); // Import this function
    startCombat(enemyType);
    _updateGameCallback();
    break;
```

### ✅ **Checkpoint:** Test encounters on different grid levels

---

## 📦 **STEP 5: CREATE ITEMS.JSON** (30 mins)

### Create `/data/items.json`
```json
{
  "consumables": {
    "health-potion": {
      "name": "Health Potion",
      "stat": "hp",
      "boost": 3,
      "maxBoost": 2,
      "rarity": "common"
    },
    "healing-herbs": {
      "name": "Healing Herbs",
      "stat": "hp", 
      "boost": 5,
      "maxBoost": 3,
      "rarity": "common"
    }
  },
  "equipment": {
    "strength-elixir": {
      "name": "Strength Elixir",
      "stat": "atk",
      "boost": 1,
      "rarity": "common"
    },
    "magic-crystal": {
      "name": "Magic Crystal", 
      "stat": "mag",
      "boost": 1,
      "rarity": "common"
    },
    "iron-sword": {
      "name": "Iron Sword",
      "stat": "atk",
      "boost": 2,
      "rarity": "uncommon"
    }
  },
  "lootTables": {
    "basic": {
      "consumables": 0.6,
      "equipment": 0.4
    },
    "treasure": {
      "consumables": 0.3,
      "equipment": 0.7
    }
  }
}
```

### Update `giveRandomItem()` in state.js:
```javascript
/**
 * Give the player a random stat boost item
 */
export function giveRandomItem() {
    const player = getPartyLeader();
    if (!player) return false;
    
    if (!GAME_DATA.items) {
        // Fallback to old hardcoded system
        const items = [
            { name: 'Health Potion', stat: 'hp', boost: 3, maxBoost: 2 },
            { name: 'Strength Elixir', stat: 'atk', boost: 1 },
            { name: 'Magic Crystal', stat: 'mag', boost: 1 }
        ];
        const item = items[Math.floor(Math.random() * items.length)];
        applyItemToPlayer(player, item);
        return item;
    }
    
    // Use data-driven items
    const lootTable = GAME_DATA.items.lootTables.basic;
    const useConsumable = Math.random() < lootTable.consumables;
    
    const itemPool = useConsumable ? 
        GAME_DATA.items.consumables : 
        GAME_DATA.items.equipment;
        
    const itemKeys = Object.keys(itemPool);
    const itemKey = itemKeys[Math.floor(Math.random() * itemKeys.length)];
    const item = itemPool[itemKey];
    
    applyItemToPlayer(player, item);
    consumeCurrentTile();
    return item;
}

/**
 * Apply item effects to player
 */
function applyItemToPlayer(player, item) {
    if (item.stat === 'hp') {
        const healAmount = Math.min(item.boost, player.maxHp - player.hp);
        player.hp += healAmount;
        if (item.maxBoost) {
            player.maxHp += item.maxBoost;
            player.hp += item.maxBoost;
        }
        addLogEntry(`📦 Found ${item.name}! Healed ${healAmount + (item.maxBoost || 0)} HP! (${player.hp}/${player.maxHp} HP)`);
    } else {
        player[item.stat] += item.boost;
        addLogEntry(`📦 Found ${item.name}! +${item.boost} ${item.stat.toUpperCase()}! (${item.stat.toUpperCase()}: ${player[item.stat]})`);
    }
}
```

### ✅ **Checkpoint:** Test item collection

---

## 🎲 **STEP 6: IMPLEMENT SEEDED RNG** (45 mins)

### Create `/js/rng.js`
```javascript
// ================================================================
// SEEDED RANDOM NUMBER GENERATOR
// Ensures reproducible runs when using same seed
// ================================================================

/**
 * Simple seeded PRNG using LCG algorithm
 */
class SeededRandom {
    constructor(seed = 0) {
        this.seed = seed;
        this.current = seed;
    }
    
    /**
     * Generate next random number (0 to 1)
     */
    random() {
        // Linear Congruential Generator
        this.current = (this.current * 1664525 + 1013904223) % 4294967296;
        return this.current / 4294967296;
    }
    
    /**
     * Generate random integer between min and max (inclusive)
     */
    randomInt(min, max) {
        return Math.floor(this.random() * (max - min + 1)) + min;
    }
    
    /**
     * Pick random element from array
     */
    pickRandom(array) {
        return array[this.randomInt(0, array.length - 1)];
    }
}

// Global RNG instance
let rng = new SeededRandom();

/**
 * Initialize RNG with seed
 */
export function initRNG(seed) {
    rng = new SeededRandom(seed);
    console.log('🎲 RNG initialized with seed:', seed);
}

/**
 * Get random number (0 to 1)
 */
export function random() {
    return rng.random();
}

/**
 * Get random integer
 */
export function randomInt(min, max) {
    return rng.randomInt(min, max);
}

/**
 * Pick random from array
 */
export function pickRandom(array) {
    return rng.pickRandom(array);
}
```

### Update main.js to import and use RNG:
```javascript
import { initRNG } from './rng.js';

// In the init() function, after loading data:
async function init() {
    // ... existing code ...
    
    // Initialize RNG with seed
    const seed = G.seed || generateSeed();
    G.seed = seed;
    initRNG(seed);
    
    // ... rest of init ...
}
```

### Replace Math.random() calls in state.js:
```javascript
import { random, randomInt, pickRandom } from './rng.js';

// Replace Math.random() with random()
// Replace Math.floor(Math.random() * n) with randomInt(0, n-1)
// etc.
```

### ✅ **Checkpoint:** Test that same seed gives same results

---

## 🧪 **TESTING CHECKLIST**

After each major step:

- [ ] **Game loads without console errors**
- [ ] **Combat works with all enemy types** 
- [ ] **Items still boost stats correctly**
- [ ] **Encounters generate on all grid levels**
- [ ] **Same seed produces same encounters**
- [ ] **All existing functionality still works**

---

## 🚨 **TROUBLESHOOTING**

### Common Issues:

**"Failed to load JSON"**
- Check file paths are correct
- Ensure JSON syntax is valid (use JSONLint.com)
- Check browser network tab for 404 errors

**"Enemy type not found"**  
- Console.log available enemies in startCombat()
- Check spelling in enemy pool references

**"Random encounters broken"**
- Add fallbacks for missing encounter data
- Test with and without encounter.json loaded

**"Can't call setGameData"**
- Make sure export/import statements are correct
- Check function is defined before calling

---

## 🎉 **SUCCESS CRITERIA**

You'll know Phase 1 is complete when:

✅ All enemy data comes from enemies.json  
✅ Encounter weights differ between grid levels  
✅ Items are generated from items.json  
✅ Same seed produces identical runs  
✅ No hardcoded game content in JavaScript files  
✅ Easy to add new enemies by editing JSON only  

**Total estimated time: ~4 hours**

Time to make your game **data-driven**! 🚀