**Cruxfade‑Micro** tiny now but ready to grow later.

# Baseline structure (no build tools)

```
cruxfade-micro/
  index.html
  styles.css
  /img/         (portraits, icons)
  /sfx/         (optional)
  /data/
    cards.json
    enemies.json
    tables.json  (loot, encounter weights, etc.)
  /js/
    main.js         // bootstraps app
    state.js        // single source of truth (run, grid, party, deck)
    rng.js          // seeded PRNG (so runs are reproducible)
    generation.js   // makes weighted 3×3 grids
    rules.js        // combat & hazard roll math
    cards.js        // card factories + effects
    encounters.js   // tile resolvers (fight/item/hazard/ally/key/door)
    ui.js           // DOM render + overlays (hand, log, dice)
```

### Why this split?

* **main.js**: only wires things together.
* **state.js**: one plain object; pure functions mutate it in controlled ways.
* **rng.js**: lock in a seed so players can share runs.
* **generation.js**: changes often; nice to keep isolated (weights, key/door rules).
* **rules.js**: the D\&D‑ish core (dice, modifiers, advantage/disadvantage).
* **cards.js**: where “play X card → state change” lives.
* **encounters.js**: translates a tile into an overlay flow.
* **ui.js**: renders board/hand/HUD, shows dice animations & popups.

That’s **8 small JS files**. You can totally start with **3 files** (`main.js`, `state.js`, `ui.js`) and peel pieces out as they get chunky.

# Index & CSS

* **index.html**: load ES modules directly; no bundler needed.

  ```html
  <script type="module" src="/js/main.js"></script>
  ```
* **styles.css**: keep variables at the top (`:root { --colors }`). Use a small set of utility classes and component blocks (`.board`, `.tile`, `.hand`, `.overlay`, `.btn`). No framework required.

# Data handling

* Keep **content as JSON** in `/data/` so design can iterate without touching code:

  * `cards.json`: id, name, type, text, tags, rarity, effect hook name.
  * `enemies.json`: id, hp, atk, magic, traits, loot table id.
  * `tables.json`: encounter weights per grid level, boss phases, shops, etc.
* `cards.js` maps `effectId` → function that applies the effect to `state`.

# State shape (sketch)

```js
// state.js
export const G = {
  seed: 0,
  gridLevel: 1,
  board: { tiles: [], seen: new Set(), player: { r:1,c:1 } },
  party: [{ id:"you", hp:10, atk:2, mag:1, tags:["human"] }],
  deck: [], discard: [],
  equipment: { you: [], /* allyId: [] */ },
  keyFound: false,
  log: [],
  over: false
};
```

# Event flow (where files talk)

```
main.js
 ├─ state.js (G)
 ├─ generation.js → makeGrid(G)
 ├─ ui.js → render(G), openOverlay(type, payload)
 ├─ encounters.js → resolveTile(G, tile)
 │    └─ rules.js (rolls, outcomes)
 ├─ cards.js → playCard(G, cardId)
 └─ rng.js → random(), pickWeighted()
```

# Dice & overlays (tech notes)

* **rules.js** exposes tiny building blocks:

  * `roll(die)`, `mod(total, stat)`, `withAdvantage(rollFn)`.
  * Hazards use `targetNumber`; fights compare `atk vs def` with modifiers.
* **ui.js** renders a **dice overlay** (CSS transform + sprite sheet or simple number flip). No canvas needed.

# Assets

* Keep portraits in `/img/portraits/…png` and reference by id in `party` or `enemies.json`.
* If you later add sprite sheets, tuck them under `/img/sprites/`.

# Persistence (optional, minimal)

* Pure roguelike, so just **remember settings** (volume, compact mode, last seed) in `localStorage`.
* If you ever want “daily seed”: generate a seed from `YYYY‑MM‑DD`.

# Testing (lightweight)

* Start manual. If you add tests later, `vitest` works great with ES modules (no heavy config). Test `rules.js` and `generation.js` first.

# Growth path (if you outgrow this)

* **Tier 2**: add TypeScript + Vite, keep the same folder structure.
* **Tier 3**: extract overlays into small web components (still no framework).
* Avoid premature frameworks; your UI surface is compact.

---

If you want, I can push a **starter repo layout** into the canvas (folders + empty files + a minimal `index.html` that boots `main.js`) so you can drop it into a project and go.
