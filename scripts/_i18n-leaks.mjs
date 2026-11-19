/**
 * Finds English that was left behind on the Chinese site.
 *
 * Type-checking proves every dictionary key exists in both languages. It cannot
 * see a string that never made it into a dictionary at all — a label still
 * hard-coded in a component renders in English on /zh and nothing complains.
 * This walks every Chinese page in a real browser and lists the text a reader
 * would see that contains no Chinese.
 *
 * Plenty of Latin text is correct on a Chinese page: names, technologies, code,
 * key caps. Those are filtered by what they are (inside <code>/<pre>, a known
 * proper noun, no real words) and what is left is printed for a person to
 * judge. It reports; it does not fail the build.
 *
 *   node scripts/_i18n-leaks.mjs <base-url> <out.txt>
 */
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const [, , BASE = 'http://localhost:3100', OUT = 'leaks.txt'] = process.argv;

const WORK = ['smartrecap', 'certain', 'singink-support', 'table-tennis-cca-website', 'swaplah'];
const POSTS = [
  'building-a-booking-system-that-cannot-double-book',
  'shrinking-a-17mb-avatar-to-1mb',
  'what-a-ticketing-system-taught-me-about-validation',
];
const PAGES = [
  '',
  '/work',
  ...WORK.map((slug) => `/work/${slug}`),
  '/blog',
  ...POSTS.map((slug) => `/blog/${slug}`),
  '/uses',
  '/book',
  '/pitch',
  '/drive',
  '/this-page-does-not-exist',
];

/** Runs in the page. Returns every piece of reader-facing text with no Chinese in it. */
function collect() {
  const HAN = /[㐀-鿿]/;
  const WORDS = /[A-Za-z]{3,}/g;
  const SKIP = 'script,style,noscript,svg,canvas,code,pre,kbd,samp,[data-no-translate]';
  const found = new Map();
  const note = (kind, text, element) => {
    const clean = text.replace(/\s+/g, ' ').trim();
    if (!clean || HAN.test(clean)) return;
    if ((clean.match(WORDS) ?? []).length === 0) return;
    const where = element?.closest('[id]')?.id ?? element?.tagName?.toLowerCase() ?? '';
    const key = `${kind}|${clean}`;
    if (!found.has(key)) found.set(key, { kind, text: clean, where });
  };

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const parent = node.parentElement;
    if (!parent || parent.closest(SKIP)) continue;
    note('text', node.textContent ?? '', parent);
  }
  for (const element of document.querySelectorAll('[aria-label]')) {
    note('aria-label', element.getAttribute('aria-label') ?? '', element);
  }
  for (const element of document.querySelectorAll('img[alt]')) {
    note('alt', element.getAttribute('alt') ?? '', element);
  }
  for (const element of document.querySelectorAll('[title]')) {
    note('title', element.getAttribute('title') ?? '', element);
  }
  for (const element of document.querySelectorAll('[placeholder]')) {
    note('placeholder', element.getAttribute('placeholder') ?? '', element);
  }
  return {
    lang: document.documentElement.lang,
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '',
    items: [...found.values()],
  };
}

const browser = await chromium.launch();
const lines = [];
let total = 0;

async function scan(context, route, label) {
  const page = await context.newPage();
  await page.goto(`${BASE}/zh${route}`, { waitUntil: 'networkidle', timeout: 120000 }).catch(() => {});
  /* Walk the page so anything that mounts on scroll has mounted. */
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1000);
  const result = await page.evaluate(collect);
  await page.close();

  lines.push(`== /zh${route}${label}   lang=${result.lang}   (${result.items.length})`);
  lines.push(`   title: ${result.title}`);
  lines.push(`   description: ${result.description}`);
  for (const item of result.items) {
    lines.push(`   [${item.kind}${item.where ? ` @${item.where}` : ''}] ${item.text}`);
  }
  lines.push('');
  total += result.items.length;
  process.stdout.write('.');
}

const still = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
for (const route of PAGES) await scan(still, route, '');
await still.close();

/* /drive and /pitch behave differently with motion allowed. */
const moving = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await scan(moving, '/drive', ' (motion)');
await scan(moving, '/pitch', ' (motion)');
await moving.close();

await browser.close();
writeFileSync(OUT, lines.join('\n'), 'utf8');
console.log(`\n${total} Latin-only text items across ${PAGES.length + 2} page views -> ${OUT}`);
