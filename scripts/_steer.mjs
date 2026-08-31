import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 800, height: 560 } });
await page.goto('http://localhost:3000/drive?debug', { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /start engine/i }).click();
await page.waitForTimeout(10000);

// Heading in degrees, measured from the car's own nose projected on the ground.
const heading = () => page.evaluate(() => {
  const q = window.__drive.current.body.rotation();
  const fx = 2 * (q.x * q.z + q.w * q.y);
  const fz = 1 - 2 * (q.x * q.x + q.y * q.y);
  return (Math.atan2(fx, fz) * 180) / Math.PI;
});

for (const key of ['KeyD', 'KeyA']) {
  await page.keyboard.press('KeyR');
  await page.waitForTimeout(1800);
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(1200);            // get rolling first
  const before = await heading();
  await page.keyboard.down(key);
  await page.waitForTimeout(2000);
  const after = await heading();
  await page.keyboard.up(key);
  await page.keyboard.up('KeyW');
  let delta = after - before;
  while (delta > 180) delta -= 360;
  while (delta < -180) delta += 360;
  /*
    Sign convention, stated once so it cannot be guessed at again: heading grows
    as the nose turns toward world +X, and the chase camera looks along the car's
    +Z, so its right vector is world -X. World +X is therefore SCREEN LEFT, and a
    positive heading change is a left turn. Calling it "right" is what let a
    reversed steering wheel pass this test.
  */
  const turned = delta > 5 ? 'LEFT' : delta < -5 ? 'RIGHT' : 'straight';
  console.log(`${key} (expect ${key === 'KeyD' ? 'RIGHT' : 'LEFT'}) -> heading changed ${delta.toFixed(0)}deg = ${turned}`);
  await page.waitForTimeout(800);
}
await browser.close();
