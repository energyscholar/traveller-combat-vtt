# Stage 9 Test Plan: Movement & Advanced Initiative

**Test Date:** 2025-11-08
**Server:** http://localhost:3000
**Testers:** Open TWO browser tabs

---

## Pre-Test Setup

1. Ensure server is running: `npm start`
2. Open Tab 1: http://localhost:3000
3. Open Tab 2: http://localhost:3000
4. Open browser console (F12) in both tabs to check for errors

---

## Test 1: Ship Selection & Auto-Assignment

### Expected Behavior:
- **Tab 1:** Auto-assigned **Scout** with **GREEN highlight**
- **Tab 2:** Auto-assigned **Free Trader (corsair)** with **GREEN highlight**
- Both tabs show **"AUTO-ASSIGNED: [Ship Name]"** in green text at top
- Range defaults to **"Medium"** in both tabs
- Ready button is **ENABLED** in both tabs

### Test Steps:
1. Load Tab 1 → Check for Scout green highlight
2. Load Tab 2 → Check for Free Trader green highlight
3. Verify range dropdown shows "Medium"
4. Verify Ready button is enabled (not grayed out)

### Results:
- [ ] Tab 1: Scout auto-assigned correctly
- [ ] Tab 2: Free Trader auto-assigned correctly
- [ ] Green highlights visible on both
- [ ] "AUTO-ASSIGNED" text shows in green
- [ ] Range defaults to Medium
- [ ] Ready buttons enabled
- [ ] No console errors

---

## Test 2: Manual Ship Selection Change (Optional)

### Expected Behavior:
- Clicking on different ship moves green highlight
- Auto-assignment text updates
- Server receives ship change

### Test Steps:
1. **Tab 1:** Click on Free Trader card
2. Verify green highlight moves from Scout to Free Trader
3. Verify text updates to "Selected: Free Trader"
4. **Tab 2:** Should still be on Free Trader (no conflict)

### Results:
- [ ] Green highlight moves when clicking different ship
- [ ] Text updates correctly
- [ ] Can change selection back and forth
- [ ] No console errors

---

## Test 3: Range Selection

### Expected Behavior:
- Range dropdown works
- Selection is remembered
- Both players can set different ranges

### Test Steps:
1. **Tab 1:** Change range to "Long"
2. Verify dropdown shows "Long"
3. **Tab 2:** Keep range at "Medium"
4. Proceed to next test

### Results:
- [ ] Range dropdown is functional
- [ ] Selection changes are visible
- [ ] No console errors

---

## Test 4: Ready System

### Expected Behavior:
- Clicking Ready in Tab 1 → Button turns green "✓ Ready"
- Tab 2 sees **"Opponent: Ready (scout)"** indicator turn green
- Clicking Ready in Tab 2 → Combat starts immediately
- Ship selection screen disappears
- Space Combat HUD appears

### Test Steps:
1. **Tab 1:** Click "Ready" button
2. Verify button changes to green "✓ Ready"
3. Verify button is disabled (can't click again)
4. **Tab 2:** Check for opponent ready indicator
5. **Tab 2:** Click "Ready" button
6. Verify both tabs transition to combat screen

### Results:
- [ ] Tab 1 Ready button works
- [ ] Tab 1 button turns green
- [ ] Tab 2 sees opponent ready notification
- [ ] Tab 2 Ready button works
- [ ] Combat screen appears in BOTH tabs
- [ ] Ship selection screen disappears
- [ ] No console errors

---

## Test 5: Combat Initialization

### Expected Behavior:
- Space Combat HUD visible
- Correct ship displayed (Scout vs Free Trader)
- Starting range matches last selection
- Combat log shows "Combat started at [Range] range"
- Round counter shows "Round 1"
- Hull bars show full health
- Initiative has been rolled

### Test Steps:
1. Verify HUD is visible in both tabs
2. Check ship names at top
3. Check range display
4. Read combat log entries
5. Check hull bars (should be 100%)

### Results:
- [ ] HUD visible in both tabs
- [ ] Correct ships displayed
- [ ] Correct range displayed
- [ ] Combat log has startup messages
- [ ] Round 1 displayed
- [ ] Hull bars at 100%
- [ ] No console errors

---

## Test 6: Initiative & Turn Order

### Expected Behavior:
- Initiative rolled: 2d6 + pilot skill
- Scout: 2d6 + 2 (pilot skill)
- Free Trader: 2d6 + 1 (pilot skill)
- Higher total goes first
- Active player sees **"Your turn"**
- Inactive player sees **"Opponent's turn..."**
- Turn timer starts at 30 seconds

### Test Steps:
1. Check combat log for initiative rolls
2. Identify which player goes first
3. Verify active player sees "Your turn"
4. Verify inactive player sees "Opponent's turn"
5. Check turn timer is counting down

### Results:
- [ ] Initiative rolls visible in combat log
- [ ] Correct player goes first
- [ ] Turn indicators correct
- [ ] Turn timer counting down
- [ ] Fire button enabled for active player
- [ ] Fire button disabled for inactive player
- [ ] No console errors

---

## Test 7: Combat Actions - Fire Weapon

### Expected Behavior:
- Active player can select turret, target, weapon
- "Use Default" button auto-selects and fires
- "FIRE!" button works
- Attack roll calculated (2d6 + gunner skill + range DM)
- Damage applied if hit
- Hull bars update
- Combat log shows detailed results
- Turn timer resets after action

### Test Steps:
1. **Active Player:** Click "Use Default" button OR manually select and click "FIRE!"
2. Check combat log for attack results
3. Verify damage calculation
4. Check opponent's hull bar
5. Verify both players see the same combat log

### Results:
- [ ] Use Default button works
- [ ] FIRE! button works
- [ ] Attack roll shown in combat log
- [ ] Hit/Miss displayed correctly
- [ ] Damage calculated correctly
- [ ] Hull bars update in both tabs
- [ ] Combat log synchronized
- [ ] No console errors

---

## Test 8: Turn Management

### Expected Behavior:
- "End Turn" button works
- Turn passes to other player
- Turn indicators swap
- Turn timer resets to 30 seconds
- Fire button enables/disables appropriately

### Test Steps:
1. **Active Player:** Click "End Turn"
2. Verify turn indicator changes
3. **Other Player:** Verify "Your turn" appears
4. Verify Fire button is now enabled
5. Take another combat action
6. End turn again

### Results:
- [ ] End Turn button works
- [ ] Turn passes correctly
- [ ] Indicators update in both tabs
- [ ] Timer resets
- [ ] Fire button states correct
- [ ] Can take turns back and forth
- [ ] No console errors

---

## Test 9: Multiple Rounds

### Expected Behavior:
- After both players end turn → Round 2 begins
- New initiative is rolled
- Round counter increments
- Combat continues

### Test Steps:
1. Complete a full round (both players take turns)
2. Verify Round 2 begins
3. Check for new initiative rolls
4. Verify combat continues smoothly

### Results:
- [ ] Round advances correctly
- [ ] New initiative rolled each round
- [ ] Round counter updates
- [ ] Combat log shows round transitions
- [ ] No console errors

---

## Test 10: Combat End Condition

### Expected Behavior:
- When ship reaches 0 hull → Combat ends
- Winner announced
- Defeated message shown
- Combat log shows final results

### Test Steps:
1. Fire repeatedly until one ship reaches 0 hull
2. Verify combat ends
3. Check victory/defeat messages
4. Review combat log

### Results:
- [ ] Combat ends at 0 hull
- [ ] Winner sees victory message
- [ ] Loser sees defeat message
- [ ] Final statistics shown
- [ ] No console errors

---

## Test 11: Auto-Turn Timer

### Expected Behavior:
- If player doesn't act in 30 seconds
- "Use Default" fires automatically
- Turn auto-ends
- Combat continues

### Test Steps:
1. Start a turn
2. Wait 30 seconds without taking action
3. Verify auto-fire happens
4. Verify turn passes automatically

### Results:
- [ ] Timer reaches 0
- [ ] Auto-fire triggers
- [ ] Turn passes automatically
- [ ] Combat log shows auto-action
- [ ] No console errors

---

## Test 12: Disconnection Handling

### Expected Behavior:
- If one player closes tab/disconnects
- Other player notified
- Game state preserved or reset appropriately

### Test Steps:
1. Close Tab 2
2. Check Tab 1 for disconnect notification
3. Reopen Tab 2
4. Verify reconnection works

### Results:
- [ ] Disconnect detected
- [ ] Notification shown
- [ ] Reconnection works
- [ ] No console errors

---

## Critical Issues Found

**List any blocking issues here:**

1.
2.
3.

---

## Non-Critical Issues Found

**List minor issues here:**

1.
2.
3.

---

## Overall Assessment

- [ ] All critical features working
- [ ] No blocking bugs
- [ ] Stage 9 ready for completion

**Tester Notes:**

(Add any additional observations here)

---

## Next Steps After Testing

1. Fix any critical issues found
2. Implement Winston logging system
3. Clean up debug messages
4. Document Stage 9 completion
5. Update README with Stage 9 features
