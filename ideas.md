Got it — your answers really lock in the tone and mechanics, so I can now draw a **full annotated gameplay loop** instead of just a placeholder grid.

Here’s the distilled *locked-down* structure before I draw it:

---

## **Cruxfade-Micro Core Loop (Locked Down)**

**1. Enter Grid**

* Start in center tile.
* Tiles are dark except visited ones.
* 3×3 map, randomized but weighted for a set number of events.
* First tile in each new grid is a **safe room** (heal/buff/shop/etc.).

**2. Explore**

* Move to adjacent tiles, revealing them.
* Tile events can be:

  * **Fight** (stats + skills roll)
  * **Hazard** (choose best party member)
  * **Item/Equipment** (buffs stats directly — no inventory bloat)
  * **Ally** (joins party, merges deck, keeps buffs)
  * **Key** (required for exit)
  * **Door** (exit to next grid)

**3. Deck & Cards**

* Hard cap **5 cards** (skills/abilities).
* Equipment doesn’t take card space, modifies stats directly.
* Deck merges with allies’ cards.
* Discard rules apply when exceeding cap.

**4. Encounters**

* **Normal fights/hazards**: only the **party leader** participates.
* **Boss fights**: multi-phase.

  1. Mini-encounters (limbs, hazards, minions).
  2. Boss fights entire party in final phase.

**5. Stat Rolls**

* Mostly simple fixed dice for speed (d6/d20).
* Skills add modifiers or swap die size depending on effect.
* Fight resolution is quick: pop-up overlay, roll animation, outcome.

**6. Between Grids**

* Party & buffs persist.
* Map is fully reshuffled each grid.
* Lose allies/items via certain events.

**7. Endgame**

* Three grids → Boss fight.
* If party leader dies, you keep going with other members.
* If all die, run ends.

---

If you’re good with that, I can now make you a **visual loop diagram** showing:

* Movement/exploration → event overlays → deck interactions → boss → repeat.
* Marking where the dice rolls, party selection, and equipment buffs happen.

That’ll make it super easy to keep the design in front of you while prototyping.

Do you want me to make that **full stylized loop diagram** now?
