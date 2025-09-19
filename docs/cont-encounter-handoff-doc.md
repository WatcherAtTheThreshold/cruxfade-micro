# Dynamic Encounter Graphics Extension Guide

## 🎯 **What We Accomplished**
Successfully implemented dynamic item graphics system with:
- ✅ **Preview consistency** - what you see is what you get
- ✅ **Fallback handling** - graceful degradation for missing images  
- ✅ **Per-tile caching** - preview stays consistent until player moves
- ✅ **Dynamic stats display** - shows actual item bonuses

---

## 🏗️ **The Pattern We Established**

### **Core Architecture:**
1. **Preview Function** - generates encounter data without applying effects
2. **Storage Variable** - caches preview per tile to ensure consistency  
3. **Clear Function** - resets preview when player moves
4. **Dynamic Rendering** - displays actual encounter with graphics and stats
5. **Action Handler** - uses stored preview when resolving encounter

### **Key Files Modified:**
- **state.js** - preview functions, action logic
- **ui.js** - rendering, preview storage, clearing
- **main.js** - global function exports

---

## 🎨 **Extension Strategy for Other Encounters**

### **Hazard Encounters**

**Assets Needed:**
```
/images/hazards/
  forest-trap.png
  mountain-avalanche.png  
  void-rift.png
  generic-hazard.png
```

**Implementation Steps:**

**Step 1: Create Preview Function (state.js)**
```javascript
/**
 * Preview what hazard would be encountered
 */
export function previewHazard() {
    const currentRegion = getRegionForGrid(G.gridLevel);
    const hazardTypes = getRegionalHazards(currentRegion);
    const hazard = pickRandom(hazardTypes);
    
    return {
        id: hazard.id,
        name: hazard.name,
        difficulty: hazard.difficulty,
        preferredStat: hazard.preferredStat,
        description: hazard.description
    };
}
```

**Step 2: Add Storage (ui.js)**
```javascript
let currentHazardPreview = null;

export function clearHazardPreview() {
    currentHazardPreview = null;
}
```

**Step 3: Update Render Function (ui.js)**
```javascript
function renderHazardEncounter() {
    if (isCurrentTileConsumed()) {
        // Show resolved state
        return;
    }
    
    // Only preview once per tile
    if (!currentHazardPreview) {
        currentHazardPreview = window.CruxfadeMicro.previewHazard();
    }
    
    const hazardPreview = currentHazardPreview;
    
    DOM.encounterArea.innerHTML = `
        <div class="encounter-hazard">
            <div class="hazard-graphic-display">
                <img src="./images/hazards/${hazardPreview.id}.png" 
                     alt="${hazardPreview.name}"
                     class="encounter-hazard-image"
                     onerror="this.src='./images/hazards/generic-hazard.png'">
                <div class="hazard-stats-preview">
                    <h3>⚡ ${hazardPreview.name}</h3>
                    <div class="difficulty-display">Difficulty: ${hazardPreview.difficulty}</div>
                    <div class="preferred-stat">Best Approach: ${hazardPreview.preferredStat.toUpperCase()}</div>
                    <p>${hazardPreview.description}</p>
                </div>
            </div>
        </div>
    `;
    
    DOM.encounterActions.innerHTML = `
        <button class="btn-primary" data-action="resolve-hazard">Navigate ${hazardPreview.name}</button>
    `;
}
```

---

### **Boss Encounters**

**Assets Needed:**
```
/images/bosses/
  shadow-lord-portrait.png
  crystal-tyrant-portrait.png
  void-empress-portrait.png
```

**Key Features:**
- **Large portrait display** (150px x 150px)
- **Boss title and threat level**
- **Dramatic introduction before phases begin**

**Implementation Pattern:**
```javascript
function renderBossEncounter() {
    const bossData = getCurrentBossData();
    
    // BOSS INTRODUCTION PHASE
    if (!G.boss.introShown) {
        DOM.encounterArea.innerHTML = `
            <div class="boss-introduction">
                <div class="boss-portrait-display">
                    <img src="./images/bosses/${bossData.id}-portrait.png" 
                         alt="${bossData.name}"
                         class="boss-portrait">
                    <div class="boss-title-card">
                        <h2>${bossData.name}</h2>
                        <div class="boss-threat-level">${bossData.title}</div>
                        <p class="boss-description">${bossData.description}</p>
                    </div>
                </div>
            </div>
        `;
        return;
    }
    
    // Continue with existing phase logic...
}
```

---

### **Key Encounters**

**Simple Enhancement:**
- Show **key type** and **region styling**
- **Glowing effects** for important progression items

**Assets Needed:**
```
/images/keys/
  forest-key.png
  mountain-key.png
  void-key.png
  master-key.png
```

---

### **Door Encounters**

**Portal/Gateway Graphics:**
- **Destination previews** for next grid
- **Regional theming** based on current/next area
- **Progression indicators**

**Assets Needed:**
```
/images/doors/
  forest-to-mountain.png
  mountain-to-void.png
  boss-door.png
  victory-portal.png
```

---

## 🔧 **Implementation Checklist**

### **For Each Encounter Type:**

**Backend (state.js):**
- [ ] Create `preview[EncounterType]()` function
- [ ] Modify action handler to accept preview data
- [ ] Export functions in main.js

**Frontend (ui.js):**
- [ ] Add `current[EncounterType]Preview` variable
- [ ] Create `clear[EncounterType]Preview()` function  
- [ ] Update `render[EncounterType]Encounter()` function
- [ ] Update action handler to use stored preview
- [ ] Add preview clearing to `movePlayer()`

**Assets:**
- [ ] Create primary images for each encounter variant
- [ ] Create fallback/generic images
- [ ] Test image loading and fallbacks

**CSS Styling:**
- [ ] Add encounter-specific image classes
- [ ] Define consistent sizing (120px for items, 150px for bosses)
- [ ] Add visual effects (drop shadows, borders, animations)

---

## 📋 **Next Session Priorities**

### **Immediate (High Impact):**
1. **Hazard Graphics** - Most commonly encountered, good visual variety
2. **Boss Portraits** - Dramatic impact, easier implementation  
3. **Key Visuals** - Simple but important for progression feel

### **Later (Polish):**
4. **Door/Portal Graphics** - Complex but adds great atmosphere
5. **Enemy Combat Portraits** - Enhance fight encounters
6. **Regional Theming** - Different graphics per region

---

## 🎨 **Design Guidelines**

### **Image Specifications:**
- **Items**: 120x120px, clean icons with transparent backgrounds
- **Hazards**: 100x100px, environmental/danger themed
- **Bosses**: 150x150px, detailed portraits with drama
- **Keys**: 80x80px, glowing/magical effects
- **Doors**: 120x120px, architectural/portal themed

### **Fallback Strategy:**
1. **Specific image** (`shadow-lord-portrait.png`)
2. **Generic type** (`boss-generic.png`) 
3. **Emoji fallback** (👿 for bosses, ⚡ for hazards)

### **Visual Consistency:**
- **Drop shadows** for depth
- **Consistent border radius** (var(--radius))
- **Loading states** and error handling
- **Responsive sizing** for different screen sizes

---

## 🚀 **Ready to Continue**

This system is **fully extensible** and follows the established pattern. Each encounter type can be enhanced independently without affecting others. The foundation is solid and the approach is proven!

**Files to update per encounter type:**
- `state.js` - 1 preview function, 1 action modification  
- `ui.js` - 1 storage variable, 1 clear function, 1 render update
- `main.js` - 1 export addition
- `/images/` - Asset folder creation

**Have a great weekend! This is going to look amazing! 🎮✨**