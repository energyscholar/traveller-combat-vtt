#!/usr/bin/env node
/**
 * URL Swap Script for V1/V2 Interface Migration
 *
 * Usage:
 *   node scripts/url-swap.js forward   - Make V2 default at /operations, V1 at /operations/legacy
 *   node scripts/url-swap.js rollback  - Restore V1 as default at /operations
 *   node scripts/url-swap.js status    - Show current routing state
 */

const fs = require('fs');
const path = require('path');

const SERVER_PATH = path.join(__dirname, '..', 'server.js');

// Route configurations
const V1_DEFAULT_ROUTES = `// Static files
// V2 route MUST come before /operations to avoid path conflict
app.use('/operations/v2', express.static('public/operations-v2'));
app.use(express.static('public/operations'));
app.use('/operations', express.static('public/operations'));`;

const V2_DEFAULT_ROUTES = `// Static files
// URL SWAP: V2 is now default, V1 moved to /operations/legacy
app.use('/operations/legacy', express.static('public/operations'));
app.use(express.static('public/operations-v2'));
app.use('/operations', express.static('public/operations-v2'));`;

function readServerFile() {
  return fs.readFileSync(SERVER_PATH, 'utf8');
}

function writeServerFile(content) {
  fs.writeFileSync(SERVER_PATH, content, 'utf8');
}

function getCurrentState(content) {
  if (content.includes('URL SWAP: V2 is now default')) {
    return 'v2-default';
  }
  if (content.includes('V2 route MUST come before /operations')) {
    return 'v1-default';
  }
  return 'unknown';
}

function swapForward() {
  const content = readServerFile();
  const state = getCurrentState(content);

  if (state === 'v2-default') {
    console.log('Already swapped to V2 default. No action needed.');
    return true;
  }

  if (state === 'unknown') {
    console.error('ERROR: Could not detect current routing state in server.js');
    console.error('Expected to find V1 or V2 routing markers.');
    return false;
  }

  // Replace V1 default routes with V2 default routes
  const newContent = content.replace(V1_DEFAULT_ROUTES, V2_DEFAULT_ROUTES);

  if (newContent === content) {
    console.error('ERROR: Route replacement failed. Pattern not found.');
    return false;
  }

  writeServerFile(newContent);
  console.log('✓ Swap complete: V2 is now default at /operations');
  console.log('  - V2 serves at: /operations');
  console.log('  - V1 serves at: /operations/legacy');
  return true;
}

function swapRollback() {
  const content = readServerFile();
  const state = getCurrentState(content);

  if (state === 'v1-default') {
    console.log('Already at V1 default. No rollback needed.');
    return true;
  }

  if (state === 'unknown') {
    console.error('ERROR: Could not detect current routing state in server.js');
    console.error('Expected to find V1 or V2 routing markers.');
    return false;
  }

  // Replace V2 default routes with V1 default routes
  const newContent = content.replace(V2_DEFAULT_ROUTES, V1_DEFAULT_ROUTES);

  if (newContent === content) {
    console.error('ERROR: Rollback replacement failed. Pattern not found.');
    return false;
  }

  writeServerFile(newContent);
  console.log('✓ Rollback complete: V1 is now default at /operations');
  console.log('  - V1 serves at: /operations');
  console.log('  - V2 serves at: /operations/v2');
  return true;
}

function showStatus() {
  const content = readServerFile();
  const state = getCurrentState(content);

  console.log('URL Routing Status');
  console.log('==================');

  if (state === 'v1-default') {
    console.log('Current: V1 DEFAULT');
    console.log('  /operations     → public/operations (V1)');
    console.log('  /operations/v2  → public/operations-v2 (V2)');
  } else if (state === 'v2-default') {
    console.log('Current: V2 DEFAULT (swapped)');
    console.log('  /operations        → public/operations-v2 (V2)');
    console.log('  /operations/legacy → public/operations (V1)');
  } else {
    console.log('Current: UNKNOWN');
    console.log('Could not detect routing state from server.js markers.');
  }

  return state !== 'unknown';
}

// Main
const command = process.argv[2];

switch (command) {
  case 'forward':
  case 'to-v2':
    process.exit(swapForward() ? 0 : 1);
    break;
  case 'rollback':
  case 'to-v1':
    process.exit(swapRollback() ? 0 : 1);
    break;
  case 'status':
    process.exit(showStatus() ? 0 : 1);
    break;
  default:
    console.log('URL Swap Script');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/url-swap.js forward   - Make V2 default');
    console.log('  node scripts/url-swap.js rollback  - Restore V1 default');
    console.log('  node scripts/url-swap.js status    - Show current state');
    console.log('');
    console.log('Or use npm scripts:');
    console.log('  npm run swap:to-v2    - Make V2 default');
    console.log('  npm run swap:rollback - Restore V1 default');
    process.exit(1);
}
