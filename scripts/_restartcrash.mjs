import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1100, height: 700 } });
const errs = [];
page.on('pageerror', (e) => errs.push('pageerror: ' + String(e).slice(0, 160)));
page.on('console', (m) => {
  const t = m.text();
  if (/null pointer passed to rust|RuntimeError|unreachable|scene failed/i.test(t)) {
    errs.push(`${m.type()}: ${t.slice(0, 160)}`);
  }
});

await page.goto('http://localhost:3000/drive?probe', { waitUntil: 'domcontentloaded', timeout: 180000 });
await page.waitForTimeout(2200);
await page.getByRole('button', { name: /start engine/i }).click();

// Wait for the natural context loss, then take the restart path twice over.
for (let round = 1; round <= 2; round++) {
  let shown = false;
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(700);
    if (await page.getByText(/ran out of room/i).count()) { shown = true; break; }
  }
  if (!shown) { console.log(`round ${round}: context held, nothing to restart`); break; }
  await page.getByRole('button', { name: /start again/i }).click();
  await page.waitForTimeout(5000);
  console.log(`round ${round}: restarted, errors so far = ${errs.length}`);
}

console.log('errors:', errs.length ? errs.slice(0, 5) : 'none');
await browser.close();
process.exit(errs.length ? 1 : 0);
