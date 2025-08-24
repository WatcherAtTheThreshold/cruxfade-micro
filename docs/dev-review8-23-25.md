

# Cruxfade-Micro: Code Review & Refactoring Suggestions

This document outlines several proposed improvements for the Cruxfade-Micro codebase. The project has a strong foundation with a clean separation of concerns between state, UI, and logic. The following suggestions aim to build on that foundation by enhancing the architecture, fixing minor bugs, and improving overall code quality.

-----

## 1\. Architectural Refactor: Remove Circular Dependency

**Problem:**
There is a circular dependency between `main.js` and `ui.js`. `main.js` imports `renderAll` from `ui.js`, while `ui.js` imports `updateGame` from `main.js`. While this may function, it's an architectural anti-pattern that can lead to subtle bugs and make the code harder to maintain and reason about. The UI module should not be responsible for controlling the main game loop.

**Recommendation:**
Invert the dependency by passing the `updateGame` function into the UI module as a callback during initialization. This establishes a clear, unidirectional data flow: `UI Event -> State Change -> Main Loop Update -> UI Render`.

**Step 1: Remove the `main.js` import from `ui.js`**

```javascript
// ui.js

// REMOVE THIS LINE:
// import { updateGame } from './main.js';
```

**Step 2: Modify `ui.js` to accept and use the callback**
The `bindEventHandlers` function is a perfect place to inject this dependency.

```javascript
// ui.js

// Add a variable to hold the callback at the top of the file
let _updateGameCallback = () => console.warn('updateGame callback not set!');

// Modify bindEventHandlers to accept and store the function
export function bindEventHandlers(updateGameCallback) {
    _updateGameCallback = updateGameCallback; // Store the callback
    cacheDOMElements();
    // ... rest of the function ...
}

// In event handlers (like handleTileClick or the delegated action listener),
// replace calls to updateGame() with _updateGameCallback().
// For example:
function handleTileClick(row, col) {
    if (G.over) return;
    
    if (isAdjacentToPlayer(row, col)) {
        const success = movePlayer(row, col);
        if (success) {
            _updateGameCallback(); // Use the callback
        }
    } else if (!isPlayerCurrentTile(row, col)) {
        addLogEntry('❌ Can only move to adjacent tiles');
        _updateGameCallback(); // Use the callback
    }
}
```

**Step 3: Pass `updateGame` into `bindEventHandlers` in `main.js`**

```javascript
// main.js

function init() {
    console.log('🎮 Cruxfade-Micro starting up...');
    
    initializeGame();
    
    // Pass the updateGame function directly into the UI module
    bindEventHandlers(updateGame);
    
    renderAll();
    
    addLogEntry('Welcome to the grid. Find the key to proceed...');
    console.log('✅ Game initialized successfully');
}
```

-----

## 2\. Bug Fix: Correct Image Portrait Fallback

**Problem:**
The fallback emoji for party member portraits does not appear if the image asset fails to load. The current `onerror` code only hides the broken image but doesn't make the fallback visible.

**Recommendation:**
Implement a two-part fix to hide the fallback by default and make it visible only when the image `onerror` event fires.

**Step 1: Add CSS to hide the fallback span**

```css
/* styles.css -> Add to Section 5 (Party Status) */

.portrait-fallback {
  display: none;
}
```

**Step 2: Update `onerror` attribute in `ui.js`**
Modify the `createPartyMemberElement` function to include logic to display the sibling fallback element on error.

```javascript
// ui.js -> createPartyMemberElement()

// ...
memberDiv.innerHTML = `
    <div class="member-portrait">
        <img src="./images/portraits/${member.id}.png" alt="${member.name}" 
             onerror="this.style.display='none'; this.nextElementSibling.style.display='inline'">
        <span class="portrait-fallback">${getCharacterIcon(member)}</span>
    </div>
    <div class="member-info">
        // ...
    </div>
`;
// ...
```

-----

## 3\. UX & Accessibility: Announce Game Log Updates

**Problem:**
New entries in the game log are not announced by screen readers, making the game inaccessible to visually impaired players.

**Recommendation:**
Add the `aria-live="polite"` attribute to the game log container in `index.html`. This tells assistive technologies to read out new content as it's added without interrupting the user.

```html
<div class="log" id="game-log" aria-live="polite">
    <p>Welcome to the grid. Find the key to proceed...</p>
</div>
```

-----

## 4\. Code Quality: Refactor Board Rendering Styles

**Problem:**
The `renderBoard` function in `ui.js` directly manipulates inline CSS styles for tile borders and cursors. This mixes presentation logic with rendering logic, making the code harder to maintain.

**Recommendation:**
Move this styling into `styles.css` and use JavaScript only to toggle CSS classes. This improves separation of concerns.

**Step 1: Simplify the rendering logic in `ui.js`**
Replace the complex `if/else if/else` block with a single check to add an `.adjacent` class.

```javascript
// ui.js -> renderBoard()

// In the DOM.tiles.forEach loop, replace this entire block:
/*
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
*/

// With this simpler version:
if (isAdjacentToPlayer(row, col) && !isPlayerCurrentTile(row, col)) {
    tileElement.classList.add('adjacent');
}
```

**Step 2: Add the corresponding styles to `styles.css`**
These rules will handle the styling based on the presence of the `.adjacent` and `.player-tile` classes.

```css
/* styles.css -> Add to the end of Section 4 (Exploration Area) */

/* Style for adjacent, clickable tiles */
.tile.adjacent {
  cursor: pointer;
  border: 2px solid var(--accent);
}

/* The player's tile is already styled, but we ensure its border and cursor are correct */
.tile.player-tile {
  cursor: default;
  border: 2px solid var(--accent);
}
```