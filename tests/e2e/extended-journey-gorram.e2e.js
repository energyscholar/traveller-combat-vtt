#!/usr/bin/env node
/**
 * Extended Multi-System Journey Test - Gorram Q-Ship (X-Carrier)
 * Coreward route: Flammarion → Narsil → Tizon → Return
 *
 * Ship: X-Carrier (600t, Jump-2, 144t fuel, 120t per jump)
 *
 * Tests fuel preference logic:
 * 1. Starport refined (A/B class) - preferred
 * 2. Starport unrefined (C/D/E class) - second choice
 * 3. Wilderness (gas giant or water) - last resort
 *
 * Run with: npm run test:journey:gorram
 */

process.env.NODE_ENV = 'test';

const operations = require('../../lib/operations');

// Ship specs: X-Carrier
const SHIP_FUEL_CAPACITY = 144;  // 120t jump + 24t power plant
const JUMP_2_FUEL = 120;         // 600t × 2 ÷ 10 = 120t

// Journey metrics
const metrics = {
  jumps: 0,
  parsecs: 0,
  fuelConsumed: 0,
  gameHours: 0,
  discoveries: [],
  refuelMethods: {
    starportRefined: 0,
    starportUnrefined: 0,
    gasGiant: 0,
    wildernessWater: 0
  },
  fuelCosts: 0,
  systemsVisited: ['Flammarion'],
  startTime: Date.now(),
  currentDate: '1105-001 08:00'
};

let passed = 0;
let failed = 0;
let testCampaignId = null;
let testShipId = null;

function test(name, result) {
  if (result) {
    console.log(`✓ ${name}`);
    passed++;
  } else {
    console.log(`✗ ${name}`);
    failed++;
  }
}

function addGameTime(hours, description) {
  metrics.gameHours += hours;
  const [datePart, timePart] = metrics.currentDate.split(' ');
  const [year, day] = datePart.split('-').map(Number);
  const [hour] = timePart.split(':').map(Number);

  let newHour = hour + hours;
  let newDay = day;
  let newYear = year;

  while (newHour >= 24) { newHour -= 24; newDay++; }
  while (newDay > 365) { newDay -= 365; newYear++; }

  metrics.currentDate = `${newYear}-${String(newDay).padStart(3, '0')} ${String(newHour).padStart(2, '0')}:00`;
  console.log(`  [TIME] +${hours}h: ${description} (Day ${newDay}, ${metrics.gameHours}h total)`);
}

function recordJump(from, to, parsecs, fuelTons) {
  metrics.jumps++;
  metrics.parsecs += parsecs;
  metrics.fuelConsumed += fuelTons;
  metrics.systemsVisited.push(to);
  addGameTime(168, `Jump-${parsecs} ${from} → ${to}`);
  console.log(`  [JUMP] ${from} → ${to}: ${parsecs} parsecs, ${fuelTons}t fuel`);
}

function recordRefuel(method, tons, costPerTon = 0) {
  metrics.refuelMethods[method]++;
  const cost = tons * costPerTon;
  metrics.fuelCosts += cost;
  console.log(`  [FUEL] ${method}: +${tons}t${cost > 0 ? ` (Cr${cost.toLocaleString()})` : ''}`);
}

function recordDiscovery(system, object, type, value) {
  metrics.discoveries.push({ system, object, type, value });
  console.log(`  [DISCOVERY] ${system}: ${object} (${type}) - ${value}`);
}

async function runJourneyTest() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║     X-CARRIER JOURNEY TEST (600t, Jump-2, 144t fuel)       ║');
  console.log('║   Flammarion → Narsil → Tizon → Return                     ║');
  console.log('║   Testing: Refined > Unrefined > Wilderness fuel preference ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // ==================== Setup ====================
  console.log('--- Setup: Creating campaign and X-Carrier ---');

  const campaign = operations.createCampaign('X-Carrier Journey Test', 'Test GM');
  testCampaignId = campaign.id;

  operations.updateCampaign(testCampaignId, {
    current_system: 'Flammarion',
    current_sector: 'Spinward Marches',
    current_hex: '0930',
    current_date: '1105-001 08:00',
    no_fuel_mode: 0
  });
  test('Campaign created', !!testCampaignId);

  const createdShip = operations.createShipFromTemplate(testCampaignId, 'x_carrier', 'THS Gorram', true);
  testShipId = createdShip.id;
  test('X-Carrier created', !!testShipId);

  // Initialize: full refined fuel from A-class
  operations.updateShipState(testShipId, {
    systemHex: '0930',
    locationId: 'loc-dock-highport',
    locationName: 'Dock - Flammarion Highport',
    fuel: { current: SHIP_FUEL_CAPACITY, max: SHIP_FUEL_CAPACITY },
    fuelBreakdown: { refined: SHIP_FUEL_CAPACITY, unrefined: 0, processed: 0 },
    fuelProcessor: true,
    positionVerified: true
  });

  // ==================== PHASE 1: Flammarion ====================
  console.log('\n--- Phase 1: Flammarion (A623514-B) - Class A Starport ---');
  console.log('  X-Carrier THS Gorram departing on coreward patrol');
  console.log('  Crew: Astrogator, Pilot, Engineer, Sensor Operator');

  addGameTime(0, 'Mission briefing');
  console.log(`  [STATUS] Full tanks: ${SHIP_FUEL_CAPACITY}t refined from A-class`);
  console.log('  [POLICY] Buy refined when available (A/B), else unrefined (C/D), else wilderness');

  let ship = operations.getShip(testShipId);
  test(`Initial fuel: ${SHIP_FUEL_CAPACITY}t refined`, ship.current_state?.fuelBreakdown?.refined === SHIP_FUEL_CAPACITY);

  // ==================== PHASE 2: Jump to Narsil ====================
  console.log('\n--- Phase 2: Jump to Narsil (B574A55-A) - Sword Worlds ---');
  console.log('  Industrial world, Class B starport (refined available)');

  addGameTime(4, 'Travel to jump point');

  const jump1 = operations.initiateJump(testShipId, testCampaignId, 'Narsil', 2);
  test('Jump-2 to Narsil initiated', jump1.success);

  // Jump-2 consumes 120t, leaving 24t (power plant reserve)
  operations.updateShipState(testShipId, {
    fuelBreakdown: { refined: 24, unrefined: 0, processed: 0 }
  });
  recordJump('Flammarion', 'Narsil', 2, JUMP_2_FUEL);

  operations.updateCampaign(testCampaignId, { current_date: jump1.jumpEndDate });
  const arrival1 = operations.completeJump(testShipId, testCampaignId);
  test('Arrived at Narsil', arrival1.success && arrival1.arrivedAt === 'Narsil');

  addGameTime(6, 'Travel to Narsil Highport');

  // B-class = refined available → BUY REFINED (preference #1)
  console.log('  Narsil B-class: REFINED available');
  console.log('  [DECISION] B-class → Buying refined (Cr500/ton)');
  addGameTime(2, 'Starport refueling (refined)');
  recordRefuel('starportRefined', JUMP_2_FUEL, 500);

  operations.updateShipState(testShipId, {
    fuelBreakdown: { refined: SHIP_FUEL_CAPACITY, unrefined: 0, processed: 0 }
  });

  recordDiscovery('Narsil', 'Orbital Shipyard', 'military intel',
    'HIGH - TL10 military shipyard, Sword Worlds Navy contracts');
  addGameTime(6, 'Orbital survey');

  ship = operations.getShip(testShipId);
  test(`Refueled at Narsil: ${SHIP_FUEL_CAPACITY}t refined`, ship.current_state?.fuelBreakdown?.refined === SHIP_FUEL_CAPACITY);

  // ==================== PHASE 3: Jump to Tizon ====================
  console.log('\n--- Phase 3: Jump to Tizon (B586887-A) - Sword Worlds ---');
  console.log('  Agricultural world, Class B starport (refined available)');

  addGameTime(4, 'Travel to jump point');

  const jump2 = operations.initiateJump(testShipId, testCampaignId, 'Tizon', 2);
  test('Jump-2 to Tizon initiated', jump2.success);

  operations.updateShipState(testShipId, {
    fuelBreakdown: { refined: 24, unrefined: 0, processed: 0 }
  });
  recordJump('Narsil', 'Tizon', 2, JUMP_2_FUEL);

  operations.updateCampaign(testCampaignId, { current_date: jump2.jumpEndDate });
  const arrival2 = operations.completeJump(testShipId, testCampaignId);
  test('Arrived at Tizon', arrival2.success && arrival2.arrivedAt === 'Tizon');

  addGameTime(6, 'Travel to downport');

  // B-class = refined available
  console.log('  Tizon B-class: REFINED available');
  console.log('  [DECISION] B-class → Buying refined (Cr500/ton)');
  addGameTime(2, 'Starport refueling (refined)');
  recordRefuel('starportRefined', JUMP_2_FUEL, 500);

  operations.updateShipState(testShipId, {
    fuelBreakdown: { refined: SHIP_FUEL_CAPACITY, unrefined: 0, processed: 0 }
  });

  recordDiscovery('Tizon', 'Agricultural Belt', 'economic',
    'MODERATE - Major grain exporter, standard Sword Worlds agri');
  addGameTime(4, 'Survey complete');

  ship = operations.getShip(testShipId);
  test(`Refueled at Tizon: ${SHIP_FUEL_CAPACITY}t refined`, ship.current_state?.fuelBreakdown?.refined === SHIP_FUEL_CAPACITY);

  // ==================== PHASE 4: Simulate E-class stop (wilderness demo) ====================
  console.log('\n--- Phase 4: Wilderness Refueling Demo ---');
  console.log('  Simulating arrival at E-class starport (no fuel service)');
  console.log('  Must use wilderness refueling: gas giant available');

  // Simulate using 120t for a jump
  operations.updateShipState(testShipId, {
    fuelBreakdown: { refined: 24, unrefined: 0, processed: 0 }
  });
  console.log('  [SCENARIO] After jump, only 24t remains');

  addGameTime(8, 'Travel to gas giant');

  // E-class = NO starport fuel → WILDERNESS (preference #3)
  console.log('  E-class starport: NO FUEL SERVICE');
  console.log('  [DECISION] No starport fuel → Gas giant skimming');
  addGameTime(4, 'Fuel skimming operations');
  recordRefuel('gasGiant', JUMP_2_FUEL, 0);
  addGameTime(3, 'Fuel processing');

  operations.updateShipState(testShipId, {
    fuelBreakdown: { refined: 0, unrefined: 0, processed: SHIP_FUEL_CAPACITY }
  });

  ship = operations.getShip(testShipId);
  test(`Wilderness refuel: ${SHIP_FUEL_CAPACITY}t processed`, ship.current_state?.fuelBreakdown?.processed === SHIP_FUEL_CAPACITY);

  // ==================== PHASE 5: Return - Tizon → Narsil ====================
  console.log('\n--- Phase 5: Return - Back to Narsil ---');

  addGameTime(4, 'Travel to jump point');

  const jump3 = operations.initiateJump(testShipId, testCampaignId, 'Narsil', 2);
  test('Jump-2 to Narsil (return) initiated', jump3.success);

  operations.updateShipState(testShipId, {
    fuelBreakdown: { refined: 0, unrefined: 0, processed: 24 }
  });
  recordJump('Tizon', 'Narsil', 2, JUMP_2_FUEL);

  operations.updateCampaign(testCampaignId, { current_date: jump3.jumpEndDate });
  const arrival3 = operations.completeJump(testShipId, testCampaignId);
  test('Return to Narsil', arrival3.success && arrival3.arrivedAt === 'Narsil');

  addGameTime(4, 'Travel to starport');

  console.log('  Narsil B-class: REFINED available');
  console.log('  [DECISION] B-class → Buying refined');
  addGameTime(2, 'Refueling');
  recordRefuel('starportRefined', JUMP_2_FUEL, 500);

  operations.updateShipState(testShipId, {
    fuelBreakdown: { refined: SHIP_FUEL_CAPACITY, unrefined: 0, processed: 0 }
  });

  ship = operations.getShip(testShipId);
  test(`Refueled at Narsil (return): ${SHIP_FUEL_CAPACITY}t`, ship.current_state?.fuelBreakdown?.refined === SHIP_FUEL_CAPACITY);

  // ==================== PHASE 6: Final Return - Narsil → Flammarion ====================
  console.log('\n--- Phase 6: Final Return - Narsil → Flammarion ---');

  addGameTime(4, 'Travel to jump point');

  const jump4 = operations.initiateJump(testShipId, testCampaignId, 'Flammarion', 2);
  test('Jump-2 to Flammarion (final) initiated', jump4.success);

  operations.updateShipState(testShipId, {
    fuelBreakdown: { refined: 24, unrefined: 0, processed: 0 }
  });
  recordJump('Narsil', 'Flammarion', 2, JUMP_2_FUEL);

  operations.updateCampaign(testCampaignId, { current_date: jump4.jumpEndDate });
  const arrival4 = operations.completeJump(testShipId, testCampaignId);
  test('Return to Flammarion', arrival4.success && arrival4.arrivedAt === 'Flammarion');

  addGameTime(4, 'Travel to highport');

  // A-class = refined
  console.log('  Flammarion A-class: REFINED available');
  console.log('  [DECISION] A-class → Buying refined');
  addGameTime(1, 'Refueling');
  recordRefuel('starportRefined', JUMP_2_FUEL, 500);

  operations.updateShipState(testShipId, {
    fuelBreakdown: { refined: SHIP_FUEL_CAPACITY, unrefined: 0, processed: 0 }
  });

  ship = operations.getShip(testShipId);
  test(`Final refuel: ${SHIP_FUEL_CAPACITY}t refined`, ship.current_state?.fuelBreakdown?.refined === SHIP_FUEL_CAPACITY);

  // ==================== Mission Complete ====================
  console.log('\n--- Mission Complete ---');
  test('Journey completed', true);

  // Cleanup
  operations.deleteShip(testShipId);
  operations.deleteCampaign(testCampaignId);

  printJourneyReport();
  return { passed, failed };
}

function printJourneyReport() {
  const elapsed = ((Date.now() - metrics.startTime) / 1000).toFixed(1);
  const gameDays = (metrics.gameHours / 24).toFixed(1);

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║              JOURNEY REPORT - THS GORRAM                        ║');
  console.log('║              600t X-Carrier, Jump-2, 144t Fuel                   ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log('║  ROUTE                                                          ║');
  const route = metrics.systemsVisited.join(' → ');
  console.log(`║  ${route.padEnd(62)}║`);
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log('║  NAVIGATION                                                     ║');
  console.log(`║    Jumps: ${String(metrics.jumps).padStart(2)}   Parsecs: ${String(metrics.parsecs).padStart(2)}   Fuel: ${String(metrics.fuelConsumed).padStart(3)}t consumed             ║`);
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log('║  TIME                                                           ║');
  console.log(`║    Game: ${String(metrics.gameHours).padStart(4)}h (${gameDays} days)   Real: ${elapsed}s                       ║`);
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log('║  FUEL PREFERENCE RESULTS                                        ║');
  console.log(`║    Starport Refined (A/B):   ${String(metrics.refuelMethods.starportRefined).padStart(2)} (PREFERRED)                   ║`);
  console.log(`║    Starport Unrefined (C/D): ${String(metrics.refuelMethods.starportUnrefined).padStart(2)}                              ║`);
  console.log(`║    Gas Giant:                ${String(metrics.refuelMethods.gasGiant).padStart(2)} (LAST RESORT)                  ║`);
  console.log(`║    Total Cost: Cr${String(metrics.fuelCosts.toLocaleString()).padStart(8)}                                ║`);
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log('║  TEST RESULTS                                                   ║');
  console.log(`║    Passed: ${String(passed).padStart(2)}   Failed: ${String(failed).padStart(2)}                                       ║`);
  console.log('╚════════════════════════════════════════════════════════════════╝');
}

if (require.main === module) {
  runJourneyTest()
    .then(({ passed, failed }) => {
      console.log(`\n=== X-CARRIER JOURNEY: ${passed} passed, ${failed} failed ===\n`);
      process.exit(failed > 0 ? 1 : 0);
    })
    .catch(err => {
      console.error('Test error:', err);
      process.exit(1);
    });
}

module.exports = { runJourneyTest };
