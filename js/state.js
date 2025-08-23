// ================================================================
// CRUXFADE-MICRO - STATE.JS
// Single source of truth for all game state
// Pure functions for controlled state mutations
// ================================================================

// ================================================================
// GLOBAL GAME STATE OBJECT
// ================================================================

/**
 * The main game state object - single source of truth
 * All game data lives here and is mutated through controlled functions
 */
export const G = {
    // Random seed for reproducible runs
    seed: 0,
    
    // Current grid level (1-3, then boss)
    gridLevel: 1,
    
    // 3x3 board state
    board: {
        tiles: [],           // Array of 9 tile objects
        seen: new Set(),     // Set of seen tile indices
        player: { r: 1, c: 1 }  // Player position (center start)
    },
    
    // Party members (leader first)
    party: [
        { 
            id: 'you', 
            name: 'You',
            hp: 10, 
            maxHp: 10,
            atk: 2, 
            mag: 1, 
            tags: ['human', 'leader'] 
        }
    ],
    
    // Card system
    deck: [],
    discard: [],
    hand: [],
    
    // Equipment system (character id -> equipment array)
    equipment: {
        you: []
    },
    
    // Grid progression
    keyFound: false,
    
    // Game log messages
    log: [],
    
    // Game over flag
    over: false
};

// ================================================================
// INITIALIZATION FUNCTIONS
// ================================================================

/**
 * Initialize/reset the game to starting state
 */
export function initializeGame() {
    // Reset core values
    G.gridLevel = 1;
    G.keyFound = false;
    G.over = false;
    G.log = [];
    
    // Initialize player position to center
    G.board.player = { r: 1, c: 1 };
    G.board.seen = new Set();
    G.board.seen.add(4); // Center tile (1,1) = index 4
    
    // Generate initial 3x3 grid
    generateGrid();
    
    // Initialize starting deck
    initializeStartingDeck();
    
    // Reset party to starting state
    resetPartyToStart();
    
    console.log('🔄 Game state initialized');
}

/**
 * Generate a new 3x3 grid with encounters
 */
function generateGrid() {
    G.board.tiles = [];
    
    // Create 9 tiles (3x3 grid)
    for (let i = 0; i < 9; i++) {
        const row = Math.floor(i / 3);
        const col = i % 3;
        
        // Center tile (1,1) is always start/safe
        if (row === 1 && col === 1) {
            G.board.tiles.push({
                type: 'start',
                row: row,
                col: col,
                revealed: true
            });
        } else {
            // Random encounter for other tiles
            G.board.tiles.push({
                type: getRandomEncounterType(),
                row: row,
                col: col,
                revealed: false
            });
        }
    }
    
    // Ensure we have exactly one key and one door
    ensureKeyAndDoor();
}

/**
 * Get a random encounter type based on current grid level
 */
function getRandomEncounterType() {
    const encounters = ['fight', 'hazard', 'item', 'ally', 'empty'];
    const weights = [3, 2, 2, 1, 1]; // fights most common
    
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < encounters.length; i++) {
        if (random < weights[i]) {
            return encounters[i];
        }
        random -= weights[i];
    }
    
    return 'empty'; // fallback
}

/**
 * Ensure the grid has exactly one key and one door
 */
function ensureKeyAndDoor() {
    // Find non-start tiles
    const availableTiles = G.board.tiles.filter((tile, index) => index !== 4);
    
    // Place key and door in random available positions
    if (availableTiles.length >= 2) {
        const keyIndex = Math.floor(Math.random() * availableTiles.length);
        availableTiles[keyIndex].type = 'key';
        
        // Remove key tile from available tiles
        availableTiles.splice(keyIndex, 1);
        
        const doorIndex = Math.floor(Math.random() * availableTiles.length);
        availableTiles[doorIndex].type = 'door';
    }
}

/**
 * Initialize the starting deck
 */
function initializeStartingDeck() {
    G.deck = [
        { id: 'basic-strike', name: 'Basic Strike', type: 'attack' },
        { id: 'basic-strike-2', name: 'Basic Strike', type: 'attack' },
        { id: 'defend', name: 'Defend', type: 'defense' },
        { id: 'move', name: 'Quick Move', type: 'utility' }
    ];
    
    G.discard = [];
    G.hand = [...G.deck]; // Start with all cards in hand for now
}

/**
 * Reset party to starting composition
 */
function resetPartyToStart() {
    G.party = [
        { 
            id: 'you', 
            name: 'You',
            hp: 10, 
            maxHp: 10,
            atk: 2, 
            mag: 1, 
            tags: ['human', 'leader'] 
        }
    ];
    
    G.equipment = { you: [] };
}

// ================================================================
// PLAYER MOVEMENT FUNCTIONS
// ================================================================

/**
 * Attempt to move player to a new position
 * Returns true if move was successful
 */
export function movePlayer(newRow, newCol) {
    // Check bounds
    if (newRow < 0 || newRow > 2 || newCol < 0 || newCol > 2) {
        return false;
    }
    
    // Check if adjacent to current position
    const currentRow = G.board.player.r;
    const currentCol = G.board.player.c;
    const deltaRow = Math.abs(newRow - currentRow);
    const deltaCol = Math.abs(newCol - currentCol);
    
    if (deltaRow + deltaCol !== 1) {
        addLogEntry('❌ Can only move to adjacent tiles');
        return false;
    }
    
    // Move player
    G.board.player.r = newRow;
    G.board.player.c = newCol;
    
    // Mark tile as seen
    const tileIndex = newRow * 3 + newCol;
    G.board.seen.add(tileIndex);
    G.board.tiles[tileIndex].revealed = true;
    
    addLogEntry(`🚶 Moved to tile (${newRow}, ${newCol})`);
    
    return true;
}

/**
 * Get the current tile the player is standing on
 */
export function getCurrentTile() {
    const { r, c } = G.board.player;
    const index = r * 3 + c;
    return G.board.tiles[index];
}

// ================================================================
// PARTY MANAGEMENT FUNCTIONS
// ================================================================

/**
 * Add a new party member
 */
export function addPartyMember(memberData) {
    G.party.push(memberData);
    G.equipment[memberData.id] = [];
    addLogEntry(`🤝 ${memberData.name} joined your party!`);
}

/**
 * Get the party leader (first member)
 */
export function getPartyLeader() {
    return G.party[0] || null;
}

/**
 * Apply damage to a party member
 */
export function damagePartyMember(memberId, damage) {
    const member = G.party.find(m => m.id === memberId);
    if (member) {
        member.hp = Math.max(0, member.hp - damage);
        addLogEntry(`💔 ${member.name} takes ${damage} damage! (${member.hp}/${member.maxHp} HP)`);
        
        if (member.hp <= 0) {
            addLogEntry(`💀 ${member.name} has fallen!`);
        }
    }
}

/**
 * Heal a party member
 */
export function healPartyMember(memberId, amount) {
    const member = G.party.find(m => m.id === memberId);
    if (member) {
        const healAmount = Math.min(amount, member.maxHp - member.hp);
        member.hp += healAmount;
        addLogEntry(`💚 ${member.name} heals ${healAmount} HP! (${member.hp}/${member.maxHp} HP)`);
    }
}

// ================================================================
// CARD SYSTEM FUNCTIONS
// ================================================================

/**
 * Draw cards from deck to hand
 */
export function drawCards(count = 1) {
    for (let i = 0; i < count && G.deck.length > 0; i++) {
        const card = G.deck.pop();
        G.hand.push(card);
    }
}

/**
 * Play a card by ID
 */
export function playCard(cardId) {
    const cardIndex = G.hand.findIndex(card => card.id === cardId);
    if (cardIndex === -1) return false;
    
    const card = G.hand.splice(cardIndex, 1)[0];
    G.discard.push(card);
    
    addLogEntry(`🃏 Played ${card.name}`);
    return true;
}

// ================================================================
// GRID PROGRESSION FUNCTIONS
// ================================================================

/**
 * Found the key for this grid
 */
export function foundKey() {
    G.keyFound = true;
    addLogEntry('🗝️ Found the key! The door is now accessible.');
}

/**
 * Progress to the next grid
 */
export function nextGrid() {
    if (!G.keyFound) {
        addLogEntry('🚪 You need the key to proceed!');
        return false;
    }
    
    G.gridLevel++;
    G.keyFound = false;
    
    // Reset player position to center
    G.board.player = { r: 1, c: 1 };
    G.board.seen = new Set([4]); // Center tile seen
    
    // Generate new grid
    generateGrid();
    
    addLogEntry(`🌟 Entered Grid Level ${G.gridLevel}!`);
    return true;
}

// ================================================================
// LOGGING FUNCTIONS
// ================================================================

/**
 * Add an entry to the game log
 */
export function addLogEntry(message) {
    G.log.push(message);
    
    // Keep log at reasonable size
    if (G.log.length > 50) {
        G.log.shift(); // Remove oldest entry
    }
    
    console.log('📝 Log:', message);
}

/**
 * Clear the game log
 */
export function clearLog() {
    G.log = [];
}

// ================================================================
// UTILITY FUNCTIONS
// ================================================================

/**
 * Get tile at specific coordinates
 */
export function getTileAt(row, col) {
    if (row < 0 || row > 2 || col < 0 || col > 2) return null;
    const index = row * 3 + col;
    return G.board.tiles[index];
}

/**
 * Check if a tile is adjacent to player
 */
export function isAdjacentToPlayer(row, col) {
    const deltaRow = Math.abs(row - G.board.player.r);
    const deltaCol = Math.abs(col - G.board.player.c);
    return deltaRow + deltaCol === 1;
}