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
    isAdjacentToPlayer,
    giveRandomItem,
    resolveHazard,
    recruitRandomAlly,
    switchPartyLeader,
    consumeCurrentTile,
    isCurrentTileConsumed,
    getRandomEnemyType,
    getMaxHandSize,
    playCard,
    getAvailableEquipmentForSlot,
    removeAlly,
    // Equipment functions
    getEquipmentById,
    equipItem,
    unequipItem,
    getEquippedItem,
    isEquipment,
    // Combat functions
    attemptFlee,
    startCombat,
    playerAttack,
    enemyAttack,
    rollDice,
    // NEW: Boss system functions
    isInBossEncounter,
    getCurrentBossPhase,
    getCurrentBoss,
    startBossPhase,
    completeBossPhase,
    
} from './state.js';

// ================================================================
// SHORT NAME HELPER FUNCTION
// ================================================================

/**
 * Extract just the first name from a full ally name for compact display
 * "Marcus the Forest Guardian" → "Marcus"
 * "You" → "You" (unchanged)
 */
function getShortName(fullName) {
    // Handle the player character
    if (fullName === 'You') {
        return 'You';
    }
    
    // Extract first name before " the " for allies
    const parts = fullName.split(' the ');
    return parts[0];
}

// ================================================================
// MISSING HELPER FUNCTION FOR UI.JS
// ================================================================
/**
 * Helper to get current region for UI display - LOCAL VERSION FOR UI.JS
 */
function getRegionForGrid(gridLevel) {
    if (gridLevel <= 5) return "forest-region";
    if (gridLevel <= 10) return "mountain-region";  
    return "void-region";
}

// ================================================================
// MODULE VARIABLES
// ================================================================

// DOM element cache
let DOM = {};

// Callback to trigger game updates
let _updateGameCallback = null;

// ================================================================
// DOM ELEMENT CACHING
// ================================================================

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
        
        // Game log - now in its own section
        gameLog: document.getElementById('game-log'),
        
        // Overlays
        overlaySystem: document.getElementById('overlay-system'),
        diceOverlay: document.getElementById('dice-overlay'),
        combatOverlay: document.getElementById('combat-overlay'),
        cardOverflowOverlay: document.getElementById('card-overflow-overlay'),
        equipmentManagementOverlay: document.getElementById('equipment-management-overlay'),
        
        // All tile elements (will be populated with 16 tiles)
        tiles: []
    };
    
    // Cache all 16 tile elements for 4x4 grid
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
    
    // NEW: Check if victory screen should be shown
    if (G.victory && G.over) {
        showVictoryScreen();
    }
    
}



// ================================================================
// UPDATED: BOARD RENDERING FUNCTION - FOG OF WAR COMPATIBLE
// ================================================================

/**
 * Render the 4x4 game board - UPDATED for fog of war system
 */
function renderBoard() {
    if (!G.board.tiles || G.board.tiles.length === 0) {
        console.log('⚠️ No tiles to render yet, skipping board render');
        return;
    }
    if (!DOM.tiles) return;
    
    DOM.tiles.forEach((tileElement, index) => {
        const row = Math.floor(index / 4); // 4x4 math
        const col = index % 4;
        const tile = G.board.tiles[index];
        
        // Clear all previous classes
        tileElement.className = 'tile';
        tileElement.innerHTML = '';
        
        // Determine tile visibility state
        const isPlayerHere = (G.board.player.r === row && G.board.player.c === col);
        
        if (!tile.discovered) {
            // HIDDEN TILE - Player doesn't know this exists
            tileElement.classList.add('hidden');
            tileElement.innerHTML = ''; // No content shown
            
        } else if (!tile.explored) {
    // Special case: Start and empty tiles should show as empty, not unknown
    if (tile.type === 'start' || tile.type === 'empty') {
        tileElement.classList.add('explored');
        tileElement.innerHTML = ''; // Show nothing
    } else {
        // DISCOVERABLE TILE - Shows "?" icon, darkened
        tileElement.classList.add('discoverable');
        tileElement.innerHTML = '<img src="./images/icons/unknown.png" class="unknown-icon-img">';
    }
            
            // Add adjacent class for clicking if next to player
            if (isAdjacentToPlayer(row, col)) {
                tileElement.classList.add('adjacent');
            }
            
        } else {
            // EXPLORED TILE - Shows actual content
            tileElement.classList.add('explored');
            
            // Show actual tile content
            const content = getExploredTileContent(tile);
            tileElement.innerHTML = content;
            
            // Add tile type class for styling
            if (tile.type) {
                tileElement.classList.add(tile.type);
            }
            
            // Mark consumed tiles
            if (tile.consumed) {
                tileElement.classList.add('consumed');
            }
        }
        
        // CURRENT PLAYER POSITION - Blue glow highlight (no extra icon)
        if (isPlayerHere) {
            tileElement.classList.add('player-tile');
            // Remove the player position ::before CSS - we'll handle this in CSS
        }
        
        // Add adjacent class for clickable tiles that can be moved to
        if (isAdjacentToPlayer(row, col) && !isPlayerHere && tile.discovered) {
            tileElement.classList.add('adjacent');
        }
    });
}

// ================================================================
// portrait icon fallback
// ================================================================

/**
 * Get icon filename based on member type
 */
function getIconFileName(member) {
    if (member.tags.includes('leader')) return 'leader.png';
    if (member.tags.includes('warrior')) return 'warrior.png';
    if (member.tags.includes('mage')) return 'mage.png';
    if (member.tags.includes('rogue')) return 'rogue.png';
    if (member.tags.includes('scout')) return 'scout.png';
    return 'default.png';
}

// ================================================================
// NEW: EXPLORED TILE CONTENT FUNCTION - SINGLE ICON ONLY
// ================================================================
/**
 * Get display content for explored tiles - SINGLE ICON, no duplicates
 * @param {Object} tile - The tile object to get content for
 * @returns {string} HTML content for the tile
 */
function getExploredTileContent(tile) {
    const icons = {
        start: '', // Empty for start tile - no icon needed
        fight: '<img src="./images/tiles/fight.png" class="tile-icon-img" alt="Fight">',
        hazard: '<img src="./images/tiles/hazard.png" class="tile-icon-img" alt="Hazard">',
        item: '<img src="./images/tiles/item.png" class="tile-icon-img" alt="Item">',
        ally: '<img src="./images/tiles/ally.png" class="tile-icon-img" alt="Ally">',
        key: '<img src="./images/tiles/key.png" class="tile-icon-img" alt="Key">',
        door: '<img src="./images/tiles/door.png" class="tile-icon-img" alt="Door">',
        empty: '', // Empty tiles show no icon
        'boss-encounter': '<img src="./images/tiles/boss.png" class="tile-icon-img" alt="Boss">'
    };
    
    const icon = tile.type in icons ? icons[tile.type] : '<img src="./images/icons/unknown.png" class="unknown-icon-img">';
    
    // Return just the icon - NO DUPLICATES
    return icon ? `<span class="tile-icon">${icon}</span>` : '';
}
// ================================================================
// UTILITY FUNCTION - CHECK IF TILE IS CURRENTLY PLAYER POSITION
// ================================================================

/**
 * Check if coordinates are the player's current tile (helper function)
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
  
  // Check if member is fallen (dead)
  const isFallen = member.hp <= 0;
  
  if (isFallen) {
    memberDiv.classList.add('fallen');
    memberDiv.style.cursor = 'default'; // No clicking on dead members
  } else {
    memberDiv.style.cursor = 'pointer';
  }

  // Compute display values
  const hpColor = isFallen ? '#666' : // Grey for dead
    member.hp <= member.maxHp * 0.25 ? '#ef6b73' :
    member.hp <= member.maxHp * 0.5  ? '#f6d55c' :
                                        '#68d391';


  // Equipped items
  const equipment = G.equipment[member.id] || [];
  const weapon    = equipment.find(item => item.slot === 'weapon');
  const armor     = equipment.find(item => item.slot === 'armor');
  const accessory = equipment.find(item => item.slot === 'accessory');

  // Build compact DOM - reduce padding and spacing
  memberDiv.innerHTML = `
    <div class="member-portrait">
     <img src="./images/icons/${member.id}.png" alt="${member.name}"
     onerror="this.onerror=null; this.src='./images/icons/${getIconFileName(member)}'; this.onload=function(){this.style.display='inline'}; this.onerror=function(){this.style.display='none'; this.nextElementSibling.style.display='inline'}">
      <span class="portrait-fallback" style="font-size: 1rem;">${getCharacterIcon(member)}</span>
    </div>
    <div class="member-info" style="flex: 1;">
      <strong style="font-size: 0.85rem;">${getShortName(member.name)}</strong>
      <div class="stats">
  <span class="hp">❤️ <strong style="color:${hpColor}">${member.hp}</strong>/${member.maxHp}</span>
  <div class="atk-mag-row">
    <span class="atk">⚔️ <strong>${member.atk}</strong></span>
    <span class="mag">✨ <strong>${member.mag}</strong></span>
  </div>
</div>
      <div class="equipment-display" style="margin-top: 4px; gap: 2px;">
        <div class="equipment-slot weapon-slot clickable-slot" style="padding: 1px 3px; font-size: 0.65rem;"
             data-member-id="${member.id}" data-slot="weapon" title="Click to manage weapon">
          <span class="slot-icon" style="width: 12px;">⚔️</span>
          <span class="equipment-name">${weapon ? weapon.name : 'None'}</span>
        </div>
        <div class="equipment-slot armor-slot clickable-slot" style="padding: 1px 3px; font-size: 0.65rem;"
             data-member-id="${member.id}" data-slot="armor" title="Click to manage armor">
          <span class="slot-icon" style="width: 12px;">🛡️</span>
          <span class="equipment-name">${armor ? armor.name : 'None'}</span>
        </div>
        <div class="equipment-slot accessory-slot clickable-slot" style="padding: 1px 3px; font-size: 0.65rem;"
             data-member-id="${member.id}" data-slot="accessory" title="Click to manage accessory">
          <span class="slot-icon" style="width: 12px;">💎</span>
          <span class="equipment-name">${accessory ? accessory.name : 'None'}</span>
        </div>
      </div>
    </div>
   ${isLeader && !isFallen ? '<div class="leader-marker">LEADER</div>' : 
      isFallen ? '<div class="fallen-marker">FALLEN</div>' : ''}
  `;

  // Only add click handlers for living members
  if (!isFallen) {
    memberDiv.addEventListener('click', (e) => {
      if (e.target.closest('.clickable-slot')) return;
      switchPartyLeader(member.id);
      _updateGameCallback();
    });

    // Add equipment management clicks (ONLY for living members)
    const equipmentSlots = memberDiv.querySelectorAll('.clickable-slot');
    equipmentSlots.forEach(slot => {
      slot.addEventListener('click', (e) => {
        e.stopPropagation();
        const memberId = slot.dataset.memberId;
        const slotType = slot.dataset.slot;

        showEquipmentManagement(memberId, slotType, () => {
          _updateGameCallback();
        });
      });
    });
  }
  
  return memberDiv;
}

/**
 * Get appropriate icon for character type
 */
function getCharacterIcon(member) {
  if (member.tags.includes('leader'))  return '<img src="./images/icons/leader.png" class="char-icon">';
  if (member.tags.includes('warrior')) return '<img src="./images/icons/warrior.png" class="char-icon">';
  if (member.tags.includes('mage'))    return '<img src="./images/icons/mage.png" class="char-icon">';
  if (member.tags.includes('rogue'))   return '<img src="./images/icons/rogue.png" class="char-icon">';
  if (member.tags.includes('scout'))   return '<img src="./images/icons/scout.png" class="char-icon">';  
  return '<img src="./images/icons/default.png" class="char-icon">';
}


// ================================================================
// PARTY HAND RENDERING (Updated for Two-Click System)
// ================================================================

// Track selected card state
let selectedCardId = null;

/**
 * Render the overlapping party card display with two-click system
 */
function renderPartyHand() {
    if (!DOM.partyHand) return;
    
    // Clear previous content
    DOM.partyHand.innerHTML = `<h4 style="margin-bottom: 8px;">Hand (${G.hand.length}/5)</h4>`;
    
    // Create card container
    const cardContainer = document.createElement('div');
    cardContainer.className = 'party-hand-cards';
    cardContainer.style.cssText = `
        display: flex;
        align-items: flex-end;
        padding-left: 10px;
        min-height: 120px;
        position: relative;
    `;
    
    // Create each card
    G.hand.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'playable-card-compact';
        cardElement.dataset.cardId = card.id;
        
        // Add selected state if this card is selected
        if (selectedCardId === card.id) {
            cardElement.classList.add('selected');
        }
        
        // Card content
        cardElement.innerHTML = `
            <h4>${card.name}</h4>
            <div class="card-type">${card.type}</div>
        `;
        
        // Add click handler for two-click system
        cardElement.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event bubbling
            handleCardClick(card.id, cardElement);
        });
        
        cardContainer.appendChild(cardElement);
    });
    
    DOM.partyHand.appendChild(cardContainer);
    
    // Add click-away handler to deselect cards
    addClickAwayHandler();
}

/**
 * Handle card click for two-click system
 */
function handleCardClick(cardId, cardElement) {
    if (selectedCardId === cardId) {
        // Second click on same card - USE the card
        playCard(cardId);
        selectedCardId = null; // Reset selection
        _updateGameCallback();
    } else {
        // First click or different card - SELECT the card
        selectedCardId = cardId;
        
        // Visual feedback: re-render to show selected state
        renderPartyHand();
        
        // Optional: Show tooltip or feedback
        showCardSelectionFeedback(cardElement);
    }
}

/**
 * Show visual feedback when card is selected
 */
function showCardSelectionFeedback(cardElement) {
    // Create temporary feedback element
    const feedback = document.createElement('div');
    feedback.textContent = 'Click again to use';
    feedback.style.cssText = `
        position: absolute;
        top: -25px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--accent);
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 0.7rem;
        pointer-events: none;
        z-index: 10;
        opacity: 0;
        transition: opacity 0.2s ease;
    `;
    
    cardElement.style.position = 'relative';
    cardElement.appendChild(feedback);
    
    // Animate in
    setTimeout(() => feedback.style.opacity = '1', 10);
    
    // Remove after 2 seconds
    setTimeout(() => {
        if (feedback.parentNode) {
            feedback.remove();
        }
    }, 2000);
}

/**
 * Add click-away handler to deselect cards when clicking elsewhere
 */
function addClickAwayHandler() {
    // Remove existing handler to prevent duplicates
    document.removeEventListener('click', handleClickAway);
    
    // Add new handler
    document.addEventListener('click', handleClickAway);
}

/**
 * Handle clicks outside of cards to deselect
 */
function handleClickAway(e) {
    // Check if click was outside party hand area
    if (!e.target.closest('.party-hand-section')) {
        if (selectedCardId !== null) {
            selectedCardId = null;
            renderPartyHand(); // Re-render to remove selected state
        }
    }
}
// ================================================================
// ENCOUNTER AREA RENDERING
// ================================================================

/**
 * Renders the encounter area based on the player's current tile.
 */
function renderEncounterArea() {
    // NEW: Check for game over first - show game over screen instead of encounters
    if (G.over && !G.victory) {
        renderGameOverScreen();
        return;
    }
    
    // NEW: Check for victory screen
    if (G.victory && G.over) {
        // Victory screen is handled elsewhere
        return;
    }
    
    const tile = getCurrentTile();
    if (!tile) {
        renderDefaultEncounter();
        return;
    }

    // If we're in active combat, always show combat UI regardless of tile type
    if (G.combat.active) {
        renderFightEncounter();
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
        // NEW: Boss encounter rendering
        case 'boss-encounter':
            renderBossEncounter();
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

/**
 * Render game over screen in encounter area
 */
function renderGameOverScreen() {
    DOM.encounterArea.innerHTML = `
        <div class="encounter-game-over">
            <h3>💀 Game Over</h3>
            <p>All party members have fallen.</p>
            <p class="game-over-stats">Grid Level: ${G.gridLevel} | Seed: ${G.seed}</p>
        </div>
    `;
    
    DOM.encounterActions.innerHTML = `
        <button class="btn-primary" onclick="window.CruxfadeMicro.newGame()">New Game</button>
        <button class="btn-secondary" onclick="window.CruxfadeMicro.restartWithSeed()">Same Seed</button>
    `;
}

// ================================================================
// NEW: BOSS ENCOUNTER RENDERING
// ================================================================

/**
 * Render a boss encounter based on current boss state
 */
function renderBossEncounter() {
    if (!isInBossEncounter()) {
        // Not in boss encounter - shouldn't happen
        renderDefaultEncounter();
        return;
    }
    
    const boss = getCurrentBoss();
    const phase = getCurrentBossPhase();
    
    if (!boss || !phase) {
        renderBossIntro();
        return;
    }
    
    // Render based on current phase type
    switch (phase.type) {
        case 'fight':
            renderBossPhaseFight(boss, phase);
            break;
        case 'hazard':
            renderBossPhaseHazard(boss, phase);
            break;
        case 'boss-fight':
            renderBossPhaseFinal(boss, phase);
            break;
        case 'party-choice':
            renderBossPhaseChoice(boss, phase);
            break;
        default:
            renderBossIntro();
            break;
    }
}

/**
 * Render boss encounter intro (before phases start)
 */
function renderBossIntro() {
    const boss = getCurrentBoss();
    if (!boss) {
        renderDefaultEncounter();
        return;
    }
    
    DOM.encounterArea.innerHTML = `
        <div class="encounter-boss-intro">
            <h3>💀 ${boss.name}</h3>
            <p class="boss-description">${boss.description}</p>
            <div class="boss-warning">
                <p><strong>⚠️ Epic Boss Encounter</strong></p>
                <p>This will be a multi-phase battle. Prepare your party!</p>
            </div>
        </div>
    `;
    
    DOM.encounterActions.innerHTML = `
        <button class="btn-primary" data-action="start-boss-sequence">Begin Boss Encounter</button>
    `;
}

/**
 * Render a boss fight phase (minions)
 */
function renderBossPhaseFight(boss, phase) {
    if (G.combat.active) {
        // Show normal combat UI
        renderFightEncounter();
        return;
    }
    
    // Check if we're in middle of sequential fights
    const currentEnemy = G.boss.enemyIndex || 0;
    const totalEnemies = phase.enemies ? phase.enemies.length : 0;
    const isSequential = totalEnemies > 1;
    
    if (isSequential && currentEnemy > 0 && currentEnemy < totalEnemies) {
        // Middle of sequential fight
        DOM.encounterArea.innerHTML = `
            <div class="encounter-boss-phase">
                <h3>💀 ${boss.name}</h3>
                <h4>⚔️ Phase: ${phase.name}</h4>
                <p class="phase-description">Sequential battle in progress...</p>
                <div class="phase-progress">
                    <p><strong>Progress:</strong> ${currentEnemy} of ${totalEnemies} enemies defeated</p>
                    <p><strong>Next Enemy:</strong> ${phase.enemies[currentEnemy]}</p>
                    <p><strong>Remaining:</strong> ${totalEnemies - currentEnemy} enemies</p>
                </div>
            </div>
        `;
        
        DOM.encounterActions.innerHTML = `
            <button class="btn-primary" data-action="start-boss-phase">Continue Fighting!</button>
        `;
    } else if (currentEnemy >= totalEnemies) {
        // Phase should be complete - this shouldn't happen
        DOM.encounterArea.innerHTML = `
            <div class="encounter-boss-phase">
                <h3>💀 ${boss.name}</h3>
                <h4>✅ Phase Complete: ${phase.name}</h4>
                <p>All enemies in this phase have been defeated!</p>
            </div>
        `;
        DOM.encounterActions.innerHTML = ``;
    } else {
        // Beginning of fight phase
        DOM.encounterArea.innerHTML = `
            <div class="encounter-boss-phase">
                <h3>💀 ${boss.name}</h3>
                <h4>⚔️ Phase: ${phase.name}</h4>
                <p class="phase-description">${phase.description}</p>
                <div class="phase-enemies">
                    <p><strong>Enemies:</strong> ${phase.enemies.join(', ')}</p>
                    ${isSequential ? `<p><em>You must defeat all ${totalEnemies} enemies in sequence!</em></p>` : ''}
                </div>
            </div>
        `;
        
        DOM.encounterActions.innerHTML = `
            <button class="btn-primary" data-action="start-boss-phase">Start Combat</button>
        `;
    }
}

/**
 * Render a boss hazard phase
 */
function renderBossPhaseHazard(boss, phase) {
    DOM.encounterArea.innerHTML = `
        <div class="encounter-boss-phase">
            <h3>💀 ${boss.name}</h3>
            <h4>⚡ Phase: ${phase.name}</h4>
            <p class="phase-description">${phase.description}</p>
            <div class="phase-difficulty">
                <p><strong>Challenge:</strong> Difficulty ${phase.difficulty} (${phase.preferredStat.toUpperCase()} check)</p>
                <p><strong>Risk:</strong> ${phase.damage} damage on failure</p>
            </div>
        </div>
    `;
    
    DOM.encounterActions.innerHTML = `
        <button class="btn-primary" data-action="start-boss-phase">Face the Challenge</button>
    `;
}

/**
 * Render final boss fight phase
 */
function renderBossPhaseFinal(boss, phase) {
    if (G.combat.active) {
        // Show enhanced boss combat UI
        renderBossFinalCombat(boss, phase);
        return;
    }
    
    DOM.encounterArea.innerHTML = `
        <div class="encounter-boss-final">
            <h3>💀 ${boss.name}</h3>
            <h4>⚡ FINAL PHASE: ${phase.name}</h4>
            <p class="phase-description">${phase.description}</p>
            <div class="final-boss-warning">
                <p><strong>🔥 FINAL BATTLE</strong></p>
                <p>This is your last chance. Use all your party members strategically!</p>
            </div>
        </div>
    `;
    
    DOM.encounterActions.innerHTML = `
        <button class="btn-primary" data-action="start-boss-phase">Face ${boss.name}!</button>
    `;
}

/**
 * Render boss choice phase (placeholder)
 */
function renderBossPhaseChoice(boss, phase) {
    DOM.encounterArea.innerHTML = `
        <div class="encounter-boss-choice">
            <h3>💀 ${boss.name}</h3>
            <h4>🤔 Phase: ${phase.name}</h4>
            <p class="phase-description">${phase.description}</p>
            <p class="choice-text">${phase.mechanicText}</p>
        </div>
    `;
    
    DOM.encounterActions.innerHTML = `
        <button class="btn-primary" data-action="complete-boss-phase">Continue</button>
    `;
}

/**
 * Render enhanced final boss combat UI
 */
function renderBossFinalCombat(boss, phase) {
    DOM.encounterArea.innerHTML = `
        <div class="encounter-boss-final-combat">
            <h3>💀 FINAL BATTLE: ${G.combat.enemy.name}</h3>
            <div class="boss-combat-status">
                <div class="combatant player">
                    <strong>${G.party[0].name} (Leader)</strong><br>
                    ❤️ ${G.combat.playerHp} HP
                </div>
                <div class="vs">VS</div>
                <div class="combatant boss-enemy">
                    <strong>${G.combat.enemy.name}</strong><br>
                    ❤️ ${G.combat.enemyHp}/${G.combat.enemy.hp} HP
                </div>
            </div>
            ${G.combat.lastRoll ? `<p>🎲 Last roll: ${G.combat.lastRoll}</p>` : ''}
            <div class="boss-combat-tip">
                <p><strong>💡 Tip:</strong> Switch party leaders to manage HP strategically!</p>
            </div>
            <p class="turn-indicator">${G.combat.turn === 'player' ? '⚔️ Your turn!' : '💀 Boss turn...'}</p>
        </div>
    `;
    
    DOM.encounterActions.innerHTML = `
        ${G.combat.turn === 'player' ? 
            '<button class="btn-primary" data-action="player-attack">Attack!</button>' :
            '<button class="btn-secondary" data-action="enemy-turn">Continue...</button>'
        }
    `;
}

// ================================================================
// ENCOUNTER CARD GENERATION FUNCTIONS
// ================================================================

/**
 * Create HTML for a player encounter card
 */
function createPlayerEncounterCard(player, hp, isActiveTurn = false) {
    const healthPercent = hp / player.maxHp;
    const healthClass = healthPercent > 0.6 ? 'high-health' : 
                       healthPercent > 0.3 ? 'medium-health' : 'low-health';
    
    return `
        <div class="encounter-card player-card ${isActiveTurn ? 'active-turn' : ''}">
            <div class="encounter-card-portrait">
                <img src="./images/portraits/${player.id}.png" alt="${player.name}"
                     onerror="this.onerror=null; this.src='./images/icons/${getIconFileName(player)}'; this.onload=function(){this.style.display='inline'}; this.onerror=function(){this.style.display='none'; this.nextElementSibling.style.display='inline'}">
                <span class="portrait-fallback" style="font-size: 1.5rem;">${getCharacterIcon(player)}</span>
            </div>
            <div class="encounter-card-name">${getShortName(player.name)}</div>
            <div class="encounter-card-hp ${healthClass}">❤️ ${hp}/${player.maxHp}</div>
            <div class="encounter-card-stats">
                <span>⚔️ ${player.atk}</span>
                <span>✨ ${player.mag}</span>
            </div>
            ${isActiveTurn ? '<div style="font-size: 0.8rem; color: var(--accent); font-weight: 600;">YOUR TURN</div>' : ''}
        </div>
    `;
}

/**
 * Create HTML for an enemy encounter card
 */
function createEnemyEncounterCard(enemy, hp, isActiveTurn = false) {
    const healthPercent = hp / enemy.hp;
    const healthClass = healthPercent > 0.6 ? 'high-health' : 
                       healthPercent > 0.3 ? 'medium-health' : 'low-health';
    
    // Get enemy icon based on type
    const enemyIcon = getEnemyIcon(enemy.type);
    
    return `
        <div class="encounter-card enemy-card ${isActiveTurn ? 'active-turn' : ''}">
            <div class="encounter-card-portrait">
                <img src="${getEnemyPortraitPath(enemy)}" alt="${enemy.name}"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='inline'">
                <span class="portrait-fallback" style="font-size: 1.5rem;">${enemyIcon}</span>
            </div>
            <div class="encounter-card-name">${enemy.name}</div>
            <div class="encounter-card-hp ${healthClass}">❤️ ${hp}/${enemy.hp}</div>
            <div class="encounter-card-stats">
                <span>⚔️ ${enemy.atk}</span>
                ${enemy.mag ? `<span>✨ ${enemy.mag}</span>` : ''}
            </div>
            ${isActiveTurn ? '<div style="font-size: 0.8rem; color: var(--bad); font-weight: 600;">ENEMY TURN</div>' : ''}
        </div>
    `;
}

/**
 * Get appropriate icon for enemy type
 */
function getEnemyIcon(enemyType) {
    const enemyIcons = {
        'goblin': '👺',
        'orc': '🧌', 
        'orc-champion': '⚔️',
        'shadow-wisp': '👻',
        'cur': '🐺',
        'hob-goblin': '👹',
        'skrunt': '🦔',
        'small-wyvern': '🐉',
        'crystal-wisp': '💎',
        'crystal-guardian': '🗿',
        'crystal-golem': '🗿',
        'void-spawn': '🌑',
        'void-wraith': '💀',
        'void-ancient': '☠️'
    };
    
    return enemyIcons[enemyType] || '👹'; // Default monster icon
}

/**
 * Get the correct portrait path for enemy type (boss, general, or regular)
 */
function getEnemyPortraitPath(enemy) {
    const enemyType = enemy.type || 'unknown';
    
    // Check if we're in a boss encounter
    if (G.boss && G.boss.active) {
        // Boss final enemies (like "shadow-lord-final", "crystal-tyrant-final")
        if (enemyType.includes('-final')) {
            return `./images/bosses/${enemyType}.png`;
        }
        // Boss generals/lieutenants (like "shadow-general", "crystal-warden")
        else if (enemyType.includes('-general') || enemyType.includes('-warden') || 
                 enemyType.includes('-lieutenant') || enemyType.includes('-champion')) {
            return `./images/generals/${enemyType}.png`;
        }
    }
    
    // Default to regular enemies folder
    return `./images/enemies/${enemyType}.png`;
}

// ================================================================
// ENCOUNTER RENDERING FUNCTIONS (existing)
// ================================================================

/**
 * Render a fight encounter
 */
function renderFightEncounter() {
    // Check if this fight was already won
    if (isCurrentTileConsumed()) {
        DOM.encounterArea.innerHTML = `
            <div class="encounter-fight">
                <h3>⚔️ Defeated Enemy</h3>
                <p>The remains of your defeated foe lie here. Nothing left to fight.</p>
            </div>
        `;
        DOM.encounterActions.innerHTML = ``; // No buttons
        return;
    }
    
    if (G.combat.active) {
        // DURING COMBAT - Show encounter cards
        const currentLeader = G.party[0];
        const leaderName = currentLeader ? currentLeader.name : 'You';
        
        const playerCard = createPlayerEncounterCard(
            currentLeader, 
            G.combat.playerHp, 
            G.combat.turn === 'player'
        );
        
        const enemyCard = createEnemyEncounterCard(
            G.combat.enemy, 
            G.combat.enemyHp, 
            G.combat.turn === 'enemy'
        );
        
      DOM.encounterArea.innerHTML = `
            <div class="encounter-fight">
                <h3>⚔️ Combat: ${G.combat.enemy.name}</h3>
                <div class="encounter-cards">
                    ${playerCard}
                    <div class="encounter-vs">VS</div>
                    ${enemyCard}
                </div>
                <div class="encounter-inline-actions">
                    ${G.combat.turn === 'player' ? 
                        '<button class="btn-primary" data-action="player-attack">Attack!</button>' +
                        '<button class="btn-secondary" data-action="flee-encounter">Flee</button>' :
                        '<button class="btn-secondary" data-action="enemy-turn">Continue...</button>'
                    }
                </div>
                ${G.combat.lastRoll ? `<p>🎲 Last roll: ${G.combat.lastRoll}</p>` : ''}
            </div>
        `;
        
        // Clear the regular actions area since we're using inline actions
        DOM.encounterActions.innerHTML = ``;
    } else {
        // BEFORE COMBAT - Only show fight button (no flee option)
        const enemyType = getRandomEnemyType();
        
        DOM.encounterArea.innerHTML = `
            <div class="encounter-fight">
                <h3>⚔️ Enemy Encounter</h3>
                <p>A hostile creature blocks your path!</p>
                <div class="enemy-preview">
                    <strong>Grid ${G.gridLevel} Enemy</strong><br>
                    Prepare for battle...
                </div>
                <div class="encounter-inline-actions">
                    <button class="btn-primary" data-action="start-combat">Fight!</button>
                </div>
            </div>
        `;
        
        // Clear the regular actions area since we're using inline actions
        DOM.encounterActions.innerHTML = ``;
    }
}

/**
 * Render a hazard encounter
 */
function renderHazardEncounter() {
    if (isCurrentTileConsumed()) {
        // Show consumed state
        DOM.encounterArea.innerHTML = `
            <div class="encounter-hazard">
                <h3>⚡ Cleared Path</h3>
                <p>The hazard has been dealt with. The path is now safe.</p>
            </div>
        `;
        DOM.encounterActions.innerHTML = ``; // No buttons
    } else {
        // Show normal hazard encounter
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
}

/**
 * Render an item encounter
 */
function renderItemEncounter() {
    if (isCurrentTileConsumed()) {
        // Show consumed state
        DOM.encounterArea.innerHTML = `
            <div class="encounter-item">
                <h3>📦 Searched Area</h3>
                <p>This area has been thoroughly searched. Nothing remains.</p>
            </div>
        `;
        DOM.encounterActions.innerHTML = ``; // No buttons
    } else {
        // Show normal item encounter
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
}

/**
 * Render an ally encounter - WITH DIRECT EVENT LISTENERS FOR DEBUG
 */
function renderAllyEncounter() {
    // CHECK FOR PENDING TECHNIQUES FIRST (before checking if consumed)
    if (G._pendingTechniques && G._pendingTechniques.length > 0) {
        // Show technique selection for abandoned camp
        const currentRegion = getRegionForGrid(G.gridLevel);
        const regionName = currentRegion.replace('-region', '');
        
        DOM.encounterArea.innerHTML = `
            <div class="encounter-ally">
                <h3>🏕️ Abandoned ${regionName.charAt(0).toUpperCase() + regionName.slice(1)} Camp</h3>
                <p>You discover an empty camp with useful techniques left behind...</p>
                <div class="technique-preview">
                    <h4>📜 Click a technique to learn it:</h4>
                    ${G._pendingTechniques.map((tech, index) => `
                        <div class="technique-option clickable-technique" 
                             data-technique-index="${index}"
                             data-action="learn-technique"
                             id="technique-${index}">
                            <strong>${tech.name}</strong> <span class="technique-type-label">(${tech.type})</span>
                            <p class="technique-description">${tech.description}</p>
                        </div>
                    `).join('')}
                </div>
                <p class="technique-instruction">💡 Click any technique above to learn it!</p>
            </div>
        `;
        
        // ADD DIRECT EVENT LISTENERS FOR DEBUG
        setTimeout(() => {
            G._pendingTechniques.forEach((tech, index) => {
                const element = document.getElementById(`technique-${index}`);
                if (element) {
                    element.addEventListener('click', (e) => {
                        
                        // Try the original logic here
                        import('./state.js').then(({ learnTechnique }) => {
                            const result = learnTechnique(tech);
                            _updateGameCallback();
                        }).catch(error => {
                            console.error('❌ DEBUG: Import/execution failed:', error);
                        });
                    });
                } else {
                    console.error(`❌ DEBUG: Could not find element technique-${index}`);
                }
            });
        }, 100); // Small delay to ensure DOM is ready
        
        // Clear the regular actions area since we're using direct clicking
        DOM.encounterActions.innerHTML = ``;
        return; // Exit early - don't check other conditions
    }
    
    // THEN check if consumed (after technique check)
    if (isCurrentTileConsumed()) {
        // Show consumed state
        DOM.encounterArea.innerHTML = `
            <div class="encounter-ally">
                <h3>🤝 Empty Camp</h3>
                <p>The ally has moved on. Only traces of their camp remain.</p>
            </div>
        `;
        DOM.encounterActions.innerHTML = ``; // No buttons
    } else {
        // Show normal ally encounter
        DOM.encounterArea.innerHTML = `
            <div class="encounter-ally">
                <h3>🤝 Potential Ally</h3>
                <p>A warrior offers to join your party...</p>
                <div class="encounter-inline-actions">
                    <button class="btn-primary" data-action="recruit-ally">Recruit</button>
                </div>
            </div>
        `;
        
        // Clear the regular actions area since we're using inline actions
        DOM.encounterActions.innerHTML = ``;
    }
}
/**
 * Render a key encounter
 */
function renderKeyEncounter() {
    if (isCurrentTileConsumed()) {
        // Show consumed state
        DOM.encounterArea.innerHTML = `
            <div class="encounter-key">
                <h3>🗝️ Empty Pedestal</h3>
                <p>The key has been taken. Only an empty pedestal remains.</p>
            </div>
        `;
        DOM.encounterActions.innerHTML = ``; // No buttons
    } else {
        // Show normal key encounter
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
// NEW: VICTORY SCREEN
// ================================================================

/**
 * Show victory screen overlay
 */
function showVictoryScreen() {
    const boss = getCurrentBoss();
    
    // Create victory overlay if it doesn't exist
    let victoryOverlay = document.getElementById('victory-overlay');
    if (!victoryOverlay) {
        victoryOverlay = document.createElement('div');
        victoryOverlay.id = 'victory-overlay';
        victoryOverlay.className = 'overlay victory-overlay';
        DOM.overlaySystem.appendChild(victoryOverlay);
    }
    
    // Get victory stats
    const partySize = G.party.length;
    const survivingMembers = G.party.filter(member => member.hp > 0).length;
    const bossName = boss ? boss.name : 'Unknown Boss';
    const gridLevel = G.gridLevel;
    const seed = G.seed;
    
    victoryOverlay.innerHTML = `
        <div class="overlay-content victory-content">
            <h2>🏆 VICTORY!</h2>
            <div class="victory-boss">
                <h3>You have defeated ${bossName}!</h3>
                ${boss && boss.victoryRewards ? `
                    <p class="victory-message">${boss.victoryRewards.completionMessage}</p>
                ` : ''}
            </div>
            
            <div class="victory-stats">
                <h4>📊 Run Statistics</h4>
                <div class="stat-grid">
                    <div class="stat-item">
                        <strong>Grid Level:</strong> ${gridLevel}
                    </div>
                    <div class="stat-item">
                        <strong>Party Size:</strong> ${partySize}
                    </div>
                    <div class="stat-item">
                        <strong>Survivors:</strong> ${survivingMembers}/${partySize}
                    </div>
                    <div class="stat-item">
                        <strong>Seed:</strong> ${seed}
                    </div>
                </div>
            </div>
            
            ${boss && boss.victoryRewards ? `
                <div class="victory-rewards">
                    <h4>🎁 Rewards</h4>
                    ${boss.victoryRewards.gold ? `<p>💰 Gold: ${boss.victoryRewards.gold}</p>` : ''}
                    ${boss.victoryRewards.experience ? `<p>⭐ Experience: ${boss.victoryRewards.experience}</p>` : ''}
                    ${boss.victoryRewards.unlocks ? `
                        <p>🔓 Unlocked: ${boss.victoryRewards.unlocks.join(', ')}</p>
                    ` : ''}
                </div>
            ` : ''}
            
            <div class="victory-actions">
                <button class="btn-primary" data-action="new-game">New Game</button>
                <button class="btn-secondary" data-action="same-seed">Play Same Seed</button>
                <button class="btn-secondary" data-action="share-seed">Share Seed</button>
            </div>
            
            ${boss && boss.victoryRewards && boss.victoryRewards.gameComplete ? `
                <div class="game-complete">
                    <h3>🎉 GAME COMPLETE!</h3>
                    <p>You have saved all of existence! Thank you for playing!</p>
                </div>
            ` : ''}
        </div>
    `;
    
    // Add event handlers for victory actions
    victoryOverlay.querySelectorAll('button[data-action]').forEach(button => {
        button.addEventListener('click', (e) => {
            const action = button.dataset.action;
            handleVictoryAction(action);
        });
    });
    
    // Show the victory overlay
    victoryOverlay.classList.add('active');
}

/**
 * Handle victory screen actions
 */
function handleVictoryAction(action) {
    switch (action) {
        case 'new-game':
            closeAllOverlays();
            // Start a new game with random seed
            if (window.CruxfadeMicro && window.CruxfadeMicro.newGame) {
                window.CruxfadeMicro.newGame();
            }
            
            break;
            
        case 'same-seed':
            // Restart with the same seed
            if (window.CruxfadeMicro && window.CruxfadeMicro.restartWithSeed) {
                window.CruxfadeMicro.restartWithSeed();
            }
            closeAllOverlays();
            break;
            
        case 'share-seed':
            // Copy seed to clipboard and show URL
            const seed = G.seed;
            const url = `${window.location.origin}${window.location.pathname}?seed=${seed}`;
            
            navigator.clipboard.writeText(url).then(() => {
                alert(`Victory seed copied to clipboard!\n\nSeed: ${seed}\nURL: ${url}`);
            }).catch(() => {
                // Fallback if clipboard fails
                prompt('Copy this URL to share your victorious run:', url);
            });
            break;
    }
}

// ================================================================
// HEADER INFO RENDERING
// ================================================================

/**
 * Render header information (grid level, keys, seed, etc.)
 */
function renderHeaderInfo() {
    // Show boss level indicator if in boss encounter
    if (DOM.gridLevel) {
        if (isInBossEncounter()) {
            DOM.gridLevel.textContent = `${G.gridLevel} (BOSS)`;
            DOM.gridLevel.style.color = '#ef6b73'; // Red color for boss
        } else {
            DOM.gridLevel.textContent = G.gridLevel;
            DOM.gridLevel.style.color = ''; // Reset color
        }
    }
    
    if (DOM.keysFound) DOM.keysFound.textContent = G.keyFound ? '1' : '0';
    
    // Make seed clickable for editing
    if (DOM.runSeed) {
        DOM.runSeed.textContent = G.seed;
        DOM.runSeed.style.cursor = 'pointer';
        DOM.runSeed.title = 'Click to enter a custom seed';
        
       // SAFE DOM.runSeed HANDLING - REPLACE the existing runSeed block
// Safely handle runSeed element
const runSeedElement = document.getElementById('run-seed');
if (runSeedElement) {
    // Remove any existing click handlers to prevent duplicates
    runSeedElement.replaceWith(runSeedElement.cloneNode(true));
    DOM.runSeed = document.getElementById('run-seed'); // Re-cache after replace
    
    DOM.runSeed.addEventListener('click', () => {
        const newSeed = prompt('Enter seed (number):', G.seed);
        if (newSeed !== null && !isNaN(newSeed) && newSeed.trim() !== '') {
            const seedNum = parseInt(newSeed);
            window.CruxfadeMicro.newGame(seedNum);
        }
    });
} else {
    console.warn('⚠️ run-seed element not found, skipping seed click handler');
}

    }
    
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
    
    // Show last 15 log entries
    const recentLogs = G.log.slice(-15);
    
    // Create HTML with special styling for the latest entry
    const logHtml = recentLogs.map((entry, index) => {
        const isLatest = index === recentLogs.length - 1;
        const cssClass = isLatest ? 'log-entry current-entry' : 'log-entry';
        return `<p class="${cssClass}">${entry}</p>`;
    }).join('');
    
    DOM.gameLog.innerHTML = logHtml;
    
    // Auto-scroll to bottom to show latest messages
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
            const row = Math.floor(index / 4); // 4x4 math
            const col = index % 4;
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
 * @param {Function} updateGameCallback - Function to call when game state changes
 */
export function bindEventHandlers(updateGameCallback) {
    // Store the callback for use in event handlers
    _updateGameCallback = updateGameCallback;
    
    // Cache DOM elements first
    cacheDOMElements();
    
    // Tile click handlers
    bindTileClickHandlers();
    
    // Overlay handlers
    bindOverlayHandlers();
    
    // Event delegation for encounter actions (both old and new inline actions)
            const encountersSection = document.querySelector('.encounters');
            if (encountersSection) {
            encountersSection.addEventListener('click', (e) => {
            // Find the button that was clicked
            const button = e.target.closest('button[data-action]');
            if (!button || button.disabled) return;
            
            // Get the action from the data-action attribute
            const action = button.dataset.action;
            
            // Handle the action
            switch(action) {
                // NEW: Boss system actions
                case 'start-boss-sequence':
                    startBossPhase();
                    _updateGameCallback();
                    break;
                    
                case 'start-boss-phase':
                    startBossPhase();
                    _updateGameCallback();
                    break;
                    
                case 'complete-boss-phase':
                    completeBossPhase();
                    _updateGameCallback();
                    break;
                
                // Existing actions

                case 'flee-encounter':
    
    if (typeof attemptFlee !== 'function') {
        console.error('❌ attemptFlee is not imported properly:', typeof attemptFlee);
        addLogEntry('❌ Flee system error - check console');
    } else {
        const fleeResult = attemptFlee();
    }
    
    _updateGameCallback();
    break;
                    
                case 'start-combat':
                    const enemyType = getRandomEnemyType(); // Use random enemy type
                    startCombat(enemyType);
                    _updateGameCallback();
                    break;
                    
                case 'player-attack':
                    playerAttack();
                    _updateGameCallback();
                    break;
                    
                case 'enemy-turn':
                    setTimeout(() => {
                        enemyAttack();
                        _updateGameCallback();
                    }, 1000); // Brief delay for enemy action
                    break;
                    
                case 'flee-encounter':
                    addLogEntry('🏃 You fled from the encounter!');
                    _updateGameCallback();
                    break;
                    
                case 'flee':
                    addLogEntry('🏃 You fled from combat!');
                    _updateGameCallback();
                    break;
                    
                case 'resolve-hazard':
                   resolveHazard();  // Call our new function!
                   _updateGameCallback();
                    break;
                    
                case 'take-item':
                    giveRandomItem();  // Call our new function!
                    _updateGameCallback();
                     break;
                    
                case 'recruit-ally':
    const result = recruitRandomAlly();
    
    // Check if recruitment caused card overflow
    if (result && result.overflow) {
        
        // For now, show overflow with the first ally card as a test
        // We'll improve this to show all cards properly
        const firstAllyCard = result.cards[0];
        showCardOverflowSelection(firstAllyCard, (resolved) => {
            if (resolved) {
                import('./state.js').then(({ resolvePendingAlly }) => {
                    resolvePendingAlly();
                    _updateGameCallback();
                }).catch(console.error);
            }
        });
    } else {
        // Normal recruitment (no overflow)
        _updateGameCallback();
    }
    break;
                case 'select-technique':
    
    // Check if we have pending techniques
    if (G._pendingTechniques && G._pendingTechniques.length > 0) {
        // Show technique selection overlay using existing card overflow system
        showTechniqueSelection(G._pendingTechniques, (selectedTechnique) => {
            if (selectedTechnique) {
                // Import the learnTechnique function
                import('./state.js').then(({ learnTechnique }) => {
                    const result = learnTechnique(selectedTechnique);
                    
                    if (result && result.overflow) {
                        // Handle overflow with existing system
                        showCardOverflowSelection(result.card, (resolved) => {
                            if (resolved) {
                                import('./state.js').then(({ resolvePendingTechnique }) => {
                                    resolvePendingTechnique();
                                    _updateGameCallback();
                                }).catch(console.error);
                            }
                        });
                    } else {
                        // Normal technique learning completed
                        _updateGameCallback();
                    }
                }).catch(console.error);
            }
        });
    } else {
        console.error('No pending techniques available');
    }
    break;  
               case 'learn-technique':
    
    // Get the technique index from the clicked element
    const techniqueIndex = parseInt(e.target.closest('[data-technique-index]').dataset.techniqueIndex);
    
    if (G._pendingTechniques && G._pendingTechniques[techniqueIndex]) {
        const selectedTechnique = G._pendingTechniques[techniqueIndex];
        
        // DEBUG: Test if import works
        import('./state.js').then(({ learnTechnique }) => {
            
            if (typeof learnTechnique === 'function') {
                const result = learnTechnique(selectedTechnique);
                
                if (result && result.overflow) {
                    // Handle overflow later
                } else {
                    _updateGameCallback();
                }
            } else {
                console.error('❌ DEBUG: learnTechnique is not a function!');
            }
        }).catch(error => {
            console.error('❌ DEBUG: Import failed:', error);
        });
    } else {
        console.error('❌ DEBUG: Invalid technique index or no pending techniques');
    }
    break;
                case 'take-key':
                    foundKey();
                    _updateGameCallback();
                    break;
                    
                case 'proceed-next-grid':
                    nextGrid();
                    _updateGameCallback();
                    break;
                    
                default:
                    console.warn('Unknown action:', action);
            }
        });
    }
}

/**
 * Handle tile click events
 */
function handleTileClick(row, col) {
    if (G.over) return;
    
    // Check if it's an adjacent tile
    if (isAdjacentToPlayer(row, col)) {
        const success = movePlayer(row, col);
        if (success) {
            _updateGameCallback(); // Use callback instead of direct import
        } else {
        }
    } else if (!isPlayerCurrentTile(row, col)) {
        addLogEntry('❌ Can only move to adjacent tiles');
        _updateGameCallback(); // Use callback instead of direct import
    } else {
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

// ================================================================
// CARD OVERFLOW MANAGEMENT
// ================================================================

// Store overflow state
let OVERFLOW_STATE = {
    active: false,
    newCard: null,
    callback: null
};

/**
 * Show card overflow selection overlay
 * @param {Object} newCard - The card that couldn't be added
 * @param {Function} callback - Called when overflow is resolved
 */
export function showCardOverflowSelection(newCard, callback) {
    OVERFLOW_STATE.active = true;
    OVERFLOW_STATE.newCard = newCard;
    OVERFLOW_STATE.callback = callback;
    
    renderCardOverflowOverlay();
    showOverlay('card-overflow-overlay');
}

/**
 * Hide card overflow selection overlay
 */
export function hideCardOverflowSelection() {
    OVERFLOW_STATE.active = false;
    OVERFLOW_STATE.newCard = null;
    OVERFLOW_STATE.callback = null;
    
    hideOverlay('card-overflow-overlay');
}

/**
 * Render the card overflow selection overlay
 */
function renderCardOverflowOverlay() {
    if (!OVERFLOW_STATE.active || !OVERFLOW_STATE.newCard) return;
    
    const overlay = document.getElementById('card-overflow-overlay');
    if (!overlay) {
        console.error('Card overflow overlay not found in DOM');
        return;
    }
    
    const newCard = OVERFLOW_STATE.newCard;
    
    // Create the overlay content
    overlay.innerHTML = `
        <div class="overlay-content card-overflow-content">
            <h3>🃏 Hand Full!</h3>
            <p>You have 5 cards. Choose a card to discard to make room for:</p>
            
            <div class="new-card-preview">
                <div class="card overflow-new-card">
                    <div class="card-header">
                        <strong>${newCard.name}</strong>
                        <span class="card-type">${newCard.type}</span>
                    </div>
                    <div class="card-description">
                        ${newCard.description || 'A new card to add to your hand.'}
                    </div>
                </div>
            </div>
            
            <p class="overflow-instruction">Click a card below to discard it:</p>
            
            <div class="overflow-hand">
                ${G.hand.map((card, index) => `
                    <div class="card overflow-discard-option" data-card-id="${card.id}" data-card-index="${index}">
                        <div class="card-header">
                            <strong>${card.name}</strong>
                            <span class="card-type">${card.type}</span>
                        </div>
                        <div class="card-description">
                            ${card.description || 'Click to discard this card.'}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    // Add click handlers to discard options
    overlay.querySelectorAll('.overflow-discard-option').forEach(cardElement => {
        cardElement.addEventListener('click', (e) => {
            const cardId = cardElement.dataset.cardId;
            handleOverflowCardSelection(cardId);
        });
    });
}

/**
 * Handle selection of card to discard during overflow
 */
function handleOverflowCardSelection(cardId) {
    if (!OVERFLOW_STATE.active || !OVERFLOW_STATE.newCard || !OVERFLOW_STATE.callback) {
        console.error('Invalid overflow state during card selection');
        return;
    }
    
    // Import the discard function from state
    import('./state.js').then(({ discardCardById, addCardToHand, addLogEntry }) => {
        // Discard the selected card
        const discardSuccess = discardCardById(cardId);
        
        if (discardSuccess) {
            // Add the new card to the now-available slot
            const result = addCardToHand(OVERFLOW_STATE.newCard);
            
            if (result.success) {
                addLogEntry(`✅ Card overflow resolved!`);
                
                // Call the callback to notify completion
                if (OVERFLOW_STATE.callback) {
                    OVERFLOW_STATE.callback(true);
                }
                
                // Hide the overlay
                hideCardOverflowSelection();
                
                // Trigger game update
                _updateGameCallback();
            } else {
                console.error('Failed to add card after discard - this should not happen');
            }
        } else {
            console.error('Failed to discard selected card');
        }
    }).catch(error => {
        console.error('Error importing state functions:', error);
    });
}

// ================================================================
// EQUIPMENT MANAGEMENT
// ================================================================

// Store equipment management state
let EQUIPMENT_STATE = {
    active: false,
    memberId: null,
    slot: null,
    callback: null
};

/**
 * Show equipment management overlay
 * @param {String} memberId - ID of party member
 * @param {String} slot - Equipment slot (weapon/armor/accessory)
 * @param {Function} callback - Called when management is complete
 */
export function showEquipmentManagement(memberId, slot, callback) {
    EQUIPMENT_STATE.active = true;
    EQUIPMENT_STATE.memberId = memberId;
    EQUIPMENT_STATE.slot = slot;
    EQUIPMENT_STATE.callback = callback;
    
    renderEquipmentManagementOverlay();
    showOverlay('equipment-management-overlay');
}

/**
 * Hide equipment management overlay
 */
export function hideEquipmentManagement() {
    EQUIPMENT_STATE.active = false;
    EQUIPMENT_STATE.memberId = null;
    EQUIPMENT_STATE.slot = null;
    EQUIPMENT_STATE.callback = null;
    
    hideOverlay('equipment-management-overlay');
}

/**
 * Render the equipment management overlay
 */
function renderEquipmentManagementOverlay() {
    if (!EQUIPMENT_STATE.active || !EQUIPMENT_STATE.memberId || !EQUIPMENT_STATE.slot) return;
    
    const overlay = document.getElementById('equipment-management-overlay');
    if (!overlay) {
        console.error('Equipment management overlay not found in DOM');
        return;
    }
    
    const member = G.party.find(m => m.id === EQUIPMENT_STATE.memberId);
    if (!member) return;
    
    const slotName = EQUIPMENT_STATE.slot.charAt(0).toUpperCase() + EQUIPMENT_STATE.slot.slice(1);
    const slotIcon = EQUIPMENT_STATE.slot === 'weapon' ? '⚔️' : 
                    EQUIPMENT_STATE.slot === 'armor' ? '🛡️' : '💎';
    
    // Get currently equipped item
    const currentItem = getEquippedItem(EQUIPMENT_STATE.memberId, EQUIPMENT_STATE.slot);
    
    // Get available items of this type from inventory
    const availableItems = getAvailableItemsForSlot(EQUIPMENT_STATE.slot);
    
    // Create the overlay content
    overlay.innerHTML = `
        <div class="overlay-content equipment-management-content">
            <h3>${slotIcon} ${member.name}'s ${slotName}</h3>
            
            <div class="current-equipment">
                <h4>Currently Equipped:</h4>
                ${currentItem ? `
                    <div class="equipment-item current-item">
                        <div class="item-header">
                            <strong>${currentItem.name}</strong>
                            <span class="item-rarity ${currentItem.rarity}">${currentItem.rarity}</span>
                        </div>
                        <div class="item-description">${currentItem.description || 'No description available.'}</div>
                        <div class="item-stats">
                            ${Object.entries(currentItem.statBonus || {}).map(([stat, bonus]) => 
                                `<span class="stat-bonus ${bonus > 0 ? 'positive' : 'negative'}">
                                    ${bonus > 0 ? '+' : ''}${bonus} ${stat.toUpperCase()}
                                </span>`
                            ).join('')}
                        </div>
                        <button class="btn-secondary unequip-btn" data-action="unequip">
                            Unequip ${currentItem.name}
                        </button>
                    </div>
                ` : `
                    <div class="equipment-item empty-slot">
                        <p>No ${EQUIPMENT_STATE.slot} equipped</p>
                    </div>
                `}
            </div>
            
            ${availableItems.length > 0 ? `
                <div class="available-equipment">
                    <h4>Available ${slotName}s:</h4>
                    <div class="equipment-options">
                        ${availableItems.map(item => `
                            <div class="equipment-item available-item" data-item-id="${item.id}">
                                <div class="item-header">
                                    <strong>${item.name}</strong>
                                    <span class="item-rarity ${item.rarity}">${item.rarity}</span>
                                </div>
                                <div class="item-description">${item.description || 'No description available.'}</div>
                                <div class="item-stats">
                                    ${Object.entries(item.statBonus || {}).map(([stat, bonus]) => 
                                        `<span class="stat-bonus ${bonus > 0 ? 'positive' : 'negative'}">
                                            ${bonus > 0 ? '+' : ''}${bonus} ${stat.toUpperCase()}
                                        </span>`
                                    ).join('')}
                                </div>
                                <button class="btn-primary equip-btn" data-action="equip" data-item-id="${item.id}">
                                    Equip ${item.name}
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div class="dismiss-member-section">
                <h4 style="color: var(--bad); margin-top: 16px;">Dismiss Party Member</h4>
                <p style="font-size: 0.8rem; color: var(--muted); margin-bottom: 8px;">
                    Remove ${member.name} from your party permanently. This cannot be undone.
                </p>
                <button class="btn-danger dismiss-btn" data-action="dismiss-member" data-member-id="${member.id}">
                    Dismiss ${member.name}
                </button>
            </div>
            
            <div class="equipment-actions">
                <button class="btn-secondary close-btn" data-action="close">Close</button>
            </div>
        </div>
    `;
    
    // Add click handlers
    overlay.querySelectorAll('button[data-action]').forEach(button => {
        button.addEventListener('click', (e) => {
            const action = button.dataset.action;
            const itemId = button.dataset.itemId;
            const memberId = button.dataset.memberId;
            handleEquipmentAction(action, itemId, memberId);
        });
    });
}

/**
 * Handle equipment management actions
 */
function handleEquipmentAction(action, itemId, memberId) {
    const currentMemberId = EQUIPMENT_STATE.memberId;
    const slot = EQUIPMENT_STATE.slot;
    const member = G.party.find(m => m.id === currentMemberId);
    
    switch(action) {
        case 'dismiss-member':
            if (confirm(`Are you sure you want to dismiss ${member.name} from your party? This cannot be undone.`)) {
                removeAlly(memberId);
                addLogEntry(`👋 ${member.name} has been dismissed from the party`);
                hideEquipmentManagement();
                if (EQUIPMENT_STATE.callback) EQUIPMENT_STATE.callback();
            }
            break;
            
        case 'unequip':
            const unequipped = unequipItem(currentMemberId, slot);
            if (unequipped) {
                addLogEntry(`📦 ${unequipped.name} was unequipped`);
            }
            hideEquipmentManagement();
            if (EQUIPMENT_STATE.callback) EQUIPMENT_STATE.callback();
            break;
            
        case 'equip':
            const itemData = getItemById(itemId);
            if (itemData) {
                equipItem(currentMemberId, itemData);
                hideEquipmentManagement();
                if (EQUIPMENT_STATE.callback) EQUIPMENT_STATE.callback();
            }
            break;
            
        case 'close':
            hideEquipmentManagement();
            break;
    }
}

/**
 * Get available items for a specific slot
 */
function getAvailableItemsForSlot(slot) {
    return getAvailableEquipmentForSlot(slot);
}

/**
 * Get item data by ID
 */
function getItemById(itemId) {
    return getEquipmentById(itemId);
}


