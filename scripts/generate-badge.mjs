/**
 * Renders the two faces of the lanyard ID badge to PNG.
 *
 * Uses headless Chromium rather than compositing with sharp: the badge is a
 * typographic layout, and Chromium gives the same font rendering, letter-spacing,
 * and gradient support the rest of the site uses. Re-run after editing the design
 * or changing the profile photo.
 *
 * Run: node scripts/generate-badge.mjs
 */
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';

/**
 * The card mesh maps each face to a 0.5 x 0.755 slice of its texture atlas, so a
 * face is 2:3-ish in portrait.
 *
 * Rendered at 1000px wide rather than 660: the badge hangs close enough to the
 * camera that the old texture was visibly soft, and every type size below is now
 * a share of this width, so the layout scales with it rather than staying small
 * inside a bigger canvas.
 */
const WIDTH = 1000;
const HEIGHT = 1515;

const OUT_DIR = 'public/img/lanyard';
mkdirSync(OUT_DIR, { recursive: true });

const photo = `data:image/jpeg;base64,${readFileSync('public/img/people/richie.jpg').toString('base64')}`;

const shell = (body) => `<!doctype html>
<html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800;900&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:${WIDTH}px;height:${HEIGHT}px;overflow:hidden;
       font-family:'Outfit',sans-serif;background:#0b0e13;color:#e9ecef}
  .card{position:relative;width:100%;height:100%;padding:74px 66px;display:flex;flex-direction:column;
        background:
          radial-gradient(circle at 15% 0%, rgba(180,255,57,.16), transparent 45%),
          radial-gradient(circle at 100% 100%, rgba(57,255,216,.10), transparent 45%),
          #0b0e13;}
  .mono{font-family:'Space Mono',monospace}
  .punch{position:absolute;top:34px;left:50%;transform:translateX(-50%);
         width:150px;height:36px;border-radius:999px;background:#05070a;
         box-shadow:inset 0 0 0 2px rgba(255,255,255,.10)}
  .rule{height:4px;background:linear-gradient(90deg,#b4ff39,#39ffd8);border-radius:2px}
</style></head><body>${body}</body></html>`;

const front = shell(`
<div class="card">
  <div class="punch"></div>

  <div style="display:flex;align-items:center;justify-content:space-between;margin-top:26px">
    <div style="font-size:52px;font-weight:800;letter-spacing:-1px">RICHIE<span style="color:#b4ff39">.</span>KOH</div>
    <div class="mono" style="font-size:20px;letter-spacing:3px;color:#8b949e">2025—2028</div>
  </div>

  <div class="rule" style="margin:32px 0 14px"></div>

  <div style="flex:1;display:flex;flex-direction:column;justify-content:center">
  <!--
    The source photograph averages 166/154/145 across its channels and clips to
    255 in all three — bright enough that the face washed out once the card's own
    lime gradient was laid over it. Pulling brightness down and contrast up
    recovers the features without making it look graded.
  -->
  <div style="width:470px;height:470px;margin:0 auto;border-radius:34px;overflow:hidden;
              box-shadow:0 0 0 3px rgba(180,255,57,.34), 0 34px 70px -24px rgba(0,0,0,.95)">
    <img src="${photo}" style="width:100%;height:100%;object-fit:cover;object-position:center top;
                               filter:brightness(.84) contrast(1.2) saturate(1.04)">
  </div>

  <div style="margin-top:46px;text-align:center">
    <div style="font-size:84px;font-weight:800;letter-spacing:-2.4px;line-height:1.04">Koh Shan Shun</div>
    <div style="font-size:84px;font-weight:800;letter-spacing:-2.4px;line-height:1.04;color:#b4ff39">Richie</div>
    <div class="mono" style="margin-top:26px;font-size:26px;letter-spacing:4px;color:#8b949e;text-transform:uppercase">
      Software&nbsp;Developer
    </div>
  </div>
  </div>

  <div style="display:flex;align-items:flex-end;justify-content:space-between">
    <div>
      <div class="mono" style="font-size:18px;letter-spacing:3.4px;color:#6b7280;text-transform:uppercase">Institution</div>
      <div style="font-size:30px;font-weight:600;margin-top:9px">Nanyang Polytechnic</div>
      <div class="mono" style="font-size:20px;color:#8b949e;margin-top:6px">Diploma in Information Technology</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:3px;align-items:flex-end">
      ${Array.from({ length: 9 })
        .map((_, i) => `<div style="width:${28 + ((i * 13) % 34)}px;height:2.5px;background:rgba(233,236,239,${i % 3 === 0 ? 0.55 : 0.2})"></div>`)
        .join('')}
    </div>
  </div>
</div>`);

const back = shell(`
<div class="card">
  <div class="punch"></div>

  <div style="margin-top:36px">
    <div class="mono" style="font-size:19px;letter-spacing:4px;color:#6b7280;text-transform:uppercase">Contact</div>
    <div class="rule" style="margin-top:20px;width:120px"></div>
  </div>

  <div style="flex:1;margin-top:52px;display:flex;flex-direction:column;justify-content:center;gap:46px">
    ${[
      /* No phone number. It came off the résumé and the site deliberately, and a
         badge texture is just as public as either of them. */
      ['Email', '251651x@mymail.nyp.edu.sg'],
      ['Book a session', 'richiekoh.dev/book'],
      ['LinkedIn', 'in/richiekoh2809'],
      ['GitHub', 'Richie280907'],
      ['Based in', 'Singapore · GMT+8'],
    ]
      .map(
        ([label, value]) => `
      <div>
        <div class="mono" style="font-size:18px;letter-spacing:3.4px;color:#6b7280;text-transform:uppercase">${label}</div>
        <div class="mono" style="font-size:29px;margin-top:10px;color:#e9ecef">${value}</div>
      </div>`,
      )
      .join('')}
  </div>

  <div>
    <div class="rule" style="opacity:.5;margin-bottom:20px"></div>
    <div style="display:flex;align-items:flex-end;justify-content:space-between">
      <div>
        <div style="font-size:38px;font-weight:700;letter-spacing:-.8px">richiekoh.dev</div>
        <div class="mono" style="font-size:20px;color:#8b949e;margin-top:8px">Drag me · I swing</div>
      </div>
      <div style="display:flex;gap:2.5px;align-items:flex-end;height:44px">
        ${Array.from({ length: 26 })
          .map((_, i) => {
            const h = 14 + ((i * 37) % 30);
            const w = i % 4 === 0 ? 4 : 2;
            return `<div style="width:${w}px;height:${h}px;background:rgba(233,236,239,${i % 5 === 0 ? 0.75 : 0.35})"></div>`;
          })
          .join('')}
      </div>
    </div>
  </div>
</div>`);

/**
 * The lanyard strap texture, tiled four times along the band.
 *
 * Replaces the upstream React Bits artwork, which carries their own logo — not
 * something to hang around a personal ID badge. One tile = one wordmark.
 */
const STRAP_W = 1024;
const STRAP_H = 248;

const strap = `<!doctype html>
<html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@700&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:${STRAP_W}px;height:${STRAP_H}px;overflow:hidden;background:#05070a;
       display:flex;align-items:center;justify-content:center;
       font-family:'Space Mono',monospace}
  .band{position:absolute;inset:0;background:linear-gradient(180deg,#0d1117 0%,#05070a 50%,#0d1117 100%)}
  .edge{position:absolute;left:0;right:0;height:5px;background:rgba(180,255,57,.30)}
</style></head><body>
  <div class="band"></div>
  <div class="edge" style="top:16px"></div>
  <div class="edge" style="bottom:16px"></div>
  <div style="position:relative;display:flex;align-items:center;gap:26px;color:#e9ecef;
              font-size:52px;font-weight:700;letter-spacing:7px">
    <span style="color:#b4ff39">&#10022;</span>
    <span>RICHIE<span style="color:#b4ff39">.</span>KOH</span>
    <span style="color:#b4ff39">&#10022;</span>
  </div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });

for (const [name, html] of [
  ['badge-front', front],
  ['badge-back', back],
]) {
  await page.setContent(html, { waitUntil: 'networkidle' });
  // Give the webfonts a beat to swap in before capturing.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT_DIR}/${name}.png` });
  console.log(`wrote ${OUT_DIR}/${name}.png`);
}

await page.setViewportSize({ width: STRAP_W, height: STRAP_H });
await page.setContent(strap, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT_DIR}/strap.png` });
console.log(`wrote ${OUT_DIR}/strap.png`);

await browser.close();
