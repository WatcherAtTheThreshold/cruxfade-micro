# [Game Name] - Technical Patterns & Decisions

> **Instructions:** Use this template when reviewing a new game repo. Fill in each section as you analyze the codebase. Delete placeholder text and examples once filled.

---

## Game Overview
- **Genre/Type:** [e.g., Deck-builder, Platformer, Puzzle, RPG, etc.]
- **Core Mechanics:**
  - [Primary mechanic]
  - [Secondary mechanic]
  - [Win/lose conditions]
- **Tech Stack:**
  - [Language/Framework]
  - [Build tools if any]
  - [Notable libraries]

## Architecture Patterns

### Module/File Structure
```
[List main files and their responsibilities]
file.js (X lines) - Description
```

### Separation of Concerns
| Module | Responsibility |
|--------|----------------|
| [file] | [what it handles] |

### State Management Pattern
- **Pattern used:** [Centralized, Redux, Context, Component-local, etc.]
- **How state flows:** [Description]
- **Key state variables:** [List them]

## Design

### Core Game System
```javascript
// Show the main pattern used for game logic
// e.g., Entity-Component, Effect system, Event system
```

**Key Design Decisions:**
- [Decision and rationale]

### Data-Driven Elements
[Describe any declarative/data-driven patterns - card definitions, level data, config objects]

### UI/Game Phase Management
[How does the game manage different screens/phases/states?]

## Sound

### Audio Architecture
- **Music system:** [How music is managed]
- **SFX system:** [How sound effects work]
- **Transitions:** [Fade logic, layering, etc.]

### Audio Files/Formats
```
[List audio assets and their purpose]
```

## Browser Compatibility

- **Target browsers:** [Modern only, IE support, mobile, etc.]
- **Module loading:** [ES6 modules, bundled, script tags]
- **Responsive approach:** [Media queries, scaling, fixed size]
- **Mobile considerations:** [Touch input, audio autoplay, etc.]

---

## What Works Well
- [Pattern/decision that proved effective]
- [Why it works for this type of game]

## What We'd Do Differently
- [Honest reflection on improvements]
- [Technical debt identified]

---

## Key Implementation Details

### [System Name 1 - e.g., "Movement System"]
- **Approach:** [How it's implemented]
- **Why this way:** [Rationale]
- **Gotchas/Lessons:** [What to watch out for]

### [System Name 2 - e.g., "Combat/Scoring"]
- **Approach:**
- **Why this way:**
- **Gotchas/Lessons:**

### [System Name 3 - e.g., "Save/Load"]
- **Approach:**
- **Why this way:**
- **Gotchas/Lessons:**

---

## Reusable Code Patterns

### [Pattern Name 1]
```javascript
// Code snippet that could transfer to other projects
```

### [Pattern Name 2]
```javascript
// Another reusable pattern
```

### [Utility Functions]
```javascript
// Helper functions worth keeping
```

### [CSS Patterns]
```css
/* Reusable styling approaches */
```

---

## Performance Considerations

### What Mattered
- [Performance concern that required attention]
- [How it was addressed]

### What Didn't Matter
- [Premature optimization avoided]
- [Why it wasn't needed for this scale]

---

## Development Workflow Notes

### Build Process
- [Steps to run/build the project]
- [Dev server setup]
- [Deployment notes]

### File Organization
```
project/
├── [folder structure]
```

### Debugging Tips
- [How to inspect game state]
- [Useful console commands]
- [Common issues and fixes]

---

## Quick Reference: Extending the Game

### Adding [Content Type 1 - e.g., "New Levels"]
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Adding [Content Type 2 - e.g., "New Enemies"]
1. [Step 1]
2. [Step 2]

### Adding [Content Type 3 - e.g., "New Items"]
1. [Step 1]
2. [Step 2]

---

## Reference: Previous Reviews

| Game | Genre | Key Patterns | Link |
|------|-------|--------------|------|
| Shadows of the Deck | Deck-builder | Declarative effects, Phase-based state, ES6 modules | [shadows-of-the-deck-review.md](shadows-of-the-deck-review.md) |
| [Next Game] | [Genre] | [Patterns] | [link] |
