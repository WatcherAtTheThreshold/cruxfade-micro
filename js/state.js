// ================================================================
// CRUXFADE-MICRO - STATE.JS
// Single source of truth for all game state
// Pure functions for controlled state mutations
// ================================================================

// Import seeded RNG functions
import { random, randomInt, pickRandom } from './rng.js';

// ADD THIS LINE:
import { renderAll } from './ui.js';

// ================================================================
// GAME DATA STORAGE
// ================================================================

/**
 * Loaded game data from JSON files
 */
let GAME_DATA = {
    enemies: {},
    encounters: null,
    items: null,
    bosses: null  // NEW: Boss encounter data
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
            id: 'leader', 
            name: 'Leader',
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
    
    // NEW: Boss encounter state
    boss: {
        active: false,        // Currently in a boss sequence
        bossId: null,         // Which boss we're fighting
        currentPhase: 0,      // Current phase index
        phaseComplete: false, // Current phase finished
        defeated: false,      // Boss fully defeated
        enemyIndex: 0         // Current enemy in sequential fight
    },
    
    // Game over flag
    over: false,
    
    // NEW: Victory state
    victory: false
};

// ================================================================
// UPDATED: TILE CREATION - ADD COMBAT ENGAGEMENT TRACKING
// ================================================================

/**
 * Generate a new 4x4 grid with encounters - UPDATED to track combat engagement
 */
function generateGrid() {
    G.board.tiles = [];
    
    // Check if this should be a boss encounter
    if (shouldTriggerBoss()) {
        generateBossGrid();
        return;
    }
    
    // Get player's entrance position
    const entranceRow = G.board.player.r;
    const entranceCol = G.board.player.c;
    const entranceIndex = entranceRow * 4 + entranceCol; // 4x4 indexing
    
    // Create 16 tiles (4x4 grid) - ALL START AS HIDDEN
    for (let i = 0; i < 16; i++) {
        const row = Math.floor(i / 4); // 4x4 math
        const col = i % 4;
        
        // Entrance tile is immediately EXPLORED (shows actual content)
        if (i === entranceIndex) {
            G.board.tiles.push({
                type: 'start',
                row: row,
                col: col,
                discovered: true,    // NEW: Player can see this tile exists
                explored: true,      // NEW: Player has been here, shows actual content
                consumed: false,     // Whether encounter is complete
                combatEngaged: false // NEW: Track if player has engaged with combat
            });
        } else {
            // All other tiles start as HIDDEN (not discovered, not explored)
            const tileType = getRandomEncounterType();
            G.board.tiles.push({
                type: tileType,
                row: row,
                col: col,
                discovered: false,   // NEW: Player doesn't know this tile exists yet
                explored: false,     // NEW: Player hasn't been here yet
                consumed: false,     // Whether encounter is complete
                combatEngaged: false // NEW: Track if player has engaged with combat (all tiles)
            });
        }
    }
    
    // Reveal adjacent tiles to starting position as DISCOVERABLE
    revealAdjacentTilesAsDiscoverable(entranceRow, entranceCol);
    
    // Ensure we have exactly one key and one door
    ensureKeyAndDoor();
}

/**
 * Initialize the game - now shows character selection first
 * REPLACE existing initializeGame() function with this
 */
export function initializeGame() {
    console.log('🎮 Initializing game...');
    
    // ONLY reset basic state - don't do any UI rendering yet
    resetGameStateMinimal();
    
    // Show character selection IMMEDIATELY (no timeout, no other UI calls)
    showCharacterSelectionImmediate();
}

/**
 * Reset only essential game state - no UI rendering
 */
function resetGameStateMinimal() {
    G.victory = false;
    G.over = false;
    G.party = [];
    G.hand = [];
    G.gridLevel = 1;
    G.keyFound = false;
    G.log = [];
    
    // Reset boss state
    G.boss = {
        active: false,
        bossId: null,
        currentPhase: 0,
        phaseComplete: false,
        defeated: false,
        enemyIndex: 0
    };
    
    console.log('🔄 Minimal game state reset complete');
}

/**
 * Show character selection without any delays or other UI calls
 */
function showCharacterSelectionImmediate() {
    console.log('🔍 DEBUG: showCharacterSelectionImmediate called');
    
    // Find modal immediately - no timeout
    const modal = document.getElementById('character-selection-modal');
    
    console.log('🔍 DEBUG: Modal search result:', modal);
    console.log('🔍 DEBUG: Modal in DOM tree:', document.contains(modal));
    
    if (modal) {
        console.log('✅ Modal found! Showing character selection...');
        modal.style.display = 'flex';
        
        // Generate and populate character cards
        const characterCards = generateCharacterCards();
        console.log('🔍 DEBUG: Generated character cards:', characterCards);
        
        if (characterCards.length > 0) {
            populateCharacterSelectionModal(characterCards);
        } else {
            console.warn('No character cards generated, using default character');
            startWithDefaultCharacter();
        }
    } else {
        console.error('❌ Character selection modal not found! Using default character');
        console.log('🔍 DEBUG: Available elements with "modal" in class or id:');
        document.querySelectorAll('[class*="modal"], [id*="modal"]').forEach(el => {
            console.log('  Found:', el.tagName, el.id, el.className);
        });
        startWithDefaultCharacter();
    }
}

// ================================================================
// UPDATED: BOSS GRID GENERATION - ADD COMBAT ENGAGEMENT TRACKING
// ================================================================

/**
 * Generate a boss encounter grid - UPDATED for combat engagement tracking
 */
function generateBossGrid() {
    const boss = getBossForLevel(G.gridLevel);
    if (!boss) {
        console.error('No boss found for grid level:', G.gridLevel);
        generateGrid(); // Fallback to normal grid
        return;
    }
    
    // Initialize boss state
    G.boss.active = true;
    G.boss.bossId = boss.id;
    G.boss.currentPhase = 0;
    G.boss.phaseComplete = false;
    G.boss.defeated = false;
    G.boss.enemyIndex = 0;
    
    // Create a 4x4 grid with fog of war
    G.board.tiles = [];
    
    for (let i = 0; i < 16; i++) {
        const row = Math.floor(i / 4);
        const col = i % 4;
        
        // Player starts at entrance (left edge) - EXPLORED
        if (row === G.board.player.r && col === G.board.player.c) {
            G.board.tiles.push({
                type: 'start',
                row: row,
                col: col,
                discovered: true,     // NEW: Fog of war compatible
                explored: true,       // NEW: Fog of war compatible
                consumed: false,
                combatEngaged: false  // NEW: Combat engagement tracking
            });
        }
        // Boss encounter in center (tile 5) - HIDDEN initially
        else if (i === 5) { // Center-left tile
            G.board.tiles.push({
                type: 'boss-encounter',
                row: row,
                col: col,
                discovered: false,    // NEW: Hidden until player moves adjacent
                explored: false,      // NEW: Hidden until player steps on it
                consumed: false,
                bossId: boss.id,
                combatEngaged: false  // NEW: Combat engagement tracking
            });
        }
        // Empty tiles elsewhere - HIDDEN initially
        else {
            G.board.tiles.push({
                type: 'empty',
                row: row,
                col: col,
                discovered: false,    // NEW: Hidden until discovered
                explored: false,      // NEW: Hidden until explored
                consumed: false,
                combatEngaged: false  // NEW: Combat engagement tracking
            });
        }
    }
    
    // Reveal adjacent tiles to starting position
    const entranceRow = G.board.player.r;
    const entranceCol = G.board.player.c;
    revealAdjacentTilesAsDiscoverable(entranceRow, entranceCol);
    
    addLogEntry(`💀 You have entered the ${boss.data.name}'s domain...`);
    addLogEntry(`📖 ${boss.data.description}`);
}


// ================================================================
// NEW: ADJACENT TILE DISCOVERY FUNCTION
// ================================================================

/**
 * Reveal tiles adjacent to given position as discoverable (show "?" icon)
 * @param {number} centerRow - Row to reveal around
 * @param {number} centerCol - Column to reveal around
 */
function revealAdjacentTilesAsDiscoverable(centerRow, centerCol) {
    // Check all 4 adjacent directions (no diagonals)
    const directions = [
        { dr: -1, dc: 0 }, // Up
        { dr: 1, dc: 0 },  // Down
        { dr: 0, dc: -1 }, // Left
        { dr: 0, dc: 1 }   // Right
    ];
    
    directions.forEach(({ dr, dc }) => {
        const newRow = centerRow + dr;
        const newCol = centerCol + dc;
        
        // Check if position is within 4x4 grid bounds
        if (newRow >= 0 && newRow < 4 && newCol >= 0 && newCol < 4) {
            const tileIndex = newRow * 4 + newCol;
            const tile = G.board.tiles[tileIndex];
            
            // Only reveal as discoverable if not already explored
            if (tile && !tile.explored) {
                tile.discovered = true;  // Player can now see this tile (with "?" icon)
                G.board.seen.add(tileIndex); // Add to seen set for compatibility
            }
        }
    });
    
    addLogEntry(`🔍 You can see ${directions.length} adjacent areas to explore...`);
}

// ================================================================
// NEW: BOSS SYSTEM FUNCTIONS
// ================================================================

/**
 * Check if current grid level should trigger a boss encounter

function shouldTriggerBoss() {
    if (!GAME_DATA.bosses) return false;
    
    // Check if current grid level matches any boss unlock level
    for (const [bossId, bossData] of Object.entries(GAME_DATA.bosses)) {
        if (bossId === 'boss-enemies') continue;
        if (bossData.unlockLevel === G.gridLevel) {
            return true;
        }
    }
    return false;
} */

/**
 * Check if current grid level should trigger a boss encounter
*/
function shouldTriggerBoss() {
    console.log('shouldTriggerBoss called for grid level:', G.gridLevel);
    console.log('GAME_DATA:', !!GAME_DATA);
    console.log('GAME_DATA.bosses:', !!GAME_DATA?.bosses);
    
    if (!GAME_DATA || !GAME_DATA.bosses) {
        console.log('No boss data available');
        return false;
    }
    
    // Check if current grid level matches any boss unlock level
    for (const [bossId, bossData] of Object.entries(GAME_DATA.bosses)) {
        if (bossId === 'boss-enemies') continue;
        console.log(`Checking ${bossId}: unlock level ${bossData.unlockLevel} vs current ${G.gridLevel}`);
        if (bossData.unlockLevel === G.gridLevel) {
            console.log(`BOSS MATCH! ${bossId} should trigger for grid ${G.gridLevel}`);
            return true;
        }
    }
    console.log('No boss matches found for grid level', G.gridLevel);
    return false;
}

/**
 * Get the appropriate boss for current grid level
 */
function getBossForLevel(level) {
    if (!GAME_DATA.bosses) return null;
    
    // Match boss to grid level based on unlockLevel
    for (const [bossId, bossData] of Object.entries(GAME_DATA.bosses)) {
        if (bossId === 'boss-enemies') continue; // Skip enemy definitions
        if (bossData.unlockLevel === level) {
            return { id: bossId, data: bossData };
        }
    }
    
    // Fallback to first available boss
    const firstBoss = Object.entries(GAME_DATA.bosses)[0];
    if (firstBoss && firstBoss[0] !== 'boss-enemies') {
        return { id: firstBoss[0], data: firstBoss[1] };
    }
    
    return null;
}


/**
 * Start the current boss phase
 */
export function startBossPhase() {
    if (!G.boss.active || !G.boss.bossId) {
        console.error('No active boss encounter');
        return false;
    }
    
    const bossData = GAME_DATA.bosses[G.boss.bossId];
    if (!bossData || !bossData.phases) {
        console.error('Invalid boss data');
        return false;
    }
    
    const phase = bossData.phases[G.boss.currentPhase];
    if (!phase) {
        console.error('Invalid phase index:', G.boss.currentPhase);
        return false;
    }
    
    // Show phase intro text
    addLogEntry(`⚡ ${phase.name}`);
    addLogEntry(`📜 ${phase.flavorText}`);
    
    // Handle different phase types
    switch (phase.type) {
        case 'fight':
            return startBossPhaseFight(phase);
        case 'hazard':
            return startBossPhaseHazard(phase);
        case 'boss-fight':
            return startBossPhaseFinal(phase);
        case 'party-choice':
            return startBossPhaseChoice(phase);
        default:
            console.error('Unknown boss phase type:', phase.type);
            return false;
    }
}

/**
 * Start a fight phase (minions)
 */
function startBossPhaseFight(phase) {  // ← Add the parameter here!
    if (!phase.enemies || phase.enemies.length === 0) {
        addLogEntry('⚔️ No enemies to fight - phase complete!');
        completeBossPhase();
        return true;
    }
    
    // Get current enemy in the sequence
    const currentEnemyIndex = G.boss.enemyIndex || 0;
    
    if (currentEnemyIndex >= phase.enemies.length) {
        // All enemies defeated - complete phase
        addLogEntry('⚔️ All enemies defeated!');
        completeBossPhase();
        return true;
    }
    
    const enemyType = phase.enemies[currentEnemyIndex];
    const remaining = phase.enemies.length - currentEnemyIndex;
    
    addLogEntry(`⚔️ Fighting enemy ${currentEnemyIndex + 1} of ${phase.enemies.length}: ${enemyType}`);
    if (remaining > 1) {
        addLogEntry(`📋 ${remaining - 1} enemies remain after this one...`);
    }
    
    // Use regular combat but with boss phase flag
    console.log('🛠 DEBUG: Starting boss phase minion fight with enemy:', enemyType);
    return startCombat(enemyType, phase);
}

/**
 * Start a hazard phase  
 */
function startBossPhaseHazard(phase) {
    // Use the enhanced hazard system with boss-specific parameters
    const hazardData = {
        name: phase.name,
        difficulty: phase.difficulty || 15,
        damage: phase.damage || 3,
        stat: phase.preferredStat || 'atk',
        successText: phase.successText,
        failureText: phase.failureText
    };
    
    return resolveBossHazard(hazardData);
}

/**
 * Start the final boss fight phase
 */
function startBossPhaseFinal(phase) {
    if (!phase.enemy) {
        console.error('Boss fight phase missing enemy');
        return false;
    }
    
    // Get boss enemy data
    const bossEnemyData = GAME_DATA.bosses['boss-enemies'][phase.enemy];
    if (!bossEnemyData) {
        console.error('Boss enemy not found:', phase.enemy);
        return false;
    }
    
    // Start combat with boss
    return startBossCombat(bossEnemyData, phase);
}

/**
 * Start a choice phase (placeholder)
 */
function startBossPhaseChoice(phase) {
    addLogEntry('🤔 ' + phase.mechanicText);
    // For now, auto-proceed - TODO: implement choice UI
    completeBossPhase();
    return true;
}

/**
 * Complete the current boss phase
 */
export function completeBossPhase() {
    if (!G.boss.active) return;
    
    const bossData = GAME_DATA.bosses[G.boss.bossId];
    const phase = bossData.phases[G.boss.currentPhase];
    
    // Show phase completion text
    if (phase.victoryText) {
        addLogEntry(`✅ ${phase.victoryText}`);
    }
    
    G.boss.phaseComplete = true;
    G.boss.currentPhase++;
    G.boss.enemyIndex = 0;
    
    // Check if boss is fully defeated
    if (G.boss.currentPhase >= bossData.phases.length) {
        console.log('🛠️ DEBUG: All phases complete, calling defeatBoss...');
        defeatBoss();
    } else {
        addLogEntry('📈 Phase complete. Preparing for next challenge...');
        // DON'T consume tile - keep boss encounter active
        console.log('🛠️ DEBUG: Boss phase complete, NOT consuming tile');
    }
}
/**
 * Handle boss defeat and victory
 */
function defeatBoss() {
    const bossData = GAME_DATA.bosses[G.boss.bossId];
    
    G.boss.defeated = true;
    
    // Show victory messages
    addLogEntry(`🎉 ${bossData.victoryRewards.completionMessage}`);
    
    if (bossData.victoryRewards.gold) {
        addLogEntry(`💰 Gained ${bossData.victoryRewards.gold} gold!`);
    }
    
    if (bossData.victoryRewards.experience) {
        addLogEntry(`⭐ Gained ${bossData.victoryRewards.experience} experience!`);
    }
    
    // Check if this is the FINAL boss (only Void Empress should have gameComplete: true)
    if (bossData.victoryRewards.gameComplete) {
        G.victory = true;
        G.over = true;
        addLogEntry('🏆 CAMPAIGN COMPLETE! You have saved all of existence!');
        console.log('🏆 Final boss defeated! Game complete!');
    } else {
        // CAMPAIGN CONTINUES - Reset boss state but don't end game
        console.log('⭐ Boss defeated but campaign continues...');
        
        // Campaign progression rewards
        addLogEntry('⚡ The boss power flows through your party!');
        addLogEntry('💚 All party members fully healed!');
        addLogEntry('🔮 Party strength increased!');
        
        // Heal all party members to full
        G.party.forEach(member => {
            if (member.hp > 0) { // Only heal living members
                member.hp = member.maxHp;
            }
        });
        
        // Stat boosts for campaign progression
        const leader = G.party[0];
        if (leader) {
            leader.maxHp += 2;
            leader.hp = leader.maxHp; // Set to new max
            leader.atk += 1;
            addLogEntry(`💪 ${leader.name} grows stronger! (+2 HP, +1 ATK)`);
        }
        
        // CRITICAL FIX: Find the actual boss encounter tile, not player's current tile
        const bossTile = G.board.tiles.find(tile => tile.type === 'boss-encounter');
        console.log('🛠️ DEBUG: Converting boss tile:', bossTile);
        console.log('🛠️ DEBUG: Boss tile type before conversion:', bossTile?.type);
        
        if (bossTile && bossTile.type === 'boss-encounter') {
            console.log('🛠️ DEBUG: Boss tile found, converting to door...');
            bossTile.type = 'door';
            bossTile.consumed = false; // Make sure it's usable
            console.log('🛠️ DEBUG: Boss tile type after conversion:', bossTile.type);
            addLogEntry('🚪 A path to the deeper realms opens before you...');
            
            // Set key found so door can be used immediately
            G.keyFound = true;
            
            // Continue exploring message
            const nextBossLevel = getNextBossLevel();
            if (nextBossLevel) {
                addLogEntry(`🗺️ Use the door to continue your journey! Next challenge awaits at Grid ${nextBossLevel}`);
            } else {
                addLogEntry('🗺️ Use the door to face the ultimate evil!');
            }
        } else {
            console.error('🚨 ERROR: Could not find boss encounter tile to convert to door!');
            console.log('🛠️ DEBUG: Available tiles:', G.board.tiles.map(t => `${t.type}(${t.row},${t.col})`));
        }
        
        // Reset boss encounter state AFTER tile conversion
        G.boss.active = false;
        G.boss.bossId = null;
        G.boss.currentPhase = 0;
        G.boss.phaseComplete = false;
        G.boss.defeated = false;
        G.boss.enemyIndex = 0;
    }
    
    console.log('🏆 Boss defeat processing complete');
}
    
/**
 * Get the level of the next boss encounter  
 */
function getNextBossLevel() {
    if (!GAME_DATA.bosses) return null;
    
    const currentLevel = G.gridLevel;
    const bossLevels = [];
    
    // Collect all boss unlock levels
    for (const [bossId, bossData] of Object.entries(GAME_DATA.bosses)) {
        if (bossId === 'boss-enemies') continue; // Skip enemy definitions
        if (bossData.unlockLevel && bossData.unlockLevel > currentLevel) {
            bossLevels.push(bossData.unlockLevel);
        }
    }
    
    // Return the next boss level
    bossLevels.sort((a, b) => a - b);
    return bossLevels[0] || null;
}

/**
 * Enhanced hazard resolver for boss encounters
 */
function resolveBossHazard(hazardData) {
    const player = getPartyLeader();
    if (!player) return false;
    
    const roll = rollDice(20);
    const statBonus = player[hazardData.stat];
    const total = roll + statBonus;
    
    addLogEntry(`⚡ ${hazardData.name}! Rolling to overcome... (d20 + ${hazardData.stat.toUpperCase()})`);
    addLogEntry(`🎲 Rolled ${roll} + ${statBonus} = ${total} (need ${hazardData.difficulty}+)`);
    
    if (total >= hazardData.difficulty) {
        addLogEntry(`✅ ${hazardData.successText || 'Success! You overcame the hazard!'}`);
        completeBossPhase();
        return { success: true };
    } else {
        const damage = hazardData.damage;
        damagePartyMember(player.id, damage);
        addLogEntry(`❌ ${hazardData.failureText || 'Failed! The hazard damages you!'}`);
        
        // Continue to next phase even on failure (boss fights are forgiving)
        completeBossPhase();
        return { success: false };
    }
}

/**
 * Start combat with a boss enemy
 */
function startBossCombat(bossEnemyData, phase) {
    const player = getPartyLeader();
    if (!player) return false;
    
    console.log('🐛 DEBUG: startBossCombat called with enemy:', bossEnemyData.name, 'phase:', phase?.name);
    
    G.combat.active = true;
    G.combat.enemy = { ...bossEnemyData };
    G.combat.playerHp = player.hp;
    G.combat.enemyHp = bossEnemyData.hp;
    G.combat.turn = 'player';
    G.combat.lastRoll = null;
    
    // Store phase data for special handling
    G.combat.bossPhase = phase;
    
    console.log('🐛 DEBUG: Boss combat initialized - bossPhase set to:', !!G.combat.bossPhase);
    
    addLogEntry(`💀 Final battle with ${bossEnemyData.name}!`);
    addLogEntry(`📊 Boss HP: ${bossEnemyData.hp} | Your HP: ${player.hp}`);
    
    return true;
}

/**
 * Check if player is currently in a boss encounter
 */
export function isInBossEncounter() {
    return G.boss.active;
}

/**
 * Get current boss phase data
 */
export function getCurrentBossPhase() {
    if (!G.boss.active || !G.boss.bossId) return null;
    
    const bossData = GAME_DATA.bosses[G.boss.bossId];
    if (!bossData || !bossData.phases) return null;
    
    return bossData.phases[G.boss.currentPhase];
}

/**
 * Get current boss data
 */
 export function getCurrentBoss() {
    if (!G.boss.active || !G.boss.bossId) return null;
    return GAME_DATA.bosses[G.boss.bossId];
}

// ================================================================
// MODIFIED: GRID PROGRESSION FUNCTIONS
// ================================================================

/**
 * Progress to the next grid (modified to handle bosses)
 */
export function nextGrid() {
    if (!G.keyFound && !isInBossEncounter()) {
        addLogEntry('🚪 You need the key to proceed!');
        return false;
    }
    
    // Get current player position (exit door location)
    const exitRow = G.board.player.r;
    const exitCol = G.board.player.c;
    
    // Calculate entrance position on new grid (opposite corner)
    const entranceRow = 3 - exitRow; // 4x4 opposite
    const entranceCol = 3 - exitCol;
    
    G.gridLevel++;
    G.keyFound = false;
    
    // Set player position to calculated entrance (opposite of exit)
    G.board.player = { r: entranceRow, c: entranceCol };
    
    // Calculate entrance tile index and mark as seen (4x4)
    const entranceIndex = entranceRow * 4 + entranceCol;
    G.board.seen = new Set([entranceIndex]);
    
    // Generate new grid (will detect boss automatically)
    generateGrid();
    
    // Make sure the entrance tile is revealed
    G.board.tiles[entranceIndex].revealed = true;
    
    const gridType = shouldTriggerBoss() ? 'Boss Domain' : `Grid Level ${G.gridLevel}`;
    addLogEntry(`🌟 Entered ${gridType}! (Entered from ${getPositionName(entranceRow, entranceCol)})`);
    
    return true;
}

// ================================================================
// MODIFIED: COMBAT SYSTEM FUNCTIONS  
// ================================================================

/**
 * End combat with victory or defeat (fixed for boss handling)
 */
export function endCombat(victory) {
    console.log('🐛 DEBUG: endCombat called with victory:', victory, 'combat active:', G.combat.active);
    
    if (!G.combat.active) {
        console.log('🐛 DEBUG: Combat not active, returning early');
        return;
    }
    
    try {
        if (victory) {
            addLogEntry(`🎉 Victory! You defeated the ${G.combat.enemy.name}!`);
            
            // Check if this was a boss fight
            if (G.combat.bossPhase) {
                console.log('🐛 DEBUG: Boss fight victory detected');
                
                const phase = getCurrentBossPhase();
                
                if (phase && phase.type === 'fight' && phase.enemies && phase.enemies.length > 1) {
                    // Sequential fight - advance to next enemy
                    G.boss.enemyIndex = (G.boss.enemyIndex || 0) + 1;
                    
                    if (G.boss.enemyIndex >= phase.enemies.length) {
                        // All enemies in sequence defeated - complete phase
                        addLogEntry(`⚔️ All minions defeated! Phase complete!`);
                        completeBossPhase();
                        // DON'T consume tile - let boss system handle it
                    } else {
                        // More enemies to fight - DON'T consume tile
                        const remaining = phase.enemies.length - G.boss.enemyIndex;
                        addLogEntry(`✅ Enemy defeated! ${remaining} enemies remain in this phase.`);
                        addLogEntry(`💀 Return to the boss encounter to continue fighting!`);
                    }
                } else {
                    // Single enemy fight or final boss - complete phase
                    console.log('🐛 DEBUG: Final boss or single fight, completing phase...');
                    completeBossPhase();
                    // DON'T consume current tile - let defeatBoss() handle boss tile conversion
                }
            } else {
                // Normal combat - consume tile as usual
                consumeCurrentTile();
            }
        } else {
            // Combat defeat
            addLogEntry(`💀 Defeat! The ${G.combat.enemy.name} has bested you!`);
            
            if (G.combat.playerHp <= 0) {
                if (G.combat.bossPhase) {
                    const phase = G.combat.bossPhase;
                    if (phase.defeatText) {
                        addLogEntry(`💀 ${phase.defeatText}`);
                    }
                }
            }
        }
        
        // Reset combat state
        G.combat.active = false;
        G.combat.enemy = null;
        G.combat.playerHp = 0;
        G.combat.enemyHp = 0;
        G.combat.turn = 'player';
        G.combat.lastRoll = null;
        G.combat.bossPhase = null;
        
        console.log('🐛 DEBUG: Combat state reset complete');
        
    } catch (error) {
        console.error('🚨 ERROR in endCombat:', error);
        
        // Fallback: reset combat state even if there was an error
        G.combat.active = false;
        G.combat.enemy = null;
        G.combat.playerHp = 0;
        G.combat.enemyHp = 0;
        G.combat.turn = 'player';
        G.combat.lastRoll = null;
        G.combat.bossPhase = null;
    }
}
// ================================================================
// EXISTING FUNCTIONS (unchanged)
// ================================================================

/**
 * Get a random encounter type based on current grid level
 */
function getRandomEncounterType() {
    // If no encounter data loaded, use defaults
    if (!GAME_DATA.encounters) {
        const encounters = ['fight', 'hazard', 'item', 'ally', 'empty'];
        const weights = [3, 2, 2, 1, 1];
        return getWeightedRandom(encounters, weights);
    }
    
    // Use data-driven encounters
    const gridKey = `grid-${G.gridLevel}`;
    const gridData = GAME_DATA.encounters[gridKey] || GAME_DATA.encounters['grid-1'];
    const weights = gridData.encounterWeights;
    
    const encounters = Object.keys(weights);
    const weightValues = Object.values(weights);
    
    return getWeightedRandom(encounters, weightValues);
}

/**
 * Utility function for weighted random selection
 */
function getWeightedRandom(items, weights) {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let randomValue = random() * totalWeight;
    
    for (let i = 0; i < items.length; i++) {
        if (randomValue < weights[i]) {
            return items[i];
        }
        randomValue -= weights[i];
    }
    
    return items[0]; // fallback
}

/**
 * Get a random enemy type based on current grid
 */
export function getRandomEnemyType() {
    if (!GAME_DATA.encounters) {
        return 'goblin'; // fallback
    }
    
    const gridKey = `grid-${G.gridLevel}`;
    const gridData = GAME_DATA.encounters[gridKey] || GAME_DATA.encounters['grid-1'];
    const enemyPools = gridData.enemyPools;
    
    // 80% chance common, 20% chance rare
    const useRare = random() < 0.2;
    const pool = useRare ? enemyPools.rare : enemyPools.common;
    
    return pickRandom(pool);
}

/**
 * Ensure the grid has exactly one key and one door
 */
function ensureKeyAndDoor() {
    // Find non-start tiles
    const entranceIndex = G.board.player.r * 4 + G.board.player.c; // 4x4 indexing
    const availableTiles = G.board.tiles.filter((tile, index) => index !== entranceIndex);
    
    // Place key and door in random available positions
    if (availableTiles.length >= 2) {
        const keyIndex = randomInt(0, availableTiles.length - 1);
        availableTiles[keyIndex].type = 'key';
        
        // Remove key tile from available tiles
        availableTiles.splice(keyIndex, 1);
        
        const doorIndex = randomInt(0, availableTiles.length - 1);
        availableTiles[doorIndex].type = 'door';
    }
}

/**
 * Initialize the starting deck  Hide this one.....{ id: 'move', name: 'Quick Move', type: 'utility' }
 */
function initializeStartingDeck() {
    G.deck = [
        
        { id: 'basic-strike', name: 'Basic Strike', type: 'attack' },
        { id: 'defend', name: 'Defend', type: 'defense' },
        
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
            id: 'leader', 
            name: 'Leader',
            hp: 10, 
            maxHp: 10,
            atk: 2, 
            mag: 1, 
            tags: ['human', 'leader'] 
        }
    ];
    
    G.equipment = { leader: [] };
}

// ================================================================
// UPDATED: TILE COMPLETION CHECK - FIX FIGHT TILE ESCAPE BUG
// ================================================================

/**
 * Check if the current tile encounter is completed - FIXED fight tile bug
 */
export function isCurrentTileCompleted() {
    const currentTile = getCurrentTile();
    if (!currentTile) return true;
    
    console.log('🔍 Tile completion check:', {
        type: currentTile.type,
        consumed: currentTile.consumed,
        combatActive: G.combat.active,
        combatEngaged: currentTile.combatEngaged, // NEW: Log engagement status
        playerPos: `${G.board.player.r},${G.board.player.c}`
    });
    
    // Start tiles are always considered completed
    if (currentTile.type === 'start') return true;
    
    // Empty tiles are completed when stepped on
    if (currentTile.type === 'empty') return true;
    
    // Door tiles: you can always move away from doors
    if (currentTile.type === 'door') return true;
    
    // FIGHT TILES: FIXED LOGIC - Must engage with combat before leaving
    if (currentTile.type === 'fight') {
        // Can leave if consumed (defeated enemy) OR if engaged and no longer in active combat (fled successfully)
        const canMove = currentTile.consumed || (currentTile.combatEngaged && !G.combat.active);
        
        console.log('⚔️ Fight tile check:', {
            consumed: currentTile.consumed,
            combatActive: G.combat.active,
            combatEngaged: currentTile.combatEngaged,
            canMove: canMove
        });
        
        return canMove;
    }
    
    // All other tiles check consumed status
    return currentTile.consumed === true;
}


// ================================================================
// UPDATED: TILE COMPLETION REQUIREMENT MESSAGE
// ================================================================

/**
 * Get completion requirement message for current tile - UPDATED for engagement
 */
export function getCurrentTileRequirement() {
    const currentTile = getCurrentTile();
    if (!currentTile) return '';
    
    // Special message for fight tiles that haven't been engaged
    if (currentTile.type === 'fight' && !currentTile.combatEngaged) {
        return 'Engage with the enemy (click Fight!)';
    }
    
    const requirements = {
        'fight': 'Defeat the enemy or flee from combat',
        'hazard': 'Navigate the hazard', 
        'item': 'Take the item',
        'ally': 'Recruit or decline the ally',
        'key': 'Take the key',
        'door': 'Find the key to use this door'
    };
    
    return requirements[currentTile.type] || 'Complete this encounter';
}


// ================================================================
// UPDATED: MOVE PLAYER FUNCTION - HANDLE FOG OF WAR REVELATION
// ================================================================

/**
 * Attempt to move player to a new position - UPDATED for fog of war
 */
export function movePlayer(newRow, newCol) {
    // Check bounds (4x4)
    if (newRow < 0 || newRow > 3 || newCol < 0 || newCol > 3) {
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
    
    // Check if current tile is completed (existing logic)
    if (!isCurrentTileCompleted()) {
        const requirement = getCurrentTileRequirement();
        addLogEntry(`❌ Must complete current encounter first: ${requirement}`);
        return false;
    }
    
    // Get the target tile
    const tileIndex = newRow * 4 + newCol;
    const targetTile = G.board.tiles[tileIndex];
    
    // Can only move to DISCOVERED tiles (tiles showing "?")
    if (!targetTile.discovered) {
        addLogEntry('❌ Cannot move to unexplored areas');
        return false;
    }
    
    // MOVE PLAYER TO NEW POSITION
    G.board.player.r = newRow;
    G.board.player.c = newCol;
    
    // EXPLORE THE NEW TILE (reveal its actual content)
    targetTile.explored = true;
    G.board.seen.add(tileIndex); // Keep compatibility with existing seen system
    
    // REVEAL NEW ADJACENT TILES AS DISCOVERABLE
    revealAdjacentTilesAsDiscoverable(newRow, newCol);
    
    // Auto-complete empty tiles (existing logic)
    if (targetTile.type === 'empty') {
        targetTile.consumed = true;
        addLogEntry(`💨 Empty area explored`);
    }
    
    // Log the move with tile type revelation
    const tileTypeNames = {
        'start': 'Safe Area',
        'fight': 'Enemy Encounter', 
        'hazard': 'Dangerous Hazard',
        'item': 'Treasure Cache',
        'ally': 'Potential Ally',
        'key': 'Key Location',
        'door': 'Grid Exit',
        'empty': 'Empty Space',
        'boss-encounter': 'Boss Domain'
    };
    
    const tileName = tileTypeNames[targetTile.type] || targetTile.type;
    addLogEntry(`🚶 Moved to ${tileName} at (${newRow}, ${newCol})`);
    
    return true;
}
/**
 * Get the current tile the player is standing on
 */
export function getCurrentTile() {
    const { r, c } = G.board.player;
    const index = r * 4 + c; // 4x4 indexing
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
// ITEM SYSTEM FUNCTIONS  
// ================================================================

/**
 * Apply item effects to player
 * Supports both consumables (stat/boost/maxBoost)
 * and equipment (statBonus object)
 */
function applyItemToPlayer(player, item) {
    // --- Case 1: Consumables ---
    if (item.stat) {
        if (item.stat === 'hp') {
            // Heal and possibly increase max HP
            const healAmount = Math.min(item.boost || 0, player.maxHp - player.hp);
            player.hp += healAmount;
            if (item.maxBoost) {
                player.maxHp += item.maxBoost;
                player.hp += item.maxBoost;
            }
            addLogEntry(
                `📦 Found ${item.name}! Healed ${healAmount + (item.maxBoost || 0)} HP! (${player.hp}/${player.maxHp} HP)`
            );
        } else {
            // Add to other stats (atk, mag, etc.)
            player[item.stat] = (player[item.stat] || 0) + (item.boost || 0);
            addLogEntry(
                `📦 Found ${item.name}! +${item.boost} ${item.stat.toUpperCase()}! (${item.stat.toUpperCase()}: ${player[item.stat]})`
            );
        }
        return;
    }

    // --- Case 2: Equipment ---
    if (item.statBonus) {
        for (const [stat, bonus] of Object.entries(item.statBonus)) {
            // Add bonus instead of overwriting
            if (stat === 'hp') {
                player.maxHp = (player.maxHp || 0) + bonus;
                player.hp = (player.hp || 0) + bonus; // also heal up to new max
            } else {
                player[stat] = (player[stat] || 0) + bonus;
            }
            addLogEntry(
                `🛡️ Equipped ${item.name}! ${bonus >= 0 ? '+' : ''}${bonus} ${stat.toUpperCase()} (Now: ${player[stat]})`
            );
        }
        return;
    }

    // --- Fallback ---
    console.warn('Item type not recognized:', item);
}


// ================================================================
// HAZARD SYSTEM FUNCTIONS  
// ================================================================

/**
 * Resolve a hazard encounter with a dice roll
 */
export function resolveHazard() {
    const player = getPartyLeader();
    if (!player) return false;
    
    // Different hazard types
    const hazards = [
        { name: 'Poison Spores', difficulty: 12, damage: 2, stat: 'atk' },
        { name: 'Pit Trap', difficulty: 11, damage: 3, stat: 'atk' },
        { name: 'Magic Ward', difficulty: 13, damage: 2, stat: 'mag' },
        { name: 'Unstable Floor', difficulty: 10, damage: 1, stat: 'atk' },
        { name: 'Arcane Barrier', difficulty: 14, damage: 3, stat: 'mag' }
    ];
    
    // Pick random hazard
    const hazard = pickRandom(hazards);
    
    // Roll dice + add best relevant stat
    const roll = rollDice(20); // d20 roll
    const statBonus = player[hazard.stat];
    const total = roll + statBonus;
    
    addLogEntry(`⚡ ${hazard.name}! Rolling to avoid... (d20 + ${hazard.stat.toUpperCase()})`);
    addLogEntry(`🎲 Rolled ${roll} + ${statBonus} = ${total} (need ${hazard.difficulty}+)`);
    
    if (total >= hazard.difficulty) {
        // Success!
        addLogEntry(`✅ Success! You avoided the ${hazard.name}!`);
        
        // Small chance of finding something useful
        if (random() < 0.3) {
            addLogEntry(`🎁 You found something useful while navigating!`);
            giveRandomItem();
        }
        consumeCurrentTile();
        return { success: true, hazard };
    } else {
        // Failure - take damage
        damagePartyMember(player.id, hazard.damage);
        addLogEntry(`❌ Failed! The ${hazard.name} caught you!`);

        consumeCurrentTile();
        return { success: false, hazard };
    }
}

// ================================================================
// ALLY SYSTEM FUNCTIONS  
// ================================================================

// ================================================================
// UPDATED: getAllyCards() FUNCTION
// Replace the existing getAllyCards() function with this version
// Now works with both JSON data and hardcoded fallback
// ================================================================

/**
 * Get cards that an ally contributes to the deck - UPDATED for JSON compatibility
 */
function getAllyCards(ally) {
    // First, try to use JSON data if available
    if (GAME_DATA.allies) {
        // Try to determine ally type and region from ally data
        const allyType = determineAllyTypeFromTags(ally);
        const currentRegion = getRegionForGrid(G.gridLevel);
        
        if (allyType && GAME_DATA.allies[currentRegion] && GAME_DATA.allies[currentRegion][allyType]) {
            console.log(`🃏 Getting cards for ${ally.name} from JSON data (${allyType})`);
            return getAllyCardsFromData(currentRegion, allyType, ally.id);
        }
    }
    
    // Fallback to hardcoded card sets (existing system)
    console.log(`🃏 Using hardcoded cards for ${ally.name} (fallback)`);
    
    const cardSets = {
        'warrior': [
            { id: `shield-bash-${ally.id}`, name: 'Shield Bash', type: 'attack', description: '+2 damage and stun enemy for 1 turn' },
            { id: `taunt-${ally.id}`, name: 'Taunt', type: 'defense', description: 'Force enemy to attack you, reduce damage taken' }
        ],
        'mage': [
            { id: `magic-bolt-${ally.id}`, name: 'Magic Bolt', type: 'attack', description: 'Deal magic damage, bypasses armor' },
            { id: `heal-${ally.id}`, name: 'Heal', type: 'utility', description: 'Restore HP to party leader' }
        ],
        'rogue': [
            { id: `sneak-attack-${ally.id}`, name: 'Sneak Attack', type: 'attack', description: 'Deal double damage if enemy is unaware' },
            { id: `dodge-${ally.id}`, name: 'Dodge', type: 'defense', description: 'Avoid the next attack completely' }
        ],
        'scout': [
            { id: `track-${ally.id}`, name: 'Track', type: 'utility', description: 'Reveal hidden encounters on the grid' },
            { id: `first-aid-${ally.id}`, name: 'First Aid', type: 'utility', description: 'Heal minor wounds during exploration' }
        ]
    };
    
    // Find the card set for this ally type
    for (const [type, cards] of Object.entries(cardSets)) {
        if (ally.tags.includes(type)) {
            return cards;
        }
    }
    
    // Default cards if no specific type found
    return [
        { id: `help-${ally.id}`, name: 'Helping Hand', type: 'utility', description: 'Generic assistance from your ally' }
    ];
}

/**
 * Helper function to determine ally type from tags for JSON lookup
 */
function determineAllyTypeFromTags(ally) {
    // Try to map ally tags to JSON ally types
    if (ally.tags.includes('warrior')) {
        if (ally.tags.includes('dwarf')) return 'dwarven-fighter';
        if (ally.tags.includes('void')) return 'void-knight';
        if (ally.tags.includes('crystal')) return 'gem-knight';
        return 'warrior';
    }
    
    if (ally.tags.includes('mage')) {
        if (ally.tags.includes('crystal')) return 'crystal-mage';
        if (ally.tags.includes('void')) return 'void-cultist';
        if (ally.tags.includes('healer')) return 'herbalist';
        if (ally.tags.includes('druid')) return 'druid';
        return 'mage';
    }
    
    if (ally.tags.includes('ranger') || ally.tags.includes('scout')) {
        if (ally.tags.includes('survivor')) return 'survivor';
        if (ally.tags.includes('worker')) return 'miner';
        return 'ranger';
    }
    
    if (ally.tags.includes('corrupted')) return 'fallen-hero';
    
    // Default fallback
    return null;
}

// ================================================================
// DEBUG VERSIONS OF ALLY HELPER FUNCTIONS
// Replace the existing functions in state.js with these versions
// ================================================================

/**
 * Get the current region based on grid level
 */
function getRegionForGrid(gridLevel) {
    if (gridLevel <= 5) return "forest-region";
    if (gridLevel <= 10) return "mountain-region";  
    return "void-region";
}

/**
 * Generate a procedural name from ally data - DEBUG VERSION
 */
function generateAllyName(allyData) {
    console.log('📛 DEBUG: generateAllyName called with:', allyData);
    
    const names = allyData.names || ["Unknown"];
    const titles = allyData.titles || ["the Wanderer"];
    
    console.log('📛 DEBUG: Available names:', names);
    console.log('📛 DEBUG: Available titles:', titles);
    
    const name = pickRandom(names);
    const title = pickRandom(titles);
    
    console.log('📛 DEBUG: Picked name:', name);
    console.log('📛 DEBUG: Picked title:', title);
    
    const fullName = `${name} ${title}`;
    console.log('📛 DEBUG: Generated full name:', fullName);
    
    return fullName;
}

/**
 * Get available ally types for the current region with rarity weighting - DEBUG VERSION
 */
function getWeightedAllyTypes(region, gridLevel) {
    console.log('⚖️ DEBUG: getWeightedAllyTypes called');
    console.log('⚖️ DEBUG: region:', region);
    console.log('⚖️ DEBUG: gridLevel:', gridLevel);
    console.log('⚖️ DEBUG: GAME_DATA.allies exists:', !!GAME_DATA.allies);
    
    if (!GAME_DATA.allies || !GAME_DATA.allies[region]) {
        console.log('❌ DEBUG: No allies data for region:', region);
        return null; // No allies data available
    }
    
    const regionAllies = GAME_DATA.allies[region];
    console.log('⚖️ DEBUG: Region allies data:', regionAllies);
    console.log('⚖️ DEBUG: Available ally types in region:', Object.keys(regionAllies).filter(key => key !== 'techniques'));
    
    const availableTypes = [];
    const weights = [];
    
    // Filter allies by join conditions and build weighted arrays
    for (const [allyType, allyData] of Object.entries(regionAllies)) {
        if (allyType === 'techniques') continue; // Skip techniques
        
        console.log(`⚖️ DEBUG: Checking ally type: ${allyType}`);
        console.log(`⚖️ DEBUG: Ally data:`, allyData);
        
        const conditions = allyData.joinConditions || {};
        console.log(`⚖️ DEBUG: Join conditions:`, conditions);
        
        // Check minimum grid level
        if (conditions.minGridLevel && gridLevel < conditions.minGridLevel) {
            console.log(`❌ DEBUG: ${allyType} requires grid level ${conditions.minGridLevel}, current: ${gridLevel}`);
            continue;
        }
        
        // Check party size limit
        if (conditions.maxPartySize && G.party.length >= conditions.maxPartySize) {
            console.log(`❌ DEBUG: ${allyType} party size limit exceeded (${G.party.length}/${conditions.maxPartySize})`);
            continue;
        }
        
        // Add to available types with weight
        availableTypes.push(allyType);
        weights.push(allyData.weight || 1);
        console.log(`✅ DEBUG: ${allyType} added to available types with weight ${allyData.weight || 1}`);
    }
    
    console.log('⚖️ DEBUG: Final available types:', availableTypes);
    console.log('⚖️ DEBUG: Final weights:', weights);
    
    if (availableTypes.length === 0) {
        console.log('❌ DEBUG: No eligible allies found');
        return null; // No eligible allies
    }
    
    // Use weighted random selection
    const selectedType = getWeightedRandom(availableTypes, weights);
    console.log('⚖️ DEBUG: Selected type after weighting:', selectedType);
    
    return selectedType;
}

/**
 * Create an ally from JSON data - DEBUG VERSION
 */
function createAllyFromData(region, allyType) {
    console.log('🏗️ DEBUG: createAllyFromData called');
    console.log('🏗️ DEBUG: region:', region);
    console.log('🏗️ DEBUG: allyType:', allyType);
    
    if (!GAME_DATA.allies || !GAME_DATA.allies[region] || !GAME_DATA.allies[region][allyType]) {
        console.error('❌ DEBUG: Ally data not found:', region, allyType);
        return null;
    }
    
    const allyData = GAME_DATA.allies[region][allyType];
    console.log('🏗️ DEBUG: Raw ally data:', allyData);
    
    // Generate unique ID and procedural name
    const allyId = `${allyType}-${Date.now()}`;
    console.log('🏗️ DEBUG: Generated ally ID:', allyId);
    
    const allyName = generateAllyName(allyData);
    console.log('🏗️ DEBUG: Generated ally name:', allyName);
    
    // Create ally object with JSON stats
    const ally = {
        id: allyId,
        name: allyName,
        ...allyData.baseStats, // Spread hp, maxHp, atk, mag
        tags: [...allyData.tags], // Copy tags array
        description: allyData.description || "A mysterious ally"
    };
    
    console.log('🏗️ DEBUG: Final ally object:', ally);
    return ally;
}

// ================================================================
// ADD THIS MISSING FUNCTION TO state.js
// Place it right after the createAllyFromData() function
// ================================================================

/**
 * Get cards for an ally from JSON data
 */
function getAllyCardsFromData(region, allyType, allyId) {
    console.log('🃏 DEBUG: getAllyCardsFromData called');
    console.log('🃏 DEBUG: region:', region, 'allyType:', allyType, 'allyId:', allyId);
    
    if (!GAME_DATA.allies || !GAME_DATA.allies[region] || !GAME_DATA.allies[region][allyType]) {
        console.log('❌ DEBUG: No ally data found for cards');
        return [];
    }
    
    const allyData = GAME_DATA.allies[region][allyType];
    console.log('🃏 DEBUG: Ally data for cards:', allyData);
    
    if (!allyData.cards) {
        console.log('❌ DEBUG: No cards defined for this ally type');
        return [];
    }
    
    console.log('🃏 DEBUG: Raw card templates:', allyData.cards);
    
    // Create cards with unique IDs for this ally
    const cards = allyData.cards.map(cardTemplate => ({
        id: `${cardTemplate.id}-${allyId}`,
        name: cardTemplate.name,
        type: cardTemplate.type,
        description: cardTemplate.description || "An ally's special ability"
    }));
    
    console.log('🃏 DEBUG: Generated cards with unique IDs:', cards);
    return cards;
}

// ================================================================
// TECHNIQUE CARD HELPER FUNCTIONS
// Add these functions to state.js after the existing ally helper functions
// ================================================================

/**
 * Get available technique cards for the current region
 */
function getRegionalTechniques(region) {
    if (!GAME_DATA.allies || !GAME_DATA.allies[region] || !GAME_DATA.allies[region].techniques) {
        return [];
    }
    
    return GAME_DATA.allies[region].techniques;
}

/**
 * Select random technique cards with weighted selection
 */
function selectRandomTechniques(region, count = 3) {
    const availableTechniques = getRegionalTechniques(region);
    
    if (availableTechniques.length === 0) {
        return [];
    }
    
    const selectedTechniques = [];
    const availablePool = [...availableTechniques]; // Copy array so we don't modify original
    
    // Select up to 'count' techniques without duplicates
    for (let i = 0; i < count && availablePool.length > 0; i++) {
        const weights = availablePool.map(tech => tech.weight || 1);
        const selectedIndex = getWeightedRandomIndex(weights);
        const selectedTech = availablePool[selectedIndex];
        
        // Create unique card with timestamp ID
        const techniqueCard = {
            id: `${selectedTech.id}-${Date.now()}-${i}`,
            name: selectedTech.name,
            type: selectedTech.type,
            description: selectedTech.description
        };
        
        selectedTechniques.push(techniqueCard);
        
        // Remove from pool to avoid duplicates
        availablePool.splice(selectedIndex, 1);
    }
    
    return selectedTechniques;
}

/**
 * Helper function for weighted random selection by index
 */
function getWeightedRandomIndex(weights) {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let randomValue = random() * totalWeight;
    
    for (let i = 0; i < weights.length; i++) {
        if (randomValue < weights[i]) {
            return i;
        }
        randomValue -= weights[i];
    }
    
    return weights.length - 1; // fallback to last item
}

/**
 * Handle abandoned camp encounter when party is full
 */
export function discoverAbandonedCamp() {
    const currentRegion = getRegionForGrid(G.gridLevel);
    const availableTechniques = selectRandomTechniques(currentRegion, 3);
    
    if (availableTechniques.length === 0) {
        addLogEntry('🏕️ You find an abandoned camp, but nothing useful remains.');
        consumeCurrentTile();
        return false;
    }
    
    // Store techniques for selection
    G._pendingTechniques = availableTechniques;
    
    addLogEntry(`🏕️ You discover an abandoned ${currentRegion.replace('-region', '')} camp!`);
    addLogEntry(`📜 The former occupants left behind some useful techniques...`);
    addLogEntry(`🎯 Choose one technique to learn: ${availableTechniques.map(tech => tech.name).join(', ')}`);
    
    consumeCurrentTile();
    return { techniques: availableTechniques };
}

/**
 * Learn a selected technique from abandoned camp
 */
export function learnTechnique(techniqueCard) {
    if (!techniqueCard) {
        console.error('No technique card provided');
        return false;
    }
    
    // Check if hand is full
    if (G.hand.length >= getMaxHandSize()) {
        addLogEntry(`📚 You want to learn ${techniqueCard.name}, but your hand is full!`);
        
        // Use existing overflow system
        G._pendingTechniqueCard = techniqueCard;
        return { overflow: true, card: techniqueCard };
    } else {
        // Add directly to hand
        const result = addCardToHand(techniqueCard);
        if (result.success) {
            addLogEntry(`📚 You learned ${techniqueCard.name}!`);
            addLogEntry(`✨ New technique: ${techniqueCard.description}`);
            
            // Clear pending techniques
            G._pendingTechniques = null;
            return { success: true };
        } else {
            console.error('Failed to add technique card to hand');
            return false;
        }
    }
}

/**
 * Resolve pending technique after overflow handled
 */
export function resolvePendingTechnique() {
    if (!G._pendingTechniqueCard) {
        console.error('No pending technique to resolve');
        return false;
    }
    
    const techniqueCard = G._pendingTechniqueCard;
    G._pendingTechniqueCard = null;
    G._pendingTechniques = null;
    
    // Try to add the technique again (should work now after overflow resolution)
    const result = addCardToHand(techniqueCard);
    if (result.success) {
        addLogEntry(`📚 You learned ${techniqueCard.name}!`);
        addLogEntry(`✨ New technique: ${techniqueCard.description}`);
        return { success: true };
    } else {
        console.error('Still failed to add technique after overflow resolution');
        return false;
    }
}

// ================================================================
// FIXED recruitRandomAlly() FUNCTION - PARTY SIZE CHECK MOVED UP
// Replace your existing recruitRandomAlly() function with this version
// ================================================================

/**
 * Recruit a random ally to join the party - FIXED party size logic
 */
export function recruitRandomAlly() {
    console.log('🤝 DEBUG: recruitRandomAlly() called');
    console.log('🤝 DEBUG: G.gridLevel:', G.gridLevel);
    console.log('🤝 DEBUG: GAME_DATA exists:', !!GAME_DATA);
    console.log('🤝 DEBUG: GAME_DATA.allies exists:', !!GAME_DATA.allies);
    
    // Check if allies data is available
    if (!GAME_DATA.allies) {
        console.log('⚠️ DEBUG: No allies data available, using fallback recruitment');
        return recruitFallbackAlly(); // Keep old system as fallback
    }
    
    console.log('✅ DEBUG: Allies data found!');
    console.log('🤝 DEBUG: Available ally regions:', Object.keys(GAME_DATA.allies));
    
    // MOVED UP: Check party size limit FIRST - offer abandoned camp techniques if full
    console.log('👥 DEBUG: Current party size:', G.party.length);
    if (G.party.length >= 4) {
        console.log('🏕️ DEBUG: Party full - discovering abandoned camp instead');
        return discoverAbandonedCamp();
    }
    
    // Get current region and check for available allies
    const currentRegion = getRegionForGrid(G.gridLevel);
    console.log('🗺️ DEBUG: Current region for grid', G.gridLevel, ':', currentRegion);
    console.log('🗺️ DEBUG: Region data exists:', !!GAME_DATA.allies[currentRegion]);
    
    if (GAME_DATA.allies[currentRegion]) {
        console.log('🗺️ DEBUG: Available ally types in', currentRegion, ':', Object.keys(GAME_DATA.allies[currentRegion]));
    }
    
    const selectedAllyType = getWeightedAllyTypes(currentRegion, G.gridLevel);
    console.log('🎯 DEBUG: Selected ally type:', selectedAllyType);
    
    if (!selectedAllyType) {
        console.log('❌ DEBUG: No ally type selected');
        addLogEntry('🤝 No allies are available in this area.');
        consumeCurrentTile();
        return false;
    }
    
    // Create ally from JSON data
    console.log('🏗️ DEBUG: Creating ally from data...');
    const ally = createAllyFromData(currentRegion, selectedAllyType);
    console.log('🤝 DEBUG: Created ally:', ally);
    
    if (!ally) {
        console.log('❌ DEBUG: Failed to create ally');
        addLogEntry('🤝 An ally approaches but seems confused and wanders off...');
        consumeCurrentTile();
        return false;
    }
    
    // Get ally's cards from JSON data
    const allyCards = getAllyCardsFromData(currentRegion, selectedAllyType, ally.id);
    console.log('🃏 DEBUG: Ally cards:', allyCards);
    
    // Check if adding ally cards would cause overflow
    const totalNewCards = allyCards.length;
    const currentHandSize = G.hand.length;
    const wouldOverflow = currentHandSize + totalNewCards > getMaxHandSize();
    
    console.log('🃏 DEBUG: Hand size check:', {
        currentHandSize,
        newCards: totalNewCards,
        maxSize: getMaxHandSize(),
        wouldOverflow
    });
    
    if (wouldOverflow) {
        // Handle card overflow - same logic as before
        addLogEntry(`🤝 ${ally.name} wants to join and offers cards, but your hand is full!`);
        addLogEntry(`📋 They offer: ${allyCards.map(card => card.name).join(', ')}`);
        
        // Store ally and cards for later resolution
        G._pendingAlly = ally;
        G._pendingCards = allyCards;
        
        // Signal that overflow needs to be handled
        consumeCurrentTile();
        return { overflow: true, ally: ally, cards: allyCards };
    } else {
        // No overflow - add ally and cards directly
        console.log('✅ DEBUG: No overflow, completing recruitment...');
        return completeAllyRecruitment(ally, allyCards);
    }
}
/**
 * Fallback ally recruitment using old hardcoded system
 */
function recruitFallbackAlly() {
    // Original hardcoded allies as fallback
    const allies = [
        { 
            id: 'warrior-' + Date.now(), 
            name: 'Warrior', 
            hp: 12, 
            maxHp: 12, 
            atk: 4, 
            mag: 0, 
            tags: ['human', 'warrior'],
            skills: ['Shield Bash', 'Taunt']
        },
        { 
            id: 'mage-' + Date.now(), 
            name: 'Mage', 
            hp: 6, 
            maxHp: 6, 
            atk: 1, 
            mag: 4, 
            tags: ['human', 'mage'],
            skills: ['Magic Bolt', 'Heal']
        },
        { 
            id: 'rogue-' + Date.now(), 
            name: 'Rogue', 
            hp: 8, 
            maxHp: 8, 
            atk: 3, 
            mag: 2, 
            tags: ['human', 'rogue'],
            skills: ['Sneak Attack', 'Dodge']
        },
        { 
            id: 'scout-' + Date.now(), 
            name: 'Scout', 
            hp: 10, 
            maxHp: 10, 
            atk: 2, 
            mag: 1, 
            tags: ['human', 'scout'],
            skills: ['Track', 'First Aid']
        }
    ];
    
    // Use old logic for fallback
    const allyTemplate = pickRandom(allies);
    
    if (G.party.length >= 4) {
        addLogEntry(`🤝 The ${allyTemplate.name} wants to join, but your party is full!`);
        consumeCurrentTile();
        return false;
    }
    
    const allyCards = getAllyCards(allyTemplate);
    const totalNewCards = allyCards.length;
    const currentHandSize = G.hand.length;
    const wouldOverflow = currentHandSize + totalNewCards > getMaxHandSize();
    
    if (wouldOverflow) {
        addLogEntry(`🤝 ${allyTemplate.name} wants to join and offers cards, but your hand is full!`);
        addLogEntry(`📋 They offer: ${allyCards.map(card => card.name).join(', ')}`);
        
        G._pendingAlly = allyTemplate;
        G._pendingCards = allyCards;
        
        consumeCurrentTile();
        return { overflow: true, ally: allyTemplate, cards: allyCards };
    } else {
        return completeAllyRecruitment(allyTemplate, allyCards);
    }
}

/**
 * Complete ally recruitment (called after overflow resolved or if no overflow)
 */
export function completeAllyRecruitment(ally, cards) {
    // Add to party
    addPartyMember(ally);
    
    // Add their equipment slot
    G.equipment[ally.id] = [];
    
    // Add their cards to hand
    let cardsAdded = 0;
    for (const card of cards) {
        const result = addCardToHand(card);
        if (result.success) {
            cardsAdded++;
        } else {
            addLogEntry(`⚠️ Could not add ${card.name} - hand still full!`);
        }
    }
    
    addLogEntry(`🎉 ${ally.name} joined your party and contributed ${cardsAdded} cards!`);
    addLogEntry(`🃏 New cards: ${cards.slice(0, cardsAdded).map(card => card.name).join(', ')}`);
    
    consumeCurrentTile();
    return { success: true, ally, cardsAdded };
}

/**
 * Handle pending ally after overflow resolution
 */
export function resolvePendingAlly() {
    if (!G._pendingAlly || !G._pendingCards) {
        console.error('No pending ally to resolve');
        return false;
    }
    
    const ally = G._pendingAlly;
    const cards = G._pendingCards;
    
    // Clear pending state
    G._pendingAlly = null;
    G._pendingCards = null;
    
    // Complete the recruitment
    return completeAllyRecruitment(ally, cards);
}

/**
 * Remove an ally and their associated cards from the game
 */
export function removeAlly(allyId) {
    // Remove from party
    const allyIndex = G.party.findIndex(member => member.id === allyId);
    if (allyIndex === -1) return false;
    
    const ally = G.party[allyIndex];
    G.party.splice(allyIndex, 1);
    
    // Remove their equipment
    delete G.equipment[allyId];
    
    // Remove their cards from hand and discard pile
    const cardsRemoved = [];
    
    // Remove from hand
    G.hand = G.hand.filter(card => {
        if (card.id.includes(allyId)) {
            cardsRemoved.push(card.name);
            return false;
        }
        return true;
    });
    
    // Remove from discard pile
    G.discard = G.discard.filter(card => {
        if (card.id.includes(allyId)) {
            cardsRemoved.push(card.name);
            return false;
        }
        return true;
    });
    
    addLogEntry(`👋 ${ally.name} has left the party`);
    if (cardsRemoved.length > 0) {
        addLogEntry(`🗑️ Lost cards: ${cardsRemoved.join(', ')}`);
    }
    
    return true;
}

/**
 * Get maximum hand size
 */
export function getMaxHandSize() {
    return 5; // MAX_HAND_SIZE constant
}

/**
 * Manually discard a card by ID to make room
 */
export function discardCardById(cardId) {
    const cardIndex = G.hand.findIndex(card => card.id === cardId);
    if (cardIndex === -1) return false;
    
    const discarded = G.hand.splice(cardIndex, 1)[0];
    G.discard.push(discarded);
    addLogEntry(`🗑️ Discarded ${discarded.name}`);
    return true;
}

// ================================================================
// CARD SYSTEM FUNCTIONS
// ================================================================

// Constants
const MAX_HAND_SIZE = 5;

/**
 * Add a card to the hand, handling overflow
 * Returns: { success: boolean, overflow: Card|null }
 */
export function addCardToHand(card) {
    if (G.hand.length < MAX_HAND_SIZE) {
        // Room in hand - add normally
        G.hand.push(card);
        addLogEntry(`🃏 Added ${card.name} to hand`);
        return { success: true, overflow: null };
    } else {
        // Hand is full - need to discard something
        addLogEntry(`⚠️ Hand full! Must discard a card to add ${card.name}`);
        return { success: false, overflow: card };
    }
}

/**
 * Force add a card to hand, discarding oldest if needed
 */
export function forceAddCardToHand(card) {
    if (G.hand.length >= MAX_HAND_SIZE) {
        // Discard the first (oldest) card
        const discarded = G.hand.shift();
        G.discard.push(discarded);
        addLogEntry(`🗑️ Discarded ${discarded.name} (hand was full)`);
    }
    
    G.hand.push(card);
    addLogEntry(`🃏 Added ${card.name} to hand`);
}

/**
 * Draw cards from deck to hand (now respects hand limit)
 */
export function drawCards(count = 1) {
    const cardsDrawn = [];
    const overflowCards = [];
    
    for (let i = 0; i < count && G.deck.length > 0; i++) {
        const card = G.deck.pop();
        const result = addCardToHand(card);
        
        if (result.success) {
            cardsDrawn.push(card);
        } else {
            overflowCards.push(result.overflow);
        }
    }
    
    return { cardsDrawn, overflowCards };
}

/**
 * Get current hand size
 */
export function getHandSize() {
    return G.hand.length;
}

/**
 * Check if hand is full
 */
export function isHandFull() {
    return G.hand.length >= MAX_HAND_SIZE;
}

// ================================================================
// PARTY LEADERSHIP FUNCTIONS
// ================================================================

/**
 * Switch party leadership to a different member
 */
export function switchPartyLeader(memberId) {
    // Find the member by ID
    const memberIndex = G.party.findIndex(member => member.id === memberId);
    if (memberIndex === -1) {
        console.error('Member not found:', memberId);
        return false;
    }
    
    // If they're already the leader, do nothing
    if (memberIndex === 0) {
        addLogEntry(`${G.party[0].name} is already the party leader!`);
        return false;
    }
    
    // Move the member to position 0 (leader spot)
    const newLeader = G.party[memberIndex];
    G.party.splice(memberIndex, 1); // Remove from current position
    G.party.unshift(newLeader); // Add to front of array
    
    addLogEntry(`👑 ${newLeader.name} is now the party leader!`);
    return true;
}

// ================================================================
// CARD EFFECTS SYSTEM
// ================================================================

/**
 * Card effect registry - maps effect types to functions
 */
const CARD_EFFECTS = {
    'basic-strike': (card) => {
        if (!G.combat.active) {
            addLogEntry(`⚔️ ${card.name}: No target to attack!`);
            return false;
        }
        
        // Enhanced basic attack - +1 damage bonus
        const player = getPartyLeader();
        const roll = rollDice(6);
        const damage = Math.max(1, player.atk + roll - 2); // Better than normal attack
        
        G.combat.enemyHp = Math.max(0, G.combat.enemyHp - damage);
        addLogEntry(`⚔️ ${card.name}: Dealt ${damage} damage! Enemy HP: ${G.combat.enemyHp}`);
        
        if (G.combat.enemyHp <= 0) {
            endCombat(true);
        } else {
            G.combat.turn = 'enemy';
        }
        return true;
    },
    
    'shield-bash': (card) => {
        if (!G.combat.active) {
            addLogEntry(`🛡️ ${card.name}: No enemy to bash!`);
            return false;
        }
        
        const player = getPartyLeader();
        const roll = rollDice(6);
        const damage = Math.max(2, player.atk + roll - 1); // +2 base damage
        
        G.combat.enemyHp = Math.max(0, G.combat.enemyHp - damage);
        
        // Add stun effect - enemy loses next turn
        G.combat.enemyStunned = true;
        
        addLogEntry(`🛡️ ${card.name}: Dealt ${damage} damage and stunned the enemy!`);
        
        if (G.combat.enemyHp <= 0) {
            endCombat(true);
        } else {
            // Player gets another turn due to stun
            G.combat.turn = 'player';
        }
        return true;
    },
    
    'taunt': (card) => {
        if (!G.combat.active) {
            addLogEntry(`🗣️ ${card.name}: No one to taunt!`);
            return false;
        }
        
        // Reduce incoming damage for next attack
        G.combat.damageReduction = 2;
        addLogEntry(`🗣️ ${card.name}: Taunting enemy! Next attack damage reduced by 2.`);
        
        G.combat.turn = 'enemy';
        return true;
    },
    
    'magic-bolt': (card) => {
        if (!G.combat.active) {
            addLogEntry(`⚡ ${card.name}: No target for magic!`);
            return false;
        }
        
        const player = getPartyLeader();
        const damage = Math.max(2, player.mag + 3); // Magic damage bypasses armor
        
        G.combat.enemyHp = Math.max(0, G.combat.enemyHp - damage);
        addLogEntry(`⚡ ${card.name}: Pure magic damage! Dealt ${damage} damage! Enemy HP: ${G.combat.enemyHp}`);
        
        if (G.combat.enemyHp <= 0) {
            endCombat(true);
        } else {
            G.combat.turn = 'enemy';
        }
        return true;
    },
    
    'heal': (card) => {
        const player = getPartyLeader();
        if (player.hp >= player.maxHp) {
            addLogEntry(`💚 ${card.name}: Already at full health!`);
            return false;
        }
        
        const healAmount = Math.min(4, player.maxHp - player.hp);
        player.hp += healAmount;
        addLogEntry(`💚 ${card.name}: Healed ${healAmount} HP! (${player.hp}/${player.maxHp} HP)`);
        
        return true;
    },
    
    'sneak-attack': (card) => {
        if (!G.combat.active) {
            addLogEntry(`🗡️ ${card.name}: No target to ambush!`);
            return false;
        }
        
        const player = getPartyLeader();
        const roll = rollDice(6);
        
        // Double damage if it's the first attack of combat
        const isFirstTurn = G.combat.turn === 'player' && !G.combat.lastRoll;
        const multiplier = isFirstTurn ? 2 : 1;
        const damage = Math.max(1, (player.atk + roll) * multiplier);
        
        G.combat.enemyHp = Math.max(0, G.combat.enemyHp - damage);
        addLogEntry(`🗡️ ${card.name}: ${isFirstTurn ? 'Perfect ambush! ' : ''}Dealt ${damage} damage!`);
        
        if (G.combat.enemyHp <= 0) {
            endCombat(true);
        } else {
            G.combat.turn = 'enemy';
        }
        return true;
    },
    
    'dodge': (card) => {
        if (!G.combat.active) {
            addLogEntry(`💨 ${card.name}: Nothing to dodge right now.`);
            return false;
        }
        
        G.combat.dodgeNext = true;
        addLogEntry(`💨 ${card.name}: Prepared to dodge the next attack!`);
        
        G.combat.turn = 'enemy';
        return true;
    },
    
    

'track': (card) => {
    // Find all discoverable but unexplored tiles (tiles showing "?")
    let tilesRevealed = 0;
    
    G.board.tiles.forEach((tile, index) => {
        if (tile.discovered && !tile.explored) {
            // This tile is currently showing "?" - reveal its actual type
            tile.explored = true; // Now shows actual content
            G.board.seen.add(index);
            tilesRevealed++;
        }
    });
    
    if (tilesRevealed > 0) {
        addLogEntry(`🔍 ${card.name}: Revealed ${tilesRevealed} tile types! You can now see what awaits you.`);
        return true;
    } else {
        addLogEntry(`🔍 ${card.name}: No hidden tile types to reveal.`);
        return false;
    }
},

    
    'first-aid': (card) => {
        const player = getPartyLeader();
        const healAmount = Math.min(2, player.maxHp - player.hp);
        
        if (healAmount <= 0) {
            addLogEntry(`🩹 ${card.name}: No wounds to treat.`);
            return false;
        }
        
        player.hp += healAmount;
        addLogEntry(`🩹 ${card.name}: Applied first aid! Healed ${healAmount} HP! (${player.hp}/${player.maxHp} HP)`);
        return true;
    },
    
    'defend': (card) => {
        if (!G.combat.active) {
            addLogEntry(`🛡️ ${card.name}: Nothing to defend against.`);
            return false;
        }
        
        G.combat.defending = true;
        addLogEntry(`🛡️ ${card.name}: Defensive stance! Incoming damage halved.`);
        
        G.combat.turn = 'enemy';
        return true;
    },
    
    'move': (card) => {
        addLogEntry(`👟 ${card.name}: Feeling more agile!`);
        // For now, just a minor effect - could add movement bonuses later
        return true;
    }
};

/**
 * Execute a card's effect
 */
function executeCardEffect(card) {
    // Get the base effect type from the card ID
    let effectType = card.id;
    
    // Handle ally-specific cards (remove the ally ID suffix)
    if (card.id.includes('-warrior-') || card.id.includes('-mage-') || 
        card.id.includes('-rogue-') || card.id.includes('-scout-')) {
        effectType = card.id.split('-').slice(0, -2).join('-');
    }
    
    // Find the effect function
    const effectFunction = CARD_EFFECTS[effectType];
    
    if (effectFunction) {
        const success = effectFunction(card);
        if (success) {
            addLogEntry(`✨ ${card.name} effect activated!`);
        }
        return success;
    } else {
        addLogEntry(`❓ ${card.name}: No special effect.`);
        return false;
    }
}

/**
 * Play a card by ID (now with real effects!)
 */
export function playCard(cardId) {
    const cardIndex = G.hand.findIndex(card => card.id === cardId);
    if (cardIndex === -1) return false;
    
    const card = G.hand.splice(cardIndex, 1)[0];
    
    // Execute the card's effect before discarding
    const effectSuccess = executeCardEffect(card);
    
    // Always discard the card after use
    G.discard.push(card);
    
    addLogEntry(`🃏 Played ${card.name}${effectSuccess ? ' - Effect triggered!' : ''}`);
    return true;
}

/**
 * Found the key for this grid
 */
export function foundKey() {
    G.keyFound = true;
    addLogEntry('🗝️ Found the key! The door is now accessible.');
    consumeCurrentTile();
}

/**
 * Get a descriptive name for a position on the grid
 */
export function getPositionName(row, col) {
    const positions = {
        '0,0': 'top-left',
        '0,1': 'top-center-left', 
        '0,2': 'top-center-right',
        '0,3': 'top-right',
        '1,0': 'middle-left',
        '1,1': 'middle-center-left',
        '1,2': 'middle-center-right',
        '1,3': 'middle-right',
        '2,0': 'lower-left',
        '2,1': 'lower-center-left',
        '2,2': 'lower-center-right', 
        '2,3': 'lower-right',
        '3,0': 'bottom-left',
        '3,1': 'bottom-center-left',
        '3,2': 'bottom-center-right',
        '3,3': 'bottom-right'
    };
    
    return positions[`${row},${col}`] || `position (${row},${col})`;
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
// UPDATED: COMBAT START - SET ENGAGEMENT FLAG
// ================================================================

/**
 * Start combat with a specific enemy type - UPDATED to set engagement flag
 */
export function startCombat(enemyType = 'goblin', bossPhase = null) {
    const enemyTemplate = GAME_DATA.enemies[enemyType];
    if (!enemyTemplate) {
        console.error('Unknown enemy type:', enemyType);
        console.error('Available enemies:', Object.keys(GAME_DATA.enemies));
        return false;
    }
    
    const player = getPartyLeader();
    if (!player) {
        console.error('No party leader for combat');
        return false;
    }
    
    console.log('🛠 DEBUG: startCombat called with enemy:', enemyType, 'bossPhase:', !!bossPhase);
    
    // SET COMBAT ENGAGEMENT FLAG - Player has now engaged with this fight tile
    const currentTile = getCurrentTile();
    if (currentTile && currentTile.type === 'fight') {
        currentTile.combatEngaged = true;
        console.log('⚔️ Combat engagement flag set for fight tile');
    }
    
    G.combat.active = true;
    G.combat.enemy = { ...enemyTemplate, type: enemyType }; // Preserve enemy type for card display
    G.combat.playerHp = player.hp;
    G.combat.enemyHp = enemyTemplate.hp;
    G.combat.turn = 'player';
    G.combat.lastRoll = null;
    G.combat.bossPhase = bossPhase; // Set boss phase if provided
    
    console.log('🛠 DEBUG: Combat initialized - bossPhase:', !!G.combat.bossPhase);
    
    addLogEntry(`⚔️ Combat started with ${enemyTemplate.name}!`);
    return true;
}


/**
 * Attempt to flee from combat with dice roll
 */
export function attemptFlee() {
    if (!G.combat.active) {
        return { success: false, message: 'Not in combat' };
    }
    
    const player = getPartyLeader();
    const enemyName = G.combat.enemy.name; // SAVE NAME FIRST before clearing
    const roll = rollDice(20); // d20 roll
    const statBonus = player.atk; // Use ATK for "fighting your way out"
    const total = roll + statBonus;
    const difficulty = 12 + G.combat.enemy.atk; // Harder to flee from stronger enemies
    
    addLogEntry(`🏃 Attempting to flee from ${enemyName}... (d20 + ATK vs ${difficulty})`);
    addLogEntry(`🎲 Rolled ${roll} + ${statBonus} = ${total}`);
    
    if (total >= difficulty) {
        // Success - end combat but DON'T consume tile
        addLogEntry(`✅ Successfully escaped from ${enemyName}!`);
        addLogEntry(`⚠️ The ${enemyName} remains - you can fight it again later`);
        
        // Reset combat state
        G.combat.active = false;
        G.combat.enemy = null;
        G.combat.playerHp = 0;
        G.combat.enemyHp = 0;
        G.combat.turn = 'player';
        G.combat.lastRoll = null;
        G.combat.bossPhase = null;
        
        return { success: true };
    } else {
        // Failure - take damage and stay in combat
        const damage = Math.max(1, G.combat.enemy.atk - 1); // Reduced damage for failed flee
        G.combat.playerHp = Math.max(0, G.combat.playerHp - damage);
        player.hp = G.combat.playerHp;
        
        addLogEntry(`❌ Failed to escape! Took ${damage} damage while trying to flee!`);
        addLogEntry(`💥 The ${enemyName} punishes your escape attempt!`);
        
        // Check if failure killed the player
        if (G.combat.playerHp <= 0) {
            endCombat(false); // This will trigger leadership switch or game over
        } else {
            // Enemy gets a turn after failed flee attempt
            G.combat.turn = 'enemy';
        }
        
        return { success: false };
    }
}

/**
 * Roll a die with specified number of sides
 */
export function rollDice(sides = 6) {
    const result = randomInt(1, sides);
    G.combat.lastRoll = result;
    addLogEntry(`🎲 Rolled ${result} on d${sides}`);
    return result;
}

/**
 * Player attacks the enemy
 */
export function playerAttack() {
    if (!G.combat.active) return false;
    
    const player = getPartyLeader();
    const roll = rollDice(6);
    const damage = Math.max(1, player.atk + roll - 3); // Base damage with some randomness
    
    G.combat.enemyHp = Math.max(0, G.combat.enemyHp - damage);
    addLogEntry(`⚔️ You attack for ${damage} damage! Enemy HP: ${G.combat.enemyHp}`);
    
    console.log('🐛 DEBUG: Attack complete - enemyHp:', G.combat.enemyHp, 'should call endCombat:', G.combat.enemyHp <= 0);
    
    if (G.combat.enemyHp <= 0) {
        console.log('🐛 DEBUG: Calling endCombat(true)');
        endCombat(true);
        return true;
    }
    
    G.combat.turn = 'enemy';
    return true;
}

/**
 * Enhanced enemy attack that considers combat modifiers - UPDATED with auto-removal
 */
export function enemyAttack() {
    if (!G.combat.active) return false;
    
    // Check if enemy is stunned
    if (G.combat.enemyStunned) {
        addLogEntry(`😵 ${G.combat.enemy.name} is stunned and loses their turn!`);
        G.combat.enemyStunned = false; // Remove stun after missing turn
        G.combat.turn = 'player';
        return true;
    }
    
    // Check if player is dodging
    if (G.combat.dodgeNext) {
        addLogEntry(`💨 You dodge the ${G.combat.enemy.name}'s attack completely!`);
        G.combat.dodgeNext = false;
        G.combat.turn = 'player';
        return true;
    }
    
    const roll = rollDice(6);
    let damage = Math.max(1, G.combat.enemy.atk + roll - 3);
    
    // Apply damage reduction from taunt
    if (G.combat.damageReduction > 0) {
        damage = Math.max(1, damage - G.combat.damageReduction);
        addLogEntry(`🛡️ Damage reduced by ${G.combat.damageReduction}!`);
        G.combat.damageReduction = 0; // Reset after use
    }
    
    // Apply defending modifier
    if (G.combat.defending) {
        damage = Math.ceil(damage / 2);
        addLogEntry(`🛡️ Defending! Damage halved!`);
        G.combat.defending = false; // Reset after use
    }
    
    G.combat.playerHp = Math.max(0, G.combat.playerHp - damage);
    
    // Apply damage to actual party leader
    const player = getPartyLeader();
    player.hp = G.combat.playerHp;
    
    addLogEntry(`💥 ${G.combat.enemy.name} attacks for ${damage} damage! Your HP: ${G.combat.playerHp}`);
    
    if (G.combat.playerHp <= 0) {
        // Check if we can switch leaders instead of ending combat
        const livingMembers = G.party.filter(member => member.hp > 0);
        
        if (livingMembers.length === 0) {
            // Everyone is dead - end combat
            endCombat(false);
            return true;
        } else {
            // Switch to next living member and continue combat
            const currentLeader = G.party[0];
            const newLeaderIndex = G.party.findIndex(member => member.hp > 0);
            
            if (newLeaderIndex > 0) {
                const newLeader = G.party[newLeaderIndex];
                
                // Switch leadership
                G.party.splice(newLeaderIndex, 1);
                G.party.unshift(newLeader);
                
                // Update combat HP to new leader
                G.combat.playerHp = newLeader.hp;
                
                addLogEntry(`💔 ${currentLeader.name} has fallen! ${newLeader.name} continues the fight!`);
                
                // AUTO-REMOVE the fallen party member after brief delay
                console.log('🔍 DEBUG: Scheduling auto-removal for fallen member:', currentLeader.name);
                setTimeout(() => {
                    console.log('🔍 DEBUG: Auto-removal timer triggered for:', currentLeader.name);
                    // Double-check the member is still in party and still dead
                    const fallenMember = G.party.find(m => m.id === currentLeader.id);
                    if (fallenMember && fallenMember.hp <= 0) {
                        console.log('🔍 DEBUG: Calling removeAlly for:', currentLeader.id);
                        removeAlly(currentLeader.id);
                        addLogEntry(`⚰️ ${currentLeader.name}'s body fades away...`);
                        console.log('🔍 DEBUG: Auto-removal complete');
                    } else {
                        console.log('🔍 DEBUG: Auto-removal skipped - member not found or not dead');
                    }
                }, 2000); // 2 second delay for dramatic effect
            }
            
            G.combat.turn = 'player';
            return true;
        }
    }
    
    G.combat.turn = 'player';
    return true;
}

// ================================================================
// UTILITY FUNCTIONS
// ================================================================

/**
 * Get tile at specific coordinates
 */
export function getTileAt(row, col) {
    if (row < 0 || row > 3 || col < 0 || col > 3) return null; // 4x4 bounds
    const index = row * 4 + col; // 4x4 indexing
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

/**
 * Mark the current tile as consumed (used up)
 */
export function consumeCurrentTile() {
    const currentTile = getCurrentTile();
    if (currentTile) {
        currentTile.consumed = true;
        addLogEntry(`🔍 This area has been thoroughly searched.`);
        console.log('🔍 Tile consumed:', currentTile);
    }
}

/**
 * Check if current tile has been consumed
 */
export function isCurrentTileConsumed() {
    const currentTile = getCurrentTile();
    return currentTile ? currentTile.consumed : false;
}

// ================================================================
// EQUIPMENT SYSTEM FUNCTIONS
// ================================================================

 /**
 * Get equipment item data by ID
 */
export function getEquipmentById(itemId) {
    if (!GAME_DATA.items || !GAME_DATA.items.equipment) return null;
    const item = GAME_DATA.items.equipment[itemId];
    return item ? {...item, id: itemId} : null;
}

/**
 * Equipment slot types
 */
const EQUIPMENT_SLOTS = {
    WEAPON: 'weapon',
    ARMOR: 'armor', 
    ACCESSORY: 'accessory'
};

/**
 * Get a party member's base stats (without equipment bonuses)
 */
function getBaseStats(member) {
    // Store original stats when member is created
    if (!member.baseStats) {
        member.baseStats = {
            hp: member.maxHp,
            atk: member.atk,
            mag: member.mag
        };
    }
    return member.baseStats;
}

/**
 * Calculate total stats including equipment bonuses
 */
function calculateTotalStats(member) {
    const baseStats = getBaseStats(member);
    const equipment = G.equipment[member.id] || [];
    
    let totalStats = {
        hp: baseStats.hp,
        atk: baseStats.atk,
        mag: baseStats.mag
    };
    
    // Add equipment bonuses
    equipment.forEach(item => {
        if (item.statBonus) {
            Object.keys(item.statBonus).forEach(stat => {
                if (totalStats[stat] !== undefined) {
                    totalStats[stat] += item.statBonus[stat];
                }
            });
        }
    });
    
    return totalStats;
}

/**
 * Update a party member's displayed stats based on equipment
 */
function updateMemberStats(member) {
    const totalStats = calculateTotalStats(member);
    
    // Update current stats (but preserve current HP if lower)
    const oldMaxHp = member.maxHp;
    member.atk = totalStats.atk;
    member.mag = totalStats.mag;
    member.maxHp = totalStats.hp;
    
    // Handle HP changes carefully
    if (totalStats.hp !== oldMaxHp) {
        const hpDifference = totalStats.hp - oldMaxHp;
        member.hp = Math.max(1, member.hp + hpDifference); // Don't let HP go to 0 from equipment
        member.hp = Math.min(member.hp, member.maxHp); // Cap at new max
    }
}

/**
 * Equip an item to a party member
 */
export function equipItem(memberId, item) {
    const member = G.party.find(m => m.id === memberId);
    if (!member) {
        addLogEntry(`❌ Cannot find party member ${memberId}`);
        return false;
    }
    
    if (!item.slot) {
        addLogEntry(`❌ ${item.name} is not equipable!`);
        return false;
    }
    
    // Initialize equipment array if needed
    if (!G.equipment[memberId]) {
        G.equipment[memberId] = [];
    }
    
    // Check if slot is already occupied
    const existingItem = G.equipment[memberId].find(equipped => equipped.slot === item.slot);
    if (existingItem) {
        addLogEntry(`⚠️ ${member.name} already has ${existingItem.name} equipped in ${item.slot} slot!`);
        addLogEntry(`🔄 Replacing ${existingItem.name} with ${item.name}`);
        
        // Remove the old item
        G.equipment[memberId] = G.equipment[memberId].filter(equipped => equipped.slot !== item.slot);
    }
    
    // Equip the new item
    G.equipment[memberId].push(item);
    updateMemberStats(member);
    
    addLogEntry(`⚔️ ${member.name} equipped ${item.name}!`);
    
    // Show stat changes
    const totalStats = calculateTotalStats(member);
    addLogEntry(`📊 Stats: ATK ${totalStats.atk}, MAG ${totalStats.mag}, HP ${member.hp}/${member.maxHp}`);
    
    return true;
}

/**
 * Unequip an item from a party member
 */
export function unequipItem(memberId, slot) {
    const member = G.party.find(m => m.id === memberId);
    if (!member) return false;
    
    const equipment = G.equipment[memberId] || [];
    const itemToUnequip = equipment.find(item => item.slot === slot);
    
    if (!itemToUnequip) {
        addLogEntry(`❌ ${member.name} has nothing equipped in ${slot} slot`);
        return false;
    }
    
    // Remove the item
    G.equipment[memberId] = equipment.filter(item => item.slot !== slot);
    updateMemberStats(member);
    
    addLogEntry(`🗑️ ${member.name} unequipped ${itemToUnequip.name}`);
    return itemToUnequip;
}

/**
 * Get equipped item in a specific slot for a member
 */
export function getEquippedItem(memberId, slot) {
    const equipment = G.equipment[memberId] || [];
    return equipment.find(item => item.slot === slot) || null;
}

/**
 * Check if an item is equipment (has a slot)
 */
export function isEquipment(item) {
    return item.slot !== undefined;
}

/**
 * Enhanced item giving that handles equipment vs consumables
 */
export function giveRandomItem() {
    const player = getPartyLeader();
    if (!player) return false;
    
    if (!GAME_DATA.items) {
        // Fallback to old hardcoded system
        const items = [
            { name: 'Health Potion', stat: 'hp', boost: 3, maxBoost: 2 },
            { name: 'Strength Elixir', stat: 'atk', boost: 1 },
            { name: 'Magic Crystal', stat: 'mag', boost: 1 }
        ];
        const item = pickRandom(items);
        applyItemToPlayer(player, item);
        consumeCurrentTile();
        return item;
    }
    
    // Use data-driven items
    const gridKey = `grid-${G.gridLevel}`;
    const lootTable = GAME_DATA.items.lootTables[gridKey] || GAME_DATA.items.lootTables.basic;
    const useConsumable = random() < lootTable.consumables;
    
    const itemPool = useConsumable ? 
        GAME_DATA.items.consumables : 
        GAME_DATA.items.equipment;
        
    const itemKeys = Object.keys(itemPool);
    const itemKey = pickRandom(itemKeys);
    const item = itemPool[itemKey];
    
    // Handle equipment vs consumables differently
    if (isEquipment(item)) {
        // Equipment - try to equip automatically to party leader
        const equipped = equipItem(player.id, item);
        if (!equipped) {
            // If couldn't equip, treat as consumable
            applyItemToPlayer(player, item);
        }
    } else {
        // Consumable - apply immediately
        applyItemToPlayer(player, item);
    }
    
    consumeCurrentTile();
    return item;
}

/**
 * Initialize equipment tracking for all party members
 */
export function initializeEquipment() {
    G.party.forEach(member => {
        if (!G.equipment[member.id]) {
            G.equipment[member.id] = [];
        }
        
        // Ensure base stats are stored
        getBaseStats(member);
    });
}

/**
 * Get available equipment items for a specific slot type
 */
export function getAvailableEquipmentForSlot(slot) {
    if (!GAME_DATA.items || !GAME_DATA.items.equipment) return [];
    
    const allEquipment = GAME_DATA.items.equipment;
    const available = [];
    
    // Get items of the correct slot type
    Object.entries(allEquipment).forEach(([id, item]) => {
        if (item.slot === slot) {
            available.push({...item, id});
        }
    });
    
    // Limit to 3 items for now to keep UI manageable
    return available.slice(0, 3);
}

// ================================================================
// CHARACTER SELECTION FUNCTIONS - FIXED VERSION
// REPLACE your existing character selection functions with these
// ================================================================



/**
 * Generate character cards from allies data
 */
function generateCharacterCards() {
    const cards = [];
    const classes = ['warrior', 'ranger', 'herbalist', 'rogue', 'paladin'];
    
    // Check if GAME_DATA exists (using local GAME_DATA variable, not window.GAME_DATA)
    if (!GAME_DATA || !GAME_DATA.allies || !GAME_DATA.allies['forest-region']) {
        console.warn('GAME_DATA not ready, using default character');
        return [];
    }
    
    const regionData = GAME_DATA.allies['forest-region'];
    
    for (const className of classes) {
        const classData = regionData[className];
        if (classData) {
            // Generate procedural name
            const name = pickRandom(classData.names);
            const title = pickRandom(classData.titles);
            const fullName = `${name} ${title}`;
            
            const characterCard = {
                className: className,
                name: fullName,
                displayClass: className.charAt(0).toUpperCase() + className.slice(1),
                description: classData.description,
                stats: classData.baseStats,
                startingCard: classData.cards && classData.cards.length > 0 ? classData.cards[0] : null,
                tags: classData.tags
            };
            
            cards.push(characterCard);
        }
    }
    
    return cards;
}

/**
 * Populate character selection modal with cards - DEBUG VERSION
 */
function populateCharacterSelectionModal(characterCards) {
    const container = document.querySelector('.character-cards-container');
    console.log('🔍 DEBUG: Container found:', container);
    console.log('🔍 DEBUG: Cards to populate:', characterCards.length);
    
    if (!container) {
        console.error('❌ character-cards-container not found!');
        return;
    }
    
    container.innerHTML = '';
    
    characterCards.forEach((card, index) => {
        console.log('🔍 DEBUG: Creating card:', card.name);
        const cardElement = createCharacterCardElement(card, index);
        console.log('🔍 DEBUG: Card element created:', cardElement);
        container.appendChild(cardElement);
    });
    console.log('🔍 DEBUG: Cards added to container. Container HTML:', container.innerHTML.length, 'characters');
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
        <div class="character-portrait">
          <img src="./images/portraits/class-${card.className}.png" alt="${card.className}"
             onerror="this.style.display='none'; this.nextElementSibling.style.display='inline'">
          <span class="character-portrait-fallback">${getClassIcon(card.className)}</span>
        </div>
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
    // Use local GAME_DATA variable instead of window.GAME_DATA
    if (!GAME_DATA || !GAME_DATA.allies) {
        console.warn('GAME_DATA not available for starting cards');
        return;
    }
    
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
 * Get icon for character class (fallback when portrait image fails)
 */
function getClassIcon(className) {
    const classIcons = {
        'warrior': '⚔️',
        'ranger': '🏹',
        'herbalist': '🌿',
        'rogue': '🗡️',
        'paladin': '🛡️'
    };
    return classIcons[className] || '👤';
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
