# Cruxfade-Micro: Technical Development Reference

Technical patterns and implementation guidance for building Cruxfade-Micro.

---

## Layout Architecture

### Container System
```css
.wrap { 
  width: min(1200px, 94vw); /* Adjust target width for more-square aspect */
  margin-inline: auto; 
  display: grid; 
  gap: 16px; 
}
```

### 4-Section Layout Structure
```
┌─────────────────┬─────────────────┐
│  EXPLORATION    │   PARTY/UI      │
│     GRID        │    STATUS       │
│    (3x3)        │   (persistent)  │
├─────────────────┼─────────────────┤
│   PARTY CARDS   │  ENCOUNTERS     │
│  (overlapped    │  (enemy cards,  │
│   leadership)   │  dice, items)   │
└─────────────────┴─────────────────┘
```

### Target Aspect Ratio
- **3:2 or 5:3 ratio** (more square-ish than 16:9)
- **Fixed container** with letterboxing on ultra-wide screens
- **Horizontal orientation** optimized for mobile
- **Example dimensions**: 1200x800px or 1500x1000px

---

## CSS Foundation

### Custom Properties (Theme System)
```css
:root {
  /* Colors */
  --bg: #0f0f13;
  --ink: #e8e6e3;
  --muted: #9aa0a6;
  --accent: #6ea7ff;
  --good: #68d391;
  --bad: #ef6b73;
  
  /* Layout */
  --boardW: 720px;
  
  /* Game Colors */
  --crux: #5b1f5e;
  --frag: #3a845a;
  --exit: #b08900;
  --ward: #27506a;
  --tile: #1a1d24;
  --tileHi: #232731;
}
```

### Spacing System
- **Gap between sections**: 16px
- **Card spacing**: 10px gaps
- **Padding patterns**: 10px-24px range
- **Responsive adjustment**: 12px gaps on mobile

---

## Grid Implementation

### 3x3 Grid Structure
```css
.board { 
  display: grid; 
  grid-template-columns: repeat(3, 1fr); 
  gap: 10px; 
  aspect-ratio: 1/1; /* Keep square */
}

.tile { 
  aspect-ratio: 1/1; 
  border-radius: 12px; 
  display: grid; 
  place-items: center; 
  position: relative; 
  cursor: pointer; 
  transition: transform .08s ease, background .15s ease;
}
```

### Tile States & Interactions
- **Base state**: Dark background, subtle border
- **Hover**: Lighter background, inner glow
- **Revealed**: Border overlay effect
- **Player location**: Accent outline with glow
- **Encounter types**: Color-coded backgrounds (fight, item, ally, etc.)

---

## Card System

### Party Card Overlap Pattern
```css
.party-hand {
  display: flex;
  margin-left: 20px; /* Offset for overlap */
}

.party-card {
  margin-left: -15px; /* Tight overlap */
  transition: transform .2s ease, z-index .2s ease;
}

.party-card.leader {
  transform: translateY(-8px);
  z-index: 10;
}

.party-card:hover {
  transform: translateY(-4px);
  z-index: 5;
}
```

### Card Base Styling
```css
.card {
  border-radius: 12px;
  padding: 10px;
  background: #141926;
  border: 1px solid #263047;
  box-shadow: 0 6px 16px rgba(0,0,0,.25);
  cursor: pointer;
  transition: transform .08s ease, box-shadow .2s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(0,0,0,.35);
}
```

---

## UI Components

### HUD Chips
```css
.chip {
  background: #141820;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid #263047;
  color: #c9d1f3;
}

.chip strong {
  color: var(--ink);
}
```

### Buttons
```css
button {
  background: #162236;
  color: #e7ecff;
  border: 1px solid #2a3b5f;
  padding: 10px 14px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  letter-spacing: .02em;
}

button:hover {
  filter: brightness(1.1);
}

button:disabled {
  opacity: .5;
  cursor: not-allowed;
}
```

### Log Area
```css
.log {
  background: #11141b;
  border: 1px solid #232a3d;
  border-radius: 12px;
  padding: 10px;
  color: #cbd5e1;
  font-size: .9rem;
  max-height: 140px;
  overflow: auto;
}
```

---

## Responsive Breakpoints

### Mobile Adjustments
```css
@media (max-width: 700px) {
  .wrap { 
    gap: 12px; 
  }
  
  .card { 
    min-width: calc(50% - 6px); 
  }
  
  /* Adjust grid size for mobile */
  :root { 
    --boardW: 640px; 
  }
}
```

---

## Animation Patterns

### Hover Effects
- **Transform**: `translateY(-2px)` for lift
- **Timing**: `.08s ease` for snappy response
- **Box-shadow**: Increased depth on hover

### State Transitions
- **Background changes**: `.15s ease`
- **Card movements**: `.2s ease`
- **Z-index changes**: Coordinate with transforms

### Flash Effects (for game feedback)
```css
/* Temporary override for damage/healing */
.tile.flash-hurt {
  box-shadow: 0 0 0 2px #ef6b73 inset, 0 0 18px rgba(239,107,115,.35);
}

.tile.flash-heal {
  box-shadow: 0 0 0 2px #68d391 inset, 0 0 18px rgba(104,211,145,.35);
}
```

---

## Implementation Notes

### Portrait System
- **Bust images**: Positioned absolute, sized to tile
- **Portrait selection**: Dropdown updates src dynamically
- **Fallback**: Text glyphs when no portrait available

### State Management Patterns
- **Single global state object**: `G` with all game data
- **Pure function mutations**: No direct object modification
- **Render triggers**: Call `renderAll()` after state changes

### Grid Data Structure
```javascript
// 3x3 array with encounter types
grid: [
  ['empty', 'fight', 'item'],
  ['ally',  'start', 'key' ],
  ['door',  'empty', 'hazard']
]
```

---

## File Organization Reminders

### CSS Structure Priority
1. **Variables first** (`:root` block)
2. **Layout systems** (containers, grid)
3. **Components** (cards, buttons, tiles)
4. **State modifiers** (hover, active, disabled)
5. **Responsive adjustments** (media queries last)

### Modular Approach
- Keep **styles.css** focused on visual presentation
- Let **JavaScript** handle dynamic styling (state classes)
- Use **data attributes** for styling hooks when needed