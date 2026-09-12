import { chromium } from 'playwright';
const OUT = process.argv[2];
const browser = await chromium.launch({ headless: true });

/* A: does the default tier now survive? */
{
  const page = await browser.newPage({ viewport: { width: 1100, height: 700 } });
  let lostAt = null;
  await page.addInitScript(() => {
    window.__lost = null;
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (t, a) {
      const c = orig.call(this, t, a);
      if (c && /webgl/.test(t)) {
        this.addEventListener('webglcontextlost', () => {
          if (window.__lost === null) window.__lost = Math.round(performance.now());
        });
      }
      return c;
    };
  });
  await page.goto('http://localhost:3000/drive?probe', { waitUntil: 'domcontentloaded', timeout: 180000 });
  await page.waitForTimeout(2200);
  await page.getByRole('button', { name: /start engine/i }).click();
  const t0 = Date.now();
  for (let i = 0; i < 34; i++) {
    await page.waitForTimeout(1000);
    lostAt = await page.evaluate(() => window.__lost);
    if (lostAt !== null) break;
  }
  const secs = Math.round((Date.now() - t0) / 1000);
  const frames = await page.evaluate(() => window.__three?.gl?.info?.render?.frame ?? null);
  console.log(`A  default tier: ${lostAt === null ? `SURVIVED ${secs}s` : `lost after ~${secs}s`}, frames=${frames}`);
  await page.close();
}

/* B: when it IS lost, does the guard catch it and offer a way back? */
{
  const page = await browser.newPage({ viewport: { width: 1100, height: 700 } });
  await page.goto('http://localhost:3000/drive?probe', { waitUntil: 'domcontentloaded', timeout: 180000 });
  await page.waitForTimeout(2200);
  await page.getByRole('button', { name: /start engine/i }).click();
  await page.waitForTimeout(2500);
  const forced = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    const gl = c && (c.getContext('webgl2') || c.getContext('webgl'));
    const ext = gl && !gl.isContextLost() && gl.getExtension('WEBGL_lose_context');
    if (!ext) return false;
    ext.loseContext();
    return true;
  });
  console.log('B  forced a loss:', forced);
  let shown = false;
  for (let i = 0; i < 16; i++) {
    await page.waitForTimeout(500);
    if (await page.getByText(/The graphics ran out of room/i).count()) { shown = true; break; }
  }
  console.log('B  recovery panel shown:', shown);
  if (shown) {
    console.log('B  tier message:', (await page.getByText(/turned down to/i).textContent()).replace(/\s+/g, ' ').trim());
    await page.screenshot({ path: `${OUT}/ctx-lost-panel.png` });
    await page.getByRole('button', { name: /start again/i }).click();
    await page.waitForTimeout(7000);
    const back = await page.evaluate(() => {
      const c = document.querySelector('canvas');
      const gl = c && (c.getContext('webgl2') || c.getContext('webgl'));
      return {
        canvases: document.querySelectorAll('canvas').length,
        alive: gl ? !gl.isContextLost() : null,
        panelGone: !document.body.innerText.includes('ran out of room'),
      };
    });
    console.log('B  after Start again:', JSON.stringify(back));
  }
  await page.close();
}
await browser.close();
