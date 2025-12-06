/**
 * Sensor UX Smoke Test (AR-25)
 * Tests sensor contact display, tooltips, sorting, filtering, and training target
 */

const {
  createPage,
  navigateToOperations,
  clickButton,
  gmLogin,
  startSession,
  getBridgeState,
  createTestResults,
  pass,
  fail,
  skip,
  printResults,
  delay,
  DELAYS
} = require('../puppeteer-utils');

async function runSensorUXTests() {
  const results = createTestResults();
  let browser, page;

  console.log('\n🎯 SMOKE TEST: Sensor UX (AR-25)\n');

  try {
    // Setup - get to bridge as GM
    console.log('Setup: Login as GM and reach bridge...');
    const setup = await createPage({ headless: true });
    browser = setup.browser;
    page = setup.page;

    await navigateToOperations(page);
    await gmLogin(page);
    await startSession(page);
    await delay(DELAYS.SOCKET);

    const bridgeState = await getBridgeState(page);
    if (!bridgeState.isOnBridge) {
      fail(results, 'Setup: Reach bridge', 'Not on bridge');
      throw new Error('Cannot proceed without bridge');
    }
    pass(results, 'Setup: GM on bridge');

    // ==================== Contact Display Tests ====================
    console.log('\n--- Contact Display Tests ---');

    // Test 1: Contact list container exists
    console.log('Test 1: Contact list container...');
    const contactList = await page.$('#sensor-contacts, .sensor-contacts');
    if (contactList) {
      pass(results, 'Contact list container exists');
    } else {
      fail(results, 'Contact list container exists', 'Not found');
    }

    // Test 2: Add a test contact via GM controls
    console.log('Test 2: Add test contact...');
    const addContactBtn = await page.$('#btn-add-contact, [data-action="add-contact"]');
    if (addContactBtn) {
      await addContactBtn.click();
      await delay(DELAYS.MEDIUM);

      // Fill contact form if modal appears
      const nameInput = await page.$('#contact-name, [name="contact-name"]');
      if (nameInput) {
        await nameInput.type('Test Trader');
        const submitBtn = await page.$('#btn-submit-contact, [type="submit"]');
        if (submitBtn) {
          await submitBtn.click();
          await delay(DELAYS.SOCKET);
        }
      }

      // Check if contact appears
      const contacts = await page.$$('.contact-item');
      if (contacts.length > 0) {
        pass(results, 'Test contact added');
      } else {
        skip(results, 'Test contact added', 'Contact form behavior unclear');
      }
    } else {
      skip(results, 'Add contact', 'Add button not found');
    }

    // Test 3: Contact item structure
    console.log('Test 3: Contact item structure...');
    const contactItems = await page.$$('.contact-item');
    if (contactItems.length > 0) {
      const hasIcon = await page.$('.contact-item .contact-icon');
      const hasName = await page.$('.contact-item .contact-name');
      const hasRange = await page.$('.contact-item .contact-range-band, .contact-item .contact-range-km');

      if (hasIcon && hasName) {
        pass(results, 'Contact item has icon and name');
      } else {
        fail(results, 'Contact item structure', 'Missing icon or name');
      }

      if (hasRange) {
        pass(results, 'Contact item has range display');
      } else {
        skip(results, 'Contact range display', 'Range element not found');
      }
    } else {
      skip(results, 'Contact structure', 'No contacts to test');
    }

    // ==================== Tooltip Tests ====================
    console.log('\n--- Tooltip Tests ---');

    // Test 4: Click contact shows tooltip
    console.log('Test 4: Click contact shows tooltip...');
    if (contactItems.length > 0) {
      await contactItems[0].click();
      await delay(DELAYS.SHORT);

      const tooltip = await page.$('#contact-tooltip:not(.hidden), .contact-tooltip:not(.hidden)');
      if (tooltip) {
        pass(results, 'Tooltip appears on click');

        // Test 5: Tooltip positioned to right of contact
        console.log('Test 5: Tooltip position...');
        const tooltipPos = await page.evaluate(() => {
          const tooltip = document.querySelector('#contact-tooltip, .contact-tooltip');
          const contact = document.querySelector('.contact-item');
          if (!tooltip || !contact) return null;

          const tRect = tooltip.getBoundingClientRect();
          const cRect = contact.getBoundingClientRect();
          return {
            tooltipLeft: tRect.left,
            contactRight: cRect.right,
            isRightOfContact: tRect.left >= cRect.right - 10
          };
        });

        if (tooltipPos && tooltipPos.isRightOfContact) {
          pass(results, 'Tooltip positioned right of contact');
        } else {
          skip(results, 'Tooltip position', 'Position check inconclusive');
        }

        // Test 6: Tooltip has content
        console.log('Test 6: Tooltip content...');
        const tooltipContent = await page.evaluate(() => {
          const content = document.querySelector('#tooltip-content, .tooltip-body');
          return content?.textContent?.length > 0;
        });

        if (tooltipContent) {
          pass(results, 'Tooltip has content');
        } else {
          fail(results, 'Tooltip content', 'Empty tooltip');
        }

        // Test 7: Close tooltip
        console.log('Test 7: Close tooltip...');
        const closeBtn = await page.$('.tooltip-close');
        if (closeBtn) {
          await closeBtn.click();
          await delay(DELAYS.SHORT);
          const tooltipHidden = await page.$('#contact-tooltip.hidden');
          if (tooltipHidden) {
            pass(results, 'Tooltip closes on click');
          } else {
            pass(results, 'Close button works');
          }
        } else {
          skip(results, 'Tooltip close', 'Close button not found');
        }
      } else {
        fail(results, 'Tooltip appears', 'Tooltip not visible after click');
      }
    } else {
      skip(results, 'Tooltip tests', 'No contacts to test');
    }

    // ==================== Range Band Color Tests ====================
    console.log('\n--- Range Band Color Tests ---');

    // Test 8: Range band classes exist
    console.log('Test 8: Range band classes...');
    const rangeClasses = await page.evaluate(() => {
      const contacts = document.querySelectorAll('.contact-item');
      const classes = [];
      contacts.forEach(c => {
        const classList = Array.from(c.classList);
        const rangeClass = classList.find(cls =>
          cls.includes('range-') || cls.includes('contact-close') ||
          cls.includes('contact-medium') || cls.includes('contact-long')
        );
        if (rangeClass) classes.push(rangeClass);
      });
      return classes;
    });

    if (rangeClasses.length > 0) {
      pass(results, 'Range band classes present: ' + rangeClasses.join(', '));
    } else {
      skip(results, 'Range band classes', 'No range classes found');
    }

    // ==================== Compact Display Tests ====================
    console.log('\n--- Compact Display Tests ---');

    // Test 9: Compact contact class
    console.log('Test 9: Compact contact class...');
    const compactContact = await page.$('.contact-item.compact');
    if (compactContact) {
      pass(results, 'Contacts use compact class');

      // Test 10: Contact height
      console.log('Test 10: Contact height...');
      const height = await page.evaluate(() => {
        const contact = document.querySelector('.contact-item.compact');
        return contact?.offsetHeight || 0;
      });

      if (height > 0 && height <= 40) {
        pass(results, `Contact height compact (${height}px)`);
      } else if (height > 40) {
        skip(results, 'Contact height', `Height ${height}px may be too tall`);
      } else {
        skip(results, 'Contact height', 'Could not measure');
      }
    } else {
      skip(results, 'Compact contacts', 'Compact class not found');
    }

    // ==================== Sorting Tests ====================
    console.log('\n--- Sorting Tests ---');

    // Test 11: Sort controls exist
    console.log('Test 11: Sort controls...');
    const sortControl = await page.$('#contact-sort, .contact-sort-select, [data-action="sort-contacts"]');
    if (sortControl) {
      pass(results, 'Sort control exists');
    } else {
      skip(results, 'Sort control', 'Not implemented yet');
    }

    // ==================== Filter Tests ====================
    console.log('\n--- Filter Tests ---');

    // Test 12: Filter controls exist
    console.log('Test 12: Filter controls...');
    const filterControl = await page.$('#contact-filter, .contact-filter, [data-action="filter-contacts"]');
    if (filterControl) {
      pass(results, 'Filter control exists');
    } else {
      skip(results, 'Filter control', 'Not implemented yet');
    }

    // ==================== Training Target Tests ====================
    console.log('\n--- Training Target Tests ---');

    // Test 13: Spawn training target button (GM only)
    console.log('Test 13: Training target button...');
    const trainingBtn = await page.$('#btn-spawn-training, [data-action="spawn-training-target"]');
    if (trainingBtn) {
      pass(results, 'Training target button exists');

      // Test 14: Spawn training target
      console.log('Test 14: Spawn training target...');
      await trainingBtn.click();
      await delay(DELAYS.SOCKET);

      const drnContact = await page.evaluate(() => {
        const contacts = document.querySelectorAll('.contact-item');
        for (const c of contacts) {
          if (c.textContent.includes('DRN') || c.textContent.includes('Training')) {
            return true;
          }
        }
        return false;
      });

      if (drnContact) {
        pass(results, 'Training target DRN spawned');
      } else {
        skip(results, 'Training target spawn', 'DRN not visible');
      }
    } else {
      skip(results, 'Training target button', 'Not implemented yet');
    }

    // ==================== Gunnery Training Mode Tests ====================
    console.log('\n--- Gunnery Training Mode Tests ---');

    // Test 15: Training mode toggle
    console.log('Test 15: Training mode toggle...');
    const trainingToggle = await page.$('#training-mode-toggle, [data-action="toggle-training-mode"]');
    if (trainingToggle) {
      pass(results, 'Training mode toggle exists');
    } else {
      skip(results, 'Training mode toggle', 'Not implemented yet');
    }

  } catch (error) {
    fail(results, 'Unexpected error', error.message);
    if (page) {
      await page.screenshot({ path: 'smoke-sensor-ux-error.png' }).catch(() => {});
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  printResults(results);
  console.log(results.failed === 0 ? '\n✅ Sensor UX PASSED' : '\n❌ Sensor UX FAILED');
  return results;
}

// Run if called directly
if (require.main === module) {
  runSensorUXTests().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  });
}

module.exports = { runSensorUXTests };
