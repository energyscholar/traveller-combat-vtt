#!/usr/bin/env node
/**
 * Screenshot Cleanup Script
 * AR-MAPFIX-1 Phase 4: Remove old test screenshots and artifacts
 *
 * Usage: node scripts/cleanup-screenshots.js [--dry-run] [--max-age=7]
 */

const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, '..', 'screenshots');
const DEFAULT_MAX_AGE_DAYS = 7;

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry-run'),
    maxAgeDays: parseInt(args.find(a => a.startsWith('--max-age='))?.split('=')[1]) || DEFAULT_MAX_AGE_DAYS
  };
}

function getFileAgeDays(filepath) {
  const stats = fs.statSync(filepath);
  const now = Date.now();
  const mtime = stats.mtime.getTime();
  return (now - mtime) / (1000 * 60 * 60 * 24);
}

function cleanupScreenshots(options = {}) {
  const { dryRun = false, maxAgeDays = DEFAULT_MAX_AGE_DAYS } = options;

  console.log(`\n🧹 Screenshot Cleanup`);
  console.log(`   Directory: ${SCREENSHOT_DIR}`);
  console.log(`   Max age: ${maxAgeDays} days`);
  console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'ACTUAL DELETE'}\n`);

  if (!fs.existsSync(SCREENSHOT_DIR)) {
    console.log('   No screenshots directory found. Nothing to clean.');
    return { deleted: 0, kept: 0, totalSize: 0 };
  }

  const files = fs.readdirSync(SCREENSHOT_DIR);
  let deleted = 0;
  let kept = 0;
  let freedBytes = 0;
  let keptBytes = 0;

  for (const file of files) {
    if (!file.endsWith('.png')) continue;

    const filepath = path.join(SCREENSHOT_DIR, file);
    const stats = fs.statSync(filepath);
    const ageDays = getFileAgeDays(filepath);

    if (ageDays > maxAgeDays) {
      if (dryRun) {
        console.log(`   [DELETE] ${file} (${ageDays.toFixed(1)} days, ${(stats.size / 1024).toFixed(1)}KB)`);
      } else {
        fs.unlinkSync(filepath);
        console.log(`   ✓ Deleted: ${file}`);
      }
      deleted++;
      freedBytes += stats.size;
    } else {
      kept++;
      keptBytes += stats.size;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Files deleted: ${deleted} (${(freedBytes / 1024 / 1024).toFixed(2)}MB freed)`);
  console.log(`   Files kept: ${kept} (${(keptBytes / 1024 / 1024).toFixed(2)}MB)`);

  return { deleted, kept, freedBytes, keptBytes };
}

// Run if called directly
if (require.main === module) {
  const { dryRun, maxAgeDays } = parseArgs();
  cleanupScreenshots({ dryRun, maxAgeDays });
}

module.exports = { cleanupScreenshots };
