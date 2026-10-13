const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true});
 const context=await browser.newContext({reducedMotion:'reduce'});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 fs.mkdirSync('qa',{recursive:true});
 try {
  await page.goto(pathToFileURL(path.join(__dirname,'site','ONE_FILE_PREVIEW.html')).href);
  await page.locator('#skipIntro').click();await page.evaluate(()=>document.fonts.ready);
  const sources=await page.locator('.page-keepsake img').evaluateAll(imgs=>[...new Set(imgs.map(i=>i.src))]);
  assert.equal(sources.length,4);assert(sources.every(s=>s.startsWith('data:image/svg+xml;base64,')));
  for(const width of [1440,1280,900,768,430,375,320]) {
   await page.setViewportSize({width,height:1000});
   for(let index=1;index<=4;index++) {
    await page.locator('.page-dot').nth(index).click();await page.waitForFunction(i=>document.querySelectorAll('.page-dot')[i].getAttribute('aria-current')==='step'&&!document.getElementById('book').classList.contains('is-turning'),index);
    const problems=await page.evaluate(()=>{
     const pages=innerWidth<=900?[...document.querySelectorAll('.mobile-card.active .page')]:[...document.querySelectorAll('.face[aria-hidden="false"] .page')];
     const bad=[];
     const overlap=(a,b)=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>2&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>2;
     for(const p of pages)for(const d of p.querySelectorAll('.page-keepsake')){
      const a=d.getBoundingClientRect(),b=p.getBoundingClientRect();
      if(a.left<b.left||a.right>b.right||a.top<b.top||a.bottom>b.bottom)bad.push('outside page');
      if(!d.querySelector('img').complete||!d.querySelector('img').naturalWidth)bad.push('unloaded keepsake');
      for(const n of p.querySelectorAll('[data-story-text],img[data-story-image],button,.page-number'))if(overlap(a,n.getBoundingClientRect()))bad.push('overlap '+n.textContent.slice(0,40));
     }return bad;
    });
    assert.deepEqual(problems,[],'Keepsake placement: '+width+'px chapter '+index);
    if(width===1440||width===375)await page.screenshot({path:'qa/keepsake-'+width+'-'+index+'.png',fullPage:true});
   }
  }
  assert.deepEqual(errors,[]);console.log('Keepsakes fit at seven widths without covering text, photos, or controls; all four portable assets loaded.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
