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
    // Equipment functions
    getEquipmentById,
    equipItem,
    unequipItem,
    getEquippedItem,
    isEquipment,
    // Combat functions
    startCombat,
    playerAttack,
    enemyAttack,
    rollDice,
    // NEW: Boss system functions
    isInBossEncounter,
    getCurrentBossPhase,
    getCurrentBoss,
    startBossPhase,
    completeBossPhase
} from './state.js';

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
    
    console.log(`🎯 Cached ${DOM.tiles.length} tiles (expecting 16 for 4x4)`);
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
    
    console.log('🎨 UI rendered');
}

// ================================================================
// BOARD RENDERING
// ================================================================

/**
 * Render the 4x4 game board
 */
function renderBoard() {
    if (!DOM.tiles) return;
    
    DOM.tiles.forEach((tileElement, index) => {
        const row = Math.floor(index / 4); // 4x4 math
        const col = index % 4;
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
        
        // Add adjacent class for tiles that can be clicked
        if (isAdjacentToPlayer(row, col) && !isPlayerCurrentTile(row, col)) {
            tileElement.classList.add('adjacent');
        }
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
        empty: '·',
        // NEW: Boss encounter icon
        'boss-encounter': '💀'
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
  memberDiv.style.cursor = 'pointer';

  // Compute display values
  const hpColor =
    member.hp <= member.maxHp * 0.25 ? '#ef6b73' :
    member.hp <= member.maxHp * 0.5  ? '#f6d55c' :
                                        '#68d391';

  // Equipped items
  const equipment = G.equipment[member.id] || [];
  const weapon    = equipment.find(item => item.slot === 'weapon');
  const armor     = equipment.find(item => item.slot === 'armor');
  const accessory = equipment.find(item => item.slot === 'accessory');

  // Build DOM
  memberDiv.innerHTML = `
    <div class="member-portrait">
      <img src="./images/portraits/${member.id}.png" alt="${member.name}"
           onerror="this.style.display='none'; this.nextElementSibling.style.display='inline'">
      <span class="portrait-fallback">${getCharacterIcon(member)}</span>
    </div>
    <div class="member-info">
      <strong>${member.name}</strong>
      <div class="stats">
        <span class="hp">❤️ <strong style="color:${hpColor}">${member.hp}</strong>/${member.maxHp}</span>
        <span class="atk">⚔️ <strong>${member.atk}</strong></span>
        <span class="mag">✨ <strong>${member.mag}</strong></span>
      </div>
      <div class="equipment-display">
        <div class="equipment-slot weapon-slot clickable-slot"
             data-member-id="${member.id}" data-slot="weapon" title="Click to manage weapon">
          <span class="slot-icon">⚔️</span>
          <span class="equipment-name">${weapon ? weapon.name : 'None'}</span>
        </div>
        <div class="equipment-slot armor-slot clickable-slot"
             data-member-id="${member.id}" data-slot="armor" title="Click to manage armor">
          <span class="slot-icon">🛡️</span>
          <span class="equipment-name">${armor ? armor.name : 'None'}</span>
        </div>
        <div class="equipment-slot accessory-slot clickable-slot"
             data-member-id="${member.id}" data-slot="accessory" title="Click to manage accessory">
          <span class="slot-icon">💎</span>
          <span class="equipment-name">${accessory ? accessory.name : 'None'}</span>
        </div>
      </div>
    </div>
    ${isLeader ? '<div class="leader-marker">LEADER</div>' : ''}
  `;

  // Click to switch leader (but ignore clicks on equipment slots)
  memberDiv.addEventListener('click', (e) => {
    if (e.target.closest('.clickable-slot')) return;
    console.log('🖱️ Clicked party member:', member.name);
    switchPartyLeader(member.id);
    _updateGameCallback();
  });

  // Add click handlers to equipment slots
  const equipmentSlots = memberDiv.querySelectorAll('.clickable-slot');
  equipmentSlots.forEach(slot => {
    slot.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent parent click
      const memberId = slot.dataset.memberId;
      const slotType = slot.dataset.slot;

      console.log(`🎒 Managing ${slotType} for ${member.name}`);
      showEquipmentManagement(memberId, slotType, () => {
        _updateGameCallback(); // Refresh UI when equipment changes
      });
    });
  });

  return memberDiv;
}

/**
 * Get appropriate icon for character type
 */
function getCharacterIcon(member) {
  if (member.tags.includes('leader'))  return '⚔️';
  if (member.tags.includes('warrior')) return '🛡️';
  if (member.tags.includes('mage'))    return '🔮';
  if (member.tags.includes('rogue'))   return '🗡️';
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
    
    DOM.partyHand.innerHTML = '<h4>Hand (' + G.hand.length + '/5)</h4>';
    
    G.hand.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'playable-card';
        cardElement.style.cursor = 'pointer';
        cardElement.innerHTML = `
            <strong>${card.name}</strong>
            <div class="card-type">${card.type}</div>
        `;
        
        // Make card clickable
        cardElement.addEventListener('click', () => {
            console.log('🃏 Playing card:', card.name);
            playCard(card.id);
            _updateGameCallback();
        });
        
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
 * Renders the encounter area based on the player's current tile.
 * This function acts as a dispatcher.
 */
function renderEncounterArea() {
    const tile = getCurrentTile();
    if (!tile) {
        renderDefaultEncounter();
        return;
    }

    console.log('🐛 DEBUG: Rendering encounter for tile:', tile.type, 'consumed:', tile.consumed, 'combat active:', G.combat.active);

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
    
    console.log('🐛 DEBUG: Boss encounter render - boss:', boss?.name, 'phase:', phase?.name, 'enemyIndex:', G.boss.enemyIndex);
    
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
    
    console.log('🐛 DEBUG: Rendering boss fight phase - currentEnemy:', currentEnemy, 'totalEnemies:', totalEnemies);
    
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
        return; // Exit early, don't show combat UI
    }
    
    if (G.combat.active) {
        DOM.encounterArea.innerHTML = `
            <div class="encounter-fight">
                <h3>⚔️ Combat: ${G.combat.enemy.name}</h3>
                <div class="combat-status">
                    <div class="combatant">
                        <strong>You</strong><br>
                        ❤️ ${G.combat.playerHp} HP
                    </div>
                    <div class="vs">VS</div>
                    <div class="combatant">
                        <strong>${G.combat.enemy.name}</strong><br>
                        ❤️ ${G.combat.enemyHp} HP
                    </div>
                </div>
                ${G.combat.lastRoll ? `<p>🎲 Last roll: ${G.combat.lastRoll}</p>` : ''}
                <p>${G.combat.turn === 'player' ? 'Your turn!' : 'Enemy turn...'}</p>
            </div>
        `;
        
        DOM.encounterActions.innerHTML = `
            ${G.combat.turn === 'player' ? 
                '<button class="btn-primary" data-action="player-attack">Attack!</button>' :
                '<button class="btn-secondary" data-action="enemy-turn">Continue...</button>'
            }
        `;
    } else {
        // Get a random enemy type for this encounter
        const enemyType = getRandomEnemyType();
        const enemyData = G.combat.enemy || { name: 'Unknown Enemy', description: 'A mysterious foe' };
        
        // Not in combat yet - show encounter start
        DOM.encounterArea.innerHTML = `
            <div class="encounter-fight">
                <h3>⚔️ Enemy Encounter</h3>
                <p>A hostile creature blocks your path!</p>
                <div class="enemy-preview">
                    <strong>Grid ${G.gridLevel} Enemy</strong><br>
                    Prepare for battle...
                </div>
            </div>
        `;
        
        DOM.encounterActions.innerHTML = `
            <button class="btn-primary" data-action="start-combat">Fight!</button>
            <button class="btn-secondary" data-action="flee-encounter">Flee</button>
        `;
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
 * Render an ally encounter
 */
function renderAllyEncounter() {
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
            </div>
        `;
        DOM.encounterActions.innerHTML = `
            <button class="btn-primary" data-action="recruit-ally">Recruit</button>
        `;
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
            // Start a new game with random seed
            if (window.CruxfadeMicro && window.CruxfadeMicro.newGame) {
                window.CruxfadeMicro.newGame();
            }
            closeAllOverlays();
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
        
        // Remove any existing click handlers to prevent duplicates
        DOM.runSeed.replaceWith(DOM.runSeed.cloneNode(true));
        DOM.runSeed = document.getElementById('run-seed'); // Re-cache after replace
        
        DOM.runSeed.addEventListener('click', () => {
            const newSeed = prompt('Enter seed (number):', G.seed);
            if (newSeed !== null && !isNaN(newSeed) && newSeed.trim() !== '') {
                const seedNum = parseInt(newSeed);
                console.log('🎲 Starting new game with seed:', seedNum);
                window.CruxfadeMicro.newGame(seedNum);
            }
        });
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
                // NEW: Boss system actions
                case 'start-boss-sequence':
                    console.log('💀 Starting boss sequence...');
                    startBossPhase();
                    _updateGameCallback();
                    break;
                    
                case 'start-boss-phase':
                    console.log('⚡ Starting boss phase...');
                    startBossPhase();
                    _updateGameCallback();
                    break;
                    
                case 'complete-boss-phase':
                    console.log('✅ Completing boss phase...');
                    completeBossPhase();
                    _updateGameCallback();
                    break;
                
                // Existing actions
                case 'start-combat':
                    console.log('⚔️ Starting combat...');
                    const enemyType = getRandomEnemyType(); // Use random enemy type
                    startCombat(enemyType);
                    _updateGameCallback();
                    break;
                    
                case 'player-attack':
                    console.log('⚔️ Player attacks...');
                    playerAttack();
                    _updateGameCallback();
                    break;
                    
                case 'enemy-turn':
                    console.log('💥 Enemy turn...');
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
                console.log('⚡ Resolving hazard...');
                   resolveHazard();  // Call our new function!
                   _updateGameCallback();
                    break;
                    
                case 'take-item':
                    console.log('📦 Taking item...');
                    giveRandomItem();  // Call our new function!
                    _updateGameCallback();
                     break;
                    
                case 'recruit-ally':
                    console.log('🤝 Recruiting ally...');
                    const result = recruitRandomAlly();
                    
                    // Check if recruitment caused card overflow
                    if (result && result.overflow) {
                        // Ally wants to join but hand is full - show card selection
                        console.log('⚠️ Ally recruitment caused card overflow');
                        
                        // Create a combined card that represents what the ally offers
                        const combinedCard = {
                            id: 'ally-offer-' + result.ally.id,
                            name: `${result.ally.name}'s Cards`,
                            type: 'ally',
                            description: `${result.ally.name} offers: ${result.cards.map(c => c.name).join(', ')}`
                        };
                        
                        // Show overflow selection with callback
                        showCardOverflowSelection(combinedCard, (resolved) => {
                            if (resolved) {
                                // Import the resolve function
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
                    
                case 'take-key':
                    console.log('🗝️ Taking key...');
                    foundKey();
                    _updateGameCallback();
                    break;
                    
                case 'proceed-next-grid':
                    console.log('🚪 Proceeding to next grid...');
                    nextGrid();
                    _updateGameCallback();
                    break;
                    
                default:
                    console.warn('Unknown action:', action);
            }
        });
    }
    
    console.log('🎯 Event handlers bound with callback system');
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
            _updateGameCallback(); // Use callback instead of direct import
        } else {
            console.log('❌ Move failed');
        }
    } else if (!isPlayerCurrentTile(row, col)) {
        addLogEntry('❌ Can only move to adjacent tiles');
        _updateGameCallback(); // Use callback instead of direct import
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
    
    // Get available items of this type from inventory (for now, just show unequip option)
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
            handleEquipmentAction(action, itemId);
        });
    });
}

/**
 * Handle equipment management actions
 */
function handleEquipmentAction(action, itemId) {
    const memberId = EQUIPMENT_STATE.memberId;
    const slot = EQUIPMENT_STATE.slot;
    
    switch(action) {
        case 'unequip':
            const unequipped = unequipItem(memberId, slot);
            if (unequipped) {
                addLogEntry(`📦 ${unequipped.name} was unequipped`);
                console.log('🔧 Equipment after unequip:', G.equipment[memberId]); // DEBUG
            }
            hideEquipmentManagement();
            if (EQUIPMENT_STATE.callback) EQUIPMENT_STATE.callback();
            break;
            
        case 'equip':
            const itemData = getItemById(itemId);
            if (itemData) {
                equipItem(memberId, itemData);
                console.log('🔧 Equipment after change:', G.equipment[memberId]); // DEBUG
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
 * Get available items for a specific slot (placeholder - later connect to inventory)
 */
function getAvailableItemsForSlot(slot) {
    return getAvailableEquipmentForSlot(slot);
}
    
   
    
   
/**
 * Get item data by ID (placeholder)
 */
function getItemById(itemId) {
    return getEquipmentById(itemId);
}
