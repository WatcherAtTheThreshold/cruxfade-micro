// ================================================================
// CRUXFADE-MICRO - MAIN.JS
// Bootstrap file that wires everything together
// ================================================================

// Import core modules
import { G, initializeGame, addLogEntry, setGameData } from './state.js';
import { renderAll, bindEventHandlers } from './ui.js';
import { initRNG } from './rng.js';

// ================================================================
// GAME LOOP & STATE MANAGEMENT (DEFINED FIRST)
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
 * Check if the game should end (win/lose conditions) - DEBUG VERSION
 */
function checkGameEndConditions() {
    console.log('🔍 DEBUG: checkGameEndConditions called');
    console.log('🔍 DEBUG: G.victory:', G.victory);
    console.log('🔍 DEBUG: G.over:', G.over);
    console.log('🔍 DEBUG: Current party:', G.party.map(m => `${m.name}:${m.hp}HP`));
    
    // Check victory condition first
    if (G.victory) {
        console.log('🔍 DEBUG: Victory already achieved, skipping game over check');
        return;
    }
    
    // Get all living party members
    const livingMembers = G.party.filter(member => member.hp > 0);
    console.log('🔍 DEBUG: Living members:', livingMembers.map(m => `${m.name}:${m.hp}HP`));
    
    // If everyone is dead, game over
    if (livingMembers.length === 0) {
        console.log('🔍 DEBUG: All members dead - setting game over');
        G.over = true;
        G.combat.active = false;
        addLogEntry('💀 Game Over! All party members have fallen.');
        renderAll();
        return;
    }
    
    // If current leader is dead but others are alive, switch leader
    const currentLeader = G.party[0];
    console.log('🔍 DEBUG: Current leader:', currentLeader ? `${currentLeader.name}:${currentLeader.hp}HP` : 'none');
    
    if (currentLeader && currentLeader.hp <= 0 && livingMembers.length > 0) {
        console.log('🔍 DEBUG: Leader dead but others alive - switching leadership');
        
        // Find the first living member
        const newLeaderIndex = G.party.findIndex(member => member.hp > 0);
        console.log('🔍 DEBUG: New leader index:', newLeaderIndex);
        
        if (newLeaderIndex > 0) {
            // Move living member to position 0 (leader spot)
            const newLeader = G.party[newLeaderIndex];
            console.log('🔍 DEBUG: Promoting', newLeader.name, 'to leader');
            
            G.party.splice(newLeaderIndex, 1); // Remove from current position
            G.party.unshift(newLeader); // Add to front
            
            addLogEntry(`💔 ${currentLeader.name} has fallen! ${newLeader.name} takes leadership!`);
            
            // Update combat HP if in combat
            if (G.combat.active) {
                console.log('🔍 DEBUG: Updating combat HP from', G.combat.playerHp, 'to', newLeader.hp);
                G.combat.playerHp = newLeader.hp;
            }
        }
        
        console.log('🔍 DEBUG: Leadership switch complete - NOT ending game');
        return; // Don't end game - we have a new leader
    }
    
    console.log('🔍 DEBUG: No game over conditions met');
    
  if (G.gridLevel > 16 && !G.victory) {
    console.log('🔍 DEBUG: Grid level > 16 - fallback victory condition');
    G.over = true;
    G.victory = true;
    addLogEntry('🏆 Victory! You have conquered all grids!');
    renderAll();
    return;
}
}

// ================================================================
// DATA LOADING SYSTEM
// ================================================================

/**
 * Load all game data from JSON files
 */
async function loadGameData() {
    try {
        console.log('📁 Loading game data files...');
        
        const enemiesResponse = await fetch('./data/enemies.json');
        if (!enemiesResponse.ok) {
            throw new Error(`Failed to load enemies.json: ${enemiesResponse.status} ${enemiesResponse.statusText}`);
        }
        
        const enemies = await enemiesResponse.json();
        console.log('✅ Enemies loaded:', enemies);
        
        let encounters = null;
        let items = null;
        let bosses = null;
        
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
        
        try {
            const bossesResponse = await fetch('./data/bosses.json');
            if (bossesResponse.ok) {
                bosses = await bossesResponse.json();
                console.log('✅ Bosses loaded:', bosses);
                console.log('👀 Available bosses:', Object.keys(bosses).filter(key => key !== 'boss-enemies'));
            }
        } catch (e) {
            console.log('⚠️ bosses.json not found (boss encounters disabled)');
        }
        
        const gameData = {
            enemies: enemies,
            encounters: encounters,
            items: items,
            bosses: bosses
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
        const gameData = await loadGameData();
        setGameData(gameData);
        
        const seed = getSeedFromURL();
        G.seed = seed;
        initRNG(seed);
        
        initializeGame();
        bindEventHandlers(updateGame); // Now updateGame is defined
        renderAll();
        
        addLogEntry('Welcome to the grid. Find the key to proceed...');
        
        if (gameData.bosses) {
            const bossCount = Object.keys(gameData.bosses).filter(key => key !== 'boss-enemies').length;
            addLogEntry(`👀 ${bossCount} epic bosses await in the deeper grids...`);
        }
        
        console.log('✅ Game initialized successfully');
        
    } catch (error) {
        console.error('🚨 Game initialization failed:', error);
        document.body.innerHTML = '<h1>Failed to load game data. Check console for details.</h1>';
    }
}

// ================================================================
// UTILITY FUNCTIONS
// ================================================================

export function generateSeed() {
    return Math.floor(Math.random() * 99999);
}

function getSeedFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const seedParam = urlParams.get('seed');
    if (seedParam && !isNaN(seedParam)) {
        return parseInt(seedParam);
    }
    return generateSeed();
}

export function newGame(seed = null) {
    G.seed = seed || generateSeed();
    initRNG(G.seed);
    initializeGame();
    renderAll();
    addLogEntry(`🌱 New game started (Seed: ${G.seed})`);
    
    const gameData = G._gameData || {};
    if (gameData.bosses) {
        const bossCount = Object.keys(gameData.bosses).filter(key => key !== 'boss-enemies').length;
        addLogEntry(`👀 ${bossCount} epic bosses await in Grid 4+...`);
    }
}

export function restartWithSeed() {
    initRNG(G.seed);
    initializeGame(); 
    renderAll();
    addLogEntry(`🔄 Restarted with seed: ${G.seed}`);
}

export function getGameState() {
    return G;
}

export function debugBoss() {
    if (!G.boss.active) {
        G.gridLevel = 4;
        initializeGame();
        renderAll();
        addLogEntry('🛠 DEBUG: Forced boss encounter!');
    } else {
        console.log('🛠 Current boss state:', G.boss);
    }
}

export function debugVictory() {
    G.victory = true;
    G.over = true;
    addLogEntry('🛠 DEBUG: Forced victory state!');
    renderAll();
}

// ================================================================
// DOM READY & ERROR HANDLING
// ================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Make functions available globally
window.CruxfadeMicro = {
    getState: getGameState,
    newGame: newGame,
    restartWithSeed: restartWithSeed,
    update: updateGame,
    debugBoss: debugBoss,
    debugVictory: debugVictory
};

// Simplified error handler (no updateGame calls)
window.addEventListener('error', (event) => {
    console.error('🚨 Game Error:', event.error);
});
