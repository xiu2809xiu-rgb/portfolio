/**
 * Idle-stability filter.
 *
 * A car that cannot sit still cannot drive. This drops the car at spawn, touches
 * nothing for three seconds, and reports how much it moves — which is a far
 * cheaper way to reject a suspension setting than driving a full lap in it.
 */
import { chromium } from 'playwright';

const CONFIGS = JSON.parse(process.argv[2]);
const CONCURRENCY = 1;  // software rendering: parallel pages starve each other

async function test(browser, config) {
  const query = Object.entries(config).map(([k, v]) => `${k}=${v}`).join('&');
  const page = await browser.newPage({ viewport: { width: 560, height: 400 } });
  try {
    await page.goto(`http://localhost:3000/drive?debug&${query}`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /start engine/i }).click();
    await page.waitForTimeout(9000);
    await page.keyboard.press('KeyR');
    await page.waitForTimeout(2000);

    const samples = [];
    for (let i = 0; i < 20; i += 1) {
      samples.push(await page.evaluate(() => {
        const h = window.__drive?.current;
        if (!h?.body) return null;
        const t = h.body.translation(), r = h.body.rotation(), lv = h.body.linvel();
        return {
          x: t.x, y: t.y, z: t.z,
          upY: 1 - 2 * (r.x * r.x + r.z * r.z),
          v: Math.hypot(lv.x, lv.y, lv.z),
          len: 0,
          grounded: h.grounded,
        };
      }));
      await page.waitForTimeout(150);
    }
    await page.close();

    const ok = samples.filter(Boolean);
    if (!ok.length) return { config, verdict: 'no data' };

    const avg = (k) => ok.reduce((a, s) => a + s[k], 0) / ok.length;
    const drift = Math.hypot(ok.at(-1).x - ok[0].x, ok.at(-1).z - ok[0].z);
    const bounce = Math.max(...ok.map((s) => s.y)) - Math.min(...ok.map((s) => s.y));

    return {
      config,
      rideY: +avg('y').toFixed(2),
      upY: +avg('upY').toFixed(2),
      vel: +avg('v').toFixed(2),
      susp: +avg('len').toFixed(2),
      grounded: +(avg('grounded') / 4).toFixed(2),
      drift: +drift.toFixed(2),
      bounce: +bounce.toFixed(3),
    };
  } catch (error) {
    await page.close().catch(() => {});
    return { config, verdict: String(error).slice(0, 60) };
  }
}

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const out = [];
for (let i = 0; i < CONFIGS.length; i += CONCURRENCY) {
  out.push(...(await Promise.all(CONFIGS.slice(i, i + CONCURRENCY).map((c) => test(browser, c)))));
}
await browser.close();

/* Settled means: upright, four wheels down, barely moving, barely drifting. */
const settled = (r) =>
  r.upY > 0.95 && r.grounded > 0.9 && r.vel < 0.6 && r.drift < 0.6 && r.bounce < 0.06;

out.sort((a, b) => (settled(b) ? 1 : 0) - (settled(a) ? 1 : 0) || (a.vel ?? 99) - (b.vel ?? 99));
for (const r of out) {
  console.log(
    settled(r) ? 'SETTLED' : '       ',
    'rideY', String(r.rideY ?? '-').padEnd(6),
    'upY', String(r.upY ?? '-').padEnd(6),
    'vel', String(r.vel ?? '-').padEnd(6),
    'susp', String(r.susp ?? '-').padEnd(6),
    'gnd', String(r.grounded ?? '-').padEnd(5),
    'drift', String(r.drift ?? '-').padEnd(6),
    'bounce', String(r.bounce ?? '-').padEnd(6),
    JSON.stringify(r.config),
  );
}
