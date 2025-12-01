# Operations VTT Autorun 2

**Created:** 2025-12-01
**Mode:** Autonomous execution
**Scope:** UI Polish, Bug Fixes, Features
**Goal:** Complete remaining TODOs from testing session

---

## Stage 1: BUG FIX - Crew Status Updates (HIGH PRIORITY)
**Issue:** Crew status display doesn't update when players join/leave roles

**Tasks:**
1. Add socket broadcast when player joins bridge (`ops:crewJoined`)
2. Add socket broadcast when player leaves role (`ops:crewLeft`)
3. Add socket broadcast on disconnect (`ops:crewDisconnected`)
4. Update `renderCrewStatus()` to handle these events
5. Test with multiple browser windows

**Files:** `operations.handlers.js`, `app.js`

---

## Stage 2: OBSERVER Role
**Feature:** Unlimited observer slots for spectators

**Tasks:**
1. Add 'observer' to ROLE_VIEWS in `lib/operations/index.js`
2. Allow unlimited observer count (no slot limit)
3. Observer sees bridge view with no role panel
4. Show ASCII art of ship in place of role panel
5. Observers appear in crew list with distinct styling

**Files:** `index.js`, `operations.handlers.js`, `app.js`, `styles.css`

---

## Stage 3: Starship Weapon Display
**Feature:** Show full weapon complement on ship detail card

**Tasks:**
1. Parse turrets array from ship template
2. Format as: "Triple Turret: Beam Laser, Beam Laser, Sandcaster"
3. Add weapons section to ship detail popup
4. Style with compact, readable format

**Files:** `app.js`, `styles.css`

---

## Stage 4: Ship Detail ASCII Art
**Feature:** Colorful ASCII art on ship detail popup

**Tasks:**
1. Create larger, more detailed ASCII art per ship type
2. Add color coding (green hull, red weapons, blue engines)
3. Display prominently in ship detail modal
4. Use monospace font with proper sizing

**Files:** `app.js`, `styles.css`

---

## Stage 5: PC Personalization - Role Quirks
**Feature:** Visual personalization for each PC's station

**Tasks:**
1. Add `quirk_text` and `quirk_icon` columns to player_accounts table
2. Create quirk editor in player setup
3. Display quirk in role panel header
4. Seed Dorannia PCs with sample quirks:
   - Asao: "Heavy-duty firefighting gear ready"
   - Von Sydo: "Photo of girlfriend on console"

**Files:** `database.js`, `accounts.js`, `operations.handlers.js`, `app.js`, `styles.css`

---

## Stage 6: Custom Role Description
**Feature:** Player-editable role name/description

**Tasks:**
1. Add `role_title` column to player_accounts
2. Add inline edit for role title in role panel
3. Socket handler for `ops:updateRoleTitle`
4. Display custom title instead of generic role name

**Files:** `database.js`, `operations.handlers.js`, `app.js`

---

## Stage 7: Character Sheet Mouseover
**Feature:** Hover on character name shows character info

**Tasks:**
1. Create character tooltip component
2. Display: Name, skills, augmentations, portrait placeholder
3. Add character_data JSON column to player_accounts
4. Parse and display on hover
5. Style as sci-fi data card

**Files:** `database.js`, `app.js`, `styles.css`, `index.html`

---

## Stage 8: Encyclopedia Data - Ator & Flammarion
**Feature:** Populate additional star systems

**Tasks:**
1. Fetch Ator wiki data from TravellerWiki
2. Fetch Flammarion wiki data
3. Create seed scripts for each system
4. Add celestial contacts (stars, planets, belts, starports)
5. Include UWP, trade codes, stellar class

**Files:** `seed-ator.js` (NEW), `seed-flammarion.js` (NEW)

---

## Execution Order

1. **Stage 1** - Crew status bug (critical path)
2. **Stage 2** - Observer role (quick win)
3. **Stage 3** - Weapon display (data already exists)
4. **Stage 4** - Ship ASCII art (builds on existing)
5. **Stage 5** - Role quirks (DB change)
6. **Stage 6** - Custom role title (simple)
7. **Stage 7** - Character mouseover (polish)
8. **Stage 8** - Encyclopedia data (research needed)

---

## Success Criteria

- [ ] Crew status updates in real-time across all clients
- [ ] Observers can join and watch without taking roles
- [ ] Ship details show complete weapon loadout
- [ ] Ships have colorful ASCII art
- [ ] PCs have personalized stations
- [ ] Character info available on hover
- [ ] Ator and Flammarion systems populated
- [ ] All 308+ tests still pass

---

## Deferred (Not This Autorun)

- Spinward Marches UWP database (large data import)
- Campaign notes integration (needs user input)
- Chip jack skill boost (gameplay mechanics)
- Time-for-skill optional rule (gameplay mechanics)

---

## Risk Mitigation Decisions

1. **DB Changes:** Try auto-migrate first, fall back to reset if needed
2. **Encyclopedia:** Research Ator + Flammarion together, seed simultaneously
3. **ASCII Art:** Compact 5-8 lines (fits tooltips, fast render)

---

**STATUS:** Ready to execute
**NEXT:** Begin Stage 1 - Crew Status Bug Fix
