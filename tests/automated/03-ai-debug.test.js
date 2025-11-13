/**
 * Stage 13.1: AI Debugging Tests
 * Deep inspection of AI opponent state to debug weapon detection
 */

const { launchBrowser, createPage, TIMEOUTS } = require('./setup');
const { screenshotOnFailure, takeScreenshot } = require('./helpers/screenshots');
const { clickElement, selectOption } = require('./helpers/elements');
const { waitForVisible } = require('./helpers/wait');

describe('03 - AI Debugging Tests', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await launchBrowser();
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  beforeEach(async () => {
    page = await createPage(browser);
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  test('Deep inspection of AI opponent data', async () => {
    try {
      await page.goto('http://localhost:3000?mode=solo', {
        waitUntil: 'networkidle0',
        timeout: TIMEOUTS.long
      });

      // Start combat
      await clickElement(page, '#ship-option-scout');
      await selectOption(page, '#range-select', 'Short');
      await clickElement(page, '#ready-button');

      // Wait for combat to start
      await waitForVisible(page, '#space-combat-hud', TIMEOUTS.long);

      // Give combat a moment to initialize
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Deep inspection of all combat-related data
      const fullState = await page.evaluate(() => {
        // This runs in the browser context
        const result = {
          // Check for global variables
          globals: {
            hasSocket: typeof socket !== 'undefined',
            hasCombatState: typeof combatState !== 'undefined',
            hasGameState: typeof gameState !== 'undefined',
            hasPlayerShip: typeof playerShip !== 'undefined',
            hasOpponentShip: typeof opponentShip !== 'undefined',
          },
          // Try to access window properties
          windowProperties: {},
          // Look for any ship-related data in localStorage
          localStorage: {},
          // Check DOM for ship data
          domData: {}
        };

        // Get all window properties that might contain ship data
        const interestingKeys = Object.keys(window).filter(k => {
          const lower = k.toLowerCase();
          return lower.includes('ship') ||
                 lower.includes('opponent') ||
                 lower.includes('ai') ||
                 lower.includes('combat') ||
                 lower.includes('player') ||
                 lower.includes('game') ||
                 lower.includes('state') ||
                 lower.includes('weapon') ||
                 lower.includes('turret');
        });

        result.windowProperties.interestingKeys = interestingKeys;

        // Try to get actual values for these keys (safely)
        interestingKeys.forEach(key => {
          try {
            const value = window[key];
            if (value && typeof value === 'object') {
              // For objects, show structure but not full content
              result.windowProperties[key] = {
                type: 'object',
                keys: Object.keys(value),
                constructor: value.constructor ? value.constructor.name : 'unknown'
              };
            } else if (typeof value === 'function') {
              result.windowProperties[key] = { type: 'function' };
            } else {
              result.windowProperties[key] = value;
            }
          } catch (e) {
            result.windowProperties[key] = { error: e.message };
          }
        });

        // Check localStorage
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            try {
              result.localStorage[key] = localStorage.getItem(key);
            } catch (e) {
              result.localStorage[key] = { error: e.message };
            }
          }
        }

        // Check for data attributes on key elements
        const hud = document.querySelector('#space-combat-hud');
        if (hud) {
          result.domData.hudDataAttributes = {};
          for (const attr of hud.attributes) {
            if (attr.name.startsWith('data-')) {
              result.domData.hudDataAttributes[attr.name] = attr.value;
            }
          }
        }

        // Check for any player info in DOM
        const playerInfo = document.querySelector('[data-player-id]');
        if (playerInfo) {
          result.domData.playerInfo = {
            playerId: playerInfo.getAttribute('data-player-id'),
            attributes: Array.from(playerInfo.attributes).reduce((acc, attr) => {
              acc[attr.name] = attr.value;
              return acc;
            }, {})
          };
        }

        return result;
      });

      console.log('🔍 FULL STATE INSPECTION:');
      console.log(JSON.stringify(fullState, null, 2));

      await takeScreenshot(page, 'ai-deep-inspection');

      // Now try to access the actual combat state if it exists
      const combatStateData = await page.evaluate(() => {
        if (typeof combatState !== 'undefined') {
          return JSON.parse(JSON.stringify(combatState));
        }
        if (typeof gameState !== 'undefined') {
          return JSON.parse(JSON.stringify(gameState));
        }
        return null;
      });

      if (combatStateData) {
        console.log('🎮 COMBAT STATE DATA:');
        console.log(JSON.stringify(combatStateData, null, 2));
      }

      console.log('✅ AI deep inspection complete');
    } catch (err) {
      await screenshotOnFailure(page, 'ai-debug-failed');
      throw err;
    }
  });

  test('Inspect server-side combat state via network', async () => {
    try {
      // Capture network traffic
      const socketMessages = [];

      page.on('console', msg => {
        const text = msg.text();
        if (text.includes('Socket') || text.includes('combat') || text.includes('AI')) {
          console.log('🌐 Browser Console:', text);
        }
      });

      await page.goto('http://localhost:3000?mode=solo', {
        waitUntil: 'networkidle0',
        timeout: TIMEOUTS.long
      });

      // Start combat
      await clickElement(page, '#ship-option-scout');
      await selectOption(page, '#range-select', 'Short');
      await clickElement(page, '#ready-button');

      // Wait for combat
      await waitForVisible(page, '#space-combat-hud', TIMEOUTS.long);
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Try to trigger AI action by ending turn
      const endTurnButton = await page.$('#end-turn-button');
      if (endTurnButton) {
        console.log('🔘 Found End Turn button, clicking...');
        await clickElement(page, '#end-turn-button');

        // Wait for AI response
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Check combat log for AI activity
        const combatLog = await page.$eval('#combat-log', el => el.textContent);
        console.log('📜 Combat Log after ending turn:');
        console.log(combatLog);

        await takeScreenshot(page, 'ai-after-end-turn');
      }

      console.log('✅ Network inspection complete');
    } catch (err) {
      await screenshotOnFailure(page, 'ai-network-failed');
      throw err;
    }
  });
});
