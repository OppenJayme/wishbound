const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const dir = path.join(__dirname, 'site');
async function dismissIntro(page) {
  if(await page.locator('#wishIntro').evaluate(d=>d.open)) {
    await page.locator('#skipIntro').click();
    await page.waitForFunction(()=>!document.getElementById('wishIntro').open);
  }
}
async function checkLayout(page) {
  await page.emulateMedia({reducedMotion:'reduce'});
  for (const width of [1440,1280,768,430,375,320]) {
    await page.setViewportSize({width,height:900});
    for(let index=0;index<7;index++) {
      await page.locator('.page-dot').nth(index).click();
      await page.waitForFunction(index=>current===index && !isTurning,index);
      const overflow=await page.evaluate(()=>{
        const visible=mobileMode() ? [...document.querySelectorAll('.mobile-card.active .page')] : [...document.querySelectorAll('.face:not([aria-hidden="true"]) .page')];
        return visible.filter(p=>p.scrollHeight>p.clientHeight+2 || p.scrollWidth>p.clientWidth+2).map(p=>({class:p.className,height:p.clientHeight,scroll:p.scrollHeight,width:p.clientWidth,scrollWidth:p.scrollWidth}));
      });
      if(overflow.length) throw Error(`Content clipped at ${width}, chapter ${index}: ${JSON.stringify(overflow)}`);
    }
    console.log('All seven chapters fit at',width);
  }
}
(async () => {
  const browser = await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe', headless:true});
  const page = await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(pathToFileURL(path.join(dir,'index.html')).href);
  await dismissIntro(page);
  if(process.argv.includes('--keyboard')) {
    await page.emulateMedia({reducedMotion:'reduce'});
    for(const width of [1440,375]) {
      await page.setViewportSize({width,height:900});
      await page.keyboard.press('ArrowRight');
      await page.waitForFunction(()=>current===1 && !isTurning);
      await page.keyboard.press('ArrowLeft');
      await page.waitForFunction(()=>current===0 && !isTurning);
    }
    if(errors.length) throw Error(errors.join('\n'));
    console.log('Desktop and mobile keyboard navigation passed.');
    await browser.close();
    return;
  }
  await page.waitForTimeout(600);
  await page.evaluate(()=>document.fonts.ready);
  console.log('loaded fonts',await page.evaluate(()=>[...new Set([...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family))]));
  fs.mkdirSync(path.join(__dirname,'qa'),{recursive:true});
  if(process.argv.includes('--layout')) {
    await checkLayout(page);
    await page.locator('.page-dot').nth(4).click();
    await page.locator('.mobile-card.active .open-letter').click();
    await page.screenshot({path:'qa/mobile-letter.png',fullPage:true});
    await page.locator('#closeLetter').click();
    await page.setViewportSize({width:1440,height:1000});
    await page.screenshot({path:'qa/desktop-letter-spread.png',fullPage:true});
    await page.locator('.face.back .open-letter').click();
    await page.screenshot({path:'qa/desktop-letter.png',fullPage:true});
    await page.goto(pathToFileURL(path.join(dir,'ONE_FILE_PREVIEW.html')).href);
    await dismissIntro(page);
    await page.setViewportSize({width:375,height:900});
    await page.locator('.page-dot').nth(3).click();
    const photos=await page.locator('.mobile-card.active img').evaluateAll(images=>images.map(img=>({src:img.src,loaded:img.complete&&img.naturalWidth>0})));
    if(photos.some(photo=>!photo.loaded)||photos[0].src===photos[1].src) throw Error('Portable artwork failed');
    if(errors.length) throw Error(errors.join('\n'));
    console.log('Letter layouts and portable preview passed; no JavaScript errors.');
    await browser.close();
    return;
  }
  await page.screenshot({path:'qa/desktop-cover.png',fullPage:true});
  await page.locator('#nextBtn').click();
  await page.waitForTimeout(700);
  await page.screenshot({path:'qa/desktop-midturn.png',fullPage:true});
  await page.waitForFunction(()=>!isTurning);
  await page.screenshot({path:'qa/desktop-open.png',fullPage:true});
  const clipping = await page.evaluate(()=>[...document.querySelectorAll('.face .page')].filter(p=> p.parentElement.getAttribute('aria-hidden')==='false').map(p=>({class:p.className,height:p.clientHeight,scroll:p.scrollHeight})));
  console.log('desktop page bounds',JSON.stringify(clipping));
  await page.locator('#cornerNext').click();
  await page.waitForTimeout(520);
  await page.screenshot({path:'qa/desktop-flexible-midturn.png',fullPage:true});
  await page.waitForFunction(()=>!isTurning && current===2);
  // Latest chapter request wins, including while a page is moving.
  await page.locator('.page-dot').nth(6).click();
  await page.waitForTimeout(200);
  await page.locator('.page-dot').nth(2).click();
  await page.waitForFunction(()=>!isTurning && current===2);
  await page.locator('.page-dot').nth(4).click();
  await page.waitForFunction(()=>!isTurning && current===4);
  await page.screenshot({path:'qa/desktop-letter-spread.png',fullPage:true});
  await page.locator('.face.back .open-letter').click();
  await page.waitForFunction(()=>document.getElementById('letterDialog').open);
  await page.screenshot({path:'qa/desktop-letter.png',fullPage:true});
  await page.keyboard.press('Escape');
  if (await page.locator('#letterDialog').evaluate(d=>d.open)) throw Error('Letter failed to close');
  await page.locator('#nextBtn').click();
  await page.waitForFunction(()=>!isTurning && current===5);
  await page.screenshot({path:'qa/wish.png',fullPage:true});
  await page.locator('.face.front .make-wish').click();
  console.log('wish result',await page.locator('.face.front .wish-note').evaluateAll(nodes=>nodes.filter(n=>n.getBoundingClientRect().width).map(n=>n.textContent)));
  await page.waitForFunction(()=>document.querySelector('.sheet[data-index="5"] .wish-note').textContent.includes('on its way'));
  await page.locator('#nextBtn').click();
  await page.waitForFunction(()=>!isTurning && current===6);
  if (!await page.locator('#nextBtn').isDisabled()) throw Error('Final boundary failed');
  await page.locator('.page-dot').first().click();
  await page.waitForFunction(()=>!isTurning && current===0);
  for (const width of [1280,768,430,375,320]) {
    await page.setViewportSize({width,height:900});
    await page.screenshot({path:`qa/cover-${width}.png`,fullPage:true});
    await page.locator('#nextBtn').click();
    await page.waitForFunction(()=>!isTurning);
    await page.screenshot({path:`qa/open-${width}.png`,fullPage:true});
    const bounds=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,clipped:[...document.querySelectorAll('.mobile-card.active .page')].map(p=>({height:p.clientHeight,scroll:p.scrollHeight}))}));
    console.log('viewport',JSON.stringify(bounds));
    await page.locator('.page-dot').first().click();
    await page.waitForFunction(()=>!isTurning && current===0);
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction(()=>current===1 && !isTurning);
  await page.keyboard.press('ArrowLeft');
  await page.waitForFunction(()=>current===0 && !isTurning);
  // Horizontal swipe turns a chapter; vertical swipe leaves navigation alone.
  await page.evaluate(()=>{
    const el=document.querySelector('#mobileBook');
    const send=(name,x,y)=>el.dispatchEvent(new TouchEvent(name,{changedTouches:[new Touch({identifier:1,target:el,clientX:x,clientY:y})]}));
    send('touchstart',200,300);send('touchend',100,305);
  });
  await page.waitForFunction(()=>current===1 && !isTurning);
  await page.evaluate(()=>{
    const el=document.querySelector('#mobileBook');
    const send=(name,x,y)=>el.dispatchEvent(new TouchEvent(name,{changedTouches:[new Touch({identifier:2,target:el,clientX:x,clientY:y})]}));
    send('touchstart',200,300);send('touchend',190,180);
  });
  if (await page.evaluate(()=>current)!==1) throw Error('Vertical swipe turned page');
  await page.locator('.page-dot').nth(4).click();
  await page.waitForFunction(()=>current===4 && !isTurning);
  await page.locator('.mobile-card.active .open-letter').click();
  await page.screenshot({path:'qa/mobile-letter.png',fullPage:true});
  await page.locator('#closeLetter').click();
  await page.locator('.page-dot').nth(5).click();
  await page.locator('.mobile-card.active .make-wish').click();
  if (await page.locator('.page-mesh').count()) throw Error('Temporary mesh leaked');
  await checkLayout(page);
  // The portable artifact must show distinct embedded artwork and work alone.
  await page.goto(pathToFileURL(path.join(dir,'ONE_FILE_PREVIEW.html')).href);
  await dismissIntro(page);
  await page.locator('.page-dot').nth(3).click();
  await page.waitForFunction(()=>document.querySelector('#pageCount').textContent==='04 / 07');
  const photos=await page.locator('.mobile-card.active img').evaluateAll(images=>images.map(img=>({src:img.src,loaded:img.complete&&img.naturalWidth>0})));
  if (photos.some(photo=>!photo.loaded) || photos[0].src===photos[1].src) throw Error('Portable artwork failed');
  console.log('errors',JSON.stringify(errors));
  if(errors.length) throw Error(errors.join('\n'));
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
