import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({viewport:{width:390,height:800}});
const p = await ctx.newPage();
await p.goto('http://localhost:3000/',{waitUntil:'networkidle'});
await p.waitForTimeout(2500);
const out = await p.evaluate(()=>{
  const iw=window.innerWidth;
  let target=null,max=0;
  for (const el of document.querySelectorAll('span.whitespace-nowrap')) {
    const r=el.getBoundingClientRect(); if(r.right>max){max=r.right;target=el;}
  }
  const chain=[]; let e=target;
  while(e){ const cs=getComputedStyle(e); const r=e.getBoundingClientRect();
    chain.push(`${e.tagName.toLowerCase()}${e.id?'#'+e.id:''}.${(typeof e.className==='string'?e.className:'').split(' ').filter(Boolean).slice(0,6).join('.')} ovx=${cs.overflowX} tf=${cs.transform.slice(0,40)} ts=${cs.transformStyle} rect=[${Math.round(r.left)},${Math.round(r.right)}] docSW=${e.scrollWidth}`);
    e=e.parentElement; }
  return {iw, maxRight:Math.round(max), chain};
});
console.log('innerWidth',out.iw,'maxRight',out.maxRight);
out.chain.forEach(c=>console.log(' ',c));
await b.close();
