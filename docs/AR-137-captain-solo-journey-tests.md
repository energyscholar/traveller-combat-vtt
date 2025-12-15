# AR-137: Captain Solo 6-Jump Journey Tests

## Use Case
Captain James pilots the Amishi through a 6-system journey in District 268:
```
Flammarion → Faldor → Caladbolg → Elixabeth → Noctocol → Talos → Collace
```

## Test 1: Data Structure & Interface Validation

### Purpose
Verify all data structures and interfaces exist before attempting E2E test.

### Checklist

#### 1.1 System Data Exists
- [ ] Flammarion system data
- [ ] Faldor system data
- [ ] Caladbolg system data
- [ ] Elixabeth system data
- [ ] Noctocol system data
- [ ] Talos system data
- [ ] Collace system data

#### 1.2 Required Celestial Objects Per System
For each system:
- [ ] Primary star
- [ ] Mainworld with starport
- [ ] Gas giants (where applicable) with diameters
- [ ] Jump points (100-diameter limit)
- [ ] Gas giant jump points (AR-136)

#### 1.3 Refueling Sources
- [ ] Faldor: Water body for wilderness refueling
- [ ] Caladbolg: Starport with refined fuel sales
- [ ] Elixabeth: Gas giant for skimming

#### 1.4 Navigation Infrastructure
- [ ] Jump routes between all 7 systems (parsec distances)
- [ ] Jump point destinations for each system
- [ ] Travel time calculations working

#### 1.5 Fuel System
- [ ] "Jumps Cost Fuel" setting functional
- [ ] Fuel capacity tracking
- [ ] Fuel types: unrefined, processed, refined
- [ ] Fuel processing time calculation
- [ ] Wilderness refueling mechanics
- [ ] Gas giant skimming mechanics
- [ ] Starport fuel purchase

#### 1.6 Ship State
- [ ] Amishi ship exists or can be created
- [ ] Fuel tank capacity sufficient for jump
- [ ] Jump drive rating

### Test Implementation
```javascript
// tests/ar-137-journey-data.test.js
describe('AR-137: 6-Jump Journey Data Validation', () => {
  const ROUTE = ['Flammarion', 'Faldor', 'Caladbolg', 'Elixabeth', 'Noctocol', 'Talos', 'Collace'];

  describe('System Data', () => {
    ROUTE.forEach(system => {
      it(`${system} system exists with required data`, () => {
        const data = getSystemData(system);
        expect(data).toBeDefined();
        expect(data.celestialObjects).toContainType('Star');
        expect(data.celestialObjects).toContainType('Planet');
      });
    });
  });

  describe('Jump Routes', () => {
    for (let i = 0; i < ROUTE.length - 1; i++) {
      it(`can jump from ${ROUTE[i]} to ${ROUTE[i+1]}`, () => {
        const distance = getJumpDistance(ROUTE[i], ROUTE[i+1]);
        expect(distance).toBeLessThanOrEqual(2); // Jump-2 max
      });
    }
  });

  describe('Refueling Sources', () => {
    it('Faldor has water landing site', () => {
      const sources = getRefuelSources('Faldor');
      expect(sources).toContain({ type: 'wilderness', subtype: 'water' });
    });

    it('Caladbolg starport sells refined fuel', () => {
      const starport = getStarport('Caladbolg');
      expect(starport.services).toContain('refined-fuel');
    });

    it('Elixabeth has gas giant for skimming', () => {
      const system = getSystemData('Elixabeth');
      const gasGiants = system.celestialObjects.filter(o => o.type === 'Gas Giant');
      expect(gasGiants.length).toBeGreaterThan(0);
    });
  });

  describe('Gas Giant Jump Points (AR-136)', () => {
    it('Elixabeth gas giant has jump point at 100 diameters', () => {
      const system = getSystemData('Elixabeth');
      const gg = system.celestialObjects.find(o => o.type === 'Gas Giant');
      const jumpPoint = system.celestialObjects.find(o =>
        o.type === 'jump-point' && o.parent === gg.id
      );
      expect(jumpPoint).toBeDefined();
      expect(jumpPoint.orbitKm).toBe(gg.diameter * 100);
    });
  });
});
```

---

## Test 2: Puppeteer E2E (Captain Role Only)

### Purpose
Validate complete solo mode workflow using only Captain panel controls.

### Deep Gap Analysis

#### GAP 2.1: Captain Panel Switching (BLOCKER)
**Status:** NOT IMPLEMENTED
**Issue:** Captain cannot access Astrogator/Pilot/Engineer panels
**Required:** AR-131 Enhancement must be complete first
**Impact:** Cannot plot jumps, set courses, or manage fuel via UI

#### GAP 2.2: Role Panel Functions Missing from Captain Context
**Status:** PARTIAL
**Issue:** Even with panel switching, some functions may require role-specific state
**Questions:**
- Does `ops:plotJump` check `opsSession.role === 'astrogator'` anywhere besides gate?
- Do panel render functions assume specific role context?
- Are there role-specific socket room memberships needed?

#### GAP 2.3: Wilderness Refueling UI
**Status:** UNKNOWN
**Questions:**
- How does player select "water landing" as refuel source?
- Is there a landing sequence required?
- Does the ship need to be "landed" state before refueling?

#### GAP 2.4: Gas Giant Skimming UI
**Status:** UNKNOWN
**Questions:**
- How does player initiate skimming?
- Is there an orbit/approach sequence?
- How long does skimming take?
- Is there a skill check?

#### GAP 2.5: Starport Fuel Purchase UI
**Status:** UNKNOWN
**Questions:**
- How does player access starport services?
- Is there a docking sequence?
- What's the purchase flow?
- Cost calculation?

#### GAP 2.6: Fuel Processing UI
**Status:** PARTIAL (backend exists)
**Questions:**
- Where is "Process Fuel" button?
- Can Captain access it?
- Progress indicator during processing?

#### GAP 2.7: Travel Time & Waiting
**Status:** UNKNOWN
**Questions:**
- How does player advance time for travel?
- How does player advance time for fuel processing?
- Is there a "time controls" UI accessible to Captain?

#### GAP 2.8: Jump Execution Sequence
**Status:** PARTIAL
**Questions:**
- Full sequence: Plot → Travel to Jump Point → Initiate Jump → Arrive
- Which steps require UI interaction?
- Which are automatic?
- Where does position verification fit?

#### GAP 2.9: State Persistence Between Systems
**Status:** UNKNOWN
**Questions:**
- Does arriving in new system reset ship position correctly?
- Is fuel state preserved across jump?
- Is ship correctly placed at arrival jump point?

#### GAP 2.10: Puppeteer Test Infrastructure
**Status:** EXISTS but needs verification
**Questions:**
- Can Puppeteer click dynamic panel content?
- Timing issues with socket events?
- How to wait for async operations (jump, travel, processing)?

### Test Implementation (Skeleton)
```javascript
// tests/e2e/ar-137-captain-solo-journey.e2e.js
const { withBrowser } = require('./helpers/browser-with-cleanup');

describe('AR-137: Captain Solo 6-Jump Journey E2E', () => {
  const ROUTE = ['Flammarion', 'Faldor', 'Caladbolg', 'Elixabeth', 'Noctocol', 'Talos', 'Collace'];

  it('completes full journey as Captain', async () => {
    await withBrowser(async (browser, page) => {
      // Setup
      await loginAsGM(page);
      await createCampaign(page, { startSystem: 'Flammarion' });
      await enableJumpsCostFuel(page);
      await createShip(page, 'Amishi', { fuelCapacity: 40, jumpDrive: 2 });
      await createPlayerSlot(page, 'Captain James');

      // Login as Captain
      await loginAsPlayer(page, 'Captain James');
      await selectRole(page, 'captain');
      await joinBridge(page);

      // === LEG 1: Flammarion → Faldor ===
      await switchToAstrogatorPanel(page);  // GAP 2.1
      await plotJump(page, 'Faldor');
      await switchToPilotPanel(page);       // GAP 2.1
      await setCourseToJumpPoint(page);
      await waitForArrival(page);           // GAP 2.7
      await switchToAstrogatorPanel(page);
      await initiateJump(page);
      await waitForJumpComplete(page);

      // === Faldor: Wilderness Refuel ===
      await switchToPilotPanel(page);
      await landOnWater(page, 'Faldor');    // GAP 2.3
      await switchToEngineerPanel(page);    // GAP 2.1
      await refuelWilderness(page);         // GAP 2.3
      await processFuel(page);              // GAP 2.6
      await waitForProcessing(page);        // GAP 2.7
      await switchToPilotPanel(page);
      await takeOff(page);

      // === LEG 2: Faldor → Caladbolg ===
      // ... similar pattern ...

      // === Caladbolg: Starport Refuel ===
      await dockAtStarport(page);           // GAP 2.5
      await purchaseRefinedFuel(page);      // GAP 2.5

      // === LEG 3-6: Continue pattern ===

      // Verify arrival at Collace
      const currentSystem = await getCurrentSystem(page);
      expect(currentSystem).toBe('Collace');
    }, { timeout: 300000 }); // 5 min timeout for full journey
  });
});

// Helper functions that need implementation
async function switchToAstrogatorPanel(page) {
  // GAP 2.1: Requires AR-131 Enhancement
  await page.click('[data-panel-switch="astrogator"]');
  await page.waitForSelector('.astrogator-panel');
}

async function plotJump(page, destination) {
  await page.select('#jump-destination', destination);
  await page.click('#btn-plot-jump');
  await page.waitForSelector('.jump-plotted');
}

// ... many more helpers needed
```

---

## Dependencies

| Dependency | Status | Blocker? |
|------------|--------|----------|
| AR-131 Enhancement (Captain panel switching) | TODO | YES |
| AR-136 (Gas giant jump points) | TODO | YES |
| Wilderness refueling UI | UNKNOWN | MAYBE |
| Gas giant skimming UI | UNKNOWN | MAYBE |
| Starport services UI | UNKNOWN | MAYBE |
| Time advancement UI | UNKNOWN | MAYBE |

## Recommended Implementation Order

1. **AR-136**: Gas Giant Jump Points (data layer)
2. **AR-131 Enhancement**: Captain panel switching (UI layer)
3. **Test 1**: Data validation (confirms 1 & 2 work)
4. **Gap fills**: Address GAPs 2.3-2.9 as discovered
5. **Test 2**: Full E2E (validates complete flow)

## Risk: MEDIUM-HIGH
- Many unknown gaps in refueling/travel UI
- E2E test depends on multiple incomplete features
- Test 1 should reveal specific gaps before E2E attempt

## Estimate
- Test 1: 2-3 hours (mostly discovery)
- Gap fills: 4-8 hours (unknown scope)
- Test 2: 3-4 hours (after gaps filled)
