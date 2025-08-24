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

// ui.js

// ================================================================
// ENCOUNTER AREA RENDERING (Add this entire section)
// ================================================================

/**
 * Renders the encounter area based on the player's current tile.
 * This function acts as a dispatcher.
 */
function renderEncounterArea() {
    const tile = getCurrentTile();
    if (!tile) {
        renderDefaultEncounter();
        return;
    }

    // Based on the tile type, call the specific render function
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
        case 'start':
        case 'empty':
            renderDefaultEncounter();
            break;
        default:
            console.warn(`Unknown tile type for encounter rendering: ${tile.type}`);
            renderDefaultEncounter();
            break;
    }
}

// NOTE: The individual functions like renderFightEncounter(), 
// renderKeyEncounter(), etc., that you've already written are perfect. 
// This new function just ties them all together.

// ================================================================
// ENCOUNTER RENDERING FUNCTIONS - Using data-action instead of onclick
// Replace these functions in your ui.js (around lines 340-420)
// ================================================================

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
        <button class="btn-primary" data-action="start-combat">Fight!</button>
        <button class="btn-secondary" data-action="flee">Flee</button>
    `;
}

/**
 * Render a hazard encounter
 */
function renderHazardEncounter() {
    DOM.encounterArea.innerHTML = `
        <div class="encounter-hazard">
            <h3>⚡ Hazard</h3>
            <p>A dangerous trap lies ahead...</p>
        </div>
    `;
    DOM.encounterActions.innerHTML = `
        <button class="btn-primary" data-action="resolve-hazard">Navigate Carefully</button>
    `;
}

/**
 * Render an item encounter
 */
function renderItemEncounter() {
    DOM.encounterArea.innerHTML = `
        <div class="encounter-item">
            <h3>📦 Item Found</h3>
            <p>You discovered a useful item!</p>
        </div>
    `;
    DOM.encounterActions.innerHTML = `
        <button class="btn-primary" data-action="take-item">Take Item</button>
    `;
}

/**
 * Render an ally encounter
 */
function renderAllyEncounter() {
    DOM.encounterArea.innerHTML = `
        <div class="encounter-ally">
            <h3>🤝 Potential Ally</h3>
            <p>A warrior offers to join your party...</p>
        </div>
    `;
    DOM.encounterActions.innerHTML = `
        <button class="btn-primary" data-action="recruit-ally">Recruit</button>
    `;
}

/**
 * Render a key encounter
 */
function renderKeyEncounter() {
    DOM.encounterArea.innerHTML = `
        <div class="encounter-key">
            <h3>🗝️ Key Found</h3>
            <p>The key to the next grid lies here!</p>
        </div>
    `;
    DOM.encounterActions.innerHTML = `
        <button class="btn-primary" data-action="take-key">Take Key</button>
    `;
}

/**
 * Render a door encounter
 */
function renderDoorEncounter() {
    const canProceed = G.keyFound;
    DOM.encounterArea.innerHTML = `
        <div class="encounter-door">
            <h3>🚪 Grid Exit</h3>
            <p>${canProceed ? 'The door is unlocked! You can proceed.' : 'The door is locked. Find the key first.'}</p>
        </div>
    `;
    DOM.encounterActions.innerHTML = `
        <button class="btn-primary" ${canProceed ? '' : 'disabled'} data-action="proceed-next-grid">
            ${canProceed ? 'Enter Next Grid' : 'Locked'}
        </button>
    `;
}

/**
 * Render default/empty encounter
 */
function renderDefaultEncounter() {
    DOM.encounterArea.innerHTML = `
        <div class="encounter-placeholder">
            <p>This area is empty...</p>
        </div>
    `;
    DOM.encounterActions.innerHTML = '';
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
    
    // Event delegation for encounter actions
    // This handles ALL button clicks in the encounter area
    const encounterActions = document.getElementById('encounter-actions');
    if (encounterActions) {
        encounterActions.addEventListener('click', (e) => {
            // Find the button that was clicked
            const button = e.target.closest('button[data-action]');
            if (!button || button.disabled) return;
            
            // Get the action from the data-action attribute
            const action = button.dataset.action;
            console.log('🎮 Action triggered:', action);
            
            // Handle the action
            switch(action) {
                case 'start-combat':
                    console.log('⚔️ Starting combat...');
                    showOverlay('combat-overlay');
                    break;
                    
                case 'flee':
                    addLogEntry('🏃 You fled from combat!');
                    updateGame();
                    break;
                    
                case 'resolve-hazard':
                    addLogEntry('⚡ You carefully navigate the hazard!');
                    updateGame();
                    break;
                    
                case 'take-item':
                    addLogEntry('📦 You found a useful item!');
                    updateGame();
                    break;
                    
                case 'recruit-ally':
                    addLogEntry('🤝 The warrior joins your party!');
                    updateGame();
                    break;
                    
                case 'take-key':
                    console.log('🗝️ Taking key...');
                    foundKey();
                    updateGame();
                    break;
                    
                case 'proceed-next-grid':
                    console.log('🚪 Proceeding to next grid...');
                    nextGrid();
                    updateGame();
                    break;
                    
                default:
                    console.warn('Unknown action:', action);
            }
        });
    }
    
    console.log('🎯 Event handlers bound with delegation');
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
        console.log('🔍 Clicked current player tile');
    }
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
