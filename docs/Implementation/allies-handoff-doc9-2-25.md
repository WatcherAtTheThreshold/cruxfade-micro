# Cruxfade-Micro: JSON Allies Implementation Handoff

## Project Status: Campaign System Complete ✅

Successfully implemented a **full 15-level campaign** with multi-phase boss encounters:
- **Grid 1-5**: Forest region → Shadow Lord (Grid 6)  
- **Grid 7-10**: Mountain region → Crystal Tyrant (Grid 11)
- **Grid 12-15**: Void region → Void Empress (Grid 16)
- **Boss progression**: Multi-phase encounters with automatic door creation and campaign continuation
- **Victory conditions**: Only final boss ends game, others continue campaign with party healing/stat boosts

---

## Current Architecture: Data-Driven System

### File Structure
```
/data/
  enemies.json          - All enemy stats including boss minions
  encounters.json       - Grid-level encounter weights and enemy pools
  items.json           - Equipment and consumables with loot tables
  bosses.json          - Multi-phase boss encounters with rewards
  
/js/
  main.js              - Game initialization and victory conditions  
  state.js             - All game logic and state management
  ui.js                - DOM rendering and user interactions
  rng.js               - Seeded random number generation
  styles.css           - Responsive scaling CSS system
```

### Key Systems Working
- **Boss encounters**: Multi-phase system with automatic tile conversion to doors
- **Campaign progression**: Boss defeats heal party, boost stats, continue to next region
- **Combat system**: Turn-based with party leadership switching
- **Card system**: 5-card limit with two-click selection
- **Equipment system**: Separate from consumables with visual management
- **Fog of war**: Tile discovery and exploration mechanics

---

## Next Goal: JSON-Driven Allies

### Current Ally System (Hardcoded)
Located in `state.js` function `recruitRandomAlly()`:
- **Hardcoded ally templates** with fixed stats and card contributions
- **Manual card integration** when allies join
- **Hand overflow management** when ally cards exceed 5-card limit  
- **Party leadership switching** and ally dismissal systems

### Implementation Plan

#### Phase 1: Create Allies JSON Structure (30 mins)
Create `/data/allies.json` with:

```json
{
  "warrior-recruit": {
    "name": "Warrior Recruit",
    "hp": 12, "maxHp": 12, "atk": 4, "mag": 0,
    "tags": ["human", "warrior"],
    "description": "A young fighter eager to prove themselves",
    "rarity": "common",
    "region": "forest",
    "cards": [
      {
        "id": "shield-bash",
        "name": "Shield Bash", 
        "type": "attack",
        "description": "+2 damage and stun enemy for 1 turn"
      },
      {
        "id": "defensive-stance",
        "name": "Defensive Stance",
        "type": "defense", 
        "description": "Reduce incoming damage by half"
      }
    ],
    "joinConditions": {
      "minGridLevel": 1,
      "maxPartySize": 4,
      "regions": ["forest", "mountain"]
    }
  }
}
```

#### Phase 2: Data Loading Integration (20 mins)
- Add allies.json to data loading system in `main.js`
- Update `setGameData()` in `state.js` to handle ally data
- Add fallback for missing ally data

#### Phase 3: Replace Hardcoded Logic (45 mins)
Replace `recruitRandomAlly()` function in `state.js`:
- **Region-based ally selection** using current grid data
- **Rarity weighting system** (common/uncommon/rare allies)
- **Condition checking** (grid level, party size, region matching)
- **Card generation** from ally data instead of hardcoded sets

#### Phase 4: Enhanced Ally Features (30 mins)
- **Region-specific allies** (mountain dwarves, void cultists, etc.)
- **Ally progression** based on grid level unlocks
- **Improved ally descriptions** and flavor text
- **Ally dismissal** with confirmation dialogs

### Technical Considerations

#### Data Access Pattern
Use existing pattern from enemy/boss systems:
```javascript
if (!GAME_DATA.allies) {
    // Fallback to hardcoded system
    return generateHardcodedAlly();
}

const regionAllies = filterAlliesByRegion(currentRegion);
const availableAllies = filterByConditions(regionAllies, G);
```

#### Card System Integration
Existing overflow management works well:
- Ally cards trigger overflow selection when hand exceeds 5 cards
- Players choose which cards to discard
- System handles ally removal (removes their cards automatically)

#### Regional Theming Opportunities
- **Forest**: Scouts, rangers, herbalists
- **Mountain**: Dwarven fighters, crystal mages, miners  
- **Void**: Fallen heroes, void cultists, desperate survivors

---

## Current Codebase State

### Known Working Systems
- **Campaign progression**: All 16 grids + 3 bosses tested and working
- **Boss encounters**: Multi-phase system with proper tile conversion
- **Combat flow**: Party leadership switching, equipment management
- **Data loading**: JSON system handles missing files gracefully
- **Responsive scaling**: CSS transform system works across devices

### Key Functions to Understand
- **`recruitRandomAlly()`** (state.js ~line 1200): Current hardcoded ally system
- **`getAllyCards()`** (state.js ~line 1150): Maps ally types to card sets
- **`removeAlly()`** (state.js ~line 1300): Handles ally dismissal and card removal
- **`loadGameData()`** (main.js ~line 100): JSON loading system with error handling

### Recent Fixes Applied
- **Boss tile conversion**: `defeatBoss()` now finds boss tiles specifically vs player position
- **Combat tile management**: Boss fights don't consume tiles until completion
- **Victory conditions**: Updated from Grid 6 to Grid 16 for full campaign
- **Boss enemy data**: Added crystal-guardian, void-spawn, void-wraith to enemies.json

---

## Implementation Priority

1. **Create allies.json** with 8-10 diverse allies across regions
2. **Test data loading** integration with existing system
3. **Replace recruitment function** with data-driven approach
4. **Add region-based filtering** for thematic consistency
5. **Enhance with rarity/progression** systems

### Success Metrics
- ✅ Ally recruitment uses JSON data instead of hardcoded templates
- ✅ Region-appropriate allies appear in different areas
- ✅ Card overflow system works with data-driven ally cards
- ✅ Ally dismissal properly removes JSON-defined cards
- ✅ No hardcoded ally logic remains in state.js

---

## Architecture Benefits

The current JSON-driven foundation makes ally implementation straightforward:
- **Consistent data loading pattern** established
- **Error handling** for missing files already works
- **Card integration system** already handles dynamic card sets
- **Regional encounter system** ready for ally filtering

The modular architecture means ally implementation won't require changes to combat, equipment, or boss systems.

---

## Next Session Ready

All boss/campaign debugging complete. Clean foundation ready for JSON allies implementation with clear technical plan and existing patterns to follow.