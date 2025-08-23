// ================================================================
// CRUXFADE-MICRO - UI.JS
// DOM rendering and user interaction handling
// ================================================================

// Import state management functions
import { 
    G, 
    movePlayer, 
    getCurrentTile, 
    foundKey, 
    nextGrid, 
    addLogEntry,
    getTileAt,
    isAdjacentToPlayer
} from './state.js';

import { updateGame } from './main.js';

// ================================================================
// DOM ELEMENT CACHING
// ================================================================

// Cache frequently accessed DOM elements
let DOM = {};

/**
 * Cache all important DOM elements for performance
 */
function cacheDOMElements() {
    DOM = {
        // Main sections
        gameBoard: document.getElementById('game-board'),
        partyStats: document.getElementById('party-stats'),
        partyHand: document.getElementById('party-hand'),
        encounterArea: document.getElementById('encounter-area'),
        encounterActions: document.getElementById('encounter-actions'),
        
        // Header info
        gridLevel: document.getElementById('grid-level'),
        keysFound: document.getElementById('keys-found'),
        runSeed: document.getElementById('run-seed'),
        deckCount: document.getElementById('deck-count'),
        handCount: document.getElementById('hand-count'),
        
        // Game log
        gameLog: document.getElementById('game-log'),
        
        // Overlays
        overlaySystem: document.getElementById('overlay-system'),
        diceOverlay: document.getElementById('dice-overlay'),
        combatOverlay: document.getElementById('combat-overlay'),
        
        // All tile elements (will be populated)
        tiles: []
    };
    
    // Cache all tile elements
    DOM.tiles = Array.from(document.querySelectorAll('.tile'));
}

// ================================================================
// MAIN RENDER FUNCTION
// ================================================================

/**
 * Render all UI elements - called after any state change
 */
export function renderAll() {
    renderBoard();
    renderPartyStatus();
    renderPartyHand();
    renderEncounterArea();
    renderHeaderInfo();
    renderGameLog();
    
    console.log('🎨 UI rendered');
}

// ================================================================
// BOARD RENDERING
// ================================================================

/**
 * Render the 3x3 game board
 */
function renderBoard() {
    if (!DOM.tiles) return;
    
    console.log('🎨 Rendering board with', G.board.tiles.length, 'tiles');
    
    DOM.tiles.forEach((tileElement, index) => {
        const row = Math.floor(index / 3);
        const col = index % 3;
        const tile = G.board.tiles[index];
        
        // Clear previous classes
        tileElement.className = 'tile';
        tileElement.innerHTML = '';
        
        // Add revealed state
        if (tile.revealed) {
            tileElement.classList.add('revealed');
        }
        
        // Add tile type
        if (tile.type) {
            tileElement.classList.add(tile.type);
        }
        
        // Mark player position
        if (G.board.player.r === row && G.board.player.c === col) {
            tileElement.classList.add('player-tile');
        }
        
        // Add tile content based on type
        const content = getTileDisplayContent(tile);
        tileElement.innerHTML = content;
        
        // Add click handler state - make adjacent tiles more obvious
        if (isAdjacentToPlayer(row, col) && !isPlayerCurrentTile(row, col)) {
            tileElement.classList.add('adjacent');
            tileElement.style.cursor = 'pointer';
            tileElement.style.border = '2px solid var(--accent)';
        } else if (isPlayerCurrentTile(row, col)) {
            tileElement.style.cursor = 'default';
            tileElement.style.border = '2px solid var(--accent)';
        } else {
            tileElement.style.cursor = 'default';
            tileElement.style.border = '1px solid var(--surface-border)';
        }
        
        // Debug info
        console.log(`Tile ${index} (${row},${col}): ${tile.type}, revealed: ${tile.revealed}, adjacent: ${isAdjacentToPlayer(row, col)}`);
    });
}

/**
 * Get display content for a tile based on its type
 */
function getTileDisplayContent(tile) {
    if (!tile.revealed && tile.type !== 'start') {
        return '<span style="opacity: 0.5">?</span>';
    }
    
    const icons = {
        start: '◉',
        fight: '⚔️',
        hazard: '⚡',
        item: '📦',
        ally: '🤝',
        key: '🗝️',
        door: '🚪',
        empty: '·'
    };
    
    return icons[tile.type] || '?';
}

/**
 * Check if coordinates are the player's current tile
 */
function isPlayerCurrentTile(row, col) {
    return G.board.player.r === row && G.board.player.c === col;
}

// ================================================================
// PARTY STATUS RENDERING
// ================================================================

/**
 * Render party member stats and info
 */
function renderPartyStatus() {
    if (!DOM.partyStats) return;
    
    DOM.partyStats.innerHTML = '';
    
    G.party.forEach((member, index) => {
        const memberElement = createPartyMemberElement(member, index === 0);
        DOM.partyStats.appendChild(memberElement);
    });
}

/**
 * Create a party member display element
 */
function createPartyMemberElement(member, isLeader = false) {
    const memberDiv = document.createElement('div');
    memberDiv.className = 'party-member';
    
    const hpColor = member.hp <= member.maxHp * 0.25 ? '#ef6b73' : 
                    member.hp <= member.maxHp * 0.5 ? '#f6d55c' : '#68d391';
    
    memberDiv.innerHTML = `
        <div class="member-portrait">
            <img src="./images/portraits/${member.id}.png" alt="${member.name}" onerror="this.style.display='none'">
            <span class="portrait-fallback">${getCharacterIcon(member)}</span>
        </div>
        <div class="member-info">
            <strong>${member.name}</strong>
            <div class="stats">
                <span class="hp">❤️ <strong style="color: ${hpColor}">${member.hp}</strong>/${member.maxHp}</span>
                <span class="atk">⚔️ <strong>${member.atk}</strong></span>
                <span class="mag">✨ <strong>${member.mag}</strong></span>
            </div>
        </div>
        ${isLeader ? '<div class="leader-marker">LEADER</div>' : ''}
    `;
    
    return memberDiv;
}

/**
 * Get appropriate icon for character type
 */
function getCharacterIcon(member) {
    if (member.tags.includes('leader')) return '⚔️';
    if (member.tags.includes('warrior')) return '🛡️';
    if (member.tags.includes('mage')) return '🔮';
    if (member.tags.includes('rogue')) return '🗡️';
    return '👤';
}

// ================================================================
// PARTY HAND RENDERING
// ================================================================

/**
 * Render the overlapping party card display
 */
function renderPartyHand() {
    if (!DOM.partyHand) return;
    
    DOM.partyHand.innerHTML = '';
    
    G.party.forEach((member, index) => {
        const cardElement = createPartyCardElement(member, index === 0);
        DOM.partyHand.appendChild(cardElement);
    });
}

/**
 * Create a party member card element
 */
function createPartyCardElement(member, isLeader = false) {
    const cardDiv = document.createElement('div');
    cardDiv.className = `party-card ${isLeader ? 'leader' : ''}`;
    
    // Get member's skills/cards
    const skills = getMemberSkills(member);
    const skillsHtml = skills.map(skill => `<span class="skill">${skill}</span>`).join('');
    
    cardDiv.innerHTML = `
        <div class="card-portrait">${getCharacterIcon(member)}</div>
        <div class="card-content">
            <h4>${member.name}</h4>
            <div class="card-skills">
                ${skillsHtml}
            </div>
        </div>
    `;
    
    return cardDiv;
}

/**
 * Get skills/abilities for a party member
 */
function getMemberSkills(member) {
    // For now, return basic skills - will be expanded with card system
    const skills = ['Basic Strike'];
    
    if (member.tags.includes('leader')) skills.push('Command');
    if (member.tags.includes('warrior')) skills.push('Shield Bash');
    if (member.tags.includes('mage')) skills.push('Magic Bolt');
    
    return skills;
}

// ================================================================
// ENCOUNTER AREA RENDERING
// ================================================================

/**
 * Render the current encounter area
 */
function renderEncounterArea() {
    if (!DOM.encounterArea || !DOM.encounterActions) return;
    
    const currentTile = getCurrentTile();
    
    if (!currentTile.revealed || currentTile.type === 'start' || currentTile.type === 'empty') {
        // No encounter or empty tile
        DOM.encounterArea.innerHTML = `
            <div class="encounter-placeholder">
                <p>Move to a tile to begin an encounter...</p>
            </div>
        `;
        DOM.encounterActions.innerHTML = '<button class="btn-primary" disabled>Waiting...</button>';
        return;
    }
    
    // Render encounter based on tile type
    renderEncounterByType(currentTile);
}

/**
 * Render encounter content based on tile type
 */
function renderEncounterByType(tile) {
    switch (tile.type) {
        case 'fight':
            renderFightEncounter();
            break;
        case 'hazard':
            renderHazardEncounter();
            break;
        case 'item':
            renderItemEncounter();
            break;
        case 'ally':
            renderAllyEncounter();
            break;
        case 'key':
            renderKeyEncounter();
            break;
        case 'door':
            renderDoorEncounter();
            break;
        default:
            renderDefaultEncounter();
    }
}

/**
 * Render a fight encounter
 */
function renderFightEncounter() {
    DOM.encounterArea.innerHTML = `
        <div class="encounter-fight">
            <h3>⚔️ Enemy Encounter</h3>
            <p>A wild goblin blocks your path!</p>
            <div class="enemy-stats">
                <strong>Goblin</strong> - HP: 4, ATK: 2
            </div>
        </div>
    `;
    
    DOM.encounterActions.innerHTML = `
        <button class="btn-primary" onclick="window.CruxfadeMicro.startCombat()">Fight!</button>
        <button class="btn-secondary" onclick="window.CruxfadeMicro.flee()">Flee</button>
    `;
}

/**
 * Render other encounter types (simplified for now)
 */
function renderHazardEncounter() {
    DOM.encounterArea.innerHTML = `
        <div class="encounter-hazard">
            <h3>⚡ Hazard</h3>
            <p>A dangerous trap lies ahead...</p>
        </div>
    `;
    DOM.encounterActions.innerHTML = `<button class="btn-primary" onclick="window.CruxfadeMicro.resolveHazard()">Navigate Carefully</button>`;
}

function renderItemEncounter() {
    DOM.encounterArea.innerHTML = `
        <div class="encounter-item">
            <h3>📦 Item Found</h3>
            <p>You discovered a useful item!</p>
        </div>
    `;
    DOM.encounterActions.innerHTML = `<button class="btn-primary" onclick="window.CruxfadeMicro.takeItem()">Take Item</button>`;
}

function renderAllyEncounter() {
    DOM.encounterArea.innerHTML = `
        <div class="encounter-ally">
            <h3>🤝 Potential Ally</h3>
            <p>A warrior offers to join your party...</p>
        </div>
    `;
    DOM.encounterActions.innerHTML = `<button class="btn-primary" onclick="window.CruxfadeMicro.recruitAlly()">Recruit</button>`;
}

function renderKeyEncounter() {
    DOM.encounterArea.innerHTML = `
        <div class="encounter-key">
            <h3>🗝️ Key Found</h3>
            <p>The key to the next grid lies here!</p>
        </div>
    `;
    DOM.encounterActions.innerHTML = `<button class="btn-primary" onclick="window.CruxfadeMicro.takeKey()">Take Key</button>`;
}

function renderDoorEncounter() {
    const canProceed = G.keyFound;
    DOM.encounterArea.innerHTML = `
        <div class="encounter-door">
            <h3>🚪 Grid Exit</h3>
            <p>${canProceed ? 'The door is unlocked! You can proceed.' : 'The door is locked. Find the key first.'}</p>
        </div>
    `;
    DOM.encounterActions.innerHTML = `
        <button class="btn-primary" ${canProceed ? '' : 'disabled'} onclick="window.CruxfadeMicro.proceedToNextGrid()">
            ${canProceed ? 'Enter Next Grid' : 'Locked'}
        </button>
    `;
}

function renderDefaultEncounter() {
    DOM.encounterArea.innerHTML = `<div class="encounter-placeholder"><p>Nothing here...</p></div>`;
    DOM.encounterActions.innerHTML = '<button class="btn-primary" disabled>Continue</button>';
}

// ================================================================
// HEADER INFO RENDERING
// ================================================================

/**
 * Render header information (grid level, keys, seed, etc.)
 */
function renderHeaderInfo() {
    if (DOM.gridLevel) DOM.gridLevel.textContent = G.gridLevel;
    if (DOM.keysFound) DOM.keysFound.textContent = G.keyFound ? '1' : '0';
    if (DOM.runSeed) DOM.runSeed.textContent = G.seed;
    if (DOM.deckCount) DOM.deckCount.textContent = G.deck.length;
    if (DOM.handCount) DOM.handCount.textContent = G.hand.length;
}

// ================================================================
// GAME LOG RENDERING
// ================================================================

/**
 * Render the game log
 */
function renderGameLog() {
    if (!DOM.gameLog) return;
    
    // Show last 10 log entries
    const recentLogs = G.log.slice(-10);
    DOM.gameLog.innerHTML = recentLogs.map(entry => `<p>${entry}</p>`).join('');
    
    // Auto-scroll to bottom
    DOM.gameLog.scrollTop = DOM.gameLog.scrollHeight;
}

// ================================================================
// EVENT HANDLERS
// ================================================================

/**
 * Bind all event handlers for user interaction
 */
export function bindEventHandlers() {
    // Cache DOM elements first
    cacheDOMElements();
    
    // Tile click handlers
    bindTileClickHandlers();
    
    // Overlay handlers
    bindOverlayHandlers();
    
    console.log('🎯 Event handlers bound');
}

/**
 * Bind click handlers for board tiles
 */
function bindTileClickHandlers() {
    DOM.tiles.forEach((tileElement, index) => {
        tileElement.addEventListener('click', () => {
            const row = Math.floor(index / 3);
            const col = index % 3;
            handleTileClick(row, col);
        });
    });
}

/**
 * Handle tile click events
 */
function handleTileClick(row, col) {
    console.log(`🖱️ Tile clicked: (${row}, ${col})`);
    console.log(`Current player position: (${G.board.player.r}, ${G.board.player.c})`);
    console.log(`Is adjacent: ${isAdjacentToPlayer(row, col)}`);
    console.log(`Game over: ${G.over}`);
    
    if (G.over) return;
    
    // Check if it's an adjacent tile
    if (isAdjacentToPlayer(row, col)) {
        console.log('🎯 Attempting to move player...');
        const success = movePlayer(row, col);
        if (success) {
            console.log('✅ Move successful, updating game...');
            updateGame();
        } else {
            console.log('❌ Move failed');
        }
    } else if (!isPlayerCurrentTile(row, col)) {
        addLogEntry('❌ Can only move to adjacent tiles');
        updateGame();
    } else {
        console.log('📍 Clicked current player tile');
    }
}

/**
 * Bind overlay system handlers
 */
function bindOverlayHandlers() {
    // Close overlays when clicking outside content
    document.querySelectorAll('.overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeAllOverlays();
            }
        });
    });
}

// ================================================================
// OVERLAY MANAGEMENT
// ================================================================

/**
 * Show an overlay by ID
 */
export function showOverlay(overlayId) {
    const overlay = document.getElementById(overlayId);
    if (overlay) {
        overlay.classList.add('active');
    }
}

/**
 * Hide an overlay by ID
 */
export function hideOverlay(overlayId) {
    const overlay = document.getElementById(overlayId);
    if (overlay) {
        overlay.classList.remove('active');
    }
}

/**
 * Close all overlays
 */
export function closeAllOverlays() {
    document.querySelectorAll('.overlay').forEach(overlay => {
        overlay.classList.remove('active');
    });
}

// ================================================================
// GAME ACTION HANDLERS (exposed globally)
// ================================================================

// Make encounter actions available globally
window.CruxfadeMicro = {
    // Combat actions
    startCombat: () => { 
        console.log('⚔️ Starting combat...');
        showOverlay('combat-overlay'); 
    },
    flee: () => { 
        addLogEntry('🏃 You fled from combat!'); 
        updateGame(); 
    },
    
    // Encounter resolutions
    resolveHazard: () => { 
        addLogEntry('⚡ You carefully navigate the hazard!'); 
        updateGame(); 
    },
    takeItem: () => { 
        addLogEntry('📦 You found a useful item!'); 
        updateGame(); 
    },
    recruitAlly: () => { 
        addLogEntry('🤝 The warrior joins your party!'); 
        updateGame(); 
    },
    takeKey: () => { 
        console.log('🗝️ Taking key...');
        foundKey(); 
        updateGame(); 
    },
    proceedToNextGrid: () => { 
        console.log('🚪 Proceeding to next grid...');
        nextGrid(); 
        updateGame(); 
    },
    
    // Utility
    closeOverlays: closeAllOverlays
};

// Log that we've set up the global object
console.log('✅ Global CruxfadeMicro ready with functions:', Object.keys(window.CruxfadeMicro));
