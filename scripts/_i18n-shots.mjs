/**
 * Screenshots of the Chinese site, for looking at with human eyes.
 *
 * Every other check on the translation is about text. This one is about type:
 * whether a Chinese headline wraps badly, a label overflows a pill that was
 * sized for an English word, or a line breaks one character from its end.
 * Those only show up in a picture.
 *
 *   node scripts/_i18n-shots.mjs <base-url> <out-dir> [prefix] [route ...]
 *
 * `prefix` is `/zh` (default) or `` for English. Each route is captured at a
 * desktop and a phone width, as a series of viewport-height slices — a single
 * full-page image of a long page is too small to read.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const [, , BASE = 'http://localhost:3100', OUT = 'shots', PREFIX = '/zh', ...ROUTES] = process.argv;

const DEFAULT_ROUTES = ['', '/work', '/work/smartrecap', '/blog', '/uses', '/book', '/pitch'];
const routes = ROUTES.length ? ROUTES.map((route) => (route === '/' ? '' : route)) : DEFAULT_ROUTES;

const SIZES = [
  { name: 'desktop', width: 1440, height: 900, slices: 9 },
  { name: 'phone', width: 390, height: 844, slices: 12 },
];

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();

for (const size of SIZES) {
  const context = await browser.newContext({
    viewport: { width: size.width, height: size.height },
    deviceScaleFactor: size.name === 'phone' ? 2 : 1,
    reducedMotion: 'reduce',
  });

  for (const route of routes) {
    const page = await context.newPage();
    await page.goto(`${BASE}${PREFIX}${route}` || BASE, { waitUntil: 'networkidle', timeout: 120000 }).catch(() => {});
    await page.waitForTimeout(1500);

    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    const count = Math.min(size.slices, Math.ceil(total / size.height));
    const name = `${PREFIX.replace('/', '') || 'en'}${route.replace(/\W+/g, '_') || '_home'}`;

    for (let i = 0; i < count; i += 1) {
      await page.evaluate((y) => window.scrollTo(0, y), i * size.height);
      await page.waitForTimeout(450);
      await page.screenshot({ path: path.join(OUT, `${name}.${size.name}.${String(i).padStart(2, '0')}.png`) });
    }
    process.stdout.write(`${name}.${size.name} (${count}) `);
    await page.close();
  }
  await context.close();
}

await browser.close();
console.log(`\nsaved to ${OUT}`);
