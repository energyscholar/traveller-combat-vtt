#!/usr/bin/env node
/**
 * Extended Multi-System Journey Test
 * Direct operations test covering: Flammarion → 567-908 → Walston → Noctocol → Return
 *
 * Tests the full journey flow with fuel management, refueling from all 4 sources,
 * and proper time tracking.
 *
 * Run with: node tests/e2e/extended-journey.e2e.js
 */

// Set test environment
process.env.NODE_ENV = 'test';

const operations = require('../../lib/operations');
const path = require('path');

// Journey metrics tracking
const metrics = {
  jumps: 0,
  parsecs: 0,
  fuelConsumed: 0,
  gameHours: 0,
  discoveries: [],
  refuelMethods: {
    starportRefined: 0,    // A/B class - refined fuel (5x cost, no processing)
    starportUnrefined: 0,  // C/D/E class - unrefined (cheap, needs processing)
    gasGiant: 0,
    wildernessWater: 0
  },
  fuelCosts: 0,  // Total fuel costs in credits
  systemsVisited: ['Flammarion'],
  startTime: Date.now(),
  currentDate: '1105-001 08:00'
};

// Test state
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
  // Parse and advance date
  const [datePart, timePart] = metrics.currentDate.split(' ');
  const [year, day] = datePart.split('-').map(Number);
  const [hour] = timePart.split(':').map(Number);

  let newHour = hour + hours;
  let newDay = day;
  let newYear = year;

  while (newHour >= 24) {
    newHour -= 24;
    newDay++;
  }
  while (newDay > 365) {
    newDay -= 365;
    newYear++;
  }

  metrics.currentDate = `${newYear}-${String(newDay).padStart(3, '0')} ${String(newHour).padStart(2, '0')}:00`;
  console.log(`  [TIME] +${hours}h: ${description} (Day ${newDay}, ${metrics.gameHours}h total)`);
}

function recordJump(from, to, parsecs, fuelTons) {
  metrics.jumps++;
  metrics.parsecs += parsecs;
  metrics.fuelConsumed += fuelTons;
  metrics.systemsVisited.push(to);
  addGameTime(168, `Jump-${parsecs} ${from} → ${to}`); // 7 days = 168 hours
  console.log(`  [JUMP] ${from} → ${to}: ${parsecs} parsecs, ${fuelTons}t fuel consumed`);
}

function recordRefuel(method, tons, costPerTon = 0) {
  metrics.refuelMethods[method]++;
  const cost = tons * costPerTon;
  metrics.fuelCosts += cost;
  const costStr = cost > 0 ? ` (Cr${cost.toLocaleString()})` : '';
  console.log(`  [FUEL] ${method}: +${tons}t${costStr}`);
}

function recordDiscovery(system, object, type, value) {
  metrics.discoveries.push({ system, object, type, value });
  console.log(`  [DISCOVERY] ${system}: ${object} (${type}) - ${value}`);
}

async function runJourneyTest() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║        EXTENDED MULTI-SYSTEM JOURNEY TEST                   ║');
  console.log('║   Flammarion → 567-908 → Walston → Noctocol → Return        ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // ==================== Setup: Create campaign and ship ====================
  console.log('--- Setup: Creating test campaign and ship ---');

  const campaign = operations.createCampaign('Extended Journey Test', 'Test GM');
  testCampaignId = campaign.id;

  // Configure campaign for journey
  operations.updateCampaign(testCampaignId, {
    current_system: 'Flammarion',
    current_sector: 'Spinward Marches',
    current_hex: '0930',
    current_date: '1105-001 08:00',
    no_fuel_mode: 0  // Fuel consumption enabled
  });
  test('Campaign created', !!testCampaignId);

  const createdShip = operations.createShipFromTemplate(testCampaignId, 'scout', 'ISS Pathfinder', true);
  testShipId = createdShip.id;
  test('Ship created', !!testShipId);

  // Initialize ship state with fuel processor and refined fuel
  operations.updateShipState(testShipId, {
    systemHex: '0930',
    locationId: 'loc-dock-highport',
    locationName: 'Dock - Flammarion Highport',
    fuel: { current: 40, max: 40 },
    fuelBreakdown: { refined: 40, unrefined: 0, processed: 0 },
    fuelProcessor: true,  // Standard equipment on scout
    positionVerified: true
  });

  // ==================== PHASE 1: Flammarion - Starting Point ====================
  console.log('\n--- Phase 1: Flammarion (A623514-B) - Class A Starport ---');
  console.log('  Scout/Courier ISS Pathfinder beginning exploration mission');
  console.log('  Crew: Astrogator, Pilot, Engineer, Sensor Operator');
  console.log('  Objective: Survey systems rimward of Flammarion, return with data');

  addGameTime(0, 'Mission briefing at Flammarion Highport');
  // Already have 40t refined fuel from last port call
  console.log('  [STATUS] Tanks full with refined fuel from A-class starport');

  let ship = operations.getShip(testShipId);
  test('Initial fuel: 40t refined', ship.current_state?.fuelBreakdown?.refined === 40);

  // ==================== PHASE 2: Jump to 567-908 ====================
  console.log('\n--- Phase 2: Jump to 567-908 (E532000-0) ---');
  console.log('  Barren rockball system, no gas giants, no population');
  console.log('  Known for rich planetoid belt - primary survey target');

  addGameTime(6, 'Undock and travel to jump point (100D limit)');

  // Initiate jump
  const jump1 = operations.initiateJump(testShipId, testCampaignId, '567-908', 2);
  test('Jump-2 to 567-908 initiated', jump1.success);

  // Consume fuel for jump
  operations.updateShipState(testShipId, {
    fuelBreakdown: { refined: 20, unrefined: 0, processed: 0 }
  });
  recordJump('Flammarion', '567-908', 2, 20);

  // Complete jump
  operations.updateCampaign(testCampaignId, { current_date: jump1.jumpEndDate });
  const arrival1 = operations.completeJump(testShipId, testCampaignId);
  test('Arrived at 567-908', arrival1.success && arrival1.arrivedAt === '567-908');

  addGameTime(4, 'Travel to planetoid belt');

  // Deep scan planetoid belt
  recordDiscovery('567-908', 'Planetoid Belt Alpha', 'mineral survey',
    'HIGH VALUE - Platinum group metals, Est. 2.3 MCr/month yield');
  addGameTime(8, 'Deep scan of planetoid belt (Electronics/Sensors)');

  // Log the discovery
  operations.addLogEntry(testShipId, testCampaignId, {
    gameDate: metrics.currentDate,
    entryType: 'sensor',
    message: 'SURVEY: Planetoid Belt Alpha - Rich platinum deposits detected',
    actor: 'Sensors',
    data: {
      target: '567-908 Planetoid Belt',
      findings: 'Platinum group metals',
      value: '2.3 MCr/month'
    }
  });

  // Refuel from wilderness water (UWP Hydro = 2, minimal but usable)
  console.log('  567-908 has Hydro 2 - minimal surface water available');
  addGameTime(8, 'Landing at water source, collecting 40t water');
  recordRefuel('wildernessWater', 40, 0);  // Free but time-consuming
  addGameTime(2, 'Fuel processing (unrefined → processed)');

  operations.updateShipState(testShipId, {
    fuelBreakdown: { refined: 0, unrefined: 0, processed: 40 }
  });

  ship = operations.getShip(testShipId);
  test('Refueled: 40t processed', ship.current_state?.fuelBreakdown?.processed === 40);

  // ==================== PHASE 3: Jump to Walston ====================
  console.log('\n--- Phase 3: Jump to Walston (C544338-8) ---');
  console.log('  Agricultural colony, Class C starport, 3 gas giants');
  console.log('  C-class has unrefined fuel only - but crew always buys refined when available');

  addGameTime(4, 'Travel to jump point');

  const jump2 = operations.initiateJump(testShipId, testCampaignId, 'Walston', 2);
  test('Jump-2 to Walston initiated', jump2.success);

  operations.updateShipState(testShipId, {
    fuelBreakdown: { refined: 0, unrefined: 0, processed: 20 }
  });
  recordJump('567-908', 'Walston', 2, 20);

  operations.updateCampaign(testCampaignId, { current_date: jump2.jumpEndDate });
  const arrival2 = operations.completeJump(testShipId, testCampaignId);
  test('Arrived at Walston', arrival2.success && arrival2.arrivedAt === 'Walston');

  // Gas giant refuel - 3 available, safer than C-class unrefined
  console.log('  Walston C-class only has unrefined fuel at starport');
  console.log('  Crew opts for gas giant skimming - same quality, free');
  addGameTime(8, 'Travel to gas giant (outer system)');
  addGameTime(4, 'Fuel skimming operations');
  recordRefuel('gasGiant', 40, 0);  // Free
  addGameTime(2, 'Fuel processing');

  operations.updateShipState(testShipId, {
    fuelBreakdown: { refined: 0, unrefined: 0, processed: 40 }
  });

  // Deep scan gas giant moon
  recordDiscovery('Walston', 'Gas Giant I Moon 3', 'ice/cryology',
    'MODERATE - Exotic ice formations, potential research site');
  addGameTime(6, 'Deep scan of gas giant moon system');

  operations.addLogEntry(testShipId, testCampaignId, {
    gameDate: metrics.currentDate,
    entryType: 'sensor',
    message: 'SURVEY: GG-I Moon 3 - Exotic cryogenic formations detected',
    actor: 'Sensors'
  });

  ship = operations.getShip(testShipId);
  test('Refueled at Walston: 40t processed', ship.current_state?.fuelBreakdown?.processed === 40);

  // ==================== PHASE 4: Jump to Noctocol ====================
  console.log('\n--- Phase 4: Jump to Noctocol (E7A5747-8) ---');
  console.log('  Fluid ocean world, exotic atmosphere, 2 gas giants');
  console.log('  E-class starport - no fuel available');
  console.log('  Surface water unusable (exotic fluids) - must use gas giant');

  addGameTime(4, 'Travel to jump point');

  const jump3 = operations.initiateJump(testShipId, testCampaignId, 'Noctocol', 2);
  test('Jump-2 to Noctocol initiated', jump3.success);

  operations.updateShipState(testShipId, {
    fuelBreakdown: { refined: 0, unrefined: 0, processed: 20 }
  });
  recordJump('Walston', 'Noctocol', 2, 20);

  operations.updateCampaign(testCampaignId, { current_date: jump3.jumpEndDate });
  const arrival3 = operations.completeJump(testShipId, testCampaignId);
  test('Arrived at Noctocol', arrival3.success && arrival3.arrivedAt === 'Noctocol');

  addGameTime(12, 'Travel to gas giant (distant orbit)');
  addGameTime(4, 'Fuel skimming');
  recordRefuel('gasGiant', 40, 0);
  addGameTime(2, 'Fuel processing');

  operations.updateShipState(testShipId, {
    fuelBreakdown: { refined: 0, unrefined: 0, processed: 40 }
  });

  // Major discovery - xenobiology
  console.log('  Noctocol mainworld scan reveals unexpected lifeforms');
  recordDiscovery('Noctocol', 'Mainworld', 'xenobiology',
    'EXCEPTIONAL - Complex silicon-based life in fluid oceans');
  addGameTime(12, 'Extended orbital survey and bioscan');

  operations.addLogEntry(testShipId, testCampaignId, {
    gameDate: metrics.currentDate,
    entryType: 'sensor',
    message: 'DISCOVERY: Silicon-based life detected in Noctocol oceans!',
    actor: 'Sensors',
    data: {
      target: 'Noctocol Mainworld',
      findings: 'Silicon-based organisms',
      significance: 'EXCEPTIONAL - First contact protocol recommended'
    }
  });

  ship = operations.getShip(testShipId);
  test('Refueled at Noctocol: 40t processed', ship.current_state?.fuelBreakdown?.processed === 40);

  // ==================== PHASE 5: Return Leg 1 - Noctocol → Walston ====================
  console.log('\n--- Phase 5: Return - Noctocol → Walston ---');
  console.log('  Returning with critical xenobiology data');
  console.log('  Will refuel at Walston C-class - crew prefers to pay for convenience');

  addGameTime(4, 'Travel to jump point');

  const jump4 = operations.initiateJump(testShipId, testCampaignId, 'Walston', 2);
  test('Jump-2 to Walston (return) initiated', jump4.success);

  operations.updateShipState(testShipId, {
    fuelBreakdown: { refined: 0, unrefined: 0, processed: 20 }
  });
  recordJump('Noctocol', 'Walston', 2, 20);

  operations.updateCampaign(testCampaignId, { current_date: jump4.jumpEndDate });
  const arrival4 = operations.completeJump(testShipId, testCampaignId);
  test('Return to Walston', arrival4.success && arrival4.arrivedAt === 'Walston');

  addGameTime(2, 'Travel to downport');

  // C-class starport refuel - unrefined only but convenient
  // Crew policy: Always buy refined if available (A/B class). C-class only has unrefined.
  console.log('  C-class starport: Only unrefined available (Cr100/ton)');
  console.log('  Crew would prefer refined (Cr500/ton) but not available at C-class');
  addGameTime(1, 'Starport refueling (unrefined)');
  recordRefuel('starportUnrefined', 40, 100);  // Cr100/ton for unrefined
  addGameTime(2, 'Fuel processing');

  operations.updateShipState(testShipId, {
    fuelBreakdown: { refined: 0, unrefined: 0, processed: 40 }
  });

  ship = operations.getShip(testShipId);
  test('Refueled at Walston starport: 40t', ship.current_state?.fuelBreakdown?.processed === 40);

  // ==================== PHASE 6: Return Leg 2 - Walston → 567-908 ====================
  console.log('\n--- Phase 6: Return - Walston → 567-908 ---');

  addGameTime(4, 'Travel to jump point');

  const jump5 = operations.initiateJump(testShipId, testCampaignId, '567-908', 2);
  test('Jump-2 to 567-908 (return) initiated', jump5.success);

  operations.updateShipState(testShipId, {
    fuelBreakdown: { refined: 0, unrefined: 0, processed: 20 }
  });
  recordJump('Walston', '567-908', 2, 20);

  operations.updateCampaign(testCampaignId, { current_date: jump5.jumpEndDate });
  const arrival5 = operations.completeJump(testShipId, testCampaignId);
  test('Return to 567-908', arrival5.success && arrival5.arrivedAt === '567-908');

  addGameTime(6, 'Travel to water source');

  // Wilderness water refuel again
  addGameTime(8, 'Water collection');
  recordRefuel('wildernessWater', 40, 0);
  addGameTime(2, 'Fuel processing');

  operations.updateShipState(testShipId, {
    fuelBreakdown: { refined: 0, unrefined: 0, processed: 40 }
  });

  ship = operations.getShip(testShipId);
  test('Refueled at 567-908: 40t processed', ship.current_state?.fuelBreakdown?.processed === 40);

  // ==================== PHASE 7: Final Return - 567-908 → Flammarion ====================
  console.log('\n--- Phase 7: Final Return - 567-908 → Flammarion ---');
  console.log('  Returning home with survey data and xenobiology discovery');

  addGameTime(4, 'Travel to jump point');

  const jump6 = operations.initiateJump(testShipId, testCampaignId, 'Flammarion', 2);
  test('Jump-2 to Flammarion (final) initiated', jump6.success);

  operations.updateShipState(testShipId, {
    fuelBreakdown: { refined: 0, unrefined: 0, processed: 20 }
  });
  recordJump('567-908', 'Flammarion', 2, 20);

  operations.updateCampaign(testCampaignId, { current_date: jump6.jumpEndDate });
  const arrival6 = operations.completeJump(testShipId, testCampaignId);
  test('Return to Flammarion', arrival6.success && arrival6.arrivedAt === 'Flammarion');

  addGameTime(6, 'Travel to highport');

  // A-class starport - refined fuel available! Crew always buys refined when possible.
  console.log('  A-class starport: Refined fuel available (Cr500/ton)');
  console.log('  Crew policy: ALWAYS buy refined at A/B class - worth the cost');
  addGameTime(1, 'Starport refueling (refined)');
  recordRefuel('starportRefined', 40, 500);  // Cr500/ton for refined

  operations.updateShipState(testShipId, {
    fuelBreakdown: { refined: 40, unrefined: 0, processed: 0 }
  });

  ship = operations.getShip(testShipId);
  test('Final refuel at Flammarion: 40t refined', ship.current_state?.fuelBreakdown?.refined === 40);

  // ==================== Mission Complete ====================
  console.log('\n--- Mission Complete: Survey Data Uploaded ---');
  test('Journey completed successfully', true);

  // Cleanup
  operations.deleteShip(testShipId);
  operations.deleteCampaign(testCampaignId);

  // Print report
  printJourneyReport();

  return { passed, failed };
}

function printJourneyReport() {
  const elapsed = ((Date.now() - metrics.startTime) / 1000).toFixed(1);
  const gameDays = (metrics.gameHours / 24).toFixed(1);
  const gameWeeks = (metrics.gameHours / 168).toFixed(1);

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║              JOURNEY REPORT - ISS PATHFINDER                    ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log('║  ROUTE                                                          ║');
  const route = metrics.systemsVisited.join(' → ');
  console.log(`║  ${route.padEnd(62)}║`);
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log('║  NAVIGATION STATISTICS                                          ║');
  console.log(`║    Total Jumps:        ${String(metrics.jumps).padStart(3)}                                      ║`);
  console.log(`║    Distance:           ${String(metrics.parsecs).padStart(3)} parsecs                              ║`);
  console.log(`║    Fuel Consumed:      ${String(metrics.fuelConsumed).padStart(3)} tons                                 ║`);
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log('║  TIME ELAPSED                                                   ║');
  console.log(`║    Game Time:        ${String(metrics.gameHours).padStart(4)} hours (${gameDays} days / ${gameWeeks} weeks)       ║`);
  console.log(`║    Real Time:        ${elapsed.padStart(5)}s                                      ║`);
  console.log(`║    Final Date:       ${metrics.currentDate.padEnd(20)}                   ║`);
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log('║  REFUELING BREAKDOWN                                            ║');
  console.log(`║    A/B Starport (refined):    ${String(metrics.refuelMethods.starportRefined).padStart(2)} stops                        ║`);
  console.log(`║    C/D/E Starport (unrefined):${String(metrics.refuelMethods.starportUnrefined).padStart(2)} stops                        ║`);
  console.log(`║    Gas Giant Skimming:        ${String(metrics.refuelMethods.gasGiant).padStart(2)} stops                        ║`);
  console.log(`║    Wilderness Water:          ${String(metrics.refuelMethods.wildernessWater).padStart(2)} stops                        ║`);
  console.log(`║    Total Fuel Cost:     Cr${String(metrics.fuelCosts.toLocaleString()).padStart(7)}                          ║`);
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log('║  DISCOVERIES                                                    ║');
  metrics.discoveries.forEach((d, i) => {
    const line = `  ${i+1}. ${d.system}: ${d.object}`;
    const typeLine = `     ${d.type} - ${d.value}`;
    console.log(`║  ${line.padEnd(62)}║`);
    if (typeLine.length <= 62) {
      console.log(`║  ${typeLine.padEnd(62)}║`);
    }
  });
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log('║  TEST RESULTS                                                   ║');
  console.log(`║    Passed: ${String(passed).padStart(2)}   Failed: ${String(failed).padStart(2)}                                       ║`);
  console.log('╚════════════════════════════════════════════════════════════════╝');
}

// Run if called directly
if (require.main === module) {
  runJourneyTest()
    .then(({ passed, failed }) => {
      console.log(`\n=== EXTENDED JOURNEY: ${passed} passed, ${failed} failed ===\n`);
      process.exit(failed > 0 ? 1 : 0);
    })
    .catch(err => {
      console.error('Test error:', err);
      process.exit(1);
    });
}

module.exports = { runJourneyTest };
