/**
 * Straight-line traction test.
 *
 * Holds the throttle for five seconds and reports how far the car actually got,
 * plus how much of that time its wheels were on the ground. Distance is the
 * honest measure — a car whose wheels skip has no traction no matter how much
 * engine force the controller reports delivering.
 */
import { chromium } from 'playwright';

const CONFIGS = JSON.parse(process.argv[2]);

async function run(browser, config) {
  const query = Object.entries(config).map(([k, v]) => `${k}=${v}`).join('&');
  const page = await browser.newPage({ viewport: { width: 620, height: 420 } });
  try {
    await page.goto(`http://localhost:3000/drive?debug&${query}`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /start engine/i }).click();
    await page.waitForTimeout(9000);
    await page.keyboard.press('KeyR');
    await page.waitForTimeout(2000);

    const read = () => page.evaluate(() => {
      const h = window.__drive?.current;
      if (!h?.body) return null;
      const t = h.body.translation(), lv = h.body.linvel(), r = h.body.rotation();
      return {
        x: t.x, z: t.z, y: t.y,
        speed: Math.hypot(lv.x, lv.z),
        upY: 1 - 2 * (r.x * r.x + r.z * r.z),
        grounded: [0, 1, 2, 3].filter((i) => h.vehicle.wheelIsInContact(i)).length,
      };
    });

    const start = await read();
    await page.keyboard.down('KeyW');
    const samples = [];
    for (let i = 0; i < 25; i += 1) {
      await page.waitForTimeout(200);
      const s = await read();
      if (s) samples.push(s);
    }
    await page.keyboard.up('KeyW');
    const end = samples.at(-1);
    await page.close();

    if (!start || !end) return { config, verdict: 'no data' };
    return {
      config,
      dist: +Math.hypot(end.x - start.x, end.z - start.z).toFixed(1),
      topSpeed: +Math.max(...samples.map((s) => s.speed)).toFixed(1),
      grounded: +(samples.reduce((a, s) => a + s.grounded, 0) / (samples.length * 4)).toFixed(2),
      upright: +(samples.filter((s) => s.upY > 0.8).length / samples.length).toFixed(2),
      maxY: +Math.max(...samples.map((s) => s.y)).toFixed(2),
    };
  } catch (error) {
    await page.close().catch(() => {});
    return { config, verdict: String(error).slice(0, 50) };
  }
}

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const out = [];
for (const c of CONFIGS) out.push(await run(browser, c));
await browser.close();

out.sort((a, b) => (b.dist ?? -1) - (a.dist ?? -1));
for (const r of out) {
  console.log(
    'dist', String(r.dist ?? '-').padStart(6),
    'top', String(r.topSpeed ?? '-').padStart(5), 'm/s',
    'gnd', String(r.grounded ?? '-').padEnd(5),
    'upright', String(r.upright ?? '-').padEnd(5),
    'maxY', String(r.maxY ?? '-').padEnd(5),
    JSON.stringify(r.config),
    r.verdict ? '| ' + r.verdict : '',
  );
}
