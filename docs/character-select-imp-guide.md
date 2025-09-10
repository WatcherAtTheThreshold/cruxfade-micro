# Character Selection System - Complete Implementation Guide

## Overview
Replace the generic "Leader" character with a character selection modal showing 5 classes with procedural names from allies.json.

## Implementation Order (Critical: Follow Exactly)

### Step 1: Add Paladin Class to allies.json
**Location:** `/data/allies.json` in the `forest-region` section
**Add after the `rogue` class, before `techniques`:**

```json
"paladin": {
  "rarity": "uncommon",
  "weight": 2,
  "names": ["Gareth", "Lyanna", "Thaddeus", "Seraphina", "Roland", "Celestine", "Aldric", "Grace"],
  "titles": ["the Righteous", "the Holy", "the Light-Bearer", "the Protector", "the Divine Champion", "the Sacred Shield"],
  "baseStats": { 
    "hp": 11, 
    "maxHp": 11, 
    "atk": 3, 
    "mag": 2 
  },
  "tags": ["human", "paladin", "healer"],
  "description": "A holy warrior dedicated to protection and healing",
  "cards": [
    { 
      "id": "divine-strike", 
      "name": "Divine Strike", 
      "type": "attack",
      "description": "Deal magic damage infused with holy power"
    },
    { 
      "id": "blessing", 
      "name": "Blessing", 
      "type": "utility",
      "description": "Heal and protect an ally with divine grace"
    }
  ],
  "joinConditions": {
    "minGridLevel": 2,
    "maxPartySize": 4,
    "regions": ["forest-region", "mountain-region"]
  }
}
```

### Step 2: Add Character Selection Modal to HTML
**Location:** `index.html`
**Add after existing modals, before the game grid:**

```html
<!-- Character Selection Modal -->
<div id="character-selection-modal" class="modal character-selection-modal">
    <div class="modal-content character-selection-content">
        <h2>Choose Your Character</h2>
        <p>Select a class to begin your journey through the Cruxfade</p>
        
        <div class="character-cards-container">
            <!-- Character cards will be dynamically populated here -->
        </div>
    </div>
</div>
```

### Step 3: Add Character Selection CSS
**Location:** `styles.css`
**Add at the end of the file:**

```css
/* Character Selection Modal */
.character-selection-modal {
    z-index: 1000;
    background-color: rgba(0, 0, 0, 0.8);
}

.character-selection-content {
    max-width: 95vw;
    width: auto;
    max-height: 90vh;
    padding: 1.5rem;
    text-align: center;
    background: linear-gradient(135deg, #2a1810 0%, #3d2a1f 100%);
    border: 2px solid #8b7355;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.character-selection-content h2 {
    color: #f4e4bc;
    font-size: 1.8rem;
    margin-bottom: 0.5rem;
    font-weight: bold;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
}

.character-selection-content p {
    color: #d4c4a8;
    font-size: 1rem;
    margin-bottom: 1.5rem;
    opacity: 0.9;
}

.character-cards-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    justify-items: center;
    max-width: 1200px;
    margin: 0 auto;
}

.character-card {
    background: linear-gradient(135deg, #3a2817 0%, #4a3326 100%);
    border: 2px solid #6b5d47;
    border-radius: 8px;
    padding: 1rem;
    width: 200px;
    min-height: 220px;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.character-card:hover {
    border-color: #8b7355;
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
    background: linear-gradient(135deg, #4a3326 0%, #5a4235 100%);
}

.character-name {
    color: #f4e4bc;
    font-size: 1.1rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
    line-height: 1.2;
}

.character-class {
    color: #a69073;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 0.75rem;
    opacity: 0.8;
}

.character-stats {
    display: flex;
    justify-content: space-around;
    margin-bottom: 0.75rem;
    padding: 0.5rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
}

.character-stat {
    text-align: center;
}

.character-stat-label {
    color: #a69073;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.character-stat-value {
    color: #f4e4bc;
    font-size: 1rem;
    font-weight: bold;
    margin-top: 2px;
}

.character-description {
    color: #d4c4a8;
    font-size: 0.8rem;
    line-height: 1.3;
    opacity: 0.9;
    margin-bottom: 0.75rem;
}

.character-starting-card {
    color: #8b7355;
    font-size: 0.7rem;
    font-style: italic;
    opacity: 0.8;
}

/* Responsive Design */
@media (max-width: 768px) {
    .character-cards-container {
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 0.75rem;
    }
    
    .character-card {
        width: 180px;
        min-height: 200px;
        padding: 0.875rem;
    }
    
    .character-selection-content {
        padding: 1rem;
    }
}

@media (max-width: 480px) {
    .character-cards-container {
        grid-template-columns: 1fr;
        max-width: 220px;
    }
    
    .character-card {
        width: 100%;
    }
}
```

### Step 4: Modify state.js - REPLACE initializeGame() Function
**Critical: REPLACE the existing initializeGame() function, don't add alongside:**

```javascript
/**
 * Initialize the game - now shows character selection first
 * REPLACE existing initializeGame() function with this
 */
export function initializeGame() {
    console.log('🎮 Initializing game...');
    
    // Reset game state
    resetGameState();
    
    // Show character selection modal
    showCharacterSelection();
}

/**
 * Reset game state to clean slate
 * ADD this new function
 */
function resetGameState() {
    G.victory = false;
    G.over = false;
    G.party = [];
    G.hand = [];
    G.discardPile = [];
    G.equipment = [];
    G.actionHistory = [];
    G.logEntries = [];
    G.currentTile = null;
    G.currentEnemy = null;
    G.combatActive = false;
    G.enemyDefeated = false;
    
    // Clear any pending data
    G._pendingAlly = null;
    G._pendingCards = null;
    G._pendingTechniques = null;
    G._pendingTechniqueCard = null;
}
```

### Step 5: Add Character Selection Functions to state.js
**Add these NEW functions at the end of state.js:**

```javascript
/**
 * Show character selection modal at game start
 */
export function showCharacterSelection() {
    console.log('🎭 Showing character selection...');
    
    // Wait a moment for GAME_DATA to be fully available
    setTimeout(() => {
        if (!GAME_DATA || !GAME_DATA.allies || !GAME_DATA.allies['forest-region']) {
            console.error('No allies data available for character selection');
            // Fallback to default character
            startWithDefaultCharacter();
            return;
        }
        
        // Get character classes from forest-region
        const characterClasses = ['warrior', 'ranger', 'herbalist', 'rogue', 'paladin'];
        const characterCards = generateCharacterCards(characterClasses);
        
        // Populate and show modal
        populateCharacterSelectionModal(characterCards);
        
        const modal = document.getElementById('character-selection-modal');
        if (modal) {
            modal.style.display = 'block';
        }
    }, 100); // Small delay to ensure GAME_DATA is ready
}

/**
 * Generate character card data from allies.json
 */
function generateCharacterCards(characterClasses) {
    const cards = [];
    const regionData = GAME_DATA.allies['forest-region'];
    
    for (const className of characterClasses) {
        if (regionData[className]) {
            const classData = regionData[className];
            
            // Generate procedural name
            const names = classData.names || ["Hero"];
            const titles = classData.titles || ["the Brave"];
            const name = pickRandom(names);
            const title = pickRandom(titles);
            const proceduralName = `${name} ${title}`;
            
            const characterCard = {
                className: className,
                name: proceduralName,
                displayClass: className.charAt(0).toUpperCase() + className.slice(1),
                stats: classData.baseStats,
                description: classData.description,
                startingCard: classData.cards && classData.cards.length > 0 ? classData.cards[0] : null,
                tags: classData.tags
            };
            
            cards.push(characterCard);
        }
    }
    
    return cards;
}

/**
 * Populate character selection modal with cards
 */
function populateCharacterSelectionModal(characterCards) {
    const container = document.querySelector('.character-cards-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    characterCards.forEach((card, index) => {
        const cardElement = createCharacterCardElement(card, index);
        container.appendChild(cardElement);
    });
}

/**
 * Create HTML element for a character card
 */
function createCharacterCardElement(card, index) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'character-card';
    cardDiv.dataset.className = card.className;
    
    cardDiv.innerHTML = `
        <div class="character-name">${card.name}</div>
        <div class="character-class">${card.displayClass}</div>
        <div class="character-stats">
            <div class="character-stat">
                <div class="character-stat-label">HP</div>
                <div class="character-stat-value">${card.stats.hp}</div>
            </div>
            <div class="character-stat">
                <div class="character-stat-label">ATK</div>
                <div class="character-stat-value">${card.stats.atk}</div>
            </div>
            <div class="character-stat">
                <div class="character-stat-label">MAG</div>
                <div class="character-stat-value">${card.stats.mag}</div>
            </div>
        </div>
        <div class="character-description">${card.description}</div>
        ${card.startingCard ? `<div class="character-starting-card">Starts with: ${card.startingCard.name}</div>` : ''}
    `;
    
    cardDiv.addEventListener('click', () => {
        selectCharacter(card);
    });
    
    return cardDiv;
}

/**
 * Handle character selection
 */
function selectCharacter(characterData) {
    console.log('Selected character:', characterData.name);
    
    // Hide modal
    const modal = document.getElementById('character-selection-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Create leader character
    const leader = {
        id: `${characterData.className}-leader`,
        name: characterData.name,
        hp: characterData.stats.hp,
        maxHp: characterData.stats.maxHp,
        atk: characterData.stats.atk,
        mag: characterData.stats.mag,
        tags: characterData.tags || [characterData.className]
    };
    
    // Start game with selected character
    startGameWithCharacter(leader, characterData);
}

/**
 * Start game with selected character
 */
function startGameWithCharacter(leader, characterData) {
    // Set up party
    G.party = [leader];
    G.partyLeaderIndex = 0;
    
    // Initialize game level and region
    G.gridLevel = 1;
    G.totalLevels = 15;
    G.currentRegion = "forest";
    G.turn = 1;
    
    // Add starting cards for this character class
    addStartingCardsForCharacter(characterData);
    
    // Generate grid and start game
    generateGrid();
    renderAll(); // Use your UI render function
    
    addLogEntry(`${leader.name} begins their journey through the Cruxfade!`);
}

/**
 * Add starting cards based on character class
 */
function addStartingCardsForCharacter(characterData) {
    const regionData = GAME_DATA.allies['forest-region'];
    const classData = regionData[characterData.className];
    
    if (classData && classData.cards) {
        // Add class-specific cards
        classData.cards.forEach(cardTemplate => {
            const card = {
                id: `${cardTemplate.id}-leader`,
                name: cardTemplate.name,
                type: cardTemplate.type,
                description: cardTemplate.description
            };
            G.hand.push(card);
        });
    }
    
    // Add basic starting cards
    const basicCards = [
        { id: 'basic-attack-leader', name: 'Strike', type: 'attack', description: 'Deal basic damage to an enemy' },
        { id: 'basic-defend-leader', name: 'Guard', type: 'defense', description: 'Reduce incoming damage' }
    ];
    
    basicCards.forEach(card => {
        G.hand.push(card);
    });
}

/**
 * Fallback for when allies data isn't available
 */
function startWithDefaultCharacter() {
    const defaultLeader = {
        id: 'default-leader',
        name: 'Artorius the Brave',
        hp: 15,
        maxHp: 15,
        atk: 3,
        mag: 1,
        tags: ['human', 'warrior']
    };
    
    const defaultCharacterData = {
        className: 'warrior',
        name: 'Artorius the Brave',
        stats: { hp: 15, maxHp: 15, atk: 3, mag: 1 },
        tags: ['human', 'warrior']
    };
    
    startGameWithCharacter(defaultLeader, defaultCharacterData);
}
```

### Step 6: Update Import in state.js
**Find the import statement at the top of state.js and update it:**

```javascript
// Change from:
import { updateUI } from './ui.js';
// To:
import { renderAll } from './ui.js';
```

**Then find all calls to `updateUI()` in state.js and change them to `renderAll()`**

## Key Points for Success

1. **REPLACE functions, don't add duplicates**
2. **The setTimeout in showCharacterSelection() is critical** - it ensures GAME_DATA is ready
3. **Test after each step** - don't implement everything at once
4. **Character classes:** warrior, ranger, herbalist, rogue, paladin (all need to exist in allies.json)
5. **The procedural names will show as:** "Marcus the Shield-Bearer", "Lyanna the Holy", etc.

## Expected Flow After Implementation

1. Game loads → Character selection modal appears
2. Player sees 5 cards with procedural names and stats
3. Player clicks a card → Modal closes, game starts with that character
4. Character has appropriate starting cards and stats from allies.json

## Troubleshooting

- **Modal doesn't appear:** Check HTML structure and CSS imports
- **No character cards:** Check allies.json loading and setTimeout delay
- **Game doesn't start:** Check renderAll() import and function calls
- **Generic names:** Verify paladin class was added to allies.json properly

This guide should result in a clean, working character selection system that replaces "Leader" with procedural names like "Gareth the Righteous" for paladin or "Marcus the Shield-Bearer" for warrior.