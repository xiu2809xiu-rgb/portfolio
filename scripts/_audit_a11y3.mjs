import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({viewport:{width:390,height:800}});
const p = await ctx.newPage();
await p.goto('http://localhost:3000/',{waitUntil:'networkidle'});
await p.waitForTimeout(2500);
const out = await p.evaluate(()=>{
  const iw = window.innerWidth;
  const clips = (el)=>{ const cs=getComputedStyle(el); return cs.overflowX!=='visible' || cs.clipPath!=='none' || cs.contain.includes('paint'); };
  const res=[];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width===0||r.height===0) continue;
    if (r.right <= iw+1) continue;
    let e = el.parentElement, clipped=false, by=null;
    while (e && e!==document.documentElement) { if (clips(e)) { clipped=true; by=e; break;} e=e.parentElement; }
    if (!clipped) res.push({ tag:el.tagName.toLowerCase(), cls:(typeof el.className==='string'?el.className:'').slice(0,110), right:Math.round(r.right), width:Math.round(r.width), id:el.id });
  }
  // dedupe by keeping outermost-ish: just first 10
  return {iw, docSW:document.documentElement.scrollWidth, count:res.length, res:res.slice(0,10)};
});
console.log(JSON.stringify(out,null,1));
await b.close();
