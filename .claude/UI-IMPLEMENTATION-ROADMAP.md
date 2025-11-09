# UI Implementation Roadmap - Stages 10-11

**Created:** 2025-11-09
**Status:** Planning Complete, Ready for Implementation
**Wireframe:** Iteration 2 (Crew at bottom) - APPROVED ✅

---

## Overview

Incremental UI improvements across Stages 10-11 to maximize screen real estate while maintaining development velocity. Stage 10 focuses on planning and wireframes, Stage 11 implements the changes.

---

## Stage 10: UI Planning & Wireframing ONLY

**Scope:** NO UI implementation in Stage 10 (maintain velocity on critical hits feature)

### Activities:
1. ✅ **Wireframe Creation** - ASCII wireframe (Iteration 2 approved)
2. ✅ **Lock in design decisions** - Option B layout with crew at bottom
3. ✅ **Document technical approach** - localStorage + JS classList toggle
4. ✅ **Plan component changes** - Top bar consolidation, expand/collapse
5. **Defer implementation to Stage 11**

### Deliverables:
- ✅ Wireframe document (this file)
- ✅ Technical specifications
- ✅ Implementation plan for Stage 11
- ❌ NO CODE CHANGES to UI in Stage 10

---

## Stage 11: UI Implementation

**Scope:** Implement Option B layout + expand/collapse functionality

### 11.1: Option B Horizontal Layout (~4-5 hours)
**Goal:** Restructure HTML for better screen real estate usage

**Changes:**
- Consolidate double headers into single top bar (~60px height)
  - Current: Two separate header sections (~200px total)
  - New: `<header>Traveller Combat VTT | Stage 11 | Round 3 | Timer: 0:45</header>`
  - Saves: ~140px vertical space

- Implement 3-section horizontal layout:
  ```
  ┌────────────┬──────────────────┬──────────────┐
  │ Ship       │ Initiative       │ Combat Log   │
  │ Status     │ Tracker          │ (fixed 280px)│
  │ (300px W)  │ (700px W)        │ (400px W)    │
  └────────────┴──────────────────┴──────────────┘
  ```

- Move hex grid to middle section
  ```
  ┌─────────────────────────────────────────────┐
  │ Hex Grid + Range Indicator (~320px height) │
  └─────────────────────────────────────────────┘
  ```

- Move crew section to bottom
  ```
  ┌─────────────────────────────────────────────┐
  │ [▼ Crew] (collapsed by default, ~40px)     │
  └─────────────────────────────────────────────┘
  ```

**Files to Modify:**
- `public/index.html` - Restructure sections
- `public/styles.css` - Add Flexbox layout, responsive breakpoints
- `public/app.js` - Update element selectors if IDs change

**Target Heights:**
- Crew collapsed: 60 + 280 + 320 + 40 = **700px** ✅ Under 900px goal
- Crew expanded: 60 + 280 + 320 + 150 = **810px** ✅ Still under 900px

### 11.2: Expand/Collapse Functionality (~2-3 hours)
**Goal:** Add collapsible sections for Crew and Combat Log

**Components to Make Collapsible:**

1. **Crew Section** (Priority: HIGH)
   ```javascript
   // HTML structure
   <div id="crewSection">
     <button id="crewToggle">▼ Crew</button>
     <div id="crewContent" class="collapsible">
       <!-- Existing crew roster -->
     </div>
   </div>
   ```

   ```javascript
   // JavaScript implementation
   document.getElementById('crewToggle').addEventListener('click', () => {
     const content = document.getElementById('crewContent');
     const button = document.getElementById('crewToggle');

     content.classList.toggle('collapsed');
     button.textContent = content.classList.contains('collapsed')
       ? '▶ Crew'
       : '▼ Crew';

     // Persist state
     localStorage.setItem('crewCollapsed', content.classList.contains('collapsed'));
   });

   // Restore state on load
   if (localStorage.getItem('crewCollapsed') === 'true') {
     document.getElementById('crewContent').classList.add('collapsed');
     document.getElementById('crewToggle').textContent = '▶ Crew';
   }
   ```

   ```css
   /* CSS implementation */
   .collapsible {
     max-height: 500px;
     overflow: hidden;
     transition: max-height 0.3s ease;
   }

   .collapsible.collapsed {
     max-height: 0;
   }
   ```

2. **Combat Log** (Priority: HIGH)
   - Similar implementation to Crew
   - Default state: **EXPANDED**
   - localStorage key: `combatLogCollapsed`
   - Fixed height when expanded: 280px

**Technical Approach:**
- ✅ Use JavaScript `classList.toggle()` (no library needed)
- ✅ Store state in `localStorage` (no cross-tab sync needed)
- ✅ Simple CSS transitions for smooth animation
- ❌ Defer Gunner Actions expand/collapse to Stage 12

**Files to Modify:**
- `public/index.html` - Add collapse buttons and structure
- `public/styles.css` - Add `.collapsible` and `.collapsed` classes
- `public/app.js` - Add event listeners and state management

### 11.3: Tooltips (DEFERRED)
**Decision:** Defer ALL tooltips to Stage 12+

**Rationale:**
- Tooltips not critical for Stage 11 velocity
- Can add incrementally:
  - Stage 12: Simple CSS tooltips
  - Stage 13+: Tippy.js for rich tooltips

### 11.4: Editable Ship Names (Optional for Stage 11)
**Goal:** Allow anyone (Player, GM, Observer) to edit ship names

**Implementation:**
```html
<!-- Replace static text -->
<input type="text" id="scoutName" value="Scout" class="ship-name-input" />
```

```javascript
// Socket event to update ship name
document.getElementById('scoutName').addEventListener('blur', (e) => {
  const newName = e.target.value.trim();
  socket.emit('ship:updateName', { ship: 'scout', name: newName });
});

// Server broadcasts to all clients
socket.on('ship:nameUpdated', ({ ship, name }) => {
  document.getElementById(`${ship}Name`).value = name;
  // Update any other references
});
```

**Decision:** Can implement in Stage 10 OR Stage 11 (low priority)

---

## Approved Wireframe - Iteration 2

```
TARGET: 1920x1080 viewport, fit under 900px height
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Traveller Combat VTT │ Stage 11 │ Round 3 │ Multiplayer │ Timer: 0:45 ┃ ← 60px
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┌─────────────────────────────────────────────────────────────────────────┐
│ TOP SECTION: Ship Status, Initiative, Combat Log               ~280px H│
├───────────────┬─────────────────────────────────────┬───────────────────┤
│               │                                     │                   │
│ ┌───┐         │     INITIATIVE TRACKER              │  COMBAT LOG    [▼]│
│ │IMG│ Scout   │    (All Ships, 2 Columns)           │  ─────────────────│
│ │64x│ HP: ███ │                                     │  > Crit! M-Drive  │
│ │64 │ 40/40   │  YOUR TEAM    │   ENEMIES           │  > Hit! 6 damage  │
│ └───┘         │  ─────────────┼─────────────        │  > Free T. fires  │
│               │  ► Scout      │   Free Trader       │  > Miss!          │
│ ⚠️ M-Drive    │    (YOU)      │                     │  > Round 3 start  │
│ (damaged)     │               │                     │                   │
│               │  Phase: COMBAT                      │  (280px height,   │
│               │  ┌──────────────────────┐           │   scroll inside)  │
│               │  │ Manoeuvre   │ Move   │           │                   │
│               │  │ ► Combat    │ Fire   │           │                   │
│               │  │ Ship Action │ Repair │           │                   │
│               │  └──────────────────────┘           │                   │
│               │                                     │                   │
└───────────────┴─────────────────────────────────────┴───────────────────┘
     ~300px W            ~700px W                          ~400px W

┌─────────────────────────────────────────────────────────────────────────┐
│ MIDDLE SECTION: Hex Grid + Range/Targeting Info                ~320px H│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│         ⬢  ⬢  ⬢  ⬢  ⬢  ⬢  ⬢  ⬢  ⬢  ⬢                                   │
│       ⬢  ⬢  ⬢  ⬢  ⬢  ⬢  ⬢  ⬢  ⬢  ⬢                                     │
│         ⬢  🚀 ⬢  ⬢  ⬢  ⬢  ⬢  💰 ⬢  ⬢       ┌──────────────────┐       │
│       ⬢  ⬢  ⬢  ⬢  ⬢  ⬢  ⬢  ⬢  ⬢  ⬢         │ Range: CLOSE     │       │
│         ⬢  ⬢  ⬢  ⬢  ⬢  ⬢  ⬢  ⬢  ⬢  ⬢       │ Distance: 5 hexes│       │
│                                             │ Modifier: -2     │       │
│                                             └──────────────────┘       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ [▼ Crew] (Collapsed by default)                                 ~40px H│
├─────────────────────────────────────────────────────────────────────────┤
│ (Collapsed - click to expand)                                          │
└─────────────────────────────────────────────────────────────────────────┘

When expanded (~150px H):
┌─────────────────────────────────────────────────────────────────────────┐
│ [▲ Crew]                                                                │
├─────────────────────────────────────────────────────────────────────────┤
│ Pilot: Lt. Chen (Skill-2)  │  Gunner: Martinez (Skill-1)  │  Engineer   │
└─────────────────────────────────────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL HEIGHT (Crew Collapsed): 60 + 280 + 320 + 40 = 700px ✅
TOTAL HEIGHT (Crew Expanded):   60 + 280 + 320 + 150 = 810px ✅

KEY IMPROVEMENTS:
✅ Single consolidated header (saves ~140px)
✅ Horizontal layout uses full 1920px width
✅ Critical info at top (ship damage, initiative, combat log)
✅ Grid in middle where action happens
✅ Crew at bottom (setup-heavy, collapse after config)
✅ Everything visible without scrolling at 900px height
✅ Expand/collapse saves space when needed
```

---

## Design Decisions (Locked In)

### What We're Doing:
- ✅ Iteration 2 wireframe (crew at bottom)
- ✅ Option B horizontal layout
- ✅ Top bar consolidation
- ✅ Expand/collapse for Crew and Combat Log
- ✅ localStorage state persistence (no cross-tab sync)
- ✅ JavaScript classList.toggle (no library)
- ✅ Defer tooltips to Stage 12+
- ✅ Defer Gunner Actions collapse to Stage 12

### What We're Deferring:
- ❌ Tooltips (Stage 12+: CSS first, then Tippy.js)
- ❌ Gunner Actions expand/collapse (Stage 12)
- ❌ Full keyboard navigation (Stage 13+)
- ❌ Ship images (Stage 14+: part of ship template system)

---

## Responsive Breakpoints

Stage 11 will target three breakpoints:

1. **1920px+ (Primary)** - Full layout, all features
2. **1366px (Compact)** - Slightly reduced spacing
3. **900px (Minimum)** - Graceful degradation, minimal scrolling

**CSS Media Queries:**
```css
/* Primary: 1920px+ */
@media (min-width: 1920px) {
  .top-section { width: 100%; }
  .ship-status { width: 300px; }
  .initiative-tracker { width: 700px; }
  .combat-log { width: 400px; }
}

/* Compact: 1366px-1919px */
@media (min-width: 1366px) and (max-width: 1919px) {
  .ship-status { width: 250px; }
  .initiative-tracker { width: 600px; }
  .combat-log { width: 350px; }
}

/* Minimum: 900px-1365px */
@media (min-width: 900px) and (max-width: 1365px) {
  .ship-status { width: 200px; }
  .initiative-tracker { width: 500px; }
  .combat-log { width: 300px; }
}
```

---

## Testing Plan

### Manual Testing (Stage 11):
1. Test at 1920x1080 (primary target)
2. Test at 1366x768 (compact layout)
3. Test at 1024x900 (minimum acceptable)
4. Verify expand/collapse state persists on refresh
5. Verify no horizontal scrolling at any breakpoint

### Automated Testing (Stage 13):
- Build automated multi-window viewport testing tool
- Open browsers at 1920, 1366, 900px pointing to localhost:3000
- Screenshot comparison tests

---

## Implementation Timeline

### Stage 10 (Current):
- ✅ Wireframe iterations (1-2 iterations)
- ✅ Lock in design
- ✅ Document roadmap
- ✅ NO UI CODE CHANGES

### Stage 11 (Next):
- **Week 1**: Option B layout restructure (~4-5 hours)
  - HTML restructure
  - CSS Flexbox layout
  - Responsive breakpoints

- **Week 2**: Expand/collapse functionality (~2-3 hours)
  - Crew section
  - Combat Log section
  - localStorage persistence

- **Optional**: Editable ship names (~1-2 hours)
  - Input fields
  - Socket events
  - Broadcast updates

**Total Effort:** 6-8 hours for Stage 11 UI work

---

## Related Documents

- **Wireframe**: This document (Iteration 2 approved)
- **UI Redesign Plan**: `.claude/handoff/ui-redesign-plan.md` (comprehensive planning)
- **Stage 11 Plan**: `.claude/STAGE-11-PLAN.md` (missiles + UI implementation)
- **Technical Debt**: `.claude/TECHNICAL-DEBT.md` (refactoring strategy)

---

**Status:** ✅ Planning Complete
**Next Action:** Begin Stage 10 (Critical Hits) with NO UI changes
**UI Implementation:** Deferred to Stage 11 as planned

**Last Updated:** 2025-11-09
