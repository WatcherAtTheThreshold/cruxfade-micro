// ================================================================
// CRUXFADE-MICRO - MAIN.JS
// Bootstrap file that wires everything together
// ================================================================

// Import core modules
import { G, initializeGame, addLogEntry } from './state.js';
import { renderAll, bindEventHandlers } from './ui.js';

// ================================================================
// MAIN INITIALIZATION
// ================================================================

/**
 * Initialize the entire game when DOM is loaded
 */
function init() {
    console.log('🎮 Cruxfade-Micro starting up...');
    
    // Initialize game state
    initializeGame();
    
    // Set up UI event handlers (tile clicks, buttons, etc.)
    bindEventHandlers();
    
    // Initial render of all game elements
    renderAll();
    
    // Add welcome message
    addLogEntry('Welcome to the grid. Find the key to proceed...');
    
    console.log('✅ Game initialized successfully');
    console.log('🎯 Current state:', G);
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