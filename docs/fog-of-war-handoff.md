# Cruxfade-Micro: Fog of War Implementation Handoff

## Project Overview
Tactical roguelike card game with 4x4 grid exploration, party management, and boss encounters. The game uses a modular architecture with separate state management, UI rendering, and data-driven content.

## Current Game State (Working Features)

### Core Systems Implemented
- **Combat System**: Turn-based combat with leadership switching when party members fall
- **Party Management**: Multi-member parties with equipment slots and dismissal system
- **Card System**: 5-card hand limit with two-click selection (pull forward → use)
- **Tile Completion Requirements**: Must complete encounters before moving to adjacent tiles
- **Boss Encounters**: Multi-phase boss fights with proper party survival mechanics
- **Equipment System**: Separate from consumables, with visual management overlay
- **Responsive Scaling**: CSS transform-based scaling for cross-device compatibility

### Visual Systems
- Compact overlapping party cards with leadership indicators
- Fallen party member visual states (greyed out, "FALLEN" marker)
- Responsive scaling using `#game` wrapper with transform scaling
- Event log with highlighted current entry

### Data Architecture
- JSON-driven enemies, encounters, items, and bosses
- Seeded RNG for reproducible runs
- Modular file structure separating logic from content

## Primary Implementation Goal: Fog of War System

### Requirements
1. **Hide undiscovered tiles** - Dark or placeholder appearance for unexplored areas
2. **Revelation mechanics** - Reveal tiles when player moves adjacent or steps on them
3. **Visual tile states**:
   - Hidden/undiscovered
   - Revealed but unexplored  
   - Current tile (glowing/highlighted)
   - Consumed/completed tiles
4. **Balance consideration**: Reveal tile types immediately or keep generic until entered

## Current Architecture

### File Structure
- `main.js`: Game initialization, update loop, game over logic
- `state.js`: All game state and logic functions
- `ui.js`: DOM rendering and user interactions  
- `styles.css`: Visual styling with CSS custom properties
- `rng.js`: Seeded random number generation
- `/data/`: JSON files for enemies, encounters, items, bosses

### Key State Objects
```js
G.board = {
    tiles: [],           // Array of 16 tile objects (4x4 grid)
    seen: new Set(),     // Set of revealed tile indices  
    player: { r: 1, c: 0 } // Player position
}

// Each tile object:
{
    type: 'fight',       // fight, hazard, item, ally, key, door, empty, start
    row: 1,
    col: 2, 
    revealed: true,      // Currently shows all tiles - needs fog of war
    consumed: false      // Whether encounter is completed
}
```

### Current Tile Rendering (ui.js)
- `renderBoard()` function handles all tile display
- `getTileDisplayContent()` determines tile icons/content
- Tiles have CSS classes for type, revealed state, player position

## Known Issues to Address

### Bug: Fight Tile Escape
Players can leave fight tiles without engaging in combat due to flee mechanic changes. The completion logic allows movement when `!G.combat.active`, which includes both:
- After successfully fleeing (intended)
- Before ever starting combat (unintended loophole)

**Fix needed**: Track `tile.combatAttempted` state to distinguish between these cases.

### Technical Debt
- Some hardcoded values that could be moved to JSON configuration
- Portrait image 404 errors (missing portrait files)

## Implementation Approach for Fog of War

### Recommended Steps
1. **Add tile discovery state tracking** to game state
2. **Modify tile revelation logic** in movement system  
3. **Update tile rendering** to respect discovery states
4. **Create CSS classes** for different tile visibility states
5. **Balance test** revelation mechanics (adjacent vs direct)

### Technical Considerations

#### State Management
Current `tile.revealed` property shows all tiles. Need to separate:
- `tile.discovered` - whether player knows tile exists
- `tile.revealed` - whether player has explored the tile
- Consider revelation radius (1-tile? line-of-sight?)

#### CSS Integration  
Current responsive scaling system uses:
```css
#game {
  transform: scale(X);
  transform-origin: top center;
}
```
New tile states should work within this scaling system.

#### Movement Integration
Current movement logic in `movePlayer()` function handles tile revelation. Fog of war should integrate with existing `G.board.seen` Set and tile completion requirements.

## Development Environment Notes
- No build tools - vanilla ES modules
- CSS custom properties for theming
- Responsive design via transform scaling
- Browser-based testing (no Node.js required)

## Testing Priorities
1. Tile revelation feels intuitive and strategic
2. Scaling system works with new tile states  
3. Performance remains smooth with visual state changes
4. Mobile/tablet compatibility maintained
5. Fight tile escape bug resolved

## Next Phase Considerations
After fog of war implementation, potential areas for expansion:
- Additional card effects and variety
- More boss encounters and enemy types
- Campaign progression system with themed regions
- Art integration system (JSON-driven art references)

---

**Ready to implement fog of war system that enhances tactical exploration while maintaining current game feel and performance.**