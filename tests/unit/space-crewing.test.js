// ========================================
// STAGE 9.5: MULTI-PLAYER CREWING TESTS
// ========================================

const assert = require('assert');
const {
  assignPlayerToRole,
  canPlayerPerformAction,
  getPlayerRole,
  removePlayerFromCrew,
  getCrewRoster
} = require('../../lib/combat');

console.log('\n=== STAGE 9.5: Multi-Player Crewing Tests ===\n');

console.log('Testing Player Assignment...');

(function testAssignPlayerToPilot() {
  const ship = { name: 'Scout', crew: [] };
  const result = assignPlayerToRole(ship, 'player1', 'pilot', { skill: 2 });
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.role, 'pilot');
  assert.strictEqual(ship.crew.length, 1);
  assert.strictEqual(ship.crew[0].playerId, 'player1');
  console.log('✓ assign player to pilot role');
})();

(function testAssignPlayerToGunner() {
  const ship = { name: 'Scout', crew: [] };
  const result = assignPlayerToRole(ship, 'player2', 'gunner', { skill: 1 });
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.role, 'gunner');
  console.log('✓ assign player to gunner role');
})();

(function testAssignPlayerToEngineer() {
  const ship = { name: 'Scout', crew: [] };
  const result = assignPlayerToRole(ship, 'player3', 'engineer', { skill: 1 });
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.role, 'engineer');
  console.log('✓ assign player to engineer role');
})();

(function testCannotAssignInvalidRole() {
  const ship = { name: 'Scout', crew: [] };
  const result = assignPlayerToRole(ship, 'player1', 'cook', { skill: 2 });
  assert.strictEqual(result.success, false);
  assert.strictEqual(result.error, 'Invalid role: cook');
  console.log('✓ cannot assign invalid role');
})();

(function testOnePilotPerShip() {
  const ship = { name: 'Scout', crew: [{ playerId: 'player1', role: 'pilot', skill: 2 }] };
  const result = assignPlayerToRole(ship, 'player2', 'pilot', { skill: 1 });
  assert.strictEqual(result.success, false);
  assert.strictEqual(result.error, 'Role pilot already filled');
  console.log('✓ only one pilot per ship');
})();

(function testMultipleGunnersAllowed() {
  const ship = { name: 'Scout', crew: [{ playerId: 'player1', role: 'gunner', skill: 1 }] };
  const result = assignPlayerToRole(ship, 'player2', 'gunner', { skill: 1 });
  assert.strictEqual(result.success, true);
  assert.strictEqual(ship.crew.length, 2);
  console.log('✓ multiple gunners allowed');
})();

console.log('\nTesting Role Permissions...');

(function testPilotCanMove() {
  const ship = { name: 'Scout', crew: [{ playerId: 'player1', role: 'pilot', skill: 2 }] };
  const can = canPlayerPerformAction(ship, 'player1', 'move');
  assert.strictEqual(can.allowed, true);
  console.log('✓ pilot can move ship');
})();

(function testGunnerCannotMove() {
  const ship = { name: 'Scout', crew: [{ playerId: 'player1', role: 'gunner', skill: 1 }] };
  const can = canPlayerPerformAction(ship, 'player1', 'move');
  assert.strictEqual(can.allowed, false);
  assert.strictEqual(can.reason, 'Only pilot can move ship');
  console.log('✓ gunner cannot move ship');
})();

(function testGunnerCanFire() {
  const ship = { name: 'Scout', crew: [{ playerId: 'player1', role: 'gunner', skill: 1 }] };
  const can = canPlayerPerformAction(ship, 'player1', 'fire');
  assert.strictEqual(can.allowed, true);
  console.log('✓ gunner can fire weapons');
})();

(function testEngineerCanRepair() {
  const ship = { name: 'Scout', crew: [{ playerId: 'player1', role: 'engineer', skill: 1 }] };
  const can = canPlayerPerformAction(ship, 'player1', 'repair');
  assert.strictEqual(can.allowed, true);
  console.log('✓ engineer can repair');
})();

(function testPilotCannotRepair() {
  const ship = { name: 'Scout', crew: [{ playerId: 'player1', role: 'pilot', skill: 2 }] };
  const can = canPlayerPerformAction(ship, 'player1', 'repair');
  assert.strictEqual(can.allowed, false);
  assert.strictEqual(can.reason, 'Only engineer can repair');
  console.log('✓ pilot cannot repair');
})();

console.log('\nTesting Crew Management...');

(function testGetPlayerRole() {
  const ship = { name: 'Scout', crew: [{ playerId: 'player1', role: 'pilot', skill: 2 }] };
  const role = getPlayerRole(ship, 'player1');
  assert.strictEqual(role, 'pilot');
  console.log('✓ get player role');
})();

(function testGetPlayerRoleNotFound() {
  const ship = { name: 'Scout', crew: [] };
  const role = getPlayerRole(ship, 'player99');
  assert.strictEqual(role, null);
  console.log('✓ get player role returns null if not found');
})();

(function testRemovePlayerFromCrew() {
  const ship = { name: 'Scout', crew: [{ playerId: 'player1', role: 'pilot', skill: 2 }] };
  const result = removePlayerFromCrew(ship, 'player1');
  assert.strictEqual(result.success, true);
  assert.strictEqual(ship.crew.length, 0);
  console.log('✓ remove player from crew');
})();

(function testGetCrewRoster() {
  const ship = {
    name: 'Scout',
    crew: [
      { playerId: 'player1', role: 'pilot', skill: 2 },
      { playerId: 'player2', role: 'gunner', skill: 1 }
    ]
  };
  const roster = getCrewRoster(ship);
  assert.strictEqual(roster.length, 2);
  assert.strictEqual(roster[0].role, 'pilot');
  assert.strictEqual(roster[1].role, 'gunner');
  console.log('✓ get crew roster');
})();

console.log('\n✅ All Stage 9.5 Multi-Player Crewing tests passed!\n');
