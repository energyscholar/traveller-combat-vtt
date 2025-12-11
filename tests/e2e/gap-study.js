const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/operations');
  await page.waitForSelector('#gm-btn', { timeout: 5000 });
  await page.click('#gm-btn');
  await page.waitForSelector('.role-panel', { timeout: 5000 });
  
  console.log('=== GAP STUDY ===\n');
  
  const roles = ['pilot', 'astrogator', 'engineer'];
  
  for (const role of roles) {
    console.log('--- ' + role.toUpperCase() + ' ---');
    await page.click('.role-tab[data-role="' + role + '"]').catch(() => {});
    await new Promise(r => setTimeout(r, 500));
    
    const btns = await page.evaluate(() => {
      const p = document.querySelector('.role-panel');
      return p ? Array.from(p.querySelectorAll('button')).map(b => 
        (b.disabled ? '[DIS] ' : '[OK ] ') + b.textContent.trim().substring(0, 35)
      ) : [];
    });
    btns.forEach(b => console.log('  ' + b));
    console.log('');
  }
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));
