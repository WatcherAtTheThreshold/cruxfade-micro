# 🗺️ Cruxfade-Micro Development Roadmap

## ✅ **ACCOMPLISHED** (Core Foundation Complete!)

### Game Architecture
- [x] 4x4 grid system with player movement
- [x] 4-section UI layout with perfect proportions
- [x] State management system (single source of truth)
- [x] Modular JS architecture (main.js, state.js, ui.js)
- [x] CSS theme system with custom properties

### Core Gameplay Loop
- [x] All encounter types: Fight, Hazard, Item, Ally, Key, Door
- [x] Party system with leadership switching
- [x] Basic combat system (turn-based, dice rolls)
- [x] Grid progression (level 1 → 2 → 3+)
- [x] Item collection with stat boosts
- [x] Event log system

### Game Feel
- [x] Tile reveal mechanics
- [x] Adjacent-only movement
- [x] Consumed encounters (can't repeat)
- [x] Responsive tile highlighting
- [x] Left-edge entry positioning

---

## 🎯 **PRIORITY ROADMAP** (Ordered by Impact & Dependencies)

### **Phase 1: Data System Foundation** (2-3 sessions)
*Enable content iteration without touching code*

1. **JSON Data Architecture**
   - Move enemies from hardcoded to `enemies.json`
   - Create `encounters.json` with grid-level weights
   - Add `items.json` with loot tables
   - Implement data loading in main.js

2. **Seeded RNG System**
   - Replace Math.random() with seeded PRNG
   - Enable reproducible runs via seed
   - Share-able run seeds

**Why first:** Everything else depends on being able to easily tweak content

---

### **Phase 2: Card System Overhaul** (3-4 sessions)
*Transform from placeholder to core mechanic*

3. **5-Card Hard Limit**
   - Implement discard-on-overflow
   - Add card selection UI when limit hit
   - Visual hand management

4. **Real Card Effects**
   - Map card IDs to effect functions
   - Implement card playing mechanics
   - Add skill variety (attack modifiers, utilities)

5. **Ally Deck Merging**
   - Add cards when allies join party
   - Remove cards when allies leave
   - Balance ally contributions

**Why second:** Cards are core to the tactical depth

---

### **Phase 3: Equipment & Progression** (2-3 sessions)
*Separate items from equipment for cleaner inventory*

6. **Equipment System**
   - Equipment slots (weapon, armor, accessory)
   - Equipment doesn't consume card slots
   - Visual equipment display

7. **Grid-Level Progression**
   - Scale enemy difficulty per grid
   - Different encounter weights per level
   - Grid-specific loot tables

**Why third:** Builds on data system, adds progression feel

---

### **Phase 4: Boss & End Game** (2-3 sessions)
*Complete the core gameplay arc*

8. **Multi-Phase Boss System**
   - Boss encounters after Grid 3
   - Mini-encounters (limbs, minions, hazards)
   - Full party participation in final phase

9. **Victory Conditions**
   - Boss defeat = run complete
   - Victory screen with run stats
   - Seed sharing for completed runs

**Why fourth:** Natural capstone, needs all other systems

---

### **Phase 5: Polish & Variety** (Ongoing)
*Quality of life and replayability*

10. **Shop System**
    - Safe rooms with shops
    - Gold economy
    - Equipment trading

11. **Difficulty Modes**
    - Multiple run configurations
    - Harder enemy stats
    - Different encounter mixes

12. **Content Expansion**
    - More enemy types per grid
    - Additional hazard varieties  
    - Rare encounter types

---

## 🔧 **TECHNICAL DEBT** (As Needed)

- **Performance**: Optimize DOM updates if needed
- **Mobile UX**: Touch interaction improvements
- **Save System**: LocalStorage for settings/progress
- **Animation Polish**: Smoother tile transitions

---

## 🎮 **THE BIG PICTURE**

**Current State:** Solid MVP with core loop working perfectly  
**Phase 1-2 Complete:** Full tactical card-based roguelike  
**Phase 3-4 Complete:** Complete game ready for players  
**Phase 5:** Endless content expansion potential

---

## 💭 **PHASE 1 STARTING POINT**

Since the data system is foundational, I'd recommend starting with:

1. **enemies.json** - Move the goblin/orc data out of state.js
2. **Simple data loader** - Add JSON loading to main.js  
3. **Test encounter generation** - Verify same gameplay with data-driven approach

This gives you the architecture to easily add content and balance without code changes.

**Ready to dive into Phase 1?** The enemies.json would be a perfect starting file - clean, contained, immediate impact.