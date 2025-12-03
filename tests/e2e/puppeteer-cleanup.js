#!/usr/bin/env node
/**
 * Puppeteer Browser Cleanup Utility
 *
 * Kills orphaned Chrome/Chromium processes spawned by Puppeteer.
 * Run this when you have zombie browser processes consuming resources.
 *
 * Usage:
 *   node tests/e2e/puppeteer-cleanup.js
 *   node tests/e2e/puppeteer-cleanup.js --list   # Just list, don't kill
 *   node tests/e2e/puppeteer-cleanup.js --force  # Kill all Chrome processes
 */

const { execSync } = require('child_process');

function parseArgs() {
  return {
    list: process.argv.includes('--list'),
    force: process.argv.includes('--force')
  };
}

function findChromiumProcesses() {
  try {
    // Find all chromium/chrome processes
    const result = execSync(
      'ps aux | grep -E "(chromium|chrome|headless)" | grep -v grep',
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    );

    const lines = result.trim().split('\n').filter(l => l);
    return lines.map(line => {
      const parts = line.split(/\s+/);
      return {
        user: parts[0],
        pid: parts[1],
        cpu: parts[2],
        mem: parts[3],
        command: parts.slice(10).join(' ').substring(0, 80)
      };
    });
  } catch (e) {
    // No processes found
    return [];
  }
}

function killProcess(pid) {
  try {
    execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

function cleanup() {
  const args = parseArgs();

  console.log('=== Puppeteer Browser Cleanup ===\n');

  const processes = findChromiumProcesses();

  if (processes.length === 0) {
    console.log('No Chrome/Chromium processes found.');
    return;
  }

  console.log(`Found ${processes.length} Chrome/Chromium process(es):\n`);

  for (const p of processes) {
    console.log(`  PID: ${p.pid} | CPU: ${p.cpu}% | MEM: ${p.mem}%`);
    console.log(`  CMD: ${p.command}`);
    console.log();
  }

  if (args.list) {
    console.log('(List mode - no processes killed)');
    return;
  }

  // Filter to puppeteer-spawned processes (headless or --remote-debugging)
  const puppeteerProcesses = args.force
    ? processes
    : processes.filter(p =>
        p.command.includes('headless') ||
        p.command.includes('remote-debugging') ||
        p.command.includes('--no-sandbox')
      );

  if (puppeteerProcesses.length === 0) {
    console.log('No Puppeteer-spawned processes found.');
    console.log('Use --force to kill all Chrome processes.');
    return;
  }

  console.log(`Killing ${puppeteerProcesses.length} Puppeteer process(es)...`);

  let killed = 0;
  for (const p of puppeteerProcesses) {
    if (killProcess(p.pid)) {
      console.log(`  Killed PID ${p.pid}`);
      killed++;
    } else {
      console.log(`  Failed to kill PID ${p.pid}`);
    }
  }

  console.log(`\nDone. Killed ${killed}/${puppeteerProcesses.length} processes.`);
}

// Also export for programmatic use
async function cleanupBrowsers() {
  const processes = findChromiumProcesses();
  const puppeteerProcesses = processes.filter(p =>
    p.command.includes('headless') ||
    p.command.includes('remote-debugging') ||
    p.command.includes('--no-sandbox')
  );

  let killed = 0;
  for (const p of puppeteerProcesses) {
    if (killProcess(p.pid)) killed++;
  }

  return { found: puppeteerProcesses.length, killed };
}

if (require.main === module) {
  cleanup();
}

module.exports = { cleanupBrowsers, findChromiumProcesses };
