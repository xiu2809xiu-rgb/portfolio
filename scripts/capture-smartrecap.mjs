/**
 * Captures screenshots of the live SmartRecap demo for the case study.
 *
 * The hackathon AWS environment has expired, so the demo runs on Vercel plus a
 * Render free-tier backend that sleeps when idle — the first request can take
 * about a minute to wake. Hence the long timeouts and the explicit wait after
 * first paint.
 *
 * Run: node scripts/capture-smartrecap.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = 'https://smartrecap.vercel.app';
const OUT = 'public/img/work/smartrecap';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1909, height: 915 },
  deviceScaleFactor: 1,
});

console.log('waking the demo (Render free tier can take ~60s) …');
await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 180_000 });
await page.waitForTimeout(6000);

/*
  The site is a long single page plus an /app route, so sections are captured by
  scrolling to each anchor rather than by visiting paths that do not exist.
*/
const sections = [
  { hash: '', name: 'landing', label: 'Landing' },
  { hash: '#how-it-works', name: 'how-it-works', label: 'How it works' },
  { hash: '#grounding', name: 'grounding', label: 'Grounding' },
  { hash: '#features', name: 'features', label: 'Features' },
  { hash: '#built-on', name: 'built-on', label: 'Built on' },
];

for (const section of sections) {
  try {
    if (section.hash) {
      const found = await page.evaluate((h) => {
        const el = document.querySelector(h) ?? document.querySelector(`[id="${h.slice(1)}"]`);
        if (!el) return false;
        el.scrollIntoView({ block: 'start', behavior: 'instant' });
        return true;
      }, section.hash);
      if (!found) {
        console.log(`✗ ${section.name}: anchor not present`);
        continue;
      }
    } else {
      await page.evaluate(() => window.scrollTo(0, 0));
    }
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${OUT}/${section.name}.jpg`, quality: 88, type: 'jpeg' });
    console.log(`✓ ${section.name}`);
  } catch (error) {
    console.log(`✗ ${section.name}: ${String(error).slice(0, 120)}`);
  }
}

try {
  await page.goto(`${BASE}/app`, { waitUntil: 'networkidle', timeout: 120_000 });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: `${OUT}/app.jpg`, quality: 88, type: 'jpeg' });
  console.log('✓ app');
} catch (error) {
  console.log(`✗ app: ${String(error).slice(0, 120)}`);
}

const anchors = await page.evaluate(() =>
  [...document.querySelectorAll('[id]')].map((el) => el.id).filter(Boolean).slice(0, 30),
);
console.log('section ids on the page:', JSON.stringify(anchors));

await browser.close();
