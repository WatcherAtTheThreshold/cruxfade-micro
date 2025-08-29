// ================================================================
// CRUXFADE-MICRO - MAIN.JS
// Bootstrap file that wires everything together
// ================================================================

// Import core modules
import { G, initializeGame, addLogEntry, setGameData, switchPartyLeader } from './state.js';
import { renderAll, bindEventHandlers } from './ui.js';
import { initRNG } from './rng.js';

// ================================================================
// DATA LOADING SYSTEM
// ================================================================

/**
 * Load all game data from JSON files
 */
async function loadGameData() {
    try {
        console.log('📁 Loading game data files...');
        
        // Load enemies.json (required)
        const enemiesResponse = await fetch('./data/enemies.json');
        
        if (!enemiesResponse.ok) {
            throw new Error(`Failed to load enemies.json: ${enemiesResponse.status} ${enemiesResponse.statusText}`);
        }
        
        const enemies = await enemiesResponse.json();
        console.log('✅ Enemies loaded:', enemies);
        
        // Optional files - don't fail if they don't exist
        let encounters = null;
        let items = null;
        let bosses = null; // NEW: Boss data
        
        try {
            const encountersResponse = await fetch('./data/encounters.json');
            if (encountersResponse.ok) {
                encounters = await encountersResponse.json();
                console.log('✅ Encounters loaded:', encounters);
            }
        } catch (e) {
            console.log('⚠️ encounters.json not found (optional)');
        }
        
        try {
            const itemsResponse = await fetch('./data/items.json');
            if (itemsResponse.ok) {
                items = await itemsResponse.json();
                console.log('✅ Items loaded:', items);
            }
        } catch (e) {
            console.log('⚠️ items.json not found (optional)');
        }
        
        // NEW: Load bosses.json
        try {
            const bossesResponse = await fetch('./data/bosses.json');
            if (bossesResponse.ok) {
                bosses = await bossesResponse.json();
                console.log('✅ Bosses loaded:', bosses);
                console.log('💀 Available bosses:', Object.keys(bosses).filter(key => key !== 'boss-enemies'));
            }
        } catch (e) {
            console.log('⚠️ bosses.json not found (boss encounters disabled)');
        }
        
        const gameData = {
            enemies: enemies,
            encounters: encounters,
            items: items,
            bosses: bosses  // NEW: Include boss data
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
        
        // Pass data to state system
        setGameData(gameData);
        
        // Initialize RNG with seed
        const seed = getSeedFromURL();
        G.seed = seed;
        initRNG(seed);
        
        // Initialize game state
        initializeGame();
        
        // Set up UI event handlers and pass updateGame as callback
        bindEventHandlers(updateGame);
        
        // Initial render of all game elements
        renderAll();
        
        // Add welcome message with boss hint
        addLogEntry('Welcome to the grid. Find the key to proceed...');
        
        // NEW: Show boss availability info
        if (gameData.bosses) {
            const bossCount = Object.keys(gameData.bosses).filter(key => key !== 'boss-enemies').length;
            addLogEntry(`💀 ${bossCount} epic bosses await in the deeper grids...`);
        }
        
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
    // NEW: Check victory condition first
    if (G.victory) {
        // Game won - don't trigger other end conditions
        return;
    }
    
    // NEW: Check for leader succession instead of immediate game over
    const leader = G.party[0]; // Current leader is always first
    if (!leader || leader.hp <= 0) {
        // Current leader is dead - check if we can promote someone
        const livingMembers = G.party.filter(member => member.hp > 0);
        
        if (livingMembers.length === 0) {
            // All party members dead - game over
            G.over = true;
            addLogEntry('💀 Game Over! All party members have fallen.');
            renderAll();
            return;
        } else {
            // Promote next living member to leader
            const newLeader = livingMembers[0];
            switchPartyLeader(newLeader.id);
            addLogEntry(`👑 ${newLeader.name} has taken leadership of the party!`);
            addLogEntry(`⚔️ The quest continues with ${livingMembers.length} party members remaining!`);
            
            // Update combat state if in combat
            if (G.combat.active) {
                G.combat.playerHp = newLeader.hp;
                addLogEntry(`⚔️ Combat continues with ${newLeader.name} (${newLeader.hp} HP)!`);
            }
            
            renderAll();
            return;
        }
    }
    
    // OLD: Basic win condition (now handled by boss system)
    // Keep as fallback for games without boss data
    if (G.gridLevel > 6 && !G.victory) {
        G.over = true;
        G.victory = true;
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
 * Get seed from URL parameters or generate random
 */
function getSeedFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const seedParam = urlParams.get('seed');
    if (seedParam && !isNaN(seedParam)) {
        return parseInt(seedParam);
    }
    return generateSeed();
}

/**
 * Start a new game with optional seed
 */
export function newGame(seed = null) {
    G.seed = seed || generateSeed();
    initRNG(G.seed);
    initializeGame();
    renderAll();
    addLogEntry(`🌱 New game started (Seed: ${G.seed})`);
    
    // NEW: Show boss info on new game
    const gameData = G._gameData || {};
    if (gameData.bosses) {
        const bossCount = Object.keys(gameData.bosses).filter(key => key !== 'boss-enemies').length;
        addLogEntry(`💀 ${bossCount} epic bosses await in Grid 4+...`);
    }
}

/**
 * Restart game with current seed (for testing)
 */
export function restartWithSeed() {
    initRNG(G.seed);
    initializeGame(); 
    renderAll();
    addLogEntry(`🔄 Restarted with seed: ${G.seed}`);
}

/**
 * Export the global state for debugging
 */
export function getGameState() {
    return G;
}

// NEW: Export boss testing functions for development
export function debugBoss() {
    if (!G.boss.active) {
        // Force trigger boss encounter
        G.gridLevel = 4;
        initializeGame();
        renderAll();
        addLogEntry('🐛 DEBUG: Forced boss encounter!');
    } else {
        console.log('🐛 Current boss state:', G.boss);
    }
}

export function debugVictory() {
    G.victory = true;
    G.over = true;
    addLogEntry('🐛 DEBUG: Forced victory state!');
    renderAll();
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

// Make functions available globally for debugging and testing
window.CruxfadeMicro = {
    getState: getGameState,
    newGame: newGame,
    restartWithSeed: restartWithSeed,
    update: updateGame,
    // NEW: Boss debugging functions
    debugBoss: debugBoss,
    debugVictory: debugVictory
};
