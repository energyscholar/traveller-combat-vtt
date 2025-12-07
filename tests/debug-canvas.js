const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  page.on('console', msg => console.log('[BROWSER]', msg.text()));
  page.on('pageerror', err => console.log('[PAGE ERROR]', err.message));

  await page.goto('http://localhost:3000/operations/');
  await page.waitForSelector('#btn-gm-login');
  await page.click('#btn-gm-login');
  await new Promise(r => setTimeout(r, 1000));
  await page.waitForSelector('.campaign-card');
  await page.click('.campaign-card');
  await new Promise(r => setTimeout(r, 500));
  await page.waitForSelector('#gm-start-session-btn');
  await page.click('#gm-start-session-btn');
  await new Promise(r => setTimeout(r, 1500));

  // Open system map
  await page.evaluate(() => window.showSystemMap());
  await new Promise(r => setTimeout(r, 1000));

  // Check canvas state
  const canvasInfo = await page.evaluate(() => {
    const canvas = document.getElementById('system-map-canvas');
    if (canvas === null) return { error: 'Canvas not found' };

    const rect = canvas.getBoundingClientRect();
    const style = window.getComputedStyle(canvas);

    // Check canvas buffer dimensions
    const bufferW = canvas.width;
    const bufferH = canvas.height;

    // Try to read multiple pixels
    const ctx = canvas.getContext('2d');
    const centerData = ctx.getImageData(bufferW/2, bufferH/2, 1, 1).data;
    const cornerData = ctx.getImageData(10, 10, 1, 1).data;
    const edgeData = ctx.getImageData(100, 100, 1, 1).data;

    return {
      bufferDimensions: bufferW + 'x' + bufferH,
      cssRect: {
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left
      },
      cssDisplay: style.display,
      cssVisibility: style.visibility,
      cssOpacity: style.opacity,
      cssZIndex: style.zIndex,
      centerPixel: Array.from(centerData),
      cornerPixel: Array.from(cornerData),
      edgePixel: Array.from(edgeData),
      dpr: window.devicePixelRatio
    };
  });

  console.log('\n=== CANVAS INFO ===');
  console.log(JSON.stringify(canvasInfo, null, 2));

  await browser.close();
})();
