import { chromium } from 'playwright';
const BASE = 'https://portfolio-liart-ten-zt8tx464k8.vercel.app';
const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
const reqs = [];
page.on('response', async (res) => {
  let size = 0;
  try { size = Number((await res.headerValue('content-length')) || 0); } catch {}
  reqs.push({ url: res.url(), type: res.request().resourceType(), status: res.status(), size, enc: await res.headerValue('content-encoding') });
});
await page.goto(BASE, { waitUntil: 'networkidle', timeout: 90000 });
await page.waitForTimeout(4000);
const scrolled = await page.evaluate(() => window.scrollY);
console.log('scrollY =', scrolled, 'requests =', reqs.length);
const total = reqs.reduce((a,r)=>a+r.size,0);
console.log('sum content-length =', (total/1024).toFixed(0)+'KB');
for (const r of reqs.filter(x=>x.size>50*1024).sort((a,b)=>b.size-a.size).slice(0,15))
  console.log(`  ${(r.size/1024).toFixed(0)}KB ${r.type} enc=${r.enc} ${r.status} ${r.url.replace(BASE,'')}`);
console.log('--- media/model/external ---');
for (const r of reqs.filter(x=>/\.(mp4|mp3|glb|hdr)/i.test(x.url)))
  console.log(`  ${(r.size/1024).toFixed(0)}KB ${r.status} ${r.url.replace(BASE,'')}`);
await browser.close();
