#!/usr/bin/env node
/**
 * Puppeteer Browser Spawn Utility
 *
 * Spawns a new browser session connected to Operations VTT.
 * Designed to allow Claude to programmatically create browser tabs.
 *
 * Usage:
 *   node tests/e2e/puppeteer-spawn.js [options]
 *
 * Options:
 *   --gm              Login as GM
 *   --player          Login as player
 *   --code=XXXXXXXX   Campaign code (for player)
 *   --slot=NAME       Player slot name (for player)
 *   --role=ROLE       Role to assign (pilot, engineer, etc.)
 *   --headless        Run in headless mode (default: true)
 *   --visible         Run in visible mode (for debugging)
 *   --keep-open       Keep browser open after setup
 *   --action=NAME     Run a specific action (email, hail, etc.)
 *
 * Actions:
 *   --action=email --to=NAME --subject=SUB --body=BODY
 *   --action=hail --target=CONTACT
 *   --action=log --message=MSG
 *
 * Examples:
 *   node tests/e2e/puppeteer-spawn.js --gm
 *   node tests/e2e/puppeteer-spawn.js --player --code=E5CDFA9C --slot=Asao --role=pilot
 *   node tests/e2e/puppeteer-spawn.js --gm --action=email --to=Asao --subject="Orders" --body="Report to bridge"
 */

const {
  delay,
  DELAYS,
  createPage,
  navigateToOperations,
  gmLogin,
  startSession,
  getBridgeState,
  playerLogin,
  selectPlayerSlot,
  selectShip,
  selectRole,
  joinBridge
} = require('./puppeteer-utils');

// Parse command line arguments
function parseArgs() {
  const args = {
    gm: false,
    player: false,
    code: null,
    slot: null,
    role: null,
    headless: true,
    keepOpen: false,
    action: null,
    // Action params
    to: null,
    subject: null,
    body: null,
    target: null,
    message: null
  };

  for (const arg of process.argv.slice(2)) {
    if (arg === '--gm') args.gm = true;
    else if (arg === '--player') args.player = true;
    else if (arg === '--headless') args.headless = true;
    else if (arg === '--visible') args.headless = false;
    else if (arg === '--keep-open') args.keepOpen = true;
    else if (arg.startsWith('--code=')) args.code = arg.split('=')[1];
    else if (arg.startsWith('--slot=')) args.slot = arg.split('=')[1];
    else if (arg.startsWith('--role=')) args.role = arg.split('=')[1];
    else if (arg.startsWith('--action=')) args.action = arg.split('=')[1];
    else if (arg.startsWith('--to=')) args.to = arg.split('=')[1];
    else if (arg.startsWith('--subject=')) args.subject = arg.split('=')[1];
    else if (arg.startsWith('--body=')) args.body = arg.split('=')[1];
    else if (arg.startsWith('--target=')) args.target = arg.split('=')[1];
    else if (arg.startsWith('--message=')) args.message = arg.split('=')[1];
  }

  return args;
}

// Actions that can be performed once on bridge
async function performAction(page, action, args) {
  switch (action) {
    case 'email':
      return await sendEmail(page, args.to, args.subject, args.body);
    case 'hail':
      return await hailContact(page, args.target);
    case 'log':
      return await addLogEntry(page, args.message);
    case 'status':
      return await getBridgeState(page);
    default:
      console.log(`Unknown action: ${action}`);
      return false;
  }
}

// Send email to a PC
async function sendEmail(page, to, subject, body) {
  console.log(`Sending email to: ${to}`);

  // Open hamburger menu
  const menuBtn = await page.$('#btn-bridge-menu');
  if (!menuBtn) {
    console.log('Menu button not found');
    return false;
  }
  await menuBtn.click();
  await delay(DELAYS.MEDIUM);

  // Find mail/email menu item
  const mailItem = await page.evaluateHandle(() => {
    const items = document.querySelectorAll('.menu-item');
    for (const item of items) {
      if (item.textContent?.toLowerCase().includes('mail') ||
          item.dataset?.feature === 'mail') {
        return item;
      }
    }
    return null;
  });

  if (!mailItem || !mailItem.asElement()) {
    console.log('Mail menu item not found');
    // Close menu
    const closeBtn = await page.$('#btn-close-menu');
    if (closeBtn) await closeBtn.click();
    return false;
  }

  await mailItem.asElement().click();
  await delay(DELAYS.LONG);

  // Find compose button
  const composeBtn = await page.$('#btn-compose-mail, button[id*="compose"], .compose-btn');
  if (!composeBtn) {
    console.log('Compose button not found');
    return false;
  }
  await composeBtn.click();
  await delay(DELAYS.MEDIUM);

  // Fill in email form
  // Recipient
  const recipientInput = await page.$('#mail-recipient, input[name="recipient"], .mail-to');
  if (recipientInput) {
    await recipientInput.click({ clickCount: 3 }); // Select all
    await recipientInput.type(to);
  }

  // Subject
  const subjectInput = await page.$('#mail-subject, input[name="subject"], .mail-subject');
  if (subjectInput) {
    await subjectInput.click({ clickCount: 3 });
    await subjectInput.type(subject || 'Message');
  }

  // Body
  const bodyInput = await page.$('#mail-body, textarea[name="body"], .mail-body');
  if (bodyInput) {
    await bodyInput.click({ clickCount: 3 });
    await bodyInput.type(body || '');
  }

  // Send button
  const sendBtn = await page.$('#btn-send-mail, button[type="submit"], .send-btn');
  if (sendBtn) {
    await sendBtn.click();
    await delay(DELAYS.SOCKET);
    console.log('Email sent!');
    return true;
  }

  console.log('Send button not found');
  return false;
}

// Hail a contact (ship)
async function hailContact(page, targetName) {
  console.log(`Hailing contact: ${targetName}`);

  // Find the contact in the contacts panel
  const contact = await page.evaluateHandle((name) => {
    const contacts = document.querySelectorAll('.contact-item, .contact');
    for (const c of contacts) {
      if (c.textContent?.toLowerCase().includes(name.toLowerCase())) {
        return c;
      }
    }
    return null;
  }, targetName);

  if (!contact || !contact.asElement()) {
    console.log(`Contact "${targetName}" not found`);
    return false;
  }

  // Click on contact to select it
  await contact.asElement().click();
  await delay(DELAYS.MEDIUM);

  // Look for hail button in contact actions or context menu
  const hailBtn = await page.$('.hail-btn, button[id*="hail"], [data-action="hail"]');
  if (hailBtn) {
    await hailBtn.click();
    await delay(DELAYS.SOCKET);
    console.log('Hail initiated!');
    return true;
  }

  // Try right-click context menu
  const contactEl = await contact.asElement();
  await contactEl.click({ button: 'right' });
  await delay(DELAYS.SHORT);

  const contextHail = await page.$('.context-menu .hail, [data-action="hail"]');
  if (contextHail) {
    await contextHail.click();
    await delay(DELAYS.SOCKET);
    console.log('Hail initiated via context menu!');
    return true;
  }

  console.log('Hail action not available for this contact');
  return false;
}

// Add a log entry
async function addLogEntry(page, message) {
  console.log(`Adding log entry: ${message}`);

  const logBtn = await page.$('#btn-add-log');
  if (!logBtn) {
    console.log('Log button not found');
    return false;
  }

  // Set up dialog handler to enter the message
  page.once('dialog', async dialog => {
    await dialog.accept(message);
  });

  await logBtn.click();
  await delay(DELAYS.SOCKET);
  console.log('Log entry added!');
  return true;
}

// Main spawn function
async function spawn() {
  const args = parseArgs();

  if (!args.gm && !args.player) {
    console.log('Usage: puppeteer-spawn.js --gm | --player --code=XXX');
    console.log('Run with --help for more options');
    process.exit(1);
  }

  console.log('=== Puppeteer Browser Spawn ===\n');
  console.log(`Mode: ${args.gm ? 'GM' : 'Player'}`);
  console.log(`Headless: ${args.headless}`);
  if (args.action) console.log(`Action: ${args.action}`);

  let browser = null;
  let page = null;

  try {
    // Create browser
    const result = await createPage({ headless: args.headless, verbose: true });
    browser = result.browser;
    page = result.page;

    // Navigate to Operations
    console.log('\n1. Navigating to Operations VTT...');
    await navigateToOperations(page);

    if (args.gm) {
      // GM flow
      console.log('2. Logging in as GM...');
      const { code } = await gmLogin(page);
      console.log(`   Campaign code: ${code}`);

      console.log('3. Starting session...');
      await startSession(page);

    } else {
      // Player flow
      if (!args.code) {
        console.error('Player mode requires --code=XXXXXXXX');
        process.exit(1);
      }

      console.log('2. Logging in as Player...');
      await playerLogin(page, args.code);

      console.log('3. Selecting slot...');
      await selectPlayerSlot(page, args.slot);

      await delay(DELAYS.LONG);

      console.log('4. Selecting ship...');
      await selectShip(page);

      if (args.role) {
        console.log(`5. Selecting role: ${args.role}...`);
        await selectRole(page, args.role);
      }

      console.log('6. Joining bridge...');
      await joinBridge(page);
    }

    // Get bridge state
    await delay(DELAYS.MEDIUM);
    const state = await getBridgeState(page);
    console.log('\n=== Bridge State ===');
    console.log(JSON.stringify(state, null, 2));

    // Perform action if specified
    if (args.action) {
      console.log(`\n=== Performing Action: ${args.action} ===`);
      const result = await performAction(page, args.action, args);
      console.log(`Action result: ${result ? 'SUCCESS' : 'FAILED'}`);
    }

    // Keep open or close
    if (args.keepOpen) {
      console.log('\nBrowser will stay open. Press Ctrl+C to close.');
      // Keep process alive
      await new Promise(() => {});
    } else {
      console.log('\nClosing browser...');
    }

  } catch (error) {
    console.error(`\nError: ${error.message}`);
    process.exit(1);
  } finally {
    if (browser && !args.keepOpen) {
      await browser.close();
    }
  }

  console.log('\n=== Spawn Complete ===');
}

// Run if called directly
if (require.main === module) {
  spawn();
}

module.exports = { spawn, performAction, sendEmail, hailContact, addLogEntry };
