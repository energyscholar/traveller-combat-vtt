/**
 * Operations Handler Tests
 * Fast smoke tests for MVC refactor safety net
 *
 * NOTE: These tests verify the operations module functions work correctly.
 * They will be deleted after MVC refactor is stable (per TODO).
 */

const operations = require('../lib/operations');

// Test utilities
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${err.message}`);
    failed++;
  }
}

function assertEqual(actual, expected, msg = '') {
  if (actual !== expected) {
    throw new Error(`${msg} Expected ${expected}, got ${actual}`);
  }
}

function assertExists(value, msg = '') {
  if (value === null || value === undefined) {
    throw new Error(`${msg} Value is null/undefined`);
  }
}

function assertArray(value, msg = '') {
  if (!Array.isArray(value)) {
    throw new Error(`${msg} Expected array, got ${typeof value}`);
  }
}

// ==================== Campaign Tests ====================

console.log('\n=== Operations Handler Tests ===\n');
console.log('--- Campaign Functions ---\n');

let testCampaignId = null;

test('createCampaign creates and returns campaign', () => {
  const campaign = operations.createCampaign('Test Campaign', 'Test GM');
  assertExists(campaign, 'Campaign');
  assertExists(campaign.id, 'Campaign ID');
  assertEqual(campaign.name, 'Test Campaign', 'Name');
  assertEqual(campaign.gm_name, 'Test GM', 'GM Name');
  testCampaignId = campaign.id;
});

test('getCampaign returns campaign by ID', () => {
  const campaign = operations.getCampaign(testCampaignId);
  assertExists(campaign, 'Campaign');
  assertEqual(campaign.id, testCampaignId, 'ID match');
});

test('getAllCampaigns returns array', () => {
  const campaigns = operations.getAllCampaigns();
  assertArray(campaigns, 'Campaigns');
});

test('updateCampaign updates fields', () => {
  const updated = operations.updateCampaign(testCampaignId, {
    current_system: 'Mora'
  });
  assertEqual(updated.current_system, 'Mora', 'System updated');
});

// ==================== Player Account Tests ====================

console.log('\n--- Player Account Functions ---\n');

let testAccountId = null;

test('createPlayerSlot creates player account', () => {
  const account = operations.createPlayerSlot(testCampaignId, 'Alice');
  assertExists(account, 'Account');
  assertExists(account.id, 'Account ID');
  assertEqual(account.slot_name, 'Alice', 'Slot name');
  testAccountId = account.id;
});

test('getPlayerAccount returns account by ID', () => {
  const account = operations.getPlayerAccount(testAccountId);
  assertExists(account, 'Account');
  assertEqual(account.id, testAccountId, 'ID match');
});

test('getPlayerAccountsByCampaign returns array', () => {
  const accounts = operations.getPlayerAccountsByCampaign(testCampaignId);
  assertArray(accounts, 'Accounts');
});

test('importCharacter imports character data', () => {
  const account = operations.importCharacter(testAccountId, {
    name: 'Captain Kirk',
    skills: { pilot: 2, leadership: 3 },
    stats: { DEX: 9, INT: 10 }
  });
  assertExists(account.character_data, 'Character data');
  assertEqual(account.character_name, 'Captain Kirk', 'Character name');
});

test('assignRole assigns role to player', () => {
  const account = operations.assignRole(testAccountId, 'captain');
  assertEqual(account.role, 'captain', 'Role assigned');
});

test('isRoleAvailable returns boolean', () => {
  const available = operations.isRoleAvailable('nonexistent-ship', 'pilot');
  assertEqual(typeof available, 'boolean', 'Returns boolean');
});

// ==================== Ship Tests ====================

console.log('\n--- Ship Functions ---\n');

let testShipId = null;

test('addShip creates ship', () => {
  const ship = operations.addShip(testCampaignId, 'Beowulf', {
    type: 'Free Trader',
    tonnage: 200
  }, { isPartyShip: true });
  assertExists(ship, 'Ship');
  assertExists(ship.id, 'Ship ID');
  assertEqual(ship.name, 'Beowulf', 'Ship name');
  testShipId = ship.id;
});

test('getShip returns ship by ID', () => {
  const ship = operations.getShip(testShipId);
  assertExists(ship, 'Ship');
  assertEqual(ship.id, testShipId, 'ID match');
});

test('getShipsByCampaign returns array', () => {
  const ships = operations.getShipsByCampaign(testCampaignId);
  assertArray(ships, 'Ships');
});

test('getPartyShips returns party ships', () => {
  const ships = operations.getPartyShips(testCampaignId);
  assertArray(ships, 'Party ships');
});

test('updateShipState updates current state', () => {
  const ship = operations.updateShipState(testShipId, { alertStatus: 'YELLOW' });
  assertEqual(ship.current_state.alertStatus, 'YELLOW', 'Alert status');
});

// ==================== NPC Crew Tests ====================

console.log('\n--- NPC Crew Functions ---\n');

let testNPCId = null;

test('addNPCCrew creates NPC', () => {
  const npc = operations.addNPCCrew(testShipId, 'Jenkins', 'engineer', {
    skillLevel: 1
  });
  assertExists(npc, 'NPC');
  assertExists(npc.id, 'NPC ID');
  assertEqual(npc.name, 'Jenkins', 'NPC name');
  testNPCId = npc.id;
});

test('getNPCCrewByShip returns array', () => {
  const crew = operations.getNPCCrewByShip(testShipId);
  assertArray(crew, 'NPC crew');
});

// ==================== Ship Log Tests ====================

console.log('\n--- Ship Log Functions ---\n');

test('addLogEntry creates log entry', () => {
  const entry = operations.addLogEntry(testShipId, testCampaignId, {
    gameDate: '1105-001',
    entryType: 'event',
    message: 'Test log entry',
    actor: 'System'
  });
  assertExists(entry, 'Log entry');
  assertExists(entry.id, 'Entry ID');
});

test('getShipLog returns array', () => {
  const logs = operations.getShipLog(testShipId);
  assertArray(logs, 'Ship logs');
});

// ==================== Full Data Tests ====================

console.log('\n--- Full Campaign Data ---\n');

test('getFullCampaignData returns complete data', () => {
  const data = operations.getFullCampaignData(testCampaignId);
  assertExists(data, 'Full data');
  assertExists(data.campaign, 'Campaign');
  assertArray(data.players, 'Players');
  assertArray(data.ships, 'Ships');
});

// ==================== Constants Tests ====================

console.log('\n--- Constants & Config ---\n');

test('ROLE_VIEWS has all roles', () => {
  assertExists(operations.ROLE_VIEWS, 'ROLE_VIEWS');
  assertExists(operations.ROLE_VIEWS.pilot, 'pilot role');
  assertExists(operations.ROLE_VIEWS.captain, 'captain role');
  assertExists(operations.ROLE_VIEWS.engineer, 'engineer role');
});

test('ALERT_STATUS has all statuses', () => {
  assertExists(operations.ALERT_STATUS, 'ALERT_STATUS');
  assertExists(operations.ALERT_STATUS.NORMAL, 'NORMAL');
  assertExists(operations.ALERT_STATUS.YELLOW, 'YELLOW');
  assertExists(operations.ALERT_STATUS.RED, 'RED');
});

test('ALL_ROLES is array of roles', () => {
  assertArray(operations.ALL_ROLES, 'ALL_ROLES');
});

// ==================== Cleanup ====================

console.log('\n--- Cleanup ---\n');

test('deleteNPCCrew removes NPC', () => {
  operations.deleteNPCCrew(testNPCId);
  const npc = operations.getNPCCrew(testNPCId);
  assertEqual(npc, undefined, 'NPC deleted');
});

test('deleteShip removes ship', () => {
  operations.deleteShip(testShipId);
  const ship = operations.getShip(testShipId);
  assertEqual(ship, undefined, 'Ship deleted');
});

test('deletePlayerSlot removes account', () => {
  operations.deletePlayerSlot(testAccountId);
  const account = operations.getPlayerAccount(testAccountId);
  assertEqual(account, undefined, 'Account deleted');
});

// ==================== AR-21 Campaign CRUD Tests ====================

console.log('\n--- AR-21 Campaign CRUD Functions ---\n');

test('duplicateCampaign creates copy of campaign', () => {
  const newCampaign = operations.duplicateCampaign(testCampaignId);
  assertExists(newCampaign, 'Duplicate created');
  assertEqual(newCampaign.name.includes('(Copy)'), true, 'Has (Copy) suffix');
  assertEqual(newCampaign.id !== testCampaignId, true, 'Has new ID');
  // Clean up
  operations.deleteCampaign(newCampaign.id);
});

test('exportCampaign returns campaign data', () => {
  const exportData = operations.exportCampaign(testCampaignId);
  assertExists(exportData, 'Export data exists');
  assertExists(exportData.manifest, 'Has manifest');
  assertEqual(exportData.manifest.format, 'campaign-json', 'Correct format');
  assertExists(exportData.campaign, 'Has campaign data');
  assertArray(exportData.players, 'Has players array');
  assertArray(exportData.ships, 'Has ships array');
  assertArray(exportData.characters, 'Has characters array');
});

test('importCampaign creates campaign from export data', () => {
  const exportData = operations.exportCampaign(testCampaignId);
  const imported = operations.importCampaign(exportData, 'Test GM');
  assertExists(imported, 'Import created');
  assertEqual(imported.name.includes('(Imported)'), true, 'Has (Imported) suffix');
  assertEqual(imported.gm_name, 'Test GM', 'Has correct GM name');
  // Clean up
  operations.deleteCampaign(imported.id);
});

test('deleteCampaign removes campaign', () => {
  operations.deleteCampaign(testCampaignId);
  const campaign = operations.getCampaign(testCampaignId);
  assertEqual(campaign, undefined, 'Campaign deleted');
});

// ==================== AR-27 Shared Map Tests ====================

console.log('\n--- AR-27 Shared Map Functions ---\n');

// Create a fresh campaign for shared map tests
const mapTestCampaign = operations.createCampaign('Map Test Campaign', 'Test GM');
const mapTestCampaignId = mapTestCampaign.id;

// Import sharedMap module (will fail until module is created - TDD red)
let sharedMap;
try {
  sharedMap = require('../lib/operations/shared-map');
} catch (e) {
  console.log('⚠ shared-map module not found - TDD red phase');
  sharedMap = null;
}

test('shareMap sets campaign map sharing state', () => {
  if (!sharedMap) {
    console.log('  ⏭ Skipped (module not yet created)');
    return;
  }
  const result = sharedMap.shareMap(mapTestCampaignId, { center: 'Regina', zoom: 64 });
  assertEqual(result.shared, true, 'Map is shared');
  assertEqual(result.center, 'Regina', 'Center is set');
});

test('getMapState returns current sharing state', () => {
  if (!sharedMap) {
    console.log('  ⏭ Skipped (module not yet created)');
    return;
  }
  const state = sharedMap.getMapState(mapTestCampaignId);
  assertEqual(state.shared, true, 'Map is still shared');
});

test('unshareMap clears sharing state', () => {
  if (!sharedMap) {
    console.log('  ⏭ Skipped (module not yet created)');
    return;
  }
  sharedMap.unshareMap(mapTestCampaignId);
  const state = sharedMap.getMapState(mapTestCampaignId);
  assertEqual(state.shared, false, 'Map is not shared');
});

test('updateMapView updates center and zoom', () => {
  if (!sharedMap) {
    console.log('  ⏭ Skipped (module not yet created)');
    return;
  }
  sharedMap.shareMap(mapTestCampaignId, { center: 'Mora', zoom: 32 });
  sharedMap.updateMapView(mapTestCampaignId, { center: 'Rhylanor', zoom: 128 });
  const state = sharedMap.getMapState(mapTestCampaignId);
  assertEqual(state.center, 'Rhylanor', 'Center updated');
  assertEqual(state.zoom, 128, 'Zoom updated');
});

// Cleanup
operations.deleteCampaign(mapTestCampaignId);

// ==================== AR-27 Map Cache Tests ====================

console.log('\n--- AR-27 TravellerMap Cache (Stub) ---\n');

// Import mapCache module
let mapCache;
try {
  mapCache = require('../lib/operations/map-cache');
} catch (e) {
  console.log('⚠ map-cache module not found');
  mapCache = null;
}

test('mapCache.isEnabled returns false in test environment', () => {
  if (!mapCache) {
    console.log('  ⏭ Skipped (module not found)');
    return;
  }
  assertEqual(mapCache.isEnabled(), false, 'Cache disabled in non-production');
});

test('mapCache.getCacheKey generates consistent keys', () => {
  if (!mapCache) {
    console.log('  ⏭ Skipped (module not found)');
    return;
  }
  const key1 = mapCache.getCacheKey({ x: 10, y: 20, scale: 64, options: '41975', style: 'poster' });
  const key2 = mapCache.getCacheKey({ x: 10, y: 20, scale: 64, options: '41975', style: 'poster' });
  assertEqual(key1, key2, 'Same params produce same key');
  assertEqual(key1, 'tile:10:20:64:41975:poster', 'Key format correct');
});

test('mapCache.get returns null when disabled', () => {
  if (!mapCache) {
    console.log('  ⏭ Skipped (module not found)');
    return;
  }
  const result = mapCache.get({ x: 10, y: 20, scale: 64 });
  assertEqual(result, null, 'Returns null when disabled');
});

test('mapCache.set is no-op when disabled', () => {
  if (!mapCache) {
    console.log('  ⏭ Skipped (module not found)');
    return;
  }
  mapCache.set({ x: 10, y: 20, scale: 64 }, 'test-data');
  const result = mapCache.get({ x: 10, y: 20, scale: 64 });
  assertEqual(result, null, 'Data not cached when disabled');
});

test('mapCache.getStats returns stats object', () => {
  if (!mapCache) {
    console.log('  ⏭ Skipped (module not found)');
    return;
  }
  const stats = mapCache.getStats();
  assertEqual(typeof stats.entries, 'number', 'Has entries count');
  assertEqual(stats.enabled, false, 'Shows disabled');
  assertExists(stats.config, 'Has config');
});

test('mapCache.buildTileUrl generates correct URL', () => {
  if (!mapCache) {
    console.log('  ⏭ Skipped (module not found)');
    return;
  }
  const url = mapCache.buildTileUrl({ x: 10, y: -5, scale: 64, options: '41975', style: 'poster' });
  assertEqual(url.includes('x=10'), true, 'Has x param');
  assertEqual(url.includes('y=-5'), true, 'Has y param');
  assertEqual(url.includes('scale=64'), true, 'Has scale param');
  assertEqual(url.includes('options=41975'), true, 'Has options param');
  assertEqual(url.includes('style=poster'), true, 'Has style param');
});

test('mapCache.clear clears cache without error', () => {
  if (!mapCache) {
    console.log('  ⏭ Skipped (module not found)');
    return;
  }
  mapCache.clear();
  const stats = mapCache.getStats();
  assertEqual(stats.entries, 0, 'Cache is empty');
});

test('mapCache.configure accepts options', () => {
  if (!mapCache) {
    console.log('  ⏭ Skipped (module not found)');
    return;
  }
  mapCache.configure({ ttlMs: 60000, maxEntries: 500 });
  const stats = mapCache.getStats();
  assertEqual(stats.config.ttlMs, 60000, 'TTL updated');
  assertEqual(stats.config.maxEntries, 500, 'Max entries updated');
  // Reset to defaults
  mapCache.configure({ ttlMs: 24 * 60 * 60 * 1000, maxEntries: 1000 });
});

// Rate limiting tests
test('mapCache.setTestMode blocks external calls', () => {
  if (!mapCache) {
    console.log('  ⏭ Skipped (module not found)');
    return;
  }
  mapCache.setTestMode(true);
  assertEqual(mapCache.isTestMode(), true, 'Test mode enabled');
  assertEqual(mapCache.canMakeRequest(), false, 'Requests blocked in test mode');
  mapCache.setTestMode(false);
  mapCache.resetRateLimiter();
});

test('mapCache.canMakeRequest respects rate limit', () => {
  if (!mapCache) {
    console.log('  ⏭ Skipped (module not found)');
    return;
  }
  mapCache.resetRateLimiter();
  assertEqual(mapCache.canMakeRequest(), true, 'Can make request when under limit');
});

test('mapCache.getRateLimiterStats returns stats', () => {
  if (!mapCache) {
    console.log('  ⏭ Skipped (module not found)');
    return;
  }
  mapCache.resetRateLimiter();
  const stats = mapCache.getRateLimiterStats();
  assertEqual(typeof stats.requestsInWindow, 'number', 'Has request count');
  assertEqual(typeof stats.maxRequests, 'number', 'Has max requests');
  assertEqual(typeof stats.canMakeRequest, 'boolean', 'Has canMakeRequest');
  assertEqual(stats.testMode, false, 'Test mode is off');
});

test('mapCache.resetRateLimiter clears state', () => {
  if (!mapCache) {
    console.log('  ⏭ Skipped (module not found)');
    return;
  }
  mapCache.resetRateLimiter();
  const stats = mapCache.getRateLimiterStats();
  assertEqual(stats.requestsInWindow, 0, 'Requests cleared');
  assertEqual(stats.isHealthy, true, 'Health reset');
});

// ==================== Tile Proxy Tests ====================

console.log('\n--- TravellerMap Tile Proxy ---\n');

let tileProxy;
try {
  tileProxy = require('../lib/operations/tile-proxy');
} catch (e) {
  console.log('⚠ tile-proxy module not found');
  tileProxy = null;
}

test('tileProxy.getCacheKey generates consistent keys', () => {
  if (!tileProxy) {
    console.log('  ⏭ Skipped (module not found)');
    return;
  }
  const key1 = tileProxy.getCacheKey({ x: 10, y: -5, scale: 64 });
  const key2 = tileProxy.getCacheKey({ x: 10, y: -5, scale: 64 });
  assertEqual(key1, key2, 'Same params produce same key');
  assertEqual(key1.startsWith('tile_'), true, 'Key has tile_ prefix');
  assertEqual(key1.endsWith('.png'), true, 'Key has .png suffix');
});

test('tileProxy.buildTileUrl generates correct URL', () => {
  if (!tileProxy) {
    console.log('  ⏭ Skipped (module not found)');
    return;
  }
  const url = tileProxy.buildTileUrl({ x: 10, y: -5, scale: 64, options: '41975', style: 'poster' });
  assertEqual(url.includes('travellermap.com'), true, 'Has travellermap domain');
  assertEqual(url.includes('x=10'), true, 'Has x param');
  assertEqual(url.includes('y=-5'), true, 'Has y param');
  assertEqual(url.includes('scale=64'), true, 'Has scale param');
});

test('tileProxy.isEnabled returns true by default', () => {
  if (!tileProxy) {
    console.log('  ⏭ Skipped (module not found)');
    return;
  }
  assertEqual(tileProxy.isEnabled(), true, 'Cache enabled by default');
});

test('tileProxy.setEnabled toggles cache', () => {
  if (!tileProxy) {
    console.log('  ⏭ Skipped (module not found)');
    return;
  }
  tileProxy.setEnabled(false);
  assertEqual(tileProxy.isEnabled(), false, 'Cache disabled');
  tileProxy.setEnabled(true);
  assertEqual(tileProxy.isEnabled(), true, 'Cache re-enabled');
});

test('tileProxy.getStats returns stats object', () => {
  if (!tileProxy) {
    console.log('  ⏭ Skipped (module not found)');
    return;
  }
  const stats = tileProxy.getStats();
  assertEqual(typeof stats.hits, 'number', 'Has hits count');
  assertEqual(typeof stats.misses, 'number', 'Has misses count');
  assertEqual(typeof stats.enabled, 'boolean', 'Has enabled flag');
});

test('tileProxy.getCacheInfo returns cache info', () => {
  if (!tileProxy) {
    console.log('  ⏭ Skipped (module not found)');
    return;
  }
  const info = tileProxy.getCacheInfo();
  assertEqual(typeof info.tileCount, 'number', 'Has tile count');
  assertEqual(typeof info.totalSizeBytes, 'number', 'Has total size');
  assertExists(info.cacheDir, 'Has cache dir');
});

// ==================== Summary ====================

console.log('\n==================================================');
console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log('==================================================');

if (failed > 0) {
  process.exit(1);
}
