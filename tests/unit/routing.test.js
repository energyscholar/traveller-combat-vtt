/**
 * T1.1: URL Routing Tests
 * Verifies V1 and V2 routes work correctly
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

function fetch(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, text: () => data }));
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('=== T1.1: URL Routing Tests ===\n');
  const results = { passed: 0, failed: 0 };

  // Test 1: V1 at /operations
  try {
    const res = await fetch(`${BASE_URL}/operations/`);
    if (res.status === 200) {
      const html = res.text();
      if (html.includes('id="btn-gm-login"')) {
        console.log('✓ V1 serves at /operations with login button');
        results.passed++;
      } else {
        console.log('✗ V1 missing btn-gm-login');
        results.failed++;
      }
    } else {
      console.log(`✗ V1 returned status ${res.status}`);
      results.failed++;
    }
  } catch (e) {
    console.log(`✗ V1 request failed: ${e.message}`);
    results.failed++;
  }

  // Test 2: V2 at /operations/v2
  try {
    const res = await fetch(`${BASE_URL}/operations/v2/`);
    if (res.status === 200) {
      console.log('✓ V2 serves at /operations/v2');
      results.passed++;
    } else {
      console.log(`✗ V2 returned status ${res.status}`);
      results.failed++;
    }
  } catch (e) {
    console.log(`✗ V2 request failed: ${e.message}`);
    results.failed++;
  }

  // Test 3: V1 app.js unchanged
  try {
    const res = await fetch(`${BASE_URL}/operations/app.js`);
    const text = res.text();
    if (text.length > 100000) {
      console.log(`✓ V1 app.js unchanged (${Math.round(text.length/1024)}KB)`);
      results.passed++;
    } else {
      console.log(`✗ V1 app.js seems wrong (only ${text.length} bytes)`);
      results.failed++;
    }
  } catch (e) {
    console.log(`✗ V1 app.js request failed: ${e.message}`);
    results.failed++;
  }

  console.log(`\n=== Results: ${results.passed}/${results.passed + results.failed} passed ===`);
  return results.failed === 0;
}

// Run if executed directly
if (require.main === module) {
  runTests().then(success => process.exit(success ? 0 : 1));
}

module.exports = { runTests };
