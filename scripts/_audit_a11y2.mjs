import { chromium } from 'playwright';
const BASE='http://localhost:3000';
const b = await chromium.launch();
for (const w of [360,390,1440]) {
  const ctx = await b.newContext({ viewport:{width:w,height:800} });
  const p = await ctx.newPage();
  await p.goto(BASE+'/',{waitUntil:'networkidle'});
  await p.waitForTimeout(2000);
  const r = await p.evaluate(async () => {
    window.scrollTo(600,0);
    await new Promise(r=>setTimeout(r,300));
    const sx = window.scrollX;
    window.scrollTo(0,0);
    // find nearest ancestor chain of first offender
    const iw = window.innerWidth;
    let worst=null;
    for (const el of document.querySelectorAll('body *')) {
      const bb = el.getBoundingClientRect();
      if (bb.width===0||bb.height===0) continue;
      if (bb.right>iw+1 && (!worst||bb.right>worst.r)) worst={el,r:bb.right};
    }
    let chain=[];
    if (worst) { let e=worst.el; while(e && e!==document.documentElement){ const cs=getComputedStyle(e); chain.push(`${e.tagName.toLowerCase()}.${(typeof e.className==='string'?e.className:'').split(' ').slice(0,4).join('.')} [ovx=${cs.overflowX} w=${Math.round(e.getBoundingClientRect().width)}]`); e=e.parentElement; } }
    return { scrollXAfter600: sx, docSW: document.documentElement.scrollWidth, iw, chain };
  });
  console.log(`WIDTH ${w}: scrollX after scrollTo(600,0) = ${r.scrollXAfter600}  docScrollWidth=${r.docSW} innerWidth=${r.iw}`);
  r.chain.forEach(c=>console.log('   '+c));
  await ctx.close();
}
// blog code block
{
  const ctx = await b.newContext({viewport:{width:360,height:800}});
  const p = await ctx.newPage();
  await p.goto(BASE+'/blog/shrinking-a-17mb-avatar-to-1mb',{waitUntil:'networkidle'});
  await p.waitForTimeout(1000);
  const r = await p.evaluate(async ()=>{
    window.scrollTo(400,0); await new Promise(r=>setTimeout(r,300));
    const sx=window.scrollX; window.scrollTo(0,0);
    const pre=document.querySelector('pre');
    const cs=pre?getComputedStyle(pre):null;
    let chain=[]; let e=pre; while(e&&e!==document.documentElement){const c=getComputedStyle(e);chain.push(`${e.tagName.toLowerCase()}.${(typeof e.className==='string'?e.className:'').split(' ').slice(0,5).join('.')} [ovx=${c.overflowX} w=${Math.round(e.getBoundingClientRect().width)} sw=${e.scrollWidth}]`);e=e.parentElement;}
    return {sx, docSW:document.documentElement.scrollWidth, preOvx:cs&&cs.overflowX, preW:pre&&Math.round(pre.getBoundingClientRect().width), preSW:pre&&pre.scrollWidth, chain};
  });
  console.log('BLOG POST 360:', JSON.stringify({sx:r.sx,docSW:r.docSW,preOvx:r.preOvx,preW:r.preW,preSW:r.preSW},null,0));
  r.chain.forEach(c=>console.log('   '+c));
  await ctx.close();
}
await b.close();
