import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1100, height: 1000 }, deviceScaleFactor: 2 });
const errs = [];
page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await page.goto('http://localhost:3000/drive', { waitUntil: 'networkidle', timeout: 180000 });
await page.waitForTimeout(2500);
await page.screenshot({ path: process.argv[2] + '/startcard.png' });
console.log('bodies offered:', await page.getByRole('button', { pressed: false }).count() + 1);
for (const name of ['The hatch', 'The van', 'The roadster', 'The pickup']) {
  console.log(' -', name, await page.getByRole('button', { name: new RegExp(name, 'i') }).count() ? 'present' : 'MISSING');
}
console.log('sound toggle:', await page.getByRole('button', { name: /engine sound/i }).count() ? 'present' : 'MISSING');
console.log('horn in key list:', (await page.locator('dt', { hasText: /^H$/ }).count()) ? 'present' : 'MISSING');
// Header entrance, on an ordinary page.
await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 180000 });
await page.waitForTimeout(1500);
const headerDrive = page.locator('a[href="/drive"]').first();
console.log('header Drive link:', await headerDrive.count(), 'visible:', await headerDrive.first().isVisible().catch(() => false));
await page.locator("body > div header, header").first().screenshot({ path: process.argv[2] + '/header.png' });
console.log('errors:', errs.slice(0, 3));
await browser.close();
