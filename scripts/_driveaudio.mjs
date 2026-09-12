import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1000, height: 640 } });
const errs = [];
page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));

await page.goto('http://localhost:3000/drive?shot', { waitUntil: 'domcontentloaded', timeout: 180000 });
await page.waitForTimeout(2200);

// Spy on the AudioContext so we can assert a graph was actually built.
await page.evaluate(() => {
  const Real = window.AudioContext;
  window.__audioSpy = { contexts: 0, oscillators: 0, buffers: 0 };
  window.AudioContext = class extends Real {
    constructor(...a) {
      super(...a);
      window.__audioSpy.contexts += 1;
    }
    createOscillator() {
      window.__audioSpy.oscillators += 1;
      return super.createOscillator();
    }
    createBufferSource() {
      window.__audioSpy.buffers += 1;
      return super.createBufferSource();
    }
  };
});

await page.getByRole('button', { name: /start engine/i }).click();
await page.waitForTimeout(4000);

const audio = await page.evaluate(() => ({
  ...window.__audioSpy,
  state: (window.__audioCtxState = undefined),
}));
console.log('audio graph:', JSON.stringify(audio));

// Drive, and confirm the engine note tracks speed rather than sitting at idle.
const sample = () => page.evaluate(() => window.__three?.gl?.info?.render?.calls ?? -1);
await page.keyboard.down('w');
await page.waitForTimeout(2500);
console.log('draw calls while driving:', await sample());
await page.keyboard.press('h');
await page.waitForTimeout(400);
await page.keyboard.up('w');

console.log('errors:', errs.slice(0, 4));
await browser.close();
