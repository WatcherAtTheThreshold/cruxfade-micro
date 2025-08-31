# Cruxfade-Micro Art Replacement Guide

Complete guide for replacing placeholder elements with original artwork.

## File Structure Setup

Create these folders in your project:
```
cruxfade-micro/
  /images/
    /tiles/          # Grid tile icons
    /portraits/      # Character portraits  
    /icons/          # Character type icons
    /cards/          # Card background textures
    /sections/       # UI section backgrounds
    /equipment/      # Equipment slot icons
```

---

## 1. Grid Tile Icons

**Location:** `ui.js` in `getExploredTileContent()` function

**Current Code:**
```javascript
const icons = {
    start: '',
    fight: '⚔️',
    hazard: '⚡', 
    item: '📦',
    ally: '🤝',
    key: '🗝️',
    door: '🚪',
    empty: '',
    'boss-encounter': '💀'
};
```

**Replace With:**
```javascript
const icons = {
    start: '',
    fight: '<img src="./images/tiles/fight.png" class="tile-icon-img" alt="Fight">',
    hazard: '<img src="./images/tiles/hazard.png" class="tile-icon-img" alt="Hazard">',
    item: '<img src="./images/tiles/item.png" class="tile-icon-img" alt="Item">',
    ally: '<img src="./images/tiles/ally.png" class="tile-icon-img" alt="Ally">',
    key: '<img src="./images/tiles/key.png" class="tile-icon-img" alt="Key">',
    door: '<img src="./images/tiles/door.png" class="tile-icon-img" alt="Door">',
    empty: '',
    'boss-encounter': '<img src="./images/tiles/boss.png" class="tile-icon-img" alt="Boss">'
};
```

**CSS to Add:**
```css
.tile-icon-img {
    width: 32px;
    height: 32px;
    object-fit: contain;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
}
```

**Files Needed:**
- `fight.png`, `hazard.png`, `item.png`, `ally.png`, `key.png`, `door.png`, `boss.png`

---

## 2. Character Portraits & Icons

**Location:** `ui.js` in `createPartyMemberElement()` and `getCharacterIcon()`

**Portrait System (Already Works):**
```javascript
<img src="./images/portraits/${member.id}.png" alt="${member.name}">
```

**Character Type Fallbacks:**
**Current Code:**
```javascript
function getCharacterIcon(member) {
  if (member.tags.includes('leader'))  return '⚔️';
  if (member.tags.includes('warrior')) return '🛡️';
  if (member.tags.includes('mage'))    return '🔮';
  if (member.tags.includes('rogue'))   return '🗡️';
  return '👤';
}
```

**Replace With:**
```javascript
function getCharacterIcon(member) {
  if (member.tags.includes('leader'))  return '<img src="./images/icons/leader.png" class="char-icon">';
  if (member.tags.includes('warrior')) return '<img src="./images/icons/warrior.png" class="char-icon">';
  if (member.tags.includes('mage'))    return '<img src="./images/icons/mage.png" class="char-icon">';
  if (member.tags.includes('rogue'))   return '<img src="./images/icons/rogue.png" class="char-icon">';
  return '<img src="./images/icons/default.png" class="char-icon">';
}
```

**CSS to Add:**
```css
.char-icon {
    width: 24px;
    height: 24px;
    object-fit: cover;
    border-radius: 50%;
}
```

**Files Needed:**
- Individual portraits: `you.png`, `warrior-[timestamp].png`, etc.
- Type icons: `leader.png`, `warrior.png`, `mage.png`, `rogue.png`, `default.png`

---

## 3. Card Backgrounds

**Location:** `styles.css` in card styling sections

**CSS to Add:**
```css
/* Basic card backgrounds */
.playable-card-compact {
    background-image: url('./images/cards/card-background.png');
    background-size: cover;
    background-position: center;
}

/* Card type specific backgrounds */
.playable-card-compact .card-type.attack {
    background-image: url('./images/cards/attack-bg.png');
}

.playable-card-compact .card-type.defense {
    background-image: url('./images/cards/defense-bg.png');  
}

.playable-card-compact .card-type.utility {
    background-image: url('./images/cards/utility-bg.png');
}

/* Party member cards */
.party-member {
    background-image: url('./images/cards/member-bg.png');
    background-size: cover;
    background-position: center;
}
```

**Files Needed:**
- `card-background.png` - Default card texture
- `attack-bg.png` - Red/combat themed background  
- `defense-bg.png` - Blue/shield themed background
- `utility-bg.png` - Green/magic themed background
- `member-bg.png` - Party member card background

---

## 4. Section Backgrounds

**Location:** `styles.css` in main layout sections

**CSS to Add:**
```css
/* Four quadrant section backgrounds */
.exploration-area {
    background-image: url('./images/sections/exploration-bg.png');
    background-size: cover;
    background-position: center;
}

.encounters {
    background-image: url('./images/sections/encounter-bg.png');  
    background-size: cover;
    background-position: center;
}

.event-log {
    background-image: url('./images/sections/log-bg.png');
    background-size: cover;
    background-position: center;
}

.party-hand-section {
    background-image: url('./images/sections/hand-bg.png');
    background-size: cover; 
    background-position: center;
}

/* Optional: Subtle overlay to ensure text readability */
.exploration-area::before,
.encounters::before, 
.event-log::before,
.party-hand-section::before {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.3);
    border-radius: var(--radius);
    pointer-events: none;
}
```

**Files Needed:**
- `exploration-bg.png` - Grid/map themed background
- `encounter-bg.png` - Combat/action themed background  
- `log-bg.png` - Scroll/text themed background
- `hand-bg.png` - Cards/magic themed background

---

## 5. Equipment Icons

**Location:** `ui.js` in `createPartyMemberElement()` equipment slots

**Current Code:**
```javascript
<span class="slot-icon">⚔️</span> // Weapon
<span class="slot-icon">🛡️</span> // Armor  
<span class="slot-icon">💎</span> // Accessory
```

**Replace With:**
```javascript
<img src="./images/equipment/weapon-slot.png" class="slot-icon-img">
<img src="./images/equipment/armor-slot.png" class="slot-icon-img"> 
<img src="./images/equipment/accessory-slot.png" class="slot-icon-img">
```

**CSS to Add:**
```css
.slot-icon-img {
    width: 16px;
    height: 16px;
    object-fit: contain;
    opacity: 0.8;
}
```

**Files Needed:**
- `weapon-slot.png`, `armor-slot.png`, `accessory-slot.png`

---

## 6. Additional Art Locations

### Game Board Background
```css
.board {
    background-image: url('./images/sections/board-bg.png');
    background-size: cover;
    background-position: center;
}
```

### Overlay Backgrounds  
```css
.overlay-content {
    background-image: url('./images/sections/overlay-bg.png');
    background-size: cover;
}
```

### Logo/Title Area
```css
.grid-header h2 {
    background-image: url('./images/ui/title-bg.png');
    background-size: contain;
    background-repeat: no-repeat;
}
```

---

## Implementation Strategy

1. **Start Small:** Replace tile icons first (most visible impact)
2. **Test Each Change:** Verify images load and display correctly  
3. **Maintain Fallbacks:** Keep text fallbacks for missing images
4. **Consistent Sizing:** Use same dimensions for similar elements
5. **Optimize Files:** Use appropriate file formats (PNG for icons, JPG for backgrounds)

## File Formats Recommended

- **Icons/UI Elements:** PNG with transparency
- **Backgrounds:** JPG for efficiency, PNG if transparency needed
- **Portraits:** PNG or JPG, square aspect ratio recommended
- **Card Elements:** PNG for layering capabilities

## Testing Checklist

- [ ] All tile types display correctly in fog of war states
- [ ] Character portraits and fallbacks work for all party member types  
- [ ] Card backgrounds don't interfere with text readability
- [ ] Section backgrounds enhance rather than distract from UI
- [ ] Equipment icons are clear at small sizes
- [ ] Images scale properly on mobile devices
- [ ] Missing image fallbacks work gracefully