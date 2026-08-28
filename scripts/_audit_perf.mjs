import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:3100';
const routes = ['/', '/work', '/work/smartrecap', '/blog', '/book', '/uses'];

const browser = await chromium.launch();
for (const route of routes) {
  const ctx = await browser.newContext({ bypassCSP: true });
  const page = await ctx.newPage();
  const reqs = [];
  page.on('response', async (res) => {
    const req = res.request();
    let size = 0;
    try { size = Number((await res.headerValue('content-length')) || 0); } catch {}
    if (!size) { try { size = (await res.body()).length; } catch {} }
    reqs.push({ url: res.url(), type: req.resourceType(), status: res.status(), size });
  });
  await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 60000 });
  // no scrolling at all
  await page.waitForTimeout(3000);
  await ctx.close();

  const by = {};
  for (const r of reqs) { by[r.type] = (by[r.type] || 0) + r.size; }
  const total = reqs.reduce((a, r) => a + r.size, 0);
  const js = reqs.filter(r => r.type === 'script').reduce((a,r)=>a+r.size,0);
  console.log(`\n=== ${route} ===`);
  console.log(`requests=${reqs.length} total=${(total/1024).toFixed(1)}KB script=${(js/1024).toFixed(1)}KB`);
  console.log('by type:', Object.entries(by).map(([k,v])=>`${k}=${(v/1024).toFixed(1)}KB`).join(' '));
  const big = reqs.filter(r => r.size > 40*1024).sort((a,b)=>b.size-a.size).slice(0,12);
  for (const b of big) console.log(`   ${(b.size/1024).toFixed(1)}KB  ${b.type}  ${b.url.replace(BASE,'')}`);
  const media = reqs.filter(r => /\.(mp4|mp3|glb)$/i.test(new URL(r.url).pathname));
  console.log('media fetched:', media.map(m=>`${new URL(m.url).pathname}(${(m.size/1024).toFixed(0)}KB,${m.status})`).join(', ') || 'none');
}
await browser.close();
