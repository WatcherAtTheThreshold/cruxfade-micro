***

# Action Plan for Cruxfade-Micro
**As of:** August 25, 2025

This document outlines the prioritized next steps for the Cruxfade-Micro project, consolidating feedback from the code and documentation review. The primary goal is to synchronize the project's documentation with its implemented features and then proceed with the planned architectural improvements.

---

### **1. Quick Code Cleanup (Low Priority / Optional)**
*These are minor quality-of-life improvements that can be done at any time.*

- **In `index.html`:**
    - Remove the commented-out `` block.
- **In `styles.css`:**
    - Consolidate the redundant header styles (`.grid-header`, `.status-header`, `.cards-header`, `.encounter-header`) into a single shared class to reduce code duplication.

---

### **2. Synchronize Documentation (Crucial Next Step)**
*Update core design documents to match the final implementation decisions. This prevents future confusion.*

- **Grid Size:**
    - Update the grid size specification from **3x3** to **4x4** in all relevant documents.
- **Player Start Position:**
    - Change the starting position from "center tile" to "left edge" in the core loop description.
- **UI Layout:**
    - Update the layout diagram to show the "EVENT LOG" in the bottom-left section, not "PARTY CARDS".
- **Aspect Ratio:**
    - Adjust the technical specification to reflect the current `95vh` viewport height approach instead of a fixed 3:2 ratio.

---

### **3. Execute Phase 1 of Your Roadmap (Main Priority)**
*Begin the planned architectural refactor to make the game data-driven. Follow the detailed steps in your implementation guide.*

- **Initiate the Plan:**
    - Begin the process outlined in the `phase1-implementation-guide.md` document.
- **First Steps:**
    - Create the `/data/enemies.json` file as specified.
    - Implement the data loader in `main.js`.
    - Modify `state.js` to use the externally loaded enemy data instead of the hardcoded `ENEMIES` object.
- **Continue with Phase 1:**
    - Proceed with the remaining steps for creating `encounters.json`, `items.json`, and implementing the seeded RNG.

***