/**
 * Screenshot helper used during development.
 *
 * Usage: node scripts/shoot.mjs <out-dir> <path> [path...]
 *
 * Captures each path at desktop and mobile widths and reports console errors,
 * failed requests, and horizontal overflow.
 *
 * Captures are viewport-sized frames taken at successive scroll offsets rather
 * than one `fullPage: true` shot: Chromium's full-page mode resizes the viewport
 * to the document height, which makes scroll-triggered reveals photograph in
 * their pre-animation state even though they are visible in a real browser.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const [outDir, ...paths] = process.argv.slice(2);
if (!outDir || paths.length === 0) {
  console.error('usage: node scripts/shoot.mjs <out-dir> <path...>');
  process.exit(1);
}

const BASE = process.env.SHOOT_BASE ?? 'http://localhost:3000';
const MAX_FRAMES = Number(process.env.SHOOT_FRAMES ?? 6);
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();

for (const viewport of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
  });

  for (const path of paths) {
    const page = await context.newPage();
    const problems = [];

    page.on('console', (message) => {
      if (message.type() === 'error') problems.push(`console: ${message.text().slice(0, 220)}`);
    });
    page.on('pageerror', (error) => problems.push(`pageerror: ${String(error).slice(0, 220)}`));
    page.on('requestfailed', (request) => {
      const failure = request.failure()?.errorText ?? '';
      // Aborted requests are normal when a component unmounts mid-fetch.
      if (!failure.includes('ABORTED')) {
        problems.push(`request: ${request.url().slice(-70)} ${failure}`);
      }
    });

    const slug = path === '/' ? 'home' : path.replace(/^\//, '').replace(/\//g, '-');

    try {
      await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 45000 });
      await page.waitForTimeout(2600);

      const docHeight = await page.evaluate(() => document.body.scrollHeight);
      const frames = Math.min(MAX_FRAMES, Math.max(1, Math.ceil(docHeight / viewport.height)));

      for (let index = 0; index < frames; index += 1) {
        const y = Math.round((index * (docHeight - viewport.height)) / Math.max(1, frames - 1));
        await page.evaluate((offset) => window.scrollTo(0, offset), y);
        // Reveals need a beat to run once they enter the viewport.
        await page.waitForTimeout(1000);
        await page.screenshot({
          path: `${outDir}/${slug}.${viewport.name}.${index}.png`,
        });
      }

      const horizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1,
      );
      if (horizontalOverflow) problems.push('LAYOUT: page scrolls horizontally');

      console.log(`✓ ${slug} @${viewport.name} — ${frames} frames (${docHeight}px tall)`);
    } catch (error) {
      console.log(`✗ ${path} @${viewport.name}: ${String(error).slice(0, 160)}`);
    }

    if (problems.length) {
      console.log(`  ⚠ ${path} @${viewport.name}`);
      for (const problem of [...new Set(problems)].slice(0, 6)) console.log(`    ${problem}`);
    }

    await page.close();
  }

  await context.close();
}

await browser.close();
