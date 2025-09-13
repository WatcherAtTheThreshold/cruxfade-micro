# Technique Consolidation Implementation Plan

## Goal
Convert techniques from allies.json into regular cards in cards.json, eliminating the separate technique system and making all techniques work through the existing card effects system.

---

## Phase 1: Add Techniques to cards.json

### Step 1.1: Add Forest Region Techniques
Add these entries to cards.json:

```json
"forest-lore": {
  "name": "Forest Lore",
  "type": "utility",
  "effect": "track",
  "description": "Deep knowledge of woodland secrets reveals hidden paths",
  "rarity": "common"
},
"nature-bond": {
  "name": "Nature Bond", 
  "type": "defense",
  "effect": "defend",
  "description": "Call upon forest spirits for protection",
  "rarity": "common"
},
"herb-mastery": {
  "name": "Herb Mastery",
  "type": "utility",
  "effect": "heal",
  "description": "Advanced knowledge of healing plants",
  "rarity": "common"
},
"beast-speech": {
  "name": "Beast Speech",
  "type": "utility",
  "effect": "track",
  "description": "Communicate with forest creatures for aid",
  "rarity": "uncommon"
},
"ancient-wisdom": {
  "name": "Ancient Wisdom",
  "type": "utility",
  "effect": "first-aid",
  "description": "Rare knowledge passed down through generations",
  "rarity": "rare"
}
```

### Step 1.2: Add Mountain Region Techniques
```json
"stone-skin": {
  "name": "Stone Skin",
  "type": "defense",
  "effect": "defend",
  "description": "Harden your body like mountain stone",
  "rarity": "common"
},
"crystal-focus": {
  "name": "Crystal Focus",
  "type": "attack",
  "effect": "magic-bolt",
  "description": "Channel energy through crystalline formations",
  "rarity": "uncommon"
},
"mountain-endurance": {
  "name": "Mountain Endurance",
  "type": "utility",
  "effect": "heal",
  "description": "Stamina techniques from high-altitude training",
  "rarity": "common"
},
"forge-mastery": {
  "name": "Forge Mastery",
  "type": "utility",
  "effect": "first-aid",
  "description": "Dwarven metalworking techniques",
  "rarity": "uncommon"
},
"gem-sight": {
  "name": "Gem Sight",
  "type": "utility",
  "effect": "track",
  "description": "See the true nature of crystalline magic",
  "rarity": "rare"
}
```

### Step 1.3: Add Void Region Techniques
```json
"void-touch": {
  "name": "Void Touch",
  "type": "attack",
  "effect": "magic-bolt",
  "description": "Channel the emptiness between worlds",
  "rarity": "common"
},
"desperation": {
  "name": "Desperation",
  "type": "attack",
  "effect": "sneak-attack",
  "description": "Fighting with nothing left to lose",
  "rarity": "uncommon"
},
"survival-instinct": {
  "name": "Survival Instinct",
  "type": "defense",
  "effect": "defend",
  "description": "Techniques learned from constant danger",
  "rarity": "common"
},
"entropy-mastery": {
  "name": "Entropy Mastery",
  "type": "utility",
  "effect": "magic-bolt",
  "description": "Understanding of decay and dissolution",
  "rarity": "uncommon"
},
"forbidden-knowledge": {
  "name": "Forbidden Knowledge",
  "type": "utility",
  "effect": "track",
  "description": "Dark secrets that should not be known",
  "rarity": "rare"
}
```

### Step 1.4: Test Card Loading
- Save cards.json
- Refresh game
- Check console for "Cards loaded: 45" (30 + 15 techniques)
- Verify no JSON errors

---

## Phase 2: Remove Techniques from allies.json

### Step 2.1: Remove Technique Sections
Delete these entire sections from allies.json:
- `"techniques": [...]` from forest-region
- `"techniques": [...]` from mountain-region  
- `"techniques": [...]` from void-region

### Step 2.2: Test Ally Recruitment
- Save allies.json
- Refresh game
- Recruit allies to ensure they still work
- No technique popups should appear anymore

---

## Phase 3: Update Technique Learning System

### Step 3.1: Modify Technique Discovery
In state.js, find technique-related functions and update them to use regular card system:

**Replace technique selection with:**
```javascript
// Instead of special technique UI, add technique card directly to hand
const techniqueCard = createCardFromData(techniqueId, '');
if (techniqueCard) {
  const result = addCardToHand(techniqueCard);
  if (result.success) {
    addLogEntry(`📜 Learned ${techniqueCard.name}!`);
  } else {
    // Handle card overflow
    showCardOverflowSelection(techniqueCard, callback);
  }
}
```

### Step 3.2: Remove Special Technique UI
- Remove any technique-specific overlay/popup code
- Remove technique selection handlers
- Techniques now appear as regular hand cards

---

## Phase 4: Testing & Validation

### Step 4.1: Test Each Technique Type
- **Forest techniques**: Recruit forest allies, trigger abandoned camp
- **Mountain techniques**: Test in mountain region (grids 7-10)
- **Void techniques**: Test in void region (grids 12-15)

### Step 4.2: Verify Technique Effects
Test each technique card in hand:
- **forest-lore**: Should reveal tile types (track effect)
- **nature-bond**: Should reduce damage in combat (defend effect)  
- **herb-mastery**: Should heal HP (heal effect)
- **stone-skin**: Should defend in combat (defend effect)
- **crystal-focus**: Should deal magic damage (magic-bolt effect)

### Step 4.3: Test Card Overflow
- Fill hand to 4/5 cards
- Trigger technique discovery
- Verify overflow selection works properly

---

## Phase 5: Clean Up Code

### Step 5.1: Remove Unused Functions
Search state.js for technique-specific functions and remove:
- `learnTechnique()`
- `showTechniqueSelection()`  
- `getAllTechniques()`
- Any technique-related debug functions

### Step 5.2: Clean Up UI Code
Remove technique-related UI code from ui.js:
- Technique overlay rendering
- Technique selection handlers
- Technique-specific event listeners

---

## Expected Outcomes

### Benefits
- **Unified card system**: All cards work the same way
- **Simplified codebase**: No separate technique handling
- **Consistent UI**: No special technique popups
- **Effect reuse**: Techniques use existing CARD_EFFECTS
- **Easier balancing**: Techniques follow same rules as other cards

### Changes for Players
- **No technique popups**: Techniques appear directly in hand as cards
- **Same mechanics**: Techniques work exactly like other cards
- **Two-click system**: Select technique, then use like any card
- **Overflow handling**: Techniques trigger card overflow when hand is full

---

## Rollback Plan

If issues arise:
1. **Restore techniques section** to allies.json from backup
2. **Remove technique entries** from cards.json  
3. **Revert technique handling code** in state.js
4. **Test that old system works**

Keep backup copies of allies.json and cards.json before starting.