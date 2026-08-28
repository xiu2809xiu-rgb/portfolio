import { chromium } from 'playwright';
const BASE = 'http://localhost:3100';
const routes = ['/', '/work', '/blog', '/book', '/uses', '/work/smartrecap'];
const browser = await chromium.launch();
for (const route of routes) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(3500);
  const rows = await page.evaluate(() => performance.getEntriesByType('resource').map(e => ({
    name: e.name, type: e.initiatorType, enc: e.encodedBodySize, dec: e.decodedBodySize })));
  const doc = await page.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; return { enc: n.encodedBodySize, dec: n.decodedBodySize }; });
  await ctx.close();
  const js = rows.filter(r => /\.js(\?|$)/.test(new URL(r.name).pathname) || r.type==='script');
  const jsEnc = js.reduce((a,r)=>a+r.enc,0), jsDec = js.reduce((a,r)=>a+r.dec,0);
  const totalEnc = rows.reduce((a,r)=>a+r.enc,0) + doc.enc;
  console.log(`\n=== ${route} ===  transfer(gzip) total=${(totalEnc/1024).toFixed(0)}KB  JS enc=${(jsEnc/1024).toFixed(0)}KB dec=${(jsDec/1024).toFixed(0)}KB  html enc=${(doc.enc/1024).toFixed(0)}KB dec=${(doc.dec/1024).toFixed(0)}KB`);
  const big = rows.filter(r=>r.enc>60*1024).sort((a,b)=>b.enc-a.enc).slice(0,10);
  for (const b of big) console.log(`   enc ${(b.enc/1024).toFixed(0)}KB dec ${(b.dec/1024).toFixed(0)}KB  ${b.name.replace(BASE,'')}`);
}
await browser.close();
