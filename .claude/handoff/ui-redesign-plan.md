# UI Redesign Plan - Stage 10+ (Future)

**Status**: Planning Complete - Ready for Wireframe & Implementation
**Screenshot Reference**: `exclude_from_git/Screenshot from 2025-11-08 19-22-00.png`
**Current State**: Zoomed to 50% to see entire UI, significant wasted space
**Last Updated**: 2025-11-08 (Answers Incorporated)

---

## USER DECISIONS SUMMARY

All questions have been answered. Key decisions:
- **Target Resolution**: 1920x1080+, try to fit under 900px height
- **Layout**: Start with Option B (horizontal), keep flexible for future switch to C (dashboard)
- **Phases**: Use official Traveller SRD phases (Manoeuvre, Combat, Ship Action)
- **Initiative Display**: All ships visible, two columns (Player Team vs All Others)
- **Phase Info**: Always show brief action list for each phase
- **Ship Damage Icons**: Show only when damaged, full status on mouseover
- **Crew Section**: Collapsed by default, expanded if player has crew role
- **Gunner Actions**: Manual expand/collapse, expanded if player is gunner, per-turret controls
- **Combat Log**: Latest on top (reverse chronological), expanded by default, 200-300px fixed height
- **Turn Timer**: Top right, very clear, near initiative/phase indicator
- **Keyboard Nav**: Defer to later stage (mouse-only for now)
- **Ship Classes**: Full Traveller ship type system (not just Military/Civilian)
- **Tooltips**: Research complete - will choose between CSS/Tippy.js based on complexity
- **Testing**: Build automated multi-window viewport testing tool

---

## Core Requirements

1. **Screen Real Estate Optimization** - Design for desktop browser aspect ratio (not mobile)
2. **No Scrolling** - Entire UI visible on standard screens without scrolling (graceful degradation if needed)
3. **Space-Saving** - Hide/collapse non-essential components
4. **Prominence** - Initiative tracker and turn order highly visible
5. **Visual Feedback** - Ship images, mouseover help, intuitive phase display

---

## Specific Issues to Address

### Current Problems:
- Double titles (top green box + "Traveller Space Combat" heading) waste ~200px vertical
- Narrow centered column (~500px) with huge purple margins
- Combat Log requires scrolling
- Turn Timer at bottom, not prominent
- Crew section always expanded (only needed at start)
- Gunner Actions visible even when not relevant
- No ship images
- No helpful tooltips/mouseovers
- Initiative/Phase display not intuitive

---

## ANSWERS TO DESIGN QUESTIONS

### 1. Screen Real Estate & Aspect Ratio ✓

**A1**: Target resolution: **1920x1080 minimum**
**A2**: Minimum viewport height: **Try to fit under 900px** (but optimized for 1080px)
**A-Concern 1**: **Move status info into compact top bar** - single consolidated header
**A-Concern 4**: **Accept collapsed default** for Crew and Gunner Actions to fit in viewport

### 2. Initiative & Phase Display ✓

**A3**: Initiative tracker shows:
- ✓ Current actor's ship name AND portrait
- ✓ ENTIRE turn order for ALL ships (full queue visible)
- ✓ Current phase with brief action summary
- ✓ Two columns: Player Team (left) vs All Others (right)

**A4**: Phase display format:
- **Vertical list** with current phase highlighted/color-coded
- Always shows brief action list for each phase (teaching tool)
- Full phase details on mouseover

**Official Traveller SRD Phases**:
1. **Manoeuvre Phase** - Allocate thrust, move ships, dodge
2. **Combat Phase** - Fire weapons, boarding actions, reactions
3. **Ship Action Phase** - Repairs, sensors, electronic warfare, crew repositioning

**NOTE**: "Corsair" is wrong term (relic from Stage 1) - need better naming

### 3. Ship Component Compression ✓

**A5**: Ship display specs:
- Ship image: **64x64 pixels**
- Ship name + HP bar (hull points)
- **System damage icons appear ONLY when damaged** (M-Drive, J-Drive, PP, Turrets, Computer, etc.)
- Icon for each damaged system with mouseover to identify

**A6**: Mouseover tooltip shows **VERY DETAILED** stats:
- ✓ Hull, Armor, Weapons
- ✓ M-Drive, J-Drive, Power Plant status
- ✓ Turrets (each turret with weapons and gunner skill)
- ✓ Computer, Damage Control rating
- ✓ Full crew assignments (pilot skill, captain skill, etc.)
- ✓ Damage history
- **Note**: Hull Damage is NOT usually the most important damage type!

### 4. Crew Component - Expand/Collapse ✓

**A7**: Default state: **Collapsed**
- Expanded if player has crew role assigned
- Manual expand/collapse control
- Critical for player ships, rarely used for GM-controlled ships
- Future: Injured crew highlighted even when collapsed

**Ship Template Enhancement Required**:
- Add **Military/Civilian flag** AND **Full Traveller ship type classification**
- Default crew skills in template:
  - All ships: Pilot-1, Gunner-1 (base)
  - Bigger ships: +1 pilot
  - Military ships: +1 pilot, Captain with Strategy skill, Damage Control-1
  - Civilian ships: No captain/strategy, Damage Control-0
- Allows standard crew that can be overridden

### 5. Gunner Actions - Role-Based Visibility ✓

**A8**: Manual **expand/collapse** control
- **Collapsed by default** (saves screen space)
- **Expanded if player is gunner** role
- **Per-turret controls** (ship with 6 turrets = 6 of these components)
  - Player controls 1-2 turrets, captain controls rest
  - Captain gets "EXPAND/COLLAPSE ALL" option for micromanagement
- Grayed out if player is neither gunner nor captain
- Defer full role system to later stage

**Concern 3**: Just expand/collapse for now, enhanced role integration later

### 6. Turn Timer Prominence ✓

**A9**: Turn Timer placement: **Top right**
- Very clear and always visible
- Near or part of initiative/phase indicator
- Countdown timer (reminder not to dither)
- **Don't change color** - just informational, not critical
- **Configurable option to hide per-combat** (like chess timer - optional)

### 7. Combat Log Visibility ✓

**A10**: Combat Log redesign:
- **Fixed height: 200-300px** with internal scroll
- **Expand/collapse option** - **expanded by default**
- Visible on screen (likely bottom), given enough space for several events
- **Latest entries on TOP** (reverse chronological scroll order)
- Older entries scroll down and away

**A11**: Log entry behavior:
- ✓ **Auto-scroll to latest** - latest always at TOP and most visible
- ✓ Highlight important events
- ✓ Color coding by event type
- **Concern**: Events may flash by too fast to read
- **Future**: May need role-based event filtering (gunner sees gunnery events, etc.)

---

## SELECTED LAYOUT APPROACH

**Decision**: Start with **Option B** (Horizontal Layout) - easier to implement
**Future**: Keep flexible to switch to **Option C** (Dashboard) in later stage
**Key**: Don't get locked in, design should support layout changes without major rewrite

---

## Layout Options (For Reference)

### Option A - Two Column Layout:
```
┌─────────────────────────────────────────────┐
│ Top Bar: Title | Ship | Initiative | Timer │
├──────────────────┬──────────────────────────┤
│                  │                          │
│  Ship Status     │   Combat Log             │
│  (compact)       │   (fixed height,         │
│                  │    scrollable)           │
│  Initiative      │                          │
│  Tracker         │                          │
│  (prominent)     │                          │
│                  │                          │
│  Crew ▼          ├──────────────────────────┤
│  (collapsed)     │                          │
│                  │   Gunner Actions         │
│  Movement/Grid?  │   (when relevant)        │
│  (later stage)   │                          │
│                  │                          │
└──────────────────┴──────────────────────────┘
```

**Pros**:
- Combat log always visible
- Clear separation of info vs actions
- Easy to scan vertically

**Cons**:
- May feel cramped on narrower screens
- Log competes for horizontal space

---

### Option B - Horizontal Layout:
```
┌─────────────────────────────────────────────┐
│ Top: Title | Ship+HP | Initiative | Timer   │
├─────────────────────────────────────────────┤
│ ┌────┐ ┌──────────────┐ ┌─────────────────┐│
│ │Ship│ │ Init Tracker │ │  Gunner Actions ││
│ │Img │ │ (prominent)  │ │  (collapsible)  ││
│ └────┘ └──────────────┘ └─────────────────┘│
├─────────────────────────────────────────────┤
│ Crew ▼ (collapsed)                          │
├─────────────────────────────────────────────┤
│ Combat Log (fixed height, auto-scroll)      │
└─────────────────────────────────────────────┘
```

**Pros**:
- Uses full width effectively
- Initiative very prominent in center
- Logical flow top-to-bottom

**Cons**:
- Log at bottom (less prominent?)
- More horizontal eye movement

---

### Option C - Dashboard Style (New Suggestion):
```
┌───────────────────────────────────────────────────────┐
│ Traveller Combat VTT | Round 3 | Your Turn | ⏱️ 0:45  │
├──────┬────────────────────────────┬───────────────────┤
│ SHIP │    INITIATIVE & PHASE      │   COMBAT LOG ▼    │
├──────┤   ┌────────────────────┐   ├───────────────────┤
│ [IMG]│   │    🎯 YOUR TURN    │   │ > Hit! 6 damage   │
│ Scout│   │                    │   │ > Corsair fires   │
│ HP:4 │   │ Phase: FIRING      │   │ > Miss!           │
│ ━━━━ │   │                    │   │ > Round 3 start   │
│      │   │ Next: Corsair      │   │   ...             │
│      │   └────────────────────┘   │   (scroll)        │
├──────┴────────────────────────────┤                   │
│ ▶ Crew (collapsed)                │                   │
├───────────────────────────────────┤                   │
│ GUNNER ACTIONS                    │                   │
│ [Target: Opponent ▼] [Weapon ▼]  │                   │
│         [🔥 FIRE!]                │                   │
└───────────────────────────────────┴───────────────────┘
```

**Pros**:
- Ship image prominent top-left
- Initiative center-stage
- Log persistently visible on right
- Compact horizontal use
- All key info in single eyeline

**Cons**:
- More complex to implement
- May need careful sizing for different resolutions

---

## COMPONENT SPECIFICATIONS (Final)

### Top Bar (Consolidated Header)
- **Remove**: Double headers (save ~200px vertical)
- **Include**:
  - Game title (smaller, left)
  - Current round info
  - Current ship/player
  - **Turn timer (top right, prominent)** ⏱️
  - Stage/mode info (compact)

### Ship Status Component
- **Ship Image**: **64x64 pixels** (PNG with transparency)
- **Ship Name**: Bold, clear
- **HP Bar**: Hull points visual with numbers (e.g., 87/20)
- **Damage Icons**: Show **ONLY when system damaged** (conditional rendering)
  - Icons for: M-Drive, J-Drive, Power Plant, Turrets, Computer, Sensors, Fuel
  - Small icons next to HP bar, mouseover identifies which system
- **Hover Tooltip**: **VERY DETAILED** full stats popup
  - Hull, Armor, Movement (M-Drive rating)
  - Pilot Skill, Captain Skill (if present)
  - Power Plant, J-Drive, Computer ratings
  - **Each turret** showing weapons and gunner skill
  - **Full crew assignments**
  - **Damage history** (recent hits)
  - **Note**: This is VERY DETAILED because it's a tooltip (won't take screen space)

### Initiative Tracker (PROMINENT - CRITICAL UI ELEMENT)
- **Display ALL Ships**: Full turn order queue always visible
- **Two Column Layout**:
  - **Left column**: Player Team ships
  - **Right column**: All Other ships (enemies/neutrals)
- **Current Actor**: Highlighted/color-coded
- **Each Ship Entry Shows**:
  - Ship portrait/icon (small)
  - Ship name
  - Current phase indicator
- **Purpose**: Teaching tool - shows sequence, teaches phases via repetition
- **Hover Tooltip**: Explain initiative system
- **Design Inspiration**: Crib from other turn-based combat games with multi-phase turns

### Phase Display (Part of Initiative Tracker)
- **Format**: Vertical list with current phase highlighted/color-coded
- **Always Show**: Brief action summary for each phase (teaching tool)
  - **Manoeuvre**: "Move, Dodge, Allocate Thrust"
  - **Combat**: "Fire Weapons, Boarding, Reactions"
  - **Ship Action**: "Repairs, Sensors, Crew Moves"
- **Mouseover**: Detailed tooltip paraphrasing Traveller rules (no copyright violation)
- **Icons**: Nice to have but NOT required (text is fine)
- **Key**: Should TEACH phases through repetition - looking at this teaches you the game

### Crew Component
- **Default State**: **Collapsed** (just "Crew ▼" header)
- **Auto-Expand**: If player has crew role assigned
- **Manual Control**: Expand/collapse toggle
- **Expanded View**: Current full crew roster
- **Importance**: SUPER CRITICAL on player ships, rarely used on GM ships
- **Future**: Highlight injured crew even when collapsed

**Ship Template Requirements** (affects Crew defaults):
- Add **isMilitary**: boolean flag
- Add **shipClass**: Full Traveller classification (Scout, Trader, Corvette, Patrol Ship, etc.)
- **Default Crew Skills in Template**:
  - All ships: Pilot-1, Gunner-1 per turret (baseline)
  - Bigger ships: Pilot +1
  - Military ships: Pilot +1, Captain with Strategy-1+, Damage Control-1
  - Civilian ships: No Captain/Strategy, Damage Control-0
- Allow override but start with sensible defaults

### Gunner Actions Component
- **Default State**: **Collapsed** (saves screen space)
- **Auto-Expand**: If player role is gunner
- **Manual Control**: Expand/collapse per turret
- **Multiple Instances**: **One component per turret**
  - Ship with 6 turrets = 6 Gunner Action components
  - Player controls 1-2, captain controls rest
  - Captain gets **"EXPAND/COLLAPSE ALL"** option
- **Visual State**: Grayed out if player is neither gunner nor captain (view-only)
- **Shows**: Gunner skill discretely but clearly, target selection, weapon selection, fire button
- **Future**: Full crew role system integration (later stage)

### Combat Log
- **Placement**: Bottom of screen, visible
- **Height**: **200-300px fixed** with internal scroll
- **Scroll Direction**: **Latest on TOP** (reverse chronological)
  - New events appear at top
  - Older events scroll down and away
  - Auto-scroll to keep latest at top (most visible)
- **Default State**: **Expanded**
- **Control**: Expand/collapse toggle
- **Highlighting**: Color coding by event type
  - Hits (damage dealt)
  - Misses
  - Damage taken
  - Critical events
- **Concern**: Events may flash too fast - monitor in testing
- **Future**: Role-based filtering (gunner sees gunnery logs, etc.)

### Turn Timer
- **Placement**: **Top right**, very clear and always visible
- **Integration**: Next to or part of initiative/phase indicator
- **Purpose**: Reminder not to dither (like chess clock)
- **Visual**: Simple countdown, **no color changes**
- **Optional**: **Configurable per-combat** (can hide if not wanted)
  - Some combats won't use timer
  - Others will depend on it
  - GM decides per-encounter

---

## IMPLEMENTATION PRIORITIES (Confirmed)

### 1. Phase 1 - Layout Restructure ✓
- Consolidate double headers into **single top bar**
- Implement **Option B layout** (horizontal, full-width)
- Keep flexible for future switch to Option C
- Target: 1920x1080, fit under 900px height if possible

### 2. Phase 2 - Expand/Collapse Controls ✓
- Add to **Crew component** (collapsed default, expand if player has crew role)
- Add to **Gunner Actions** (collapsed default, expand if player is gunner)
  - Per-turret controls
  - Captain gets "expand/collapse all"
- Add to **Combat Log** (expanded default)
- **Save state to localStorage** (client-side, no network travel)

### 3. Phase 3 - Ship Images → DEFER TO LATER STAGE
- **Push to later stage** (not critical for initial UI)
- Ship images are part of Ship Templates
- Will add standard ships from Ship Rules PDF
- Design system to create custom ships
- Import/export system based on JSON
- Format: **PNG with transparency, 64x64 pixels**
- Fallback: **Colored SVG shapes** if no images available

### 4. Phase 4 - Tooltips/Mouseovers ✓ IMPORTANT
- **Fairly important and not too hard**
- Implement comprehensive tooltips:
  - Ship stats (very detailed)
  - Initiative explanation
  - Phase explanations (paraphrase rules, teach system)
  - Damage system mouseovers
- **Decision needed**: CSS vs Tippy.js vs Popper.js (research completed, see below)
- **Future**: Full keyboard navigation system with shortcuts shown in tooltips
  - Initially: mouse-only (defer keyboard nav to later stage)
  - Eventually: entire game playable with keyboard only

### 5. Phase 5 - Initiative/Phase Enhancement ✓ CRITICAL
- **Prominent central display** (most important UI element)
- Two-column vertical layout (Player Team | All Others)
- Show **ALL ships** in turn order
- Current ship highlighted/color-coded
- **Always show brief action list** per phase (teaching tool)
- Phase tooltips with detailed explanations
- Ship portraits in initiative queue

### 6. Phase 6 - Combat Log Enhancement ✓
- Fixed height: **200-300px** with internal scroll
- **Latest on top** (reverse chronological)
- Auto-scroll to keep latest visible
- Event highlighting and color coding
- Expand/collapse control (expanded by default)
- Sufficient space to see several log events

### 7. Phase 7 - Responsive Testing ✓
- Test at **three breakpoints**:
  - 1920px+ (primary, full layout)
  - 1366px (compact layout)
  - ~900px (graceful degradation)
- **Build automated multi-window viewport testing tool**
  - Script opens browser windows at designated sizes
  - Points to localhost:3000
  - Reusable for ongoing testing
- Manual testing with Puppeteer (integration tests)
- Ensure no scrolling at target resolutions

---

## TECHNICAL CONSIDERATIONS (Decisions)

### CSS Framework ✓
- **Current**: Custom CSS (continue with this)
- **Layout System**: **CSS Flexbox** (good option for responsive layouts)
  - Flexbox is standard, well-supported, flexible
  - CSS Grid is alternative but Flexbox sufficient for this layout
  - Use Flexbox for component internals and main layout
- **Decision**: Custom CSS + Flexbox (no heavy framework needed)

### Collapse/Expand Mechanism ✓
- **Approach**: **CSS + JavaScript toggle** (best option)
- **State Management**: **Store in localStorage** (no network travel)
- **Implementation**:
  - JavaScript controls visibility (add/remove CSS classes)
  - localStorage persists user preferences per component
  - Each component state tracked independently
  - Crew: collapsed/expanded
  - Gunner Actions: per-turret collapsed/expanded states
  - Combat Log: collapsed/expanded

### Ship Images ✓
- **Format**: **PNG with transparency, 64x64 pixels**
- **Source**: User will have AI generate from available pics
- **Fallback**: **Colored SVG shapes** when no image available
  - SVG allows scaling without quality loss
  - Can generate procedural ship shapes
- **Future Stage**: Full ship template system with images
- **Deferred**: Not critical for initial UI redesign

### Tooltips ✓ (RESEARCH COMPLETE)

**Three Options Analyzed**:

#### Option 1: Pure CSS Tooltips
**Pros**:
- Lightweight, no JavaScript required
- Very small file size
- No additional dependencies
- Works in all modern browsers
- Simple implementation with `aria-label` for accessibility

**Cons**:
- No positioning engine (can't flip to fit viewport)
- Will overflow near window edges
- No lifecycle functions/API
- Difficult to use HTML content (especially in dynamic apps)
- Limited for complex tooltips with rich formatting

#### Option 2: Popper.js
**Pros**:
- Lightweight: only 2KB minzipped
- Position updates < 1ms (very fast)
- Excellent positioning engine (prevents clipping/overflow)
- Used by Bootstrap, Foundation, Material UI (proven)
- Full control over appearance and behavior
- Allows tooltips relative to reference element

**Cons**:
- Just a positioning engine, NOT a tooltip library
- Must build appearance/behavior from scratch
- More work to implement
- No out-of-the-box features

#### Option 3: Tippy.js (Built on Popper.js)
**Pros**:
- Easy-to-use, feature-rich, highly customizable
- Powered by Popper.js (inherits positioning benefits)
- Out-of-the-box animations, themes, accessibility
- Lightweight: ~15KB with CSS + Popper.js dependency
- Supports interactive tooltips, rich HTML content
- Great for dynamic applications
- Simple API, accessible to all skill levels

**Cons**:
- Larger than pure CSS (~15KB vs ~0KB)
- Requires JavaScript (unlike CSS-only)
- May have more features than needed (some overhead)

**RECOMMENDATION**:
- **Start with CSS tooltips** for simple, static tooltips (e.g., phase explanations)
- **Use Tippy.js** for complex tooltips with rich content (e.g., ship stats with HTML formatting)
- **Hybrid approach**: Best of both worlds
  - Simple text tooltips: CSS
  - Complex tooltips with stats, damage history, crew: Tippy.js
- **Future**: Full keyboard navigation will work with both (CSS supports `:focus`, Tippy.js has keyboard support)

### Responsive Breakpoints ✓
- **1920px+**: Full layout, primary target
- **1366px**: Compact layout
- **900px**: Graceful degradation
- **Testing**: Automated multi-window tool (see Implementation Priorities #7)

---

## NEXT STEPS (Ready for Wireframing)

### ✓ COMPLETED:
1. ✓ **Get Answers**: All user questions answered
2. ✓ **Choose Layout**: Option B selected (keep flexible for C)
3. ✓ **Research**: Tooltip libraries analyzed
4. ✓ **Research**: Traveller SRD phases confirmed

### → NEXT ACTIONS:
5. **Create Wireframes**: Design visual mockup for Option B layout
   - Show component placement and sizing
   - Include Option C variant for comparison
   - Demonstrate responsive behavior at 1920, 1366, 900px
   - Add visible toggle/button to show wireframes without code changes

6. **Prototype**: Build HTML/CSS prototype
   - Implement Option B layout structure
   - Add expand/collapse mechanisms
   - Integrate Flexbox responsive layout
   - Test collapse/expand state persistence

7. **Implement Tooltips**: Add tooltip system
   - CSS tooltips for simple text
   - Tippy.js for complex ship stats
   - Phase explanation tooltips
   - Keyboard accessibility hooks (for future nav system)

8. **Iterate**: Test and refine prototype
   - Test at multiple resolutions
   - Validate expand/collapse behavior
   - Ensure no scrolling at target resolutions
   - Performance testing

9. **Full Implementation**: Integrate into main application
   - Update public/index.html
   - Update public/styles.css
   - Add app.js enhancements
   - Server-side changes if needed (unlikely)

10. **Testing & Validation**:
    - Build automated viewport testing tool
    - Run Puppeteer integration tests
    - Recruit Discord testers for feedback
    - Iterate based on user testing

---

## TERMINOLOGY CLEANUP NEEDED

**Issues Identified**:
- "Corsair" is wrong term (relic from Stage 1) - need better enemy ship naming
- "Scout" may be wrong word for ship components - clarify or rename

---

## Related Files

- Current UI: `public/index.html`
- Current CSS: `public/styles.css`
- Current JS: `public/app.js`
- Screenshot: `exclude_from_git/Screenshot from 2025-11-08 19-22-00.png`
- Combat Logic: `lib/combat.js`
- Server: `server.js`

---

## SUMMARY

Planning is **COMPLETE**. All design questions answered, technical research finished. Ready to proceed with:
1. Detailed wireframe creation
2. HTML/CSS prototype development
3. Full implementation when approved

**Key Design Pillars**:
- Horizontal Layout (Option B) with flexibility
- Collapsed components by default (space optimization)
- Initiative/Phase tracker as teaching tool (CRITICAL component)
- Tooltips everywhere (CSS + Tippy.js hybrid)
- Target: 1920x1080+, fit under 900px height
- No scrolling at target resolutions

---

**Last Updated**: 2025-11-08 (Planning Complete)
**Session**: UI Redesign Planning - All Questions Answered
**Stage**: Future (10+)
**Status**: ✓ Ready for Implementation
