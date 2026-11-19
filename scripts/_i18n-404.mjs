/**
 * Checks that every kind of missing page lands on the site's own 404, in the
 * right language, with the right status.
 *
 * There are three different ways a URL can be missing here, and they take
 * different paths through the framework:
 *
 *   /nope              no route at all        → the `[lang]/[...rest]` catch-all
 *   /work/nope         a real route, bad slug → that page's own `notFound()`
 *   /fr/work           an unknown language    → rewritten under /en, then as above
 *
 * All of them should end at `[lang]/not-found.tsx`. That page is rendered on
 * the client (the server sends a shell with the 404 status and the page's data),
 * so this has to be a real browser check rather than a look at the HTML.
 *
 *   node scripts/_i18n-404.mjs <base-url> [screenshot-dir]
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const [, , BASE = 'http://localhost:3100', SHOTS = ''] = process.argv;

const CASES = [
  { path: '/nope', lang: 'en', heading: 'This page doesn’t exist' },
  { path: '/zh/nope', lang: 'zh-Hans', heading: '这个页面不存在' },
  { path: '/work/nope', lang: 'en', heading: 'This page doesn’t exist' },
  { path: '/zh/work/nope', lang: 'zh-Hans', heading: '这个页面不存在' },
  { path: '/blog/nope', lang: 'en', heading: 'This page doesn’t exist' },
  { path: '/zh/blog/nope', lang: 'zh-Hans', heading: '这个页面不存在' },
  { path: '/fr/work', lang: 'en', heading: 'This page doesn’t exist' },
  { path: '/zh/a/b/c', lang: 'zh-Hans', heading: '这个页面不存在' },
];

if (SHOTS) mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  reducedMotion: 'reduce',
});

let failures = 0;

for (const test of CASES) {
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));

  const response = await page.goto(`${BASE}${test.path}`, { waitUntil: 'domcontentloaded' });
  const status = response?.status();

  // The 404 is drawn by the client, so wait for it rather than for the load event.
  const heading = page.locator('main h1');
  await heading.waitFor({ state: 'visible', timeout: 15000 }).catch(() => undefined);

  const seen = await page.evaluate(() => ({
    lang: document.documentElement.lang,
    dark: document.documentElement.classList.contains('dark'),
    heading: document.querySelector('main h1')?.textContent?.trim() ?? null,
    header: Boolean(document.querySelector('header')),
    footer: Boolean(document.querySelector('footer')),
    title: document.title,
    links: [...document.querySelectorAll('main nav a')].map(
      (a) => `${a.textContent?.trim()}→${a.getAttribute('href')}`,
    ),
  }));

  if (SHOTS) {
    const name = test.path.replace(/\W+/g, '_').replace(/^_/, '') || 'root';
    await page.screenshot({ path: path.join(SHOTS, `404-${name}.png`) });
  }

  const ok =
    status === 404 &&
    seen.lang === test.lang &&
    seen.dark &&
    seen.heading === test.heading &&
    seen.header &&
    seen.footer &&
    errors.length === 0;

  if (!ok) failures += 1;
  console.log(
    `${ok ? 'PASS' : 'FAIL'} ${test.path.padEnd(16)} status=${status} lang=${seen.lang} ` +
      `chrome=${seen.header && seen.footer} title=${JSON.stringify(seen.title)}`,
  );
  if (!ok) console.log('     ', JSON.stringify({ ...seen, errors }));
  else console.log('     ', seen.links.join('  '));

  await page.close();
}

await browser.close();
if (failures) {
  console.log(`\n${failures} of ${CASES.length} failed`);
  process.exit(1);
}
console.log(`\nall ${CASES.length} missing-page cases land on the localised 404`);
