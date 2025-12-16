#!/usr/bin/env node
/**
 * Rebuild _index.json from actual star system JSON files
 * Ensures index is in sync with system data and has all UID fields
 */

const fs = require('fs');
const path = require('path');

const SYSTEMS_DIR = path.join(__dirname, '../data/star-systems');
const INDEX_PATH = path.join(SYSTEMS_DIR, '_index.json');

function rebuildIndex() {
  const files = fs.readdirSync(SYSTEMS_DIR)
    .filter(f => f.endsWith('.json') && f !== '_index.json' && !f.startsWith('_'));

  const systems = [];
  const errors = [];

  for (const file of files) {
    try {
      const filePath = path.join(SYSTEMS_DIR, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      // Extract index entry from system data
      const entry = {
        id: data.id || path.basename(file, '.json'),
        name: data.name,
        hex: data.hex,
        sector: data.sector || 'Spinward Marches',
        subsector: data.subsector,
        file: file
      };

      // Mark special systems (like jumpspace)
      if (data.special) {
        entry.special = true;
      }

      // Add UWP and trade codes for richer index
      if (data.uwp) {
        entry.uwp = data.uwp;
      }
      if (data.tradeCodes?.length) {
        entry.tradeCodes = data.tradeCodes;
      }

      systems.push(entry);
    } catch (err) {
      errors.push({ file, error: err.message });
    }
  }

  // Sort by hex for consistent ordering
  systems.sort((a, b) => {
    if (a.hex && b.hex) return a.hex.localeCompare(b.hex);
    return (a.name || '').localeCompare(b.name || '');
  });

  const index = {
    version: '1.1.0',
    description: 'Star system registry for Operations VTT',
    schemaVersion: '1.1',
    generatedAt: new Date().toISOString(),
    totalSystems: systems.length,
    systems
  };

  fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2) + '\n');

  console.log(`Index rebuilt: ${systems.length} systems`);
  if (errors.length) {
    console.log(`Errors: ${errors.length}`);
    errors.forEach(e => console.log(`  - ${e.file}: ${e.error}`));
  }

  // Summary by subsector
  const bySubsector = {};
  systems.forEach(s => {
    const sub = s.subsector || 'Unknown';
    bySubsector[sub] = (bySubsector[sub] || 0) + 1;
  });
  console.log('\nBy subsector:');
  Object.entries(bySubsector).sort((a, b) => b[1] - a[1]).forEach(([sub, count]) => {
    console.log(`  ${sub}: ${count}`);
  });

  return { systems: systems.length, errors: errors.length };
}

rebuildIndex();
