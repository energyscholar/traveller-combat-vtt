/**
 * Sandcaster Unit Tests - Stage 11
 *
 * Tests for sandcaster defensive mechanics:
 * - Reaction defense against laser attacks
 * - Armor bonus calculation (1D + Effect)
 * - Missile interception
 * - Ammo tracking
 * - Range restrictions (adjacent/close only)
 */

const { useSandcaster, canUseSandcaster, interceptMissile } = require('../../lib/weapons/sandcasters');

console.log('========================================');
console.log('STAGE 11: SANDCASTER MECHANICS TESTS');
console.log('========================================\n');

let passedTests = 0;
let failedTests = 0;

// ========================================
// 1. Basic Sandcaster Defense
// ========================================

console.log('--- BASIC SANDCASTER DEFENSE (5 tests) ---\n');

function testNoAmmoFails() {
  const result = useSandcaster({
    gunnerSkill: 1,
    attackType: 'laser',
    ammoRemaining: 0
  });

  if (result.success !== false) {
    throw new Error('Should fail with no ammo');
  }

  if (result.reason !== 'no_ammo') {
    throw new Error(`Expected reason 'no_ammo', got '${result.reason}'`);
  }

  if (result.armorBonus !== 0) {
    throw new Error(`Expected armor bonus 0, got ${result.armorBonus}`);
  }

  console.log('✓ Sandcaster fails with no ammo');
  passedTests++;
}

function testAmmoConsumption() {
  const result = useSandcaster({
    gunnerSkill: 1,
    attackType: 'laser',
    ammoRemaining: 20
  });

  if (result.ammoUsed !== 1) {
    throw new Error(`Expected 1 ammo used, got ${result.ammoUsed}`);
  }

  console.log('✓ Sandcaster consumes 1 ammo per use');
  passedTests++;
}

function testAmmoConsumedOnFailure() {
  // Run multiple times to get at least one failure
  let foundFailure = false;

  for (let i = 0; i < 100; i++) {
    const result = useSandcaster({
      gunnerSkill: 0,
      attackType: 'laser',
      ammoRemaining: 20
    });

    if (!result.success) {
      foundFailure = true;
      if (result.reason !== 'failed_check') {
        throw new Error(`Expected reason 'failed_check', got '${result.reason}'`);
      }
      if (result.ammoUsed !== 1) {
        throw new Error('Ammo should be consumed even on failure');
      }
      break;
    }
  }

  if (!foundFailure) {
    throw new Error('Should have at least one failure in 100 attempts');
  }

  console.log('✓ Ammo consumed even on failed check');
  passedTests++;
}

function testSuccessReturnsArmorBonus() {
  // Run multiple times to get at least one success
  let foundSuccess = false;

  for (let i = 0; i < 100; i++) {
    const result = useSandcaster({
      gunnerSkill: 3,
      attackType: 'laser',
      ammoRemaining: 20
    });

    if (result.success) {
      foundSuccess = true;

      if (result.armorBonus <= 0) {
        throw new Error('Armor bonus should be > 0 on success');
      }

      if (result.effect < 0) {
        throw new Error('Effect should be >= 0 on success');
      }

      if (result.bonusDie < 1 || result.bonusDie > 6) {
        throw new Error(`Bonus die should be 1-6, got ${result.bonusDie}`);
      }

      break;
    }
  }

  if (!foundSuccess) {
    throw new Error('Should have at least one success with skill 3');
  }

  console.log('✓ Success returns armor bonus');
  passedTests++;
}

function testArmorBonusCalculation() {
  // Run multiple successful attempts
  let successCount = 0;

  for (let i = 0; i < 100; i++) {
    const result = useSandcaster({
      gunnerSkill: 4,
      attackType: 'laser',
      ammoRemaining: 20
    });

    if (result.success) {
      successCount++;

      // Check armor bonus = bonusDie + effect
      if (result.armorBonus !== result.bonusDie + result.effect) {
        throw new Error(`Armor bonus calculation wrong: ${result.armorBonus} != ${result.bonusDie} + ${result.effect}`);
      }

      // Check bonusDie range
      if (result.bonusDie < 1 || result.bonusDie > 6) {
        throw new Error(`Bonus die out of range: ${result.bonusDie}`);
      }

      // Check effect calculation
      if (result.effect !== result.total - 8) {
        throw new Error(`Effect calculation wrong: ${result.effect} != ${result.total} - 8`);
      }
    }
  }

  if (successCount < 50) {
    throw new Error(`Expected >50 successes with skill 4, got ${successCount}`);
  }

  console.log('✓ Armor bonus calculated as 1D + Effect');
  passedTests++;
}

// ========================================
// 2. Range Restrictions
// ========================================

console.log('\n--- RANGE RESTRICTIONS (7 tests) ---\n');

function testAdjacentRangeAllowed() {
  if (!canUseSandcaster('adjacent')) {
    throw new Error('Sandcaster should work at adjacent range');
  }
  console.log('✓ Sandcaster allowed at adjacent range');
  passedTests++;
}

function testCloseRangeAllowed() {
  if (!canUseSandcaster('close')) {
    throw new Error('Sandcaster should work at close range');
  }
  console.log('✓ Sandcaster allowed at close range');
  passedTests++;
}

function testShortRangeNotAllowed() {
  if (canUseSandcaster('short')) {
    throw new Error('Sandcaster should not work at short range');
  }
  console.log('✓ Sandcaster not allowed at short range');
  passedTests++;
}

function testMediumRangeNotAllowed() {
  if (canUseSandcaster('medium')) {
    throw new Error('Sandcaster should not work at medium range');
  }
  console.log('✓ Sandcaster not allowed at medium range');
  passedTests++;
}

function testLongRangeNotAllowed() {
  if (canUseSandcaster('long')) {
    throw new Error('Sandcaster should not work at long range');
  }
  console.log('✓ Sandcaster not allowed at long range');
  passedTests++;
}

function testVeryLongRangeNotAllowed() {
  if (canUseSandcaster('very_long')) {
    throw new Error('Sandcaster should not work at very_long range');
  }
  console.log('✓ Sandcaster not allowed at very_long range');
  passedTests++;
}

function testDistantRangeNotAllowed() {
  if (canUseSandcaster('distant')) {
    throw new Error('Sandcaster should not work at distant range');
  }
  console.log('✓ Sandcaster not allowed at distant range');
  passedTests++;
}

// ========================================
// 3. Missile Interception
// ========================================

console.log('\n--- MISSILE INTERCEPTION (5 tests) ---\n');

function testInterceptNoAmmo() {
  const result = interceptMissile({
    gunnerSkill: 1,
    ammoRemaining: 0
  });

  if (result.success !== false) {
    throw new Error('Interception should fail with no ammo');
  }

  if (result.intercepted !== false) {
    throw new Error('Should not intercept with no ammo');
  }

  if (result.reason !== 'no_ammo') {
    throw new Error(`Expected reason 'no_ammo', got '${result.reason}'`);
  }

  console.log('✓ Missile interception fails with no ammo');
  passedTests++;
}

function testInterceptConsumesAmmo() {
  const result = interceptMissile({
    gunnerSkill: 1,
    ammoRemaining: 20
  });

  if (result.ammoUsed !== 1) {
    throw new Error(`Expected 1 ammo used, got ${result.ammoUsed}`);
  }

  console.log('✓ Missile interception consumes 1 ammo');
  passedTests++;
}

function testInterceptSuccessAndFailure() {
  const results = { intercepted: 0, missed: 0 };

  for (let i = 0; i < 100; i++) {
    const result = interceptMissile({
      gunnerSkill: 1,
      ammoRemaining: 20
    });

    if (result.success !== true) {
      throw new Error('Interception attempt should succeed (return result)');
    }

    if (result.intercepted) {
      results.intercepted++;
    } else {
      results.missed++;
    }
  }

  if (results.intercepted === 0) {
    throw new Error('Should have at least one interception');
  }

  if (results.missed === 0) {
    throw new Error('Should have at least one miss');
  }

  console.log('✓ Missile interception has both successes and misses');
  passedTests++;
}

function testInterceptTarget() {
  // With skill 5, should intercept most missiles
  let interceptions = 0;

  for (let i = 0; i < 100; i++) {
    const result = interceptMissile({
      gunnerSkill: 5,
      ammoRemaining: 20
    });

    if (result.intercepted) {
      interceptions++;
      if (result.total < 8) {
        throw new Error(`Interception succeeded with total ${result.total} < 8`);
      }
    }
  }

  if (interceptions < 70) {
    throw new Error(`Expected >70 interceptions with skill 5, got ${interceptions}`);
  }

  console.log('✓ High skill increases interception rate');
  passedTests++;
}

function testInterceptRollData() {
  const result = interceptMissile({
    gunnerSkill: 2,
    ammoRemaining: 20
  });

  if (!result.roll) {
    throw new Error('Interception should return roll data');
  }

  if (!result.total) {
    throw new Error('Interception should return total');
  }

  console.log('✓ Interception returns roll data');
  passedTests++;
}

// ========================================
// 4. Skill Impact
// ========================================

console.log('\n--- SKILL IMPACT (2 tests) ---\n');

function testHigherSkillImproves() {
  const lowSkill = { successes: 0 };
  const highSkill = { successes: 0 };

  // Test low skill (0)
  for (let i = 0; i < 100; i++) {
    const result = useSandcaster({
      gunnerSkill: 0,
      attackType: 'laser',
      ammoRemaining: 20
    });

    if (result.success) lowSkill.successes++;
  }

  // Test high skill (4)
  for (let i = 0; i < 100; i++) {
    const result = useSandcaster({
      gunnerSkill: 4,
      attackType: 'laser',
      ammoRemaining: 20
    });

    if (result.success) highSkill.successes++;
  }

  if (highSkill.successes <= lowSkill.successes) {
    throw new Error(`High skill should have more successes: ${highSkill.successes} vs ${lowSkill.successes}`);
  }

  // Verify reasonable ranges
  if (lowSkill.successes < 25 || lowSkill.successes > 60) {
    throw new Error(`Low skill successes out of expected range: ${lowSkill.successes}`);
  }

  if (highSkill.successes < 80) {
    throw new Error(`High skill successes too low: ${highSkill.successes}`);
  }

  console.log('✓ Higher skill improves success rate');
  passedTests++;
}

function testAttackTypeTracked() {
  // Test laser attack
  for (let i = 0; i < 20; i++) {
    const result = useSandcaster({
      gunnerSkill: 3,
      attackType: 'laser',
      ammoRemaining: 20
    });

    if (result.success) {
      if (result.attackType !== 'laser') {
        throw new Error(`Expected attackType 'laser', got '${result.attackType}'`);
      }
      break;
    }
  }

  // Test missile defense
  for (let i = 0; i < 20; i++) {
    const result = useSandcaster({
      gunnerSkill: 3,
      attackType: 'missile',
      ammoRemaining: 20
    });

    if (result.success) {
      if (result.attackType !== 'missile') {
        throw new Error(`Expected attackType 'missile', got '${result.attackType}'`);
      }
      break;
    }
  }

  console.log('✓ Attack type tracked in result');
  passedTests++;
}

// ========================================
// RUN ALL TESTS
// ========================================

try {
  // Basic defense
  testNoAmmoFails();
  testAmmoConsumption();
  testAmmoConsumedOnFailure();
  testSuccessReturnsArmorBonus();
  testArmorBonusCalculation();

  // Range restrictions
  testAdjacentRangeAllowed();
  testCloseRangeAllowed();
  testShortRangeNotAllowed();
  testMediumRangeNotAllowed();
  testLongRangeNotAllowed();
  testVeryLongRangeNotAllowed();
  testDistantRangeNotAllowed();

  // Missile interception
  testInterceptNoAmmo();
  testInterceptConsumesAmmo();
  testInterceptSuccessAndFailure();
  testInterceptTarget();
  testInterceptRollData();

  // Skill impact
  testHigherSkillImproves();
  testAttackTypeTracked();

  console.log('\n========================================');
  console.log('SANDCASTER TEST RESULTS');
  console.log('========================================');
  console.log(`PASSED: ${passedTests}/19`);
  console.log(`FAILED: ${failedTests}/19`);
  console.log('\nALL TESTS PASSED ✅');
  console.log('========================================');
  console.log('Sandcaster mechanics verified!');
  console.log('Ready for Stage 11 integration!');
} catch (error) {
  failedTests++;
  console.error('\n❌ TEST FAILED:', error.message);
  console.error('\n========================================');
  console.error('SANDCASTER TEST RESULTS');
  console.error('========================================');
  console.error(`PASSED: ${passedTests}/19`);
  console.error(`FAILED: ${failedTests}/19`);
  process.exit(1);
}
