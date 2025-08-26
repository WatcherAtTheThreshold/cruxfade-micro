// ================================================================
// CRUXFADE-MICRO - STATE.JS
// Single source of truth for all game state
// Pure functions for controlled state mutations
// ================================================================

// ================================================================
// GAME DATA STORAGE
// ================================================================

/**
 * Loaded game data from JSON files
 */
let GAME_DATA = {
    enemies: {},
    encounters: null,
    items: null
};

/**
 * Set the loaded game data
 */
export function setGameData(gameData) {
    GAME_DATA = gameData;
    console.log('📊 Game data set in state:', GAME_DATA);
}

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
    
    // 4x4 board state
    board: {
        tiles: [],           // Array of 16 tile objects
        seen: new Set(),     // Set of seen tile indices
        player: { r: 1, c: 0 }  // Player position (left edge start)
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
    
    // Combat state
    combat: {
        active: false,
        enemy: null,
        playerHp: 0,
        enemyHp: 0,
        turn: 'player', // 'player' or 'enemy'
        lastRoll: null
    },
    
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
    
    // Initialize player position to left edge start (1,0)
    G.board.player = { r: 1, c: 0 };
    G.board.seen = new Set();
    G.board.seen.add(4); // Left edge start (1,0) = index 4
    
    // Generate initial 4x4 grid
    generateGrid();
    
    // Initialize starting deck
    initializeStartingDeck();
    
    // Reset party to starting state
    resetPartyToStart();
    
    console.log('🔄 Game state initialized');
}

/**
 * Generate a new 4x4 grid with encounters
 */
function generateGrid() {
    G.board.tiles = [];
    
    // Get player's entrance position
    const entranceRow = G.board.player.r;
    const entranceCol = G.board.player.c;
    const entranceIndex = entranceRow * 4 + entranceCol; // 4x4 indexing
    
    // Create 16 tiles (4x4 grid)
    for (let i = 0; i < 16; i++) {
        const row = Math.floor(i / 4); // 4x4 math
        const col = i % 4;
        
        // Entrance tile is always safe/start type
        if (i === entranceIndex) {
            G.board.tiles.push({
                type: 'start',
                row: row,
                col: col,
                revealed: true,
                consumed: false
            });
        } else {
            // Random encounter for other tiles
