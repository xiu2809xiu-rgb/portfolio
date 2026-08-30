/**
 * Scores a car configuration by driving it through a fixed manoeuvre.
 *
 * Everything about vehicle feel that matters here is measurable: did it stay on
 * its wheels, did it cover ground, did it leave the floor. Tuning by screenshot
 * was what produced four hours of parameter roulette.
 */
import { chromium } from 'playwright';

const CONFIGS = JSON.parse(process.argv[2]);
const CONCURRENCY = 1;  // software rendering: parallel pages starve each other

const MANOEUVRE = [
  { keys: ['KeyW'], ms: 1800 },                 // accelerate
  { keys: ['KeyW', 'KeyD'], ms: 2600 },         // hard right under power
  { keys: ['KeyW', 'KeyA'], ms: 2600 },         // hard left the other way
  { keys: ['Space'], ms: 1200 },                // handbrake
];

async function score(browser, config) {
  const query = Object.entries(config).map(([k, v]) => `${k}=${v}`).join('&');
  const page = await browser.newPage({ viewport: { width: 640, height: 440 } });
  const samples = [];
  let crashed = null;
  page.on('pageerror', (e) => { crashed = String(e).slice(0, 80); });

  try {
    await page.goto(`http://localhost:3000/drive?debug&${query}`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /start engine/i }).click();
    await page.waitForTimeout(9000);
    await page.keyboard.press('KeyR');
    await page.waitForTimeout(2200);

    const sample = () => page.evaluate(() => {
      const h = window.__drive?.current;
      if (!h?.body) return null;
      const t = h.body.translation(), r = h.body.rotation();
      return {
        x: t.x, y: t.y, z: t.z,
        upY: 1 - 2 * (r.x * r.x + r.z * r.z),
        kph: h.speedKph,
        grounded: [0, 1, 2, 3].filter((i) => h.vehicle.wheelIsInContact(i)).length,
      };
    });

    for (const step of MANOEUVRE) {
      for (const k of step.keys) await page.keyboard.down(k);
      const until = Date.now() + step.ms;
      while (Date.now() < until) {
        const s = await sample();
        if (s) samples.push(s);
        await page.waitForTimeout(110);
      }
      for (const k of step.keys) await page.keyboard.up(k);
    }
  } catch (error) {
    crashed = crashed ?? String(error).slice(0, 80);
  }
  await page.close();

  if (!samples.length) return { config, fitness: -999, note: crashed ?? 'no samples' };

  const upright = samples.filter((s) => s.upY > 0.75).length / samples.length;
  const grounded = samples.reduce((a, s) => a + s.grounded, 0) / (samples.length * 4);
  const maxY = Math.max(...samples.map((s) => s.y));
  const escaped = samples.some((s) => Math.abs(s.x) > 60 || Math.abs(s.z) > 60 || s.y < -2);

  let distance = 0;
  for (let i = 1; i < samples.length; i += 1) {
    distance += Math.hypot(samples[i].x - samples[i - 1].x, samples[i].z - samples[i - 1].z);
  }
  const topSpeed = Math.max(...samples.map((s) => s.kph));

  /*
    Upright dominates: a car that rolls is not a car. Ground contact is next,
    because a vehicle skipping across the surface is the failure mode that
    precedes a roll. Distance rewards actually driving rather than sitting still,
    and air time is punished hard — anything above two metres is a launch.
  */
  const fitness =
    upright * 100 +
    grounded * 40 +
    Math.min(distance, 120) * 0.35 -
    Math.max(0, maxY - 2) * 25 -
    (escaped ? 200 : 0);

  return {
    config,
    fitness: +fitness.toFixed(1),
    upright: +upright.toFixed(2),
    grounded: +grounded.toFixed(2),
    dist: +distance.toFixed(0),
    maxY: +maxY.toFixed(1),
    top: +topSpeed.toFixed(0),
    note: crashed ?? (escaped ? 'left the arena' : ''),
  };
}

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const results = [];
for (let i = 0; i < CONFIGS.length; i += CONCURRENCY) {
  const batch = CONFIGS.slice(i, i + CONCURRENCY);
  results.push(...(await Promise.all(batch.map((c) => score(browser, c)))));
}
await browser.close();

results.sort((a, b) => b.fitness - a.fitness);
for (const r of results) {
  console.log(
    String(r.fitness).padStart(7),
    'upright', String(r.upright ?? '-').padEnd(5),
    'grounded', String(r.grounded ?? '-').padEnd(5),
    'dist', String(r.dist ?? '-').padEnd(4),
    'maxY', String(r.maxY ?? '-').padEnd(5),
    'top', String(r.top ?? '-').padEnd(4),
    JSON.stringify(r.config),
    r.note ? '| ' + r.note : '',
  );
}
