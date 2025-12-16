#!/usr/bin/env node
/**
 * Convert star system locations from old object format to new array format
 *
 * Old format:
 * "locations": {
 *   "default": "mainworld-id",
 *   "starport": "mainworld-id",
 *   "orbit": "mainworld-id"
 * }
 *
 * New format:
 * "locations": [
 *   { "id": "loc-exit-jump", "name": "Exit Jump Space", "type": "jump_point", ... },
 *   { "id": "loc-orbit-mainworld", "name": "Orbit", "type": "orbit", "linkedTo": "mainworld-id", ... },
 *   { "id": "loc-dock-starport", "name": "Starport", "type": "dock", "linkedTo": "mainworld-id", ... }
 * ]
 */

const fs = require('fs');
const path = require('path');

const SYSTEMS_DIR = path.join(__dirname, '../data/star-systems');

function convertSystem(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const system = JSON.parse(content);

  // Skip if already in new format (array)
  if (Array.isArray(system.locations)) {
    return { skipped: true, name: system.name };
  }

  // Skip if no locations at all
  if (!system.locations) {
    return { skipped: true, name: system.name, reason: 'no locations' };
  }

  const oldLocations = system.locations;
  const mainworldId = oldLocations.default || oldLocations.starport || oldLocations.orbit;

  // Find mainworld celestial object for info
  const mainworld = system.celestialObjects?.find(obj => obj.id === mainworldId);
  const starId = system.celestialObjects?.find(obj => obj.type === 'Star')?.id;

  // Generate standard locations array
  const newLocations = [
    {
      id: 'loc-exit-jump',
      name: 'Exit Jump Space',
      type: 'jump_point',
      x: 100,
      y: 300,
      actions: ['scan', 'plot_course']
    },
    {
      id: 'loc-system-jump',
      name: 'System Departure Jump Point',
      type: 'jump_point',
      linkedTo: starId || mainworldId,
      x: 50,
      y: 150,
      actions: ['jump', 'scan'],
      travelTimeHours: {
        'loc-exit-jump': 6,
        'loc-mainworld-jump': 8
      }
    },
    {
      id: 'loc-mainworld-jump',
      name: 'Mainworld Departure Jump Point',
      type: 'jump_point',
      linkedTo: mainworldId,
      x: 500,
      y: 280,
      actions: ['jump', 'scan'],
      travelTimeHours: {
        'loc-orbit-mainworld': 4
      }
    },
    {
      id: 'loc-orbit-mainworld',
      name: `Orbit - ${mainworld?.name || system.name}`,
      type: 'orbit',
      linkedTo: mainworldId,
      x: 450,
      y: 300,
      actions: ['scan', 'dock', 'land'],
      travelTimeHours: {
        'loc-mainworld-jump': 4,
        'loc-dock-highport': 1,
        'loc-surface-starport': 2
      }
    }
  ];

  // Add highport if starport class A-D
  const uwp = system.uwp || mainworld?.uwp || 'X000000-0';
  const starportClass = uwp[0];

  if (['A', 'B', 'C', 'D'].includes(starportClass)) {
    newLocations.push({
      id: 'loc-dock-highport',
      name: `${system.name} ${starportClass === 'A' || starportClass === 'B' ? 'Highport' : 'Orbital Station'}`,
      type: 'dock',
      linkedTo: mainworldId,
      x: 480,
      y: 320,
      actions: ['refuel', 'repair', 'trade', 'passengers'],
      travelTimeHours: {
        'loc-orbit-mainworld': 1,
        'loc-surface-starport': 3
      }
    });
  }

  // Add surface starport
  if (starportClass !== 'X') {
    const starportNames = {
      'A': 'Starport',
      'B': 'Starport',
      'C': 'Starport',
      'D': 'Landing Field',
      'E': 'Frontier Landing'
    };
    newLocations.push({
      id: 'loc-surface-starport',
      name: `${system.name} ${starportNames[starportClass] || 'Surface'}`,
      type: 'surface',
      linkedTo: mainworldId,
      x: 420,
      y: 350,
      actions: starportClass === 'E' ? ['refuel_wilderness'] : ['refuel', 'repair', 'trade', 'passengers'],
      travelTimeHours: {
        'loc-orbit-mainworld': 2,
        'loc-dock-highport': 3
      }
    });
  }

  // Update the system
  system.locations = newLocations;

  // Write back
  fs.writeFileSync(filePath, JSON.stringify(system, null, 2) + '\n');

  return { converted: true, name: system.name, locationCount: newLocations.length };
}

// Main
const files = fs.readdirSync(SYSTEMS_DIR).filter(f => f.endsWith('.json'));
let converted = 0;
let skipped = 0;
let errors = 0;

console.log(`Processing ${files.length} system files...`);

for (const file of files) {
  try {
    const result = convertSystem(path.join(SYSTEMS_DIR, file));
    if (result.converted) {
      converted++;
      console.log(`✓ ${result.name}: ${result.locationCount} locations`);
    } else {
      skipped++;
    }
  } catch (err) {
    errors++;
    console.error(`✗ ${file}: ${err.message}`);
  }
}

console.log(`\nDone! Converted: ${converted}, Skipped: ${skipped}, Errors: ${errors}`);
