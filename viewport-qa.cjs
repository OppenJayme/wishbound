const { chromium } = require('playwright');
const { pathToFileURL } = require('url');
const root = require('path').join(__dirname, 'albedo-beidou-birthday-codex-v4/birthday_codex_albedo_beidou');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({executablePath:process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox']});
  const page = await browser.newPage();
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.emulateMedia({reducedMotion:'reduce'});
  const results=[];
  for (const [width,height] of [[1366,600],[1280,560],[1024,620],[1920,900],[1440,900],[1024,480],[1920,640],[910,500]]) {
    await page.setViewportSize({width,height});
    await page.goto(pathToFileURL(root+'/index.html').href);
    await page.evaluate(()=>document.fonts.ready);
    const invitation=await page.locator('#wishIntro').evaluate(d=>({height:d.clientHeight,scroll:d.scrollHeight}));
    await page.locator('#startWish').click();
    await page.waitForFunction(()=>document.getElementById('wishIntro').dataset.stage==='revealed');
    const reveal=await page.locator('#wishIntro').evaluate(d=>({height:d.clientHeight,scroll:d.scrollHeight}));
    await page.locator('#enterBook').click();
    await page.waitForFunction(()=>!document.getElementById('wishIntro').open);
    const chapters=[];
    for(let index=0;index<7;index++) {
      await page.locator('.page-dot').nth(index).click();
      await page.waitForFunction(i=>current===i&&!isTurning,index);
      chapters.push(await page.evaluate(()=>({documentHeight:document.documentElement.scrollHeight,viewportHeight:innerHeight,
        bookWidth:document.getElementById('book').clientWidth,font:getComputedStyle(document.getElementById('book')).fontSize,
        pages:[...document.querySelectorAll('.face:not([aria-hidden="true"]) .page')].filter(p=>p.scrollHeight>p.clientHeight+2||p.scrollWidth>p.clientWidth+2).map(p=>({class:p.className,height:p.clientHeight,scroll:p.scrollHeight,width:p.clientWidth,scrollWidth:p.scrollWidth}))})));
    }
    await page.locator('.page-dot').nth(1).click();
    require('fs').mkdirSync('qa', {recursive:true});
    if(width===1366||width===1920) await page.screenshot({path:`qa/viewport-${width}-${height}.png`});
    const result={width,height,invitation,reveal,chapters}; results.push(result);
    console.log(JSON.stringify(result));
  }
  await browser.close();
  assert.equal(errors.length,0,errors.join('\n'));
  assert(results.every(r=>r.invitation.scroll<=r.invitation.height+2&&r.reveal.scroll<=r.reveal.height+2), 'Entrance overflow');
  assert(results.every(r=>r.chapters.every(c=>c.documentHeight<=c.viewportHeight+2&&c.pages.length===0)), 'Book overflow');
})().catch(e=>{console.error(e);process.exit(1)});
