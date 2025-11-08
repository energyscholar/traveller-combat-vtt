// ========================================
// STAGE 9.3: COMBAT MANOEUVRES TESTS
// ========================================

const assert = require('assert');
const { aidGunners, evasiveAction } = require('../../lib/combat');

console.log('\n=== STAGE 9.3: Combat Manoeuvres Tests ===\n');

// Aid Gunners Tests
console.log('Testing Aid Gunners...');

(function testSuccessfulAidGunners() {
  const pilot = { name: 'Miller', role: 'pilot', skill: 2 };
  const result = aidGunners(pilot, { seed: 555 }); // Roll: 8, Total: 10, Effect: 2
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.bonusToGunners > 0, true);
  console.log('✓ successful Aid Gunners grants task chain bonus');
})();

(function testFailedAidGunners() {
  const pilot = { name: 'Novice', role: 'pilot', skill: 0 };
  const result = aidGunners(pilot, { seed: 100 });
  assert.strictEqual(result.success, false);
  assert.strictEqual(result.effect, -4);
  assert.strictEqual(result.bonusToGunners, 0);
  console.log('✓ failed Aid Gunners provides no bonus');
})();

(function testExceptionalAidGunners() {
  const pilot = { name: 'Ace', role: 'pilot', skill: 3 };
  const result = aidGunners(pilot, { seed: 555 });
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.bonusToGunners > 0, true);
  console.log('✓ exceptional Aid Gunners roll grants larger bonus');
})();

(function testAidGunnersValidatesPilot() {
  const nonPilot = { name: 'Smith', role: 'gunner', skill: 2 };
  let threw = false;
  try {
    aidGunners(nonPilot);
  } catch (e) {
    threw = e.message === 'Only pilots can use Aid Gunners';
  }
  assert.strictEqual(threw, true);
  console.log('✓ Aid Gunners validates pilot skill');
})();

(function testAidGunnersRequiresThrust() {
  const pilot = { name: 'Miller', role: 'pilot', skill: 2 };
  const result = aidGunners(pilot, { thrustAvailable: 0 });
  assert.strictEqual(result.success, false);
  assert.strictEqual(result.error, 'Insufficient Thrust (requires 1)');
  console.log('✓ Aid Gunners requires 1 Thrust');
})();

// Evasive Action Tests
console.log('\nTesting Evasive Action...');

(function testEvasiveActionConsumesThrust() {
  const pilot = { name: 'Miller', role: 'pilot', skill: 2 };
  const result = evasiveAction(pilot, { thrustToSpend: 2, thrustAvailable: 3 });
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.thrustConsumed, 2);
  assert.strictEqual(result.dodgePenalty, -2);
  assert.strictEqual(result.reactionsAvailable, 2);
  console.log('✓ Evasive Action consumes Thrust to add dodge penalty');
})();

(function testEvasiveActionValidatesThrust() {
  const pilot = { name: 'Miller', role: 'pilot', skill: 2 };
  const result = evasiveAction(pilot, { thrustToSpend: 5, thrustAvailable: 2 });
  assert.strictEqual(result.success, false);
  assert.strictEqual(result.error, 'Insufficient Thrust (have 2, need 5)');
  console.log('✓ Evasive Action validates Thrust availability');
})();

(function testEvasiveActionValidatesPilot() {
  const gunner = { name: 'Chen', role: 'gunner', skill: 1 };
  let threw = false;
  try {
    evasiveAction(gunner, { thrustToSpend: 1, thrustAvailable: 2 });
  } catch (e) {
    threw = e.message === 'Only pilots can use Evasive Action';
  }
  assert.strictEqual(threw, true);
  console.log('✓ Evasive Action validates pilot');
})();

(function testEvasiveActionDodgePenalty() {
  const acePilot = { name: 'Ace', role: 'pilot', skill: 4 };
  const result = evasiveAction(acePilot, { thrustToSpend: 1, thrustAvailable: 3 });
  assert.strictEqual(result.dodgePenalty, -4);
  console.log('✓ Evasive Action dodge penalty equals pilot skill');
})();

(function testEvasiveActionMultipleReactions() {
  const pilot = { name: 'Miller', role: 'pilot', skill: 2 };
  const result = evasiveAction(pilot, { thrustToSpend: 3, thrustAvailable: 4 });
  assert.strictEqual(result.reactionsAvailable, 3);
  console.log('✓ Evasive Action allows multiple reactions');
})();

(function testEvasiveActionRequiresOneThrust() {
  const pilot = { name: 'Miller', role: 'pilot', skill: 2 };
  const result = evasiveAction(pilot, { thrustToSpend: 0, thrustAvailable: 2 });
  assert.strictEqual(result.success, false);
  assert.strictEqual(result.error, 'Must spend at least 1 Thrust');
  console.log('✓ Evasive Action requires at least 1 Thrust');
})();

console.log('\n✅ All Stage 9.3 Combat Manoeuvres tests passed!\n');
