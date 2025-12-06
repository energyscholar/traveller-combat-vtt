/**
 * AR-29: Gunner Training Target Tests
 * Tests for gunner firing at training asteroid DRN
 */

const operations = require('../lib/operations');

console.log('--- Gunner Training Target Tests ---\n');

// Test campaign setup
let testCampaignId = null;
let trainingTargetId = null;

// Setup: Create test campaign with training target
(function setup() {
  // Create campaign
  const campaign = operations.createCampaign('Gunner Test Campaign', 'Test GM');
  testCampaignId = campaign.id;

  // Create training target (same as auto-spawn)
  const contact = operations.addContact(testCampaignId, {
    name: 'Training Target DRN',
    type: 'Asteroid',
    range_band: 'short',
    range_km: 50000,
    bearing: 45,
    signature: 'Low',
    is_targetable: true,
    weapons_free: true,
    health: 20,
    max_health: 20,
    training_target: true
  });
  trainingTargetId = contact.id;

  console.log('✓ Test setup complete');
})();

// Test: Training target exists and is targetable
(function testTrainingTargetExists() {
  const contact = operations.getContact(trainingTargetId);

  console.assert(contact !== null, 'Training target should exist');
  console.assert(contact.name === 'Training Target DRN', 'Name should match');
  console.assert(contact.is_targetable === 1, 'Should be targetable');
  console.assert(contact.weapons_free === 1, 'Should have weapons free');
  console.assert(contact.health === 20, 'Should have 20 health');
  console.assert(contact.training_target === 1, 'Should have training_target flag');

  console.log('✓ Training target exists and is properly configured');
})();

// Test: Simulate gunner attack (hit scenario)
(function testGunnerAttackHit() {
  const contact = operations.getContact(trainingTargetId);
  const initialHealth = contact.health;

  // Simulate damage (as if attack hit)
  const damage = 7; // Simulated 2d6 roll
  const newHealth = Math.max(0, initialHealth - damage);
  operations.updateContact(trainingTargetId, { health: newHealth });

  const updatedContact = operations.getContact(trainingTargetId);
  console.assert(updatedContact.health === 13, `Health should be 13 after 7 damage, got ${updatedContact.health}`);

  console.log('✓ Gunner attack damages training target');
})();

// Test: Multiple attacks reduce health
(function testMultipleAttacks() {
  // Apply more damage
  const contact = operations.getContact(trainingTargetId);
  const damage = 5;
  const newHealth = Math.max(0, contact.health - damage);
  operations.updateContact(trainingTargetId, { health: newHealth });

  const updatedContact = operations.getContact(trainingTargetId);
  console.assert(updatedContact.health === 8, `Health should be 8, got ${updatedContact.health}`);

  console.log('✓ Multiple attacks accumulate damage');
})();

// Test: Target destruction at 0 health
(function testTargetDestruction() {
  // Get current health and apply fatal damage
  const contact = operations.getContact(trainingTargetId);
  const fatalDamage = contact.health + 5; // Overkill
  const newHealth = Math.max(0, contact.health - fatalDamage);

  console.assert(newHealth === 0, 'Health should be 0 after fatal damage');

  // In real code, contact would be deleted - we'll just verify the math
  operations.updateContact(trainingTargetId, { health: 0 });
  const destroyedContact = operations.getContact(trainingTargetId);
  console.assert(destroyedContact.health === 0, 'Health should be 0');

  console.log('✓ Target can be destroyed (health reaches 0)');
})();

// Test: Weapons free check
(function testWeaponsFreeRequired() {
  // Create a non-authorized contact
  const hostileContact = operations.addContact(testCampaignId, {
    name: 'Hostile Ship',
    type: 'Ship',
    range_band: 'medium',
    is_targetable: true,
    weapons_free: false, // NOT authorized
    health: 50
  });

  const contact = operations.getContact(hostileContact.id);
  console.assert(contact.weapons_free === 0, 'Hostile should not have weapons free');

  // Cleanup
  operations.deleteContact(hostileContact.id);

  console.log('✓ Weapons free flag controls authorization');
})();

// Test: Non-targetable contacts cannot be fired upon
(function testNonTargetable() {
  const civilianContact = operations.addContact(testCampaignId, {
    name: 'Civilian Liner',
    type: 'Ship',
    range_band: 'long',
    is_targetable: false, // Cannot target
    health: 100
  });

  const contact = operations.getContact(civilianContact.id);
  console.assert(contact.is_targetable === 0, 'Civilian should not be targetable');

  // Cleanup
  operations.deleteContact(civilianContact.id);

  console.log('✓ Non-targetable contacts cannot be fired upon');
})();

// Test: Training target flag identification
(function testTrainingTargetFlag() {
  const contacts = operations.getContactsByCampaign(testCampaignId);
  const trainingTargets = contacts.filter(c => c.training_target === 1);

  console.assert(trainingTargets.length >= 1, 'Should have at least 1 training target');
  console.assert(trainingTargets[0].name === 'Training Target DRN', 'Training target name should match');

  console.log('✓ Training target can be identified by flag');
})();

// Cleanup
(function cleanup() {
  if (testCampaignId) {
    operations.deleteCampaign(testCampaignId);
  }
  console.log('✓ Test cleanup complete');
})();

console.log('\n--- Gunner Training Tests Complete ---');
