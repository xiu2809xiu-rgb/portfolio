/**
 * Text snapshot of every page, for one locale.
 *
 * Written for the bilingual refactor, where the claim that needs proving is
 * "moving every string into a dictionary changed nothing a reader can see".
 * Type-checking proves the keys exist; it cannot prove the right string ended up
 * in the right place. Capturing the rendered text of every route before the
 * refactor and diffing it afterwards can.
 *
 * It records, per route: the visible text, all mounted text (which includes
 * things like the closed mobile menu), the <html lang>, the title and the head
 * tags that matter for search and sharing.
 *
 *   node scripts/_i18n-snapshot.mjs <base-url> <out.json> [prefix]
 *
 * `prefix` is '' for English and '/zh' for Chinese.
 */
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const [, , BASE = 'http://localhost:3100', OUT = 'snapshot.json', PREFIX = ''] = process.argv;

const WORK = [
  'smartrecap',
  'certain',
  'singink-support',
  'table-tennis-cca-website',
  'swaplah',
  'abc-retail',
];
const POSTS = [
  'building-a-booking-system-that-cannot-double-book',
  'shrinking-a-17mb-avatar-to-1mb',
  'what-a-ticketing-system-taught-me-about-validation',
];

const PAGES = [
  '/',
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

/** Fetched raw rather than rendered. */
const RAW = ['/blog/rss.xml'];
const RAW_GLOBAL = ['/sitemap.xml', '/robots.txt', '/manifest.webmanifest'];

const browser = await chromium.launch({ headless: true });
const out = { base: BASE, prefix: PREFIX, pages: {}, raw: {} };

async function capture(context, route, label) {
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 300)));
  const url = BASE + (PREFIX + route === '' ? '/' : PREFIX + (route === '/' && PREFIX ? '' : route));
  let status = 0;
  try {
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 });
    status = response?.status() ?? 0;
  } catch (e) {
    errors.push('goto: ' + String(e).slice(0, 200));
  }
  /* Walk the page so anything that mounts on scroll has mounted. */
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1200);

  const data = await page.evaluate(() => {
    const meta = (selector, attr = 'content') =>
      document.querySelector(selector)?.getAttribute(attr) ?? null;
    const mounted = document.body.cloneNode(true);
    mounted.querySelectorAll('script,style,noscript,svg,canvas').forEach((n) => n.remove());
    return {
      lang: document.documentElement.lang,
      title: document.title,
      description: meta('meta[name="description"]'),
      canonical: meta('link[rel="canonical"]', 'href'),
      alternates: [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map(
        (n) => `${n.getAttribute('hreflang')} ${n.getAttribute('href')}`,
      ),
      ogTitle: meta('meta[property="og:title"]'),
      ogDescription: meta('meta[property="og:description"]'),
      ogUrl: meta('meta[property="og:url"]'),
      ogLocale: meta('meta[property="og:locale"]'),
      visible: document.body.innerText,
      mounted: mounted.textContent.replace(/\s+/g, ' ').trim(),
      /* Internal links, to prove navigation stays inside the locale. */
      links: [...new Set([...document.querySelectorAll('a[href^="/"]')].map((a) => a.getAttribute('href')))].sort(),
      aria: [...new Set([...document.querySelectorAll('[aria-label]')].map((n) => n.getAttribute('aria-label')))].sort(),
      alts: [...new Set([...document.querySelectorAll('img[alt]')].map((n) => n.getAttribute('alt')).filter(Boolean))].sort(),
    };
  });
  out.pages[label] = { url, status, errors, ...data };
  await page.close();
}

/* Reduced motion collapses reveals and counters to their end state, which is
   what makes the text deterministic enough to diff. */
const still = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
for (const route of PAGES) {
  await capture(still, route, route);
  process.stdout.write('.');
}
await still.close();

/* The drive page replaces itself with a notice under reduced motion, so its
   real start card needs a second look with motion allowed. */
const moving = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await capture(moving, '/drive', '/drive (motion)');
await capture(moving, '/pitch', '/pitch (motion)');
await moving.close();

const fetchText = async (path) => {
  try {
    const res = await fetch(BASE + path);
    return { status: res.status, body: await res.text() };
  } catch (e) {
    return { status: 0, body: String(e) };
  }
};
for (const route of RAW) out.raw[route] = await fetchText(PREFIX + route);
if (!PREFIX) for (const route of RAW_GLOBAL) out.raw[route] = await fetchText(route);

writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log(`\nsaved ${Object.keys(out.pages).length} pages + ${Object.keys(out.raw).length} raw -> ${OUT}`);
for (const [label, p] of Object.entries(out.pages)) {
  if (p.errors.length || (p.status !== 200 && !label.includes('does-not-exist'))) {
    console.log('  !', label, p.status, p.errors.slice(0, 2));
  }
}
await browser.close();
