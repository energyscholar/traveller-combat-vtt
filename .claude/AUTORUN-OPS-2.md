# AUTORUN-OPS-2: Bridge Polish + Sensor System

**Created:** 2025-11-30
**Scope:** Stage 3 (Bridge Polish) + Stage 4 (Sensor/Contacts)
**Estimated Time:** 3-5 hours autonomous work
**Risk Level:** LOW-MEDIUM

---

## Phase 0: Permission Warmup (REQUIRED - User Present)

Before going AFK, execute each of these to grant permissions:

```bash
# 1. File operations - lib directory
touch lib/operations/contacts.js && rm lib/operations/contacts.js

# 2. File operations - public directory
touch public/operations/test.js && rm public/operations/test.js

# 3. Edit server.js
head -1 server.js

# 4. Edit operations handlers
head -1 lib/socket-handlers/operations.handlers.js

# 5. Edit HTML/CSS/JS
head -1 public/operations/index.html
head -1 public/operations/styles.css
head -1 public/operations/app.js

# 6. Database operations (read schema)
sqlite3 data/campaigns/operations.db ".schema" | head -5

# 7. Run tests
npm test

# 8. Git operations
git status && git checkout -b test-perm && git checkout main && git branch -d test-perm

# 9. Create test file
touch tests/contacts.test.js && rm tests/contacts.test.js

# 10. Read data files
ls data/campaigns/
```

**User confirms all 10 operations succeeded, then says "GO" to start autorun.**

---

## Stage 3: Bridge Polish (1-2 hours)

### Task 3.1: Role Detail Panels (30 min)
- Pilot panel: thrust available, current vector, maneuver options
- Engineer panel: power allocation, system status summary
- Gunner panel: weapons list, ammo counts, target lock status
- Captain panel: crew status overview, comms actions

### Task 3.2: Time System UI (20 min)
- Add time advance buttons: +10min, +1h, +4h, +1day
- Custom time input modal
- Wire to existing `ops:advanceTime` handler

### Task 3.3: Guest Login Completion (20 min)
- Add "Join as Guest" button to player setup
- Guest name input field
- Wire to existing `ops:joinAsGuest` handler
- Show guest indicator on bridge

### Task 3.4: Multiple Identical Roles (20 min)
- Detect ships with 2+ of same role from template
- Show "Gunner 1", "Gunner 2" in role selection
- Track role instance in player account

**Commit:** "feat: Stage 3 - Bridge view polish (roles, time, guest)"

---

## Stage 4: Sensor & Contact System (2-3 hours)

### Task 4.1: Contact Data Model (30 min)
Add to `lib/operations/database.js`:
```sql
CREATE TABLE contacts (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  name TEXT,
  type TEXT DEFAULT 'unknown',
  bearing INTEGER DEFAULT 0,
  range_km INTEGER DEFAULT 0,
  range_band TEXT,
  transponder TEXT,
  signature TEXT DEFAULT 'normal',
  visible_to TEXT DEFAULT 'all',
  gm_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);
```

### Task 4.2: Contact CRUD Functions (30 min)
Create `lib/operations/contacts.js`:
- `addContact(campaignId, contactData)`
- `getContact(id)`
- `getContactsByCampaign(campaignId)`
- `updateContact(id, updates)`
- `deleteContact(id)`
- `getVisibleContacts(campaignId, shipId, sensorSkill)`

### Task 4.3: Contact Socket Handlers (30 min)
Add to `operations.handlers.js`:
- `ops:addContact` (GM only)
- `ops:updateContact` (GM only)
- `ops:deleteContact` (GM only)
- `ops:getContacts` (returns visible contacts)
- `ops:sensorScan` (active scan, skill check)

### Task 4.4: GM Contact UI (30 min)
- Add contact modal: name, type, bearing, range, transponder
- Contact list in GM overlay with edit/delete
- Quick-add buttons for common types (ship, station, debris)

### Task 4.5: Sensor Display Rendering (30 min)
- Update `renderContacts()` with real data
- Contact icons by type
- Range band colors (green=far, yellow=medium, red=close)
- Click contact for details

### Task 4.6: Tests (20 min)
Create `tests/contacts.test.js`:
- Contact CRUD operations
- Visibility filtering
- Range band calculation

**Commit:** "feat: Stage 4 - Sensor and contact system"

---

## Final Verification

### Checklist
- [ ] All role panels render content
- [ ] Time advance buttons work
- [ ] Guest can join and see bridge
- [ ] Multiple gunner roles selectable
- [ ] GM can add/edit/delete contacts
- [ ] Players see contacts on sensors
- [ ] All tests pass (308 + new)
- [ ] No regressions

### Create Completion Report
- `AUTORUN-OPS-2-COMPLETION.md`

---

## Success Criteria

✅ Role panels show role-specific content
✅ Time UI functional with quick buttons
✅ Guest login works end-to-end
✅ Contacts table in database
✅ GM can manage contacts
✅ Sensor display shows contacts
✅ All tests pass
✅ No regressions to combat or operations

---

## Rollback Plan

```bash
# If things break:
git checkout main
git reset --hard HEAD~N  # where N = commits to undo

# Database rollback (if schema changed):
rm data/campaigns/operations.db
# Restart server to recreate
```

---

## Files to Create

- `lib/operations/contacts.js`
- `tests/contacts.test.js`

## Files to Modify

- `lib/operations/database.js` (contacts table)
- `lib/operations/index.js` (export contacts)
- `lib/socket-handlers/operations.handlers.js` (contact handlers)
- `public/operations/index.html` (role panels, time UI, guest)
- `public/operations/styles.css` (contact styling)
- `public/operations/app.js` (rendering, handlers)
- `tests/run-all-tests.js` (add contacts test)

---

**STATUS:** Ready for Permission Warmup
**NEXT:** User runs Phase 0 commands, then says "GO"
