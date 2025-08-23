# 📋 Cruxfade-Micro — Data Structure & Progression Plan

This plan outlines how to structure Cruxfade-Micro's data files for easy content iteration, balanced progression, and maintainable code separation.

---

## 1. Current Architecture Goals

**From structure.md:**
- Keep content as JSON in `/data/` so design can iterate without touching code
- `cards.js` maps `effectId` → function that applies effect to state
- Weighted encounter generation per grid level
- Reproducible runs via seeded RNG

**New Goal:**
- Support multiple difficulty modes and run variants through data configuration
- Clear progression from Grid 1 → Grid 2 → Grid 3 → Boss

---

## 2. Proposed Data Structure

```
/data/
  run-configs.json          # Different run types (normal, hard, daily, etc.)
  /encounters/
    grid-1.json             # Encounter weights & pools for first grid
    grid-2.json             # Encounter weights & pools for second grid  
    grid-3.json             # Encounter weights & pools for third grid
    bosses.json             # Multi-phase boss configurations
  /cards/
    starting.json           # Starting deck compositions
    skills.json             # All skill cards with effects
    equipment.json          # Equipment cards and stat modifiers
  /entities/
    enemies.json            # Enemy stats, abilities, loot tables
    allies.json             # Ally stats, deck contributions, join conditions
  /tables/
    loot.json              # Item drop tables by enemy type/grid level
    shops.json             # Safe room shop inventories by grid
```

---

## 3. Run Configuration System

### Example: `run-configs.json`
```json
{
  "normal": {
    "name": "Standard Run",
    "description": "Balanced 3-grid adventure",
    "startingDeck": "basic-explorer",
    "startingStats": { "hp": 10, "atk": 2, "mag": 1 },
    "gridConfigs": ["grid-1", "grid-2", "grid-3"],
    "bossSet": "standard",
    "allowedAllies": "all"
  },
  "hard": {
    "name": "Veteran Run", 
    "description": "Harder enemies, limited allies",
    "startingDeck": "basic-explorer",
    "startingStats": { "hp": 8, "atk": 2, "mag": 1 },
    "gridConfigs": ["grid-1-hard", "grid-2-hard", "grid-3-hard"],
    "bossSet": "veteran",
    "allowedAllies": ["warrior", "mage"],
    "modifiers": { "enemyHpBonus": 2, "lootReduction": 0.7 }
  }
}
```

---

## 4. Grid Encounter Tables

### Example: `encounters/grid-1.json`
```json
{
  "name": "First Grid - Tutorial Area",
  "safeRoomType": "healing-spring",
  "encounterWeights": {
    "fight": 3,
    "hazard": 2, 
    "item": 2,
    "ally": 1,
    "key": 1,
    "empty": 1
  },
  "guaranteedEncounters": {
    "key": 1,
    "door": 1
  },
  "fightPools": {
    "common": ["goblin", "dire-rat", "shadow-wisp"],
    "rare": ["orc-scout"]
  },
  "hazardPools": {
    "environmental": ["pit-trap", "poisonous-spores"],
    "magical": ["unstable-rune"]
  },
  "itemPools": {
    "equipment": ["leather-armor", "iron-sword", "focus-crystal"],
    "consumables": ["healing-potion", "energy-boost"]
  },
  "allyPools": {
    "available": ["warrior-recruit", "hedge-wizard"],
    "joinChance": 0.8
  }
}
```

---

## 5. Card & Equipment System

### Example: `cards/skills.json`
```json
{
  "power-strike": {
    "name": "Power Strike",
    "type": "attack",
    "rarity": "common",
    "tags": ["physical", "single-target"],
    "description": "Deal +2 damage on your next attack",
    "effectId": "modifyNextAttack",
    "effectData": { "damageBonus": 2 }
  },
  "shadow-step": {
    "name": "Shadow Step", 
    "type": "utility",
    "rarity": "rare",
    "tags": ["movement", "stealth"],
    "description": "Avoid the next hazard or enemy attack",
    "effectId": "grantAvoidance",
    "effectData": { "duration": 1 }
  }
}
```

### Example: `cards/equipment.json`
```json
{
  "iron-sword": {
    "name": "Iron Sword",
    "type": "weapon",
    "slot": "mainhand",
    "statModifiers": { "atk": 1 },
    "description": "+1 Attack",
    "rarity": "common",
    "sellValue": 2
  },
  "mage-robes": {
    "name": "Mage Robes",
    "type": "armor", 
    "slot": "body",
    "statModifiers": { "mag": 2, "hp": -1 },
    "description": "+2 Magic, -1 HP",
    "rarity": "uncommon", 
    "sellValue": 4
  }
}
```

---

## 6. Entity Definitions

### Example: `entities/enemies.json`
```json
{
  "goblin": {
    "name": "Goblin",
    "hp": 4,
    "atk": 2,
    "mag": 0,
    "traits": ["cowardly"],
    "description": "A small, quick creature that flees when wounded",
    "lootTable": "weak-enemy",
    "abilities": ["flee-at-low-hp"]
  },
  "orc-champion": {
    "name": "Orc Champion",
    "hp": 12, 
    "atk": 4,
    "mag": 1,
    "traits": ["tough", "leader"],
    "description": "A battle-hardened warrior with devastating attacks",
    "lootTable": "strong-enemy",
    "abilities": ["berserker-rage", "intimidate"]
  }
}
```

### Example: `entities/allies.json`
```json
{
  "warrior-recruit": {
    "name": "Warrior Recruit",
    "hp": 8,
    "atk": 3,
    "mag": 0,
    "tags": ["human", "warrior"],
    "description": "A young fighter eager to prove themselves",
    "deckContribution": ["shield-bash", "defensive-stance"],
    "joinConditions": { "minGridLevel": 1, "maxPartySize": 4 },
    "leavesOn": ["party-leader-death", "grid-3-entry"]
  }
}
```

---

## 7. Loot & Shop Tables

### Example: `tables/loot.json`
```json
{
  "weak-enemy": {
    "goldRange": [1, 3],
    "itemChance": 0.3,
    "itemPools": {
      "common": ["healing-potion", "rusty-dagger"],
      "rare": ["silver-coin"]
    }
  },
  "boss-loot": {
    "goldRange": [8, 12],
    "itemChance": 1.0,
    "guaranteedItems": ["boss-fragment"],
    "itemPools": {
      "rare": ["enchanted-weapon", "power-crystal"],
      "legendary": ["artifact-shard"]
    }
  }
}
```

### Example: `tables/shops.json`
```json
{
  "healing-spring": {
    "name": "Healing Spring",
    "services": ["full-heal", "remove-debuffs"],
    "shopInventory": {
      "equipment": ["basic-sword", "leather-armor"],
      "consumables": ["healing-potion", "antidote"],
      "skills": ["first-aid", "dodge-roll"]
    },
    "priceModifier": 1.0
  }
}
```

---

## 8. Boss Configuration

### Example: `encounters/bosses.json`
```json
{
  "shadow-lord": {
    "name": "The Shadow Lord",
    "phases": [
      {
        "name": "Summoning Phase",
        "type": "minion-encounter",
        "enemies": ["shadow-minion", "shadow-minion"],
        "description": "Defeat the summoned shadows"
      },
      {
        "name": "Weakened Form", 
        "type": "hazard",
        "hazardType": "reality-tear",
        "description": "Navigate the collapsing reality"
      },
      {
        "name": "Final Confrontation",
        "type": "boss-fight",
        "hp": 25,
        "atk": 6,
        "mag": 4,
        "abilities": ["shadow-blast", "teleport-strike", "darkness-aura"],
        "description": "Face the Shadow Lord at full power"
      }
    ],
    "victoryRewards": {
      "gold": 50,
      "items": ["shadow-crystal", "victory-token"]
    }
  }
}
```

---

## 9. Implementation Benefits

### Content Iteration
- **Balance tweaking**: Change encounter weights, enemy stats, loot rates without touching code
- **New run types**: Add seasonal events, challenge modes, or story variants
- **Rapid prototyping**: Test different progression curves or difficulty spikes

### Code Clarity
- **Separation of concerns**: Game logic vs. game content
- **Maintainability**: Card effects in code, card stats in data
- **Testing**: Easy to create test scenarios with known data sets

### Expansion Ready
- **New grids**: Add grid-4.json for extended runs
- **Campaign mode**: Chain multiple run-configs together
- **Mod support**: Players can edit JSON files for custom content

---

## 10. Migration Strategy

### Phase 1: Extract Current Hardcoded Values
1. Move existing enemy stats from `encounters.js` to `enemies.json`
2. Move card definitions from `cards.js` to `skills.json` and `equipment.json`
3. Create basic `grid-1.json` with current encounter weights

### Phase 2: Add Configuration Loading
1. Update `main.js` to load run config and pass to game engine
2. Modify generation functions to use loaded data instead of hardcoded values
3. Test that gameplay remains identical with data-driven approach

### Phase 3: Add Progression & Variety
1. Create `grid-2.json` and `grid-3.json` with escalating difficulty
2. Add boss configuration system
3. Implement run type selection (normal/hard modes)

---

## 11. File Loading Pattern

```javascript
// In main.js - load configuration
const runType = 'normal'; // or from URL/user selection
const config = await fetch(`/data/run-configs.json`).then(r => r.json());
const runConfig = config[runType];

// Load grid encounters
const gridConfig = await fetch(`/data/encounters/${runConfig.gridConfigs[0]}.json`).then(r => r.json());

// Pass to game engine
gameEngine.init(runConfig, gridConfig);
```

This keeps the same modular JS architecture from `structure.md` while adding the flexibility to support multiple difficulty modes and easy content iteration!