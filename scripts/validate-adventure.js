#!/usr/bin/env node
/**
 * CLI Tool: Validate Adventure Package
 * Stage 10.2: Adventure File Utilities
 *
 * Usage:
 *   npm run validate-adventure <file.tvadv>
 *   node scripts/validate-adventure.js <file.tvadv>
 *
 * Exit codes:
 *   0 = Valid
 *   1 = Invalid or error
 */

const fs = require('fs');
const path = require('path');

// Must initialize database before requiring operations modules
process.env.DB_PATH = process.env.DB_PATH || path.join(__dirname, '../data/campaigns/operations.db');

const { previewAdventure, validateAdventureData } = require('../lib/operations');

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Traveller VTT Adventure Validator

Usage:
  npm run validate-adventure <file.tvadv>
  npm run validate-adventure <file.tvadv> --preview
  npm run validate-adventure <file.tvadv> --json

Options:
  --preview    Show detailed preview of contents
  --json       Output results as JSON
  --help, -h   Show this help message

Exit Codes:
  0  Valid adventure package
  1  Invalid or error
`);
    process.exit(0);
  }

  const filePath = args.find(a => !a.startsWith('-'));
  const showPreview = args.includes('--preview');
  const jsonOutput = args.includes('--json');

  if (!filePath) {
    console.error('Error: No file specified');
    process.exit(1);
  }

  const fullPath = path.resolve(filePath);

  if (!fs.existsSync(fullPath)) {
    console.error(`Error: File not found: ${fullPath}`);
    process.exit(1);
  }

  try {
    const buffer = fs.readFileSync(fullPath);
    const preview = await previewAdventure(buffer);

    const result = {
      file: path.basename(fullPath),
      valid: preview.validation.valid,
      name: preview.name,
      author: preview.author,
      version: preview.version,
      counts: preview.counts,
      errors: preview.validation.errors,
      preview: showPreview ? preview.preview : undefined,
      assets: showPreview ? preview.assets : undefined
    };

    if (jsonOutput) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`\n=== ${result.file} ===\n`);
      console.log(`Name:    ${result.name}`);
      console.log(`Author:  ${result.author}`);
      console.log(`Version: ${result.version}`);
      console.log(`\nContents:`);
      console.log(`  NPCs:      ${result.counts.npcs || 0}`);
      console.log(`  Locations: ${result.counts.locations || 0}`);
      console.log(`  Events:    ${result.counts.events || 0}`);
      console.log(`  Handouts:  ${result.counts.handouts || 0}`);
      console.log(`  Emails:    ${result.counts.emails || 0}`);

      if (showPreview && preview.preview) {
        console.log(`\nPreview:`);
        if (preview.preview.npcs?.length) {
          console.log(`  NPCs: ${preview.preview.npcs.join(', ')}`);
        }
        if (preview.preview.locations?.length) {
          console.log(`  Locations: ${preview.preview.locations.join(', ')}`);
        }
        if (preview.preview.handouts?.length) {
          console.log(`  Handouts: ${preview.preview.handouts.join(', ')}`);
        }
        if (preview.assets?.length) {
          console.log(`  Assets: ${preview.assets.join(', ')}`);
        }
      }

      console.log(`\nValidation: ${result.valid ? 'PASSED' : 'FAILED'}`);
      if (!result.valid && result.errors.length > 0) {
        console.log(`\nErrors:`);
        result.errors.forEach(e => console.log(`  - ${e}`));
      }
    }

    process.exit(result.valid ? 0 : 1);
  } catch (error) {
    if (jsonOutput) {
      console.log(JSON.stringify({ error: error.message, valid: false }, null, 2));
    } else {
      console.error(`\nError: ${error.message}`);
    }
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
