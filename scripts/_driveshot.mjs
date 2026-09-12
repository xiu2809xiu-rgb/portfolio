/**
 * Visual harness for /drive.
 *
 * Two things make this awkward, and both are the headless browser's fault
 * rather than the scene's:
 *
 *  1. Playwright's page screenshot will not composite this WebGL canvas — it
 *     comes back white. Reading the canvas back with `drawImage`/`toDataURL`
 *     does work, which is why ?debug turns on `preserveDrawingBuffer`.
 *  2. Software WebGL loses the context about a second after the first full
 *     frame. So there is one short window in which the world can be looked at.
 *
 * Hence the shape: poll until the first frame lands, then — inside that window
 * — place the camera and force a synchronous render for each view, reading the
 * pixels back immediately. No driving required, and any viewpoint is reachable.
 *
 *   node scripts/_driveshot.mjs <out-dir> [tag]
 */
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const OUT = process.argv[2];
const TAG = process.argv[3] || 'shot';

/** [name, camera position, look-at target] */
const VIEWS = [
  ['chase', [0, 4.2, -18], [0, 1.2, -4]],
  ['plaza-high', [0, 34, -46], [0, 0, 6]],
  ['ring', [44, 9, -44], [8, 0, -6]],
  ['gate', [0, 6, -74], [0, 4, -52]],
  ['treeline', [58, 5, 20], [24, 2, 6]],
  ['aerial', [0, 130, -95], [0, 0, 0]],
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 760 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));

await page.goto('http://localhost:3000/drive?shot', { waitUntil: 'domcontentloaded', timeout: 240000 });
await page.waitForTimeout(2000);
await page.getByRole('button', { name: /start engine/i }).click();

/* Wait for the first real frame. */
let alive = false;
for (let i = 0; i < 90; i += 1) {
  await page.waitForTimeout(120);
  alive = await page.evaluate(() => {
    const t = window.__three;
    if (!t) return false;
    const gl = t.gl.getContext();
    return !gl.isContextLost() && (t.gl.info.render.calls > 0 || !!t.composer);
  });
  if (alive) break;
}
if (!alive) {
  console.log(JSON.stringify({ ok: false, reason: 'never rendered', errors }));
  await browser.close();
  process.exit(1);
}

/* Grab every view inside the live window, in one page call. */
const frames = await page.evaluate((views) => {
  const t = window.__three;
  const out = [];
  for (const [name, pos, look] of views) {
    try {
      t.camera.position.set(pos[0], pos[1], pos[2]);
      t.camera.lookAt(look[0], look[1], look[2]);
      t.camera.updateMatrixWorld();
      /* Through the composer when there is one — otherwise the capture would
         miss bloom and the tone curve, i.e. most of what is being checked. */
      if (t.composer) t.composer.render(0);
      else t.gl.render(t.scene, t.camera);
      out.push({ name, url: t.gl.domElement.toDataURL('image/png'), lost: t.gl.getContext().isContextLost() });
    } catch (e) {
      out.push({ name, err: String(e).slice(0, 120) });
    }
  }
  const i = t.gl.info.render;
  return { out, stats: { calls: i.calls, triangles: i.triangles, programs: t.gl.info.programs?.length } };
}, VIEWS);

let saved = 0;
for (const f of frames.out) {
  if (!f.url) { console.log('  ', f.name, 'FAILED', f.err || ''); continue; }
  writeFileSync(`${OUT}/${TAG}-${f.name}.png`, Buffer.from(f.url.split(',')[1], 'base64'));
  saved += 1;
}
console.log(JSON.stringify({ ok: true, saved, stats: frames.stats, errors: errors.slice(0, 3) }));
await browser.close();
