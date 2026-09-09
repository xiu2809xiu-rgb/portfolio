/**
 * Measurement harness for the holographic card.
 *
 * The card is CSS 3D, and the one thing that cannot be checked by looking at a
 * still is whether the rotations carry the right sign — the same class of bug
 * that reversed the car's throttle and its steering. So the tilt is asserted
 * from the transform axes rather than eyeballed: with the pointer on the right,
 * the card's right edge must come towards the viewer.
 *
 * Run the dev server first, then:  node scripts/_holo.mjs <output-dir>
 */
import { chromium } from 'playwright';

const OUT = process.argv[2];
const BASE = 'http://localhost:3000';
const browser = await chromium.launch();

const settle = (page) => page.waitForTimeout(800);

/* ── Desktop: tilt signs, foil, parallax, flip ───────────────────────────── */
{
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 2,
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()));

  await page.goto(BASE + '/#achievements', { waitUntil: 'networkidle', timeout: 180000 });
  await page.waitForTimeout(2000);

  const card = page.locator('.holo-viewport').first();
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);

  const box = await card.boundingBox();
  const clip = { x: box.x - 30, y: box.y - 30, width: box.width + 60, height: box.height + 60 };
  console.log('card box:', JSON.stringify(box));

  const tilt = page.locator('.holo-tilt').first();
  const vars = () =>
    tilt.evaluate((el) => ({
      rx: el.style.getPropertyValue('--holo-rx'),
      ry: el.style.getPropertyValue('--holo-ry'),
      px: el.style.getPropertyValue('--holo-px'),
      glare: el.style.getPropertyValue('--holo-glare'),
      foil: el.style.getPropertyValue('--holo-foil'),
    }));

  await page.screenshot({ path: `${OUT}/01-rest.png`, clip });
  console.log('rest    ', JSON.stringify(await vars()));

  await page.mouse.move(box.x + box.width * 0.12, box.y + box.height * 0.1);
  await settle(page);
  const topLeft = await vars();
  console.log('topleft ', JSON.stringify(topLeft));
  await page.screenshot({ path: `${OUT}/02-topleft.png`, clip });

  await page.mouse.move(box.x + box.width * 0.88, box.y + box.height * 0.62);
  await settle(page);
  const botRight = await vars();
  console.log('botright', JSON.stringify(botRight));
  await page.screenshot({ path: `${OUT}/03-botright.png`, clip });

  /*
    The assertion. +Y runs down the screen, so a positive rotateX carries the
    top edge AWAY and a positive rotateY carries the right edge AWAY. For the
    card to face the pointer, both must be negative on the side the pointer is.
  */
  const rx = parseFloat(topLeft.rx);
  const ry = parseFloat(botRight.ry);
  console.log(
    'FACES POINTER:',
    rx < -5 && ry < -5 ? 'yes' : `NO — pointer-top rx=${rx} (want <0), pointer-right ry=${ry} (want <0)`,
  );

  /* Do the planes actually slide against each other? */
  const layers = () =>
    page.evaluate(() =>
      [...document.querySelector('.holo-face').firstElementChild.children].map(
        (c) => +c.getBoundingClientRect().x.toFixed(2),
      ),
    );
  await page.mouse.move(box.x + box.width * 0.02, box.y + box.height * 0.5);
  await settle(page);
  const left = await layers();
  await page.mouse.move(box.x + box.width * 0.98, box.y + box.height * 0.5);
  await settle(page);
  const right = await layers();
  const spread = left.map((v, i) => +(right[i] - v).toFixed(2));
  console.log('layer travel L→R:', JSON.stringify(spread));
  console.log('PARALLAX:', new Set(spread).size > 1 ? 'layers separate' : 'NO SEPARATION');

  await page.getByRole('button', { name: /turn it over/i }).click();
  await page.waitForTimeout(1400);
  await page.screenshot({ path: `${OUT}/04-back.png`, clip });

  await page.getByRole('button', { name: /turn it over/i }).click();
  await page.mouse.move(10, 10);
  await page.waitForTimeout(1400);
  await page.locator('#achievements').screenshot({ path: `${OUT}/05-section.png` });

  console.log('desktop errors:', errors.length ? errors.slice(0, 5) : 'none');
  await page.close();
}

/* ── Narrow viewport ─────────────────────────────────────────────────────── */
{
  const page = await browser.newPage({
    viewport: { width: 390, height: 850 },
    deviceScaleFactor: 2,
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(BASE + '/#achievements', { waitUntil: 'networkidle', timeout: 180000 });
  await page.waitForTimeout(2500);
  const card = page.locator('.holo-viewport').first();
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  console.log('mobile card box:', JSON.stringify(await card.boundingBox()));
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  console.log('mobile horizontal overflow:', overflow, 'px', overflow === 0 ? '(ok)' : '(BLEEDS)');
  await page.locator('#achievements').screenshot({ path: `${OUT}/06-mobile.png` });
  console.log('mobile errors:', errors.length ? errors.slice(0, 3) : 'none');
  await page.close();
}

/* ── Reduced motion: no tilt, but the card still turns over ──────────────── */
{
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
    reducedMotion: 'reduce',
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(BASE + '/#achievements', { waitUntil: 'networkidle', timeout: 180000 });
  await page.waitForTimeout(2500);
  const card = page.locator('.holo-viewport').first();
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  const box = await card.boundingBox();

  await page.mouse.move(box.x + box.width * 0.1, box.y + box.height * 0.15);
  await settle(page);
  const state = await page
    .locator('.holo-tilt')
    .first()
    .evaluate((el) => getComputedStyle(el).transform);
  console.log('reduced-motion transform:', state, state === 'none' ? '(ok)' : '(STILL TILTS)');

  await page.getByRole('button', { name: /turn it over/i }).click();
  await page.waitForTimeout(500);
  const pressed = await page
    .getByRole('button', { name: /turn it over/i })
    .getAttribute('aria-pressed');
  console.log('reduced-motion flip works:', pressed === 'true' ? 'yes' : 'NO');
  await page.screenshot({
    path: `${OUT}/07-reduced.png`,
    clip: { x: box.x - 20, y: box.y - 20, width: box.width + 40, height: box.height + 40 },
  });
  console.log('reduced errors:', errors.length ? errors.slice(0, 3) : 'none');
  await page.close();
}

await browser.close();
