const { chromium } = require('playwright');
const { pathToFileURL } = require('url');
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'site');
(async () => {
  const browser = await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  const page = await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  fs.mkdirSync('qa',{recursive:true});
  if(process.argv.includes('--wish')) {
    for(const width of [1440,375]) {
      await page.setViewportSize({width,height:900});
      for(const elapsed of [500,1300,1800,2400,3200,3600,4250,5100]) {
        // Each capture starts a fresh wish so screenshot latency cannot skip a stage.
        await page.goto(pathToFileURL(path.join(dir,'index.html')).href);
        await page.evaluate(()=>document.fonts.ready);
        await page.locator('#startWish').click();
        const began=await page.locator(".wish-canvas").evaluate(c=>Number(c.dataset.startedAt));
        const remaining=await page.evaluate(({began,elapsed})=>Math.max(0,began+elapsed*window.BIRTHDAY_WISH.tempo-performance.now()),{began,elapsed});
        await page.waitForTimeout(remaining);
        const painted=await page.locator('.wish-canvas').evaluate(canvas=>{
          const pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
          let visible=0;
          for(let i=3;i<pixels.length;i+=4) if(pixels[i]>12) visible++;
          return {active:canvas.dataset.active,visible,camera:canvas.dataset.camera,renderer:canvas.dataset.renderer,meshFaces:Number(canvas.dataset.meshFaces),stage:document.getElementById('wishIntro').dataset.stage};
        });
        await page.screenshot({path:`qa/wish-${width}-${elapsed}.png`});
        if(painted.active!=='true'||painted.visible<100) throw Error(`Wish did not render at ${width}, ${elapsed}: ${JSON.stringify(painted)}, phase=${await page.locator('.wish-canvas').getAttribute('data-phase')}, errors=${JSON.stringify(errors)}`);
        const extra=-1300/1.85;
        const expectedStage=elapsed<3900+extra?'wishing':elapsed<4700+extra?'manifesting':'revealed';
        if(painted.stage!==expectedStage) throw Error(`Wish clock drift at ${width}, ${elapsed}: ${painted.stage}, expected ${expectedStage}`);
        const expectedCamera=elapsed<2050?'front':elapsed<2800?'flyby':elapsed<3900+extra?'descent':'reveal';
        if(painted.camera!==expectedCamera) throw Error(`Camera phase drift at ${width}, ${elapsed}: ${painted.camera}, expected ${expectedCamera}`);
        if(painted.renderer!=='perspective-3d'||painted.meshFaces!==16) throw Error(`3D star mesh missing at ${width}, ${elapsed}`);
      }
      await page.waitForFunction(()=>document.getElementById('wishIntro').dataset.stage==='revealed');
      await page.waitForFunction(()=>document.querySelector('.wish-canvas').dataset.active==='false');
      await page.screenshot({path:`qa/wish-revealed-${width}.png`,fullPage:true});
      await page.locator('#enterBook').click();
      await page.waitForFunction(()=>!document.getElementById('wishIntro').open && !isTurning);
      await page.locator('#replayIntro').click();
      await page.locator('#startWish').click();
      await page.waitForFunction(()=>document.getElementById('wishIntro').dataset.stage==='manifesting');
      await page.keyboard.press('Escape');
      await page.waitForFunction(()=>!document.getElementById('wishIntro').open);
      if(await page.locator('.wish-canvas').getAttribute('data-active')!=='false') throw Error('Wish animation survived Escape');
      await page.locator('#replayIntro').click();
      await page.locator('#startWish').click();
      await page.waitForFunction(()=>document.getElementById('wishIntro').dataset.stage==='manifesting');
      await page.emulateMedia({reducedMotion:'reduce'});
      await page.waitForFunction(()=>document.getElementById('wishIntro').dataset.stage==='revealed');
      if(await page.locator('.wish-canvas').getAttribute('data-active')!=='false') throw Error('Wish animation survived reduced motion');
      await page.emulateMedia({reducedMotion:'no-preference'});
      console.log('Cloud portal, blue-to-gold comet, flyby, descent, handoff, Escape, and reduced motion passed at',width);
    }
    await page.goto(pathToFileURL(path.join(dir,'ONE_FILE_PREVIEW.html')).href);
    await page.locator('#startWish').click();
    if(await page.locator('.wish-canvas').getAttribute('data-active')!=='true') throw Error('Portable wish missing');
    await page.locator('#skipIntro').click();
    await page.waitForFunction(()=>!document.getElementById('wishIntro').open);
    if(errors.length) throw Error(errors.join('\n'));
    console.log('Portable canvas sequence passed; no JavaScript errors.');
    await browser.close();
    return;
  }
  if(process.argv.includes('--journey')) {
    const sizes = process.argv.includes('--phone') ? [[375,812]] : [[1440,900],[1280,768],[430,900],[375,812],[320,740]];
    for(const [width,height] of sizes) {
      await page.setViewportSize({width,height});
      await page.goto(pathToFileURL(path.join(dir,'index.html')).href);
      await page.evaluate(()=>document.fonts.ready);
      await page.locator('#skipIntro').click();
      await page.waitForFunction(()=>!document.getElementById('wishIntro').open);
      await page.screenshot({path:`qa/closed-${width}.png`,fullPage:true});
      await page.locator('#replayIntro').click();
      await page.locator('#startWish').click();
      await page.waitForFunction(()=>document.getElementById('wishIntro').dataset.stage==='revealed');
      await page.locator('#enterBook').click();
      await page.waitForTimeout(450);
      if(await page.locator('.travel-portrait').count()!==1) throw Error('Missing travelling portrait');
      await page.screenshot({path:`qa/journey-${width}.png`});
      if(process.argv.includes('--alignment')) {
        await page.waitForFunction(()=>document.querySelector('.travel-portrait.is-landing'));
        const alignment=await page.evaluate(async()=>{
          const flying=document.querySelector('.travel-portrait');
          const landing=flying.getAnimations().find(animation=>animation.effect.getTiming().duration===800);
          landing.pause();
          landing.currentTime=799.99;
          await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
          const actual=flying.querySelector('img').getBoundingClientRect();
          const expected=window.BIRTHDAY_BOOK.portrait().querySelector('img').getBoundingClientRect();
          return {left:actual.left-expected.left,top:actual.top-expected.top,width:actual.width-expected.width,height:actual.height-expected.height};
        });
        await page.screenshot({path:`qa/portrait-alignment-${width}.png`});
        console.log('Portrait landing alignment',width,JSON.stringify(alignment));
        if(Object.values(alignment).some(delta=>Math.abs(delta)>1)) throw Error(`Portrait landing offset at ${width}: ${JSON.stringify(alignment)}`);
        await page.locator('.travel-portrait').evaluate(element=>element.getAnimations().find(animation=>animation.effect.getTiming().duration===800).play());
      }
      await page.waitForFunction(()=>!document.getElementById('wishIntro').open && current===1 && !isTurning);
      const landed=await page.evaluate(()=>{
        const frame=window.BIRTHDAY_BOOK.portrait();
        const img=frame.querySelector('img');
        return getComputedStyle(frame).visibility==='visible' && img.complete && img.naturalWidth>0 && !document.querySelector('.travel-portrait, .travel-veil') && img.src===document.getElementById('revealPortrait').src;
      });
      if(!landed) throw Error(`Portrait did not land cleanly at ${width}`);
      await page.screenshot({path:`qa/landed-${width}.png`,fullPage:true});
      console.log('Portrait flight and landing passed at',width,height);
    }
    // Replaying from a later chapter must preserve the reader's place.
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.locator('.page-dot').nth(3).click();
    await page.locator('#replayIntro').click();
    await page.locator('#startWish').click();
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.locator('#enterBook').click();
    await page.waitForFunction(()=>!document.getElementById('wishIntro').open);
    if(await page.evaluate(()=>current)!==3 || await page.locator('.travel-portrait, .travel-veil').count()) throw Error('Later-chapter replay changed position or leaked a layer');
    console.log('Later-chapter animated replay preserved reading position.');
    await page.setViewportSize({width:1440,height:900});
    for(const interrupt of process.argv.includes('--phone') ? [] : ['escape','resize','reduced']) {
      await page.goto(pathToFileURL(path.join(dir,'index.html')).href);
      await page.emulateMedia({reducedMotion:'reduce'});
      await page.locator('#startWish').click();
      await page.emulateMedia({reducedMotion:'no-preference'});
      await page.locator('#enterBook').click();
      await page.waitForTimeout(250);
      if(interrupt==='escape') await page.keyboard.press('Escape');
      if(interrupt==='resize') await page.setViewportSize({width:1280,height:850});
      if(interrupt==='reduced') await page.emulateMedia({reducedMotion:'reduce'});
      await page.waitForFunction(()=>!document.getElementById('wishIntro').open && !isTurning);
      await page.waitForTimeout(1000);
      if(await page.locator('.travel-portrait, .travel-veil, .portrait-in-transit').count()) throw Error(`Flight leaked after ${interrupt}`);
      await page.emulateMedia({reducedMotion:'no-preference'});
      console.log('Flight cleanup passed after',interrupt);
    }
    if(errors.length) throw Error(errors.join('\n'));
    await browser.close();
    return;
  }
  await page.goto(pathToFileURL(path.join(dir,'index.html')).href);
  await page.evaluate(()=>document.fonts.ready);
  await page.waitForFunction(()=>document.getElementById('wishIntro').open);
  await page.screenshot({path:'qa/intro-ready.png',fullPage:true});
  await page.locator('#startWish').click();
  await page.waitForTimeout(1800);
  await page.screenshot({path:'qa/intro-gold.png',fullPage:true});
  await page.waitForFunction(()=>document.querySelector('#wishIntro').dataset.stage==='revealed');
  await page.waitForTimeout(850);
  await page.screenshot({path:'qa/intro-reveal.png',fullPage:true});
  if(await page.locator('#revealPortrait').evaluate(img=>!img.complete||!img.naturalWidth)) throw Error('Portrait did not load');
  await page.locator('#enterBook').click();
  await page.waitForFunction(()=>!document.getElementById('wishIntro').open && current===1 && !isTurning);
  await page.screenshot({path:'qa/map-book.png',fullPage:true});
  if(process.argv.includes('--visual')) {
    if(errors.length) throw Error(errors.join('\n'));
    console.log('Visual sequence and book opening passed.');
    await browser.close();
    return;
  }
  // Replay and a skip during the comet must cancel the pending reveal.
  await page.locator('#replayIntro').click();
  await page.locator('#startWish').click();
  await page.waitForTimeout(300);
  await page.locator('#skipIntro').click();
  await page.waitForTimeout(await page.evaluate(()=>window.BIRTHDAY_WISH.timing.reveal+100));
  if(await page.locator('#wishIntro').evaluate(d=>d.open)) throw Error('Skip leaked an intro timer');
  if(await page.evaluate(()=>current)!==1) throw Error('Replay changed reading position');
  await page.emulateMedia({reducedMotion:'reduce'});
  for(const width of [1280,768,430,375,320]) {
    await page.setViewportSize({width,height:900});
    await page.locator('#replayIntro').click();
    const ready=await page.locator('#wishIntro').evaluate(d=>({width:d.clientWidth,scroll:d.scrollWidth}));
    if(ready.scroll>ready.width+1) throw Error(`Intro overflow at ${width}`);
    await page.locator('#startWish').click();
    await page.waitForFunction(()=>document.getElementById('wishIntro').dataset.stage==='revealed');
    const reveal=await page.locator('#wishIntro').evaluate(d=>({width:d.clientWidth,scroll:d.scrollWidth}));
    if(reveal.scroll>reveal.width+1) throw Error(`Reveal overflow at ${width}`);
    await page.screenshot({path:`qa/reveal-${width}.png`,fullPage:true});
    await page.locator('#enterBook').click();
    await page.waitForFunction(()=>!document.getElementById('wishIntro').open);
    console.log('Reveal, reduced motion, and book handoff passed at',width);
  }
  await page.locator('#replayIntro').click();
  await page.keyboard.press('Escape');
  if(await page.locator('#wishIntro').evaluate(d=>d.open)) throw Error('Escape failed');
  // Arrow keys must not turn the background book while the reveal is open.
  await page.locator('#replayIntro').click();
  await page.keyboard.press('ArrowRight');
  if(await page.evaluate(()=>current)!==1) throw Error('Book keyboard leaked through intro');
  await page.locator('#skipIntro').click();
  await page.goto(pathToFileURL(path.join(dir,'ONE_FILE_PREVIEW.html')).href);
  await page.locator('#startWish').click();
  await page.waitForFunction(()=>document.getElementById('wishIntro').dataset.stage==='revealed');
  if(await page.locator('#revealPortrait').evaluate(img=>!img.src.startsWith('data:image')||!img.naturalWidth)) throw Error('Portable portrait missing');
  await page.locator('#enterBook').click();
  await page.waitForFunction(()=>document.getElementById('pageCount').textContent==='02 / 07');
  if(errors.length) throw Error(errors.join('\n'));
  console.log('Normal animation, replay, skip, Escape, portrait, keyboard isolation, portable intro passed. No JavaScript errors.');
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
