// ================================================================
// CRUXFADE-MICRO - MAIN.JS
// Bootstrap file that wires everything together
// ================================================================

// Import core modules
import { G, initializeGame, addLogEntry } from './state.js';
import { renderAll, bindEventHandlers } from './ui.js';

// ================================================================
// DATA LOADING SYSTEM
// ================================================================

/**
 * Load all game data from JSON files
 */
async function loadGameData() {
    try {
        console.log('📁 Loading game data files...');
        
        const [enemiesResponse, encountersResponse, itemsResponse] = await Promise.all([
            fetch('./data/enemies.json'),
            fetch('./data/encounters.json').catch(() => null), // Optional for now
            fetch('./data/items.json').catch(() => null)       // Optional for now
        ]);
        
        // Check if enemies.json loaded successfully
        if (!enemiesResponse.ok) {
            throw new Error(`Failed to load enemies.json: ${enemiesResponse.status} ${enemiesResponse.statusText}`);
        }
        
        const gameData = {
            enemies: await enemiesResponse.json(),
            encounters: encountersResponse ? await encountersResponse.json() : null,
            items: itemsResponse ? await itemsResponse.json() : null
        };
        
        console.log('🎮 Game data loaded:', gameData);
        return gameData;
        
    } catch (error) {
        console.error('❌ Failed to load game data:', error);
        throw error;
    }
}

// ================================================================
// MAIN INITIALIZATION
// ================================================================

/**
 * Initialize the entire game when DOM is loaded
 */
async function init() {
    console.log('🎮 Cruxfade-Micro starting up...');
    
    try {
        // Load game data first
        const gameData = await loadGameData();
        
        // Pass data to state system (Step 3 will add setGameData function)
        // setGameData(gameData);
        
        // Initialize game state
        initializeGame();
        
        // Set up UI event handlers and pass updateGame as callback
        bindEventHandlers(updateGame);
        
        // Initial render of all game elements
        renderAll();
        
        // Add welcome message
        addLogEntry('Welcome to the grid. Find the key to proceed...');
        
        console.log('✅ Game initialized successfully');
        console.log('🎯 Current state:', G);
        
    } catch (error) {
        console.error('🚨 Game initialization failed:', error);
        document.body.innerHTML = '<h1>Failed to load game data. Check console for details.</h1>';
    }
}

// ================================================================
// GAME LOOP & STATE MANAGEMENT
// ================================================================

/**
 * Main game update cycle - called after any state change
 */
export function updateGame() {
    // Re-render all UI elements to reflect state changes
    renderAll();
    
    // Check win/lose conditions
    checkGameEndConditions();
}

/**
 * Check if the game should end (win/lose conditions)
 */
function checkGameEndConditions() {
    // Check if player party leader is dead
    const leader = G.party.find(member => member.id === 'you');
    if (!leader || leader.hp <= 0) {
        G.over = true;
        addLogEntry('💀 Game Over! Party leader has fallen.');
        renderAll();
        return;
    }
    
    // Check win condition (placeholder for now)
    if (G.gridLevel > 3) {
        G.over = true;
        addLogEntry('🏆 Victory! You have conquered all grids!');
        renderAll();
        return;
    }
}

// ================================================================
// UTILITY FUNCTIONS
// ================================================================

/**
 * Generate a random seed for new games
 */
export function generateSeed() {
    return Math.floor(Math.random() * 99999);
}

/**
 * Start a new game with optional seed
 */
export function newGame(seed = null) {
    G.seed = seed || generateSeed();
    initializeGame();
    renderAll();
    addLogEntry(`🌱 New game started (Seed: ${G.seed})`);
}

/**
 * Export the global state for debugging
 */
export function getGameState() {
    return G;
}

// ================================================================
// DOM READY & ERROR HANDLING
// ================================================================

// Wait for DOM to be fully loaded before initializing
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    // DOM already loaded
    init();
}

// Global error handler for development
window.addEventListener('error', (event) => {
    console.error('🚨 Game Error:', event.error);
    addLogEntry(`❌ Error: ${event.error.message}`);
});

// Make some functions available globally for debugging
window.CruxfadeMicro = {
    getState: getGameState,
    newGame: newGame,
    update: updateGame
};
