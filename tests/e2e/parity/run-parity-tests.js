#!/usr/bin/env node
/**
 * Parity Test Runner
 *
 * Runs all parity tests for V1/V2 interface comparison.
 * Run with: node tests/e2e/parity/run-parity-tests.js
 */

const { spawn } = require('child_process');
const path = require('path');

const tests = [
  'dom-parity.test.js',
  'workflow-parity.test.js'
];

let passed = 0;
let failed = 0;

async function runTest(testFile) {
  return new Promise((resolve) => {
    const testPath = path.join(__dirname, testFile);
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Running: ${testFile}`);
    console.log('='.repeat(60) + '\n');

    const proc = spawn('node', [testPath], {
      stdio: 'inherit',
      env: { ...process.env }
    });

    proc.on('close', (code) => {
      if (code === 0) {
        passed++;
        resolve(true);
      } else {
        failed++;
        resolve(false);
      }
    });

    proc.on('error', (err) => {
      console.error(`Error running ${testFile}:`, err.message);
      failed++;
      resolve(false);
    });
  });
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    PARITY TEST SUITE                         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`\nInterface: ${process.env.INTERFACE_PATH || '/operations'}`);

  for (const test of tests) {
    await runTest(test);
  }

  console.log('\n' + '='.repeat(60));
  console.log('PARITY TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Test files: ${tests.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log('='.repeat(60));

  if (failed > 0) {
    console.log('\n\x1b[31mSome parity tests failed.\x1b[0m');
    process.exit(1);
  } else {
    console.log('\n\x1b[32mAll parity tests passed!\x1b[0m');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Runner error:', err);
  process.exit(1);
});
