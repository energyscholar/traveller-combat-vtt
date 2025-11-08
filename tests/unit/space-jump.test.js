// ========================================
// STAGE 9.4: JUMP AWAY TESTS
// ========================================

const assert = require('assert');
const { initiateJump, checkJumpStatus, cancelJump, canJump } = require('../../lib/combat');

console.log('\n=== STAGE 9.4: Jump Away Tests ===\n');

console.log('Testing Jump Initiation...');

(function testInitiateJump() {
  const ship = { name: 'Scout', jumpDrive: 2, stance: 'normal' };
  const result = initiateJump(ship);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.jumpCharging, true);
  assert.strictEqual(result.turnsUntilJump, 1);
  console.log('✓ initiating jump sets charging state');
})();

(function testJumpRequiresDrive() {
  const ship = { name: 'Lifeboat', jumpDrive: 0, stance: 'normal' };
  const result = initiateJump(ship);
  assert.strictEqual(result.success, false);
  assert.strictEqual(result.error, 'Ship has no jump drive');
  console.log('✓ jump requires jump drive');
})();

(function testCannotJumpWhileDisabled() {
  const ship = { name: 'Scout', jumpDrive: 2, stance: 'disabled' };
  const result = initiateJump(ship);
  assert.strictEqual(result.success, false);
  assert.strictEqual(result.error, 'Ship is disabled');
  console.log('✓ cannot jump while disabled');
})();

console.log('\nTesting Jump Status...');

(function testJumpStatusCharging() {
  const ship = { name: 'Scout', jumpCharging: true, turnsUntilJump: 1 };
  const status = checkJumpStatus(ship);
  assert.strictEqual(status.charging, true);
  assert.strictEqual(status.ready, false);
  assert.strictEqual(status.turnsRemaining, 1);
  console.log('✓ check jump status while charging');
})();

(function testJumpStatusReady() {
  const ship = { name: 'Scout', jumpCharging: true, turnsUntilJump: 0 };
  const status = checkJumpStatus(ship);
  assert.strictEqual(status.charging, true);
  assert.strictEqual(status.ready, true);
  assert.strictEqual(status.turnsRemaining, 0);
  console.log('✓ check jump status when ready');
})();

(function testJumpStatusNotCharging() {
  const ship = { name: 'Scout', jumpCharging: false };
  const status = checkJumpStatus(ship);
  assert.strictEqual(status.charging, false);
  assert.strictEqual(status.ready, false);
  console.log('✓ check jump status when not charging');
})();

console.log('\nTesting Jump Interruption...');

(function testDamageInterruptsJump() {
  const ship = { name: 'Scout', jumpCharging: true, turnsUntilJump: 1 };
  const result = cancelJump(ship, { reason: 'damage' });
  assert.strictEqual(result.interrupted, true);
  assert.strictEqual(result.reason, 'damage');
  assert.strictEqual(ship.jumpCharging, false);
  console.log('✓ damage interrupts jump charging');
})();

(function testCanCancelJumpManually() {
  const ship = { name: 'Scout', jumpCharging: true, turnsUntilJump: 1 };
  const result = cancelJump(ship, { reason: 'manual' });
  assert.strictEqual(result.interrupted, true);
  assert.strictEqual(result.reason, 'manual');
  console.log('✓ can manually cancel jump');
})();

console.log('\nTesting Jump Execution...');

(function testCanJumpValidation() {
  const ship = { name: 'Scout', jumpDrive: 2, stance: 'normal' };
  const can = canJump(ship);
  assert.strictEqual(can.allowed, true);
  console.log('✓ can jump validation succeeds for valid ship');
})();

(function testCannotJumpWithoutDrive() {
  const ship = { name: 'Lifeboat', jumpDrive: 0 };
  const can = canJump(ship);
  assert.strictEqual(can.allowed, false);
  assert.strictEqual(can.reason, 'No jump drive');
  console.log('✓ cannot jump without drive');
})();

(function testCannotJumpWhenDisabled() {
  const ship = { name: 'Scout', jumpDrive: 2, stance: 'disabled' };
  const can = canJump(ship);
  assert.strictEqual(can.allowed, false);
  assert.strictEqual(can.reason, 'Ship disabled');
  console.log('✓ cannot jump when disabled');
})();

console.log('\n✅ All Stage 9.4 Jump Away tests passed!\n');
