import { chromium } from 'playwright';

const PAGES = ['/', '/work', '/work/smartrecap', '/blog', '/blog/shrinking-a-17mb-avatar-to-1mb', '/book', '/uses'];
const WIDTHS = [360, 390, 768, 1024, 1440];
const BASE = 'http://localhost:3000';

const browser = await chromium.launch();
const results = [];
for (const w of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 800 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  for (const p of PAGES) {
    try {
      await page.goto(BASE + p, { waitUntil: 'networkidle', timeout: 45000 });
    } catch (e) {
      try { await page.goto(BASE + p, { waitUntil: 'domcontentloaded', timeout: 30000 }); } catch (e2) { results.push({w,p,err:String(e2)}); continue; }
    }
    await page.waitForTimeout(1500);
    const r = await page.evaluate(() => {
      const de = document.documentElement;
      const sw = de.scrollWidth, iw = window.innerWidth;
      const offenders = [];
      if (sw > iw) {
        for (const el of document.querySelectorAll('body *')) {
          const b = el.getBoundingClientRect();
          if (b.width === 0 || b.height === 0) continue;
          if (b.right > iw + 1 || b.left < -1) {
            const cs = getComputedStyle(el);
            offenders.push({
              tag: el.tagName.toLowerCase(),
              cls: (el.className && typeof el.className === 'string' ? el.className : '').slice(0, 90),
              left: Math.round(b.left), right: Math.round(b.right), width: Math.round(b.width),
              overflowX: cs.overflowX, pos: cs.position,
            });
          }
        }
      }
      return { sw, iw, bodyScrollWidth: document.body.scrollWidth, offenders: offenders.slice(0, 8) };
    });
    results.push({ w, p, ...r });
  }
  await ctx.close();
}
await browser.close();
for (const r of results) {
  if (r.err) { console.log(`${r.w} ${r.p} ERROR ${r.err.slice(0,120)}`); continue; }
  const flag = r.sw > r.iw ? 'OVERFLOW' : 'ok';
  console.log(`${String(r.w).padStart(4)} ${r.p.padEnd(45)} scrollWidth=${r.sw} innerWidth=${r.iw} body=${r.bodyScrollWidth} ${flag}`);
  for (const o of r.offenders || []) console.log(`      -> <${o.tag} class="${o.cls}"> left=${o.left} right=${o.right} w=${o.width} ovx=${o.overflowX} pos=${o.pos}`);
}
