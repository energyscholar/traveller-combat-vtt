/**
 * Test Cleanup Utility
 * Ensures all test campaigns are deleted after test runs
 *
 * Usage:
 *   const cleanup = require('./test-cleanup');
 *   cleanup.registerCampaign(campaignId);  // Track for cleanup
 *   cleanup.run();  // Delete all tracked + any stale test campaigns
 */

const operations = require('../lib/operations');

// Track campaigns created during tests
const trackedCampaigns = new Set();

/**
 * Register a campaign for cleanup
 * @param {string} campaignId
 */
function registerCampaign(campaignId) {
  if (campaignId) {
    trackedCampaigns.add(campaignId);
  }
}

/**
 * Delete all test campaigns (tracked + pattern-matched)
 * Patterns: "Test", "test", "TEST", temp IDs, etc.
 */
function run() {
  const allCampaigns = operations.getAllCampaigns();
  let deleted = 0;

  // Test campaign name patterns
  const testPatterns = [
    /^test/i,
    /test$/i,
    /\btest\b/i,
    /^temp/i,
    /^debug/i,
    /^demo/i,
    /gunner.*test/i,
    /captain.*test/i,
    /pilot.*test/i,
    /engineer.*test/i,
    /sensor.*test/i,
    /refuel.*test/i,
    /jump.*test/i,
    /combat.*test/i,
    /ship.*test/i
  ];

  for (const campaign of allCampaigns) {
    const shouldDelete =
      trackedCampaigns.has(campaign.id) ||
      testPatterns.some(p => p.test(campaign.name)) ||
      testPatterns.some(p => p.test(campaign.gm_name || ''));

    if (shouldDelete) {
      try {
        operations.deleteCampaign(campaign.id);
        deleted++;
      } catch (e) {
        // Ignore errors during cleanup
      }
    }
  }

  trackedCampaigns.clear();
  return deleted;
}

/**
 * Get count of test campaigns that would be cleaned
 */
function countTestCampaigns() {
  const allCampaigns = operations.getAllCampaigns();
  const testPatterns = [
    /^test/i, /test$/i, /\btest\b/i, /^temp/i, /^debug/i, /^demo/i
  ];

  return allCampaigns.filter(c =>
    trackedCampaigns.has(c.id) ||
    testPatterns.some(p => p.test(c.name)) ||
    testPatterns.some(p => p.test(c.gm_name || ''))
  ).length;
}

// Run cleanup if executed directly
if (require.main === module) {
  const deleted = run();
  console.log(`Test cleanup: ${deleted} campaigns deleted`);
}

module.exports = {
  registerCampaign,
  run,
  countTestCampaigns
};
