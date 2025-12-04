#!/usr/bin/env node
/**
 * Download TravellerMap fixture tiles for testing
 *
 * Usage: node scripts/download-map-fixtures.js
 *
 * Downloads a small set of tiles for Spinward Marches region
 * to enable testing without network calls.
 */

const tileProxy = require('../lib/operations/tile-proxy');

// Spinward Marches approximate coordinates at different zoom levels
const FIXTURE_TILES = [
  // Zoom 64 - sector level
  { x: -40, y: 30, scale: 64, options: '41975', style: 'poster' },
  { x: -39, y: 30, scale: 64, options: '41975', style: 'poster' },
  { x: -40, y: 31, scale: 64, options: '41975', style: 'poster' },
  { x: -39, y: 31, scale: 64, options: '41975', style: 'poster' },

  // Zoom 128 - subsector level
  { x: -80, y: 60, scale: 128, options: '41975', style: 'poster' },
  { x: -79, y: 60, scale: 128, options: '41975', style: 'poster' },

  // Zoom 32 - wider view
  { x: -20, y: 15, scale: 32, options: '41975', style: 'poster' },
  { x: -19, y: 15, scale: 32, options: '41975', style: 'poster' },
];

async function downloadFixtures() {
  console.log('Downloading TravellerMap fixture tiles...\n');
  console.log('This will make a few requests to travellermap.com');
  console.log('Please be patient and respectful of the API.\n');

  let downloaded = 0;
  let failed = 0;

  for (const tile of FIXTURE_TILES) {
    try {
      console.log(`Downloading tile: x=${tile.x}, y=${tile.y}, scale=${tile.scale}...`);
      const result = await tileProxy.saveFixture(tile);
      console.log(`  ✓ Saved: ${result.key} (${(result.size / 1024).toFixed(1)} KB)`);
      downloaded++;

      // Rate limit: wait 500ms between requests
      await new Promise(r => setTimeout(r, 500));
    } catch (error) {
      console.log(`  ✗ Failed: ${error.message}`);
      failed++;
    }
  }

  console.log(`\nDone! Downloaded: ${downloaded}, Failed: ${failed}`);
  console.log(`Fixtures saved to: data/map-fixtures/`);
}

// Run if called directly
if (require.main === module) {
  downloadFixtures().catch(console.error);
}

module.exports = { downloadFixtures, FIXTURE_TILES };
