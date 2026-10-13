const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {pathToFileURL} = require('node:url');
const dir = path.join(__dirname, 'site');
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'};
let giftHtml;
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (pathname === '/personalized.html' && giftHtml) { res.setHeader('Content-Type','text/html'); res.end(giftHtml); return; }
  const file = path.join(dir, pathname === '/' ? 'ONE_FILE_PREVIEW.html' : pathname);
  if (!file.startsWith(dir + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream'); res.end(fs.readFileSync(file));
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({executablePath:process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  const context = await browser.newContext({acceptDownloads:true, viewport:{width:1440,height:900},reducedMotion:'reduce'});
  const page = await context.newPage(); const errors=[];
  page.on('pageerror', e => errors.push(e.message));
  const writeRequests=[];context.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))writeRequests.push(r.method()+' '+r.url());});
  const originalTemplate=fs.readFileSync(path.join(dir,'ONE_FILE_PREVIEW.html'),'utf8');
  fs.mkdirSync('qa', {recursive:true});
  // Hold startup for longer than the reported flash and inspect actual painted frames.
  async function checkStartup(markup, width, label, enabled = true, reducedMotion = 'reduce') {
    const startupContext = await browser.newContext({viewport:{width,height:900},reducedMotion});
    const startupPage = await startupContext.newPage();
    startupPage.on('pageerror', e => errors.push(e.message));
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    await startupPage.route('https://**', route => route.abort());
    await startupPage.route('**/startup-check.html', route => route.fulfill({contentType:'text/html',body:markup.replace('<link rel="preconnect"', '<script src="/startup-gate.js" defer></script><link rel="preconnect"')}));
    await startupPage.route('**/startup-gate.js', async route => { await gate; await route.fulfill({contentType:'text/javascript',body:''}); });
    try {
      await startupPage.goto(base+'/startup-check.html', {waitUntil:'commit'});
      await startupPage.waitForFunction(() => document.getElementById('scene') && document.getElementById('wishIntro') && getComputedStyle(document.getElementById('wishIntro')).position === 'fixed');
      const frames = await startupPage.evaluate(async () => {
        const samples = [];
        const until = performance.now() + 1000;
        while (performance.now() < until) {
          await new Promise(requestAnimationFrame);
          samples.push({
            starting: document.documentElement.hasAttribute('data-wishbound-starting'),
            book: getComputedStyle(document.getElementById('main')).opacity,
            wish: getComputedStyle(document.getElementById('wishIntro')).display,
            modal: document.getElementById('wishIntro').matches(':modal')
          });
        }
        return samples;
      });
      assert(frames.length > 1, 'No startup frames were captured');
      if (enabled) {
        assert(frames.every(frame => frame.starting && frame.book === '0' && frame.wish === 'grid' && !frame.modal), 'The book flashed during delayed startup: '+JSON.stringify(frames));
        assert(await startupPage.locator('#birthdayWelcome').isVisible());
        assert(await startupPage.locator('#birthdayTitle').textContent().then(text => text.includes('Happy') && text.includes('birthday.')));
        if (reducedMotion === 'no-preference') assert.equal(await startupPage.locator('.birthday-welcome-copy').evaluate(el => getComputedStyle(el).opacity), '0', 'The complete title flashed before its animation');
      } else {
        assert(frames.every(frame => !frame.starting && frame.book === '1' && frame.wish === 'none'), 'A disabled wish appeared during startup');
      }
      await startupPage.screenshot({path:`qa/editor-startup-${label}-${width}.png`});
      release();
      await startupPage.waitForLoadState('load');
      assert.equal(await startupPage.evaluate(() => document.documentElement.hasAttribute('data-wishbound-starting')), false);
      assert.equal(await startupPage.evaluate(() => document.getElementById('wishIntro').matches(':modal')), enabled);
      if (enabled) {
        await startupPage.locator('#skipIntro').click();
        await startupPage.waitForFunction(() => !document.getElementById('wishIntro').open);
        await startupPage.waitForFunction(() => getComputedStyle(document.getElementById('main')).opacity === '1');
        assert(await startupPage.locator('#main').isVisible());
        await startupPage.locator('#replayIntro').click();
        assert(await startupPage.evaluate(() => document.getElementById('wishIntro').matches(':modal')));
      } else {
        assert.equal(await startupPage.locator('#main').evaluate(el => getComputedStyle(el).opacity), '1');
      }
      console.log(`First-paint startup passed: ${label}, ${width}px, ${frames.length} delayed frames, wish ${enabled ? 'enabled' : 'disabled'}.`);
    } finally { release(); await startupContext.close(); }
  }
  async function checkBirthdayOpening(url, width, recipient, firstLine = 'Happy', secondLine = 'birthday.') {
    const recording = process.env.RECORD_BIRTHDAY_VIDEO === '1' ? {recordVideo:{dir:'qa/birthday-videos',size:{width,height:900}}} : {};
    const birthdayContext = await browser.newContext({viewport:{width,height:900},reducedMotion:'no-preference',...recording});
    const birthdayPage = await birthdayContext.newPage();
    birthdayPage.on('pageerror', e => errors.push(e.message));
    await birthdayPage.route('https://**', route => route.abort());
    try {
      await birthdayPage.goto(url);
      assert.equal(await birthdayPage.locator('#wishIntro').getAttribute('data-welcome'), 'playing');
      assert.equal(await birthdayPage.locator('#birthdayTitle').getAttribute('aria-label'), firstLine+' '+secondLine);
      assert.equal(await birthdayPage.locator('.birthday-recipient [data-story-text="recipient"]').textContent(), recipient);
      assert(await birthdayPage.locator('.birthday-letter').count() > 5);
      assert.equal(await birthdayPage.locator('#birthdayStarlight').getAttribute('data-active'), 'true');
      assert.equal(await birthdayPage.locator('#introInvitation').isVisible(), false);
      await birthdayPage.waitForTimeout(2100);
      const pixels = await birthdayPage.locator('#birthdayStarlight').evaluate(canvas => {
        const data = canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
        let painted = 0; for(let i=3;i<data.length;i+=4) if(data[i]>10) painted++;
        return painted;
      });
      assert(pixels > 50, 'Birthday starlight did not paint');
      assert.equal(await birthdayPage.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      const bounds = await birthdayPage.locator('.birthday-welcome-copy').boundingBox();
      assert(bounds.x >= 0 && bounds.x+bounds.width <= width+1 && bounds.y >= 0 && bounds.y+bounds.height <= 900, 'Birthday greeting is clipped');
      await birthdayPage.screenshot({path:`qa/editor-birthday-${width}.png`});
      await birthdayPage.waitForFunction(() => !document.getElementById('wishIntro').dataset.welcome);
      assert(await birthdayPage.locator('#startWish').isVisible());
      assert.equal(await birthdayPage.locator('#birthdayStarlight').getAttribute('data-active'), 'false');
      assert.equal(await birthdayPage.evaluate(() => document.activeElement.id), 'startWish');
      await birthdayPage.screenshot({path:`qa/editor-birthday-handoff-${width}.png`});
      console.log(`Birthday opening passed: ${width}px, gold lettering, projected starlight, automatic handoff, focus, and cleanup.`);
    } finally { await birthdayContext.close(); }
  }
  async function downloadGift(target, editable = false) {
    await target.locator('#giftDownloadButton').click();
    assert(await target.locator('#giftDownloadDialog').isVisible());
    await target.locator('#giftAllowEditing').setChecked(editable);
    const pending = target.waitForEvent('download');
    await target.locator('#giftConfirmDownload').click();
    return pending;
  }
  try {
    for (const width of [1440,375]) {
      await checkStartup(fs.readFileSync(path.join(dir,'index.html'),'utf8'), width, 'source');
      await checkStartup(originalTemplate, width, 'portable');
    }
    await checkStartup(originalTemplate, 1440, 'animated', true, 'no-preference');
    await page.goto(base + '/ONE_FILE_PREVIEW.html');
    assert.equal(await page.evaluate(()=>document.body.dataset.giftMode),'template');
    await page.locator('#introEditGift').click();
    assert(await page.evaluate(()=>document.getElementById('wishIntro').open&&document.getElementById('wishIntro').dataset.stage==='ready'),'Editing skipped the first wish screen');
    assert.equal(await page.locator('#giftViewSelect').inputValue(),'opening');
    assert(await page.locator('#giftToolbar').isVisible());
    assert(await page.locator('#giftToolbar').evaluate(el=>el.parentElement.id==='wishIntro'),'Toolbar is blocked by the modal');
    const birthdayCopy = {birthdayFirstLine:'Wonderful', birthdaySecondLine:'birthday, Alex!'};
    await page.locator('#giftViewSelect').selectOption('greeting');
    assert.equal(await page.locator('#wishIntro').getAttribute('data-welcome'), 'editing');
    assert.equal(await page.locator('#birthdayStarlight').getAttribute('data-active'), 'false');
    for (const [key,value] of Object.entries(birthdayCopy)) {
      await page.locator(`[data-story-text="presentation.${key}"]`).click();
      await page.locator('#giftTextValue').fill(value); await page.locator('#giftTextForm button[type=submit]').click();
      assert.equal(await page.locator(`[data-story-text="presentation.${key}"]`).textContent(), value);
    }
    await page.locator('#giftViewSelect').selectOption('opening');
    assert.equal(await page.locator('#giftViewSelect').inputValue(), 'opening');
    await page.locator('#introTitle').click();await page.locator('#giftTextValue').fill('A wish for Alex');await page.locator('#giftTextForm button[type=submit]').click();
    assert.equal(await page.locator('#introTitle').textContent(),'A wish for Alex');
    // The explicit save button stores the draft locally and keeps the demo original.
    await page.locator('#giftSaveButton').click();
    await page.waitForFunction(()=>document.getElementById('giftSaveStatus').textContent==='Saved in this browser.');
    assert.equal(await page.locator('#giftSaveButton').isDisabled(),false);
    await page.reload();await page.locator('#introEditGift').waitFor({state:'visible'});
    assert.equal(await page.locator('#introTitle').textContent(),'A wish, just for you.');
    await page.locator('#introEditGift').click();
    assert.equal(await page.locator('#introTitle').textContent(),'A wish for Alex');

    await page.locator('#introTitle').focus();await page.keyboard.press('Enter');
    await page.locator('#giftTextDialog [data-close-editor]').click();
    await page.screenshot({path:'qa/editor-opening.png'});
    await page.locator('#giftViewSelect').selectOption('reveal');
    assert(await page.locator('#revealPortrait').isVisible());
    await page.locator('#revealRecipient').click();
    await page.locator('#giftTextValue').fill('Alex Rivera');
    await page.locator('#giftTextForm button[type=submit]').click();
    assert.equal(await page.evaluate(()=>WISHBOUND.story.recipient),'Alex Rivera');
    assert(await page.locator('.cover-title').allTextContents().then(t=>t.every(v=>v.includes('Alex Rivera'))));
    await page.locator('#giftViewSelect').selectOption('book');
    await page.waitForFunction(()=>!document.getElementById('wishIntro').open);
    await page.waitForFunction(()=>document.getElementById('giftToolbar').parentElement===document.body);
    await page.locator('#nextBtn').click();
    await page.waitForFunction(()=>document.getElementById('pageCount').textContent.startsWith('02'));
    const hostile = 'A memory <img src=x onerror="window.giftXss=1"> & </script> 🙂';
    await page.locator('[data-story-text="copy.somewhere_between_the_stars_above"]:visible').click();
    await page.locator('#giftTextValue').fill(hostile);
    await page.locator('#giftTextForm button[type=submit]').click();
    assert.equal(await page.locator('[data-story-text="copy.somewhere_between_the_stars_above"]').first().textContent(),hostile);
    assert.equal(await page.locator('img[onerror]').count(),0);
    assert.equal(await page.evaluate(()=>window.giftXss),undefined);
    await page.locator('#giftDetailsButton').click();
    await page.locator('#gift-field-chapterNames-1').fill('Our first chapter');
    await page.locator('#giftDetailsForm button[type=submit]').click();
    assert.equal(await page.locator('#chapterLabel').textContent(),'Our first chapter');
    await page.locator('#giftLetterButton').click();
    await page.locator('#giftTextValue').fill('Happy birthday, Alex.\n\nHere is a memory for you.\n\nLove, Sam.\n\nOne more adventure awaits.');
    await page.locator('#giftTextForm button[type=submit]').click();
    assert.equal(await page.evaluate(()=>WISHBOUND.story.letter.paragraphs.length),4);
    assert.equal(await page.locator('#letterDialog .dialog-inner p').count(),4);
    const png = await page.evaluate(()=>{
      const c=document.createElement('canvas'); c.width=1600; c.height=1200;
      const x=c.getContext('2d'); x.fillStyle='#e02020'; x.fillRect(0,0,800,1200); x.fillStyle='#2040e0'; x.fillRect(800,0,800,1200);
      return c.toDataURL('image/png').split(',')[1];
    });
    const upload = {name:'memory.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')};
    await page.locator('#giftPhotosButton').click();
    await page.getByRole('button',{name:'Opening wish portrait',exact:true}).click();
    await page.locator('#giftImageFile').setInputFiles(upload);
    await page.waitForFunction(()=>!document.getElementById('giftImageApply').disabled);
    for(const [id,value] of [['giftCropZoom','2'],['giftCropX','100']]) await page.locator('#'+id).evaluate((e,v)=>{e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));},value);
    const pixel=await page.locator('#giftCropPreview').evaluate(c=>Array.from(c.getContext('2d').getImageData(0,0,1,1).data));
    assert(pixel[2]>pixel[0],'Crop positioning did not move to the blue side');
    await page.locator('#giftImageAlt').fill('A portrait of Alex');
    await page.locator('#giftImageForm button[type=submit]').click();
    const portrait=await page.evaluate(()=>WISHBOUND.story.reveal.portrait);
    assert(portrait.startsWith('data:image/jpeg;base64,'));
    assert(await page.locator('img[data-story-image="reveal.portrait"]').evaluateAll((imgs,src)=>imgs.every(i=>i.src===src&&i.alt==='A portrait of Alex'),portrait));
    await page.locator('#giftPhotosButton').click();
    await page.getByRole('button',{name:'Chapter 3 · Unforgettable day',exact:true}).click();
    await page.locator('#giftImageFile').setInputFiles(upload);
    await page.waitForFunction(()=>!document.getElementById('giftImageApply').disabled);
    await page.locator('#giftImageAlt').fill('Our favorite day');
    await page.locator('#giftImageForm button[type=submit]').click();
    assert(await page.evaluate(()=>WISHBOUND.story.photos[0].startsWith('data:image/jpeg;base64,')));
    await page.locator('#giftPhotosButton').click();
    await page.getByRole('button',{name:'Chapter 2 · Little constellations',exact:true}).click();
    await page.locator('#giftImageFile').setInputFiles({name:'invalid.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg/>')});
    assert(await page.locator('#giftImageError').isVisible());
    assert(await page.locator('#giftImageApply').isDisabled());
    await page.locator('#giftImageDialog [data-close-editor]').click();
    // Give every remaining slot a different image; replacing one must leave the others untouched.
    const slots=await page.evaluate(()=>WISHBOUND.photoSlots);
    assert.equal(slots.length,5);
    const photoValues={'reveal.portrait':portrait};
    assert.equal(await page.evaluate(()=>WISHBOUND.story.photos[3]),portrait,'Opening portrait must connect to Chapter 1');
    await page.evaluate(()=>{const s=WISHBOUND.snapshot();WISHBOUND.set('photos.3','assets/moonlight.svg');WISHBOUND.refresh();if(WISHBOUND.story.reveal.portrait!=='assets/moonlight.svg')throw Error('Book portrait edit did not update opening');WISHBOUND.apply(s);WISHBOUND.refresh();});
    for (const [index,slot] of slots.entries()) {
      if (slot.path==='reveal.portrait') continue;
      const before=await page.evaluate(()=>WISHBOUND.photoSlots.map(s=>WISHBOUND.get(s.path)));
      const colorPng=await page.evaluate(index=>{
        const c=document.createElement('canvas');c.width=320;c.height=400;
        const x=c.getContext('2d');x.fillStyle=`hsl(${index*55},75%,45%)`;x.fillRect(0,0,320,400);
        return c.toDataURL('image/png').split(',')[1];
      },index);
      await page.locator('#giftPhotosButton').click();
      assert.equal(await page.locator('#giftPhotoGrid button').count(),5);
      await page.getByRole('button',{name:slot.label,exact:true}).click();
      await page.locator('#giftImageFile').setInputFiles({name:`photo-${index}.png`,mimeType:'image/png',buffer:Buffer.from(colorPng,'base64')});
      await page.waitForFunction(()=>!document.getElementById('giftImageApply').disabled);
      await page.locator('#giftImageAlt').fill(slot.label);
      await page.locator('#giftImageForm button[type=submit]').click();
      const after=await page.evaluate(()=>WISHBOUND.photoSlots.map(s=>WISHBOUND.get(s.path)));
      for(let i=0;i<slots.length;i++) if(i!==index) assert.equal(after[i],before[i],`Replacing ${slot.label} changed ${slots[i].label}`);
      photoValues[slot.path]=after[index];
      const instances=page.locator(`img[data-story-image="${slot.path}"]`);
      assert(await instances.count()>0);
      assert(await instances.evaluateAll((imgs,{src,alt})=>imgs.every(i=>i.src===src&&i.alt===alt),{src:after[index],alt:slot.label}));
    }
    assert.equal(new Set(Object.values(photoValues)).size,slots.length,'Independent slots lost their distinct images');
    // Restore only one placeholder, then put its upload back; no other slot may change.
    const slot=slots[2]; const snapshot=await page.evaluate(()=>WISHBOUND.snapshot());
    await page.locator('#giftPhotosButton').click();await page.getByRole('button',{name:slot.label,exact:true}).click();
    await page.locator('#giftImageDefault').click();
    assert.notEqual(await page.evaluate(path=>WISHBOUND.get(path),slot.path),photoValues[slot.path]);
    for(const other of slots.filter(s=>s.path!==slot.path)) assert.equal(await page.evaluate(path=>WISHBOUND.get(path),other.path),photoValues[other.path]);
    await page.evaluate(snapshot=>{WISHBOUND.apply(snapshot);WISHBOUND.refresh();},snapshot);
    // Click the actual surrounding labels, including the caption formerly ignoring pointer events.
    const edgeValues={...birthdayCopy};
    for(const key of ['monogramFirst','monogramLast','themeTitle','heroEyebrow','keepsakeLabel','bottomHint','footerNote','footerDedication']) {
      const value=key.startsWith('monogram')?'A':'Our '+key;
      await page.locator(`[data-story-text="presentation.${key}"]:visible`).click();
      await page.locator('#giftTextValue').fill(value);await page.locator('#giftTextForm button[type=submit]').click();
      assert.equal(await page.evaluate(key=>WISHBOUND.story.presentation[key],key),value);edgeValues[key]=value;
    }
    await page.locator('#giftDetailsButton').click();
    await page.locator('#giftDetailsDialog summary').click();
    await page.locator('#gift-field-presentation-introChartNote').fill('A voyage just for Alex');
    await page.locator('#gift-field-presentation-letterOverline').fill('Words for Alex');
    await page.locator('#giftDetailsForm button[type=submit]').click();
    edgeValues.introChartNote='A voyage just for Alex';edgeValues.letterOverline='Words for Alex';
    await page.waitForFunction(()=>document.getElementById('giftSaveStatus').textContent==='Saved in this browser.');
    await page.locator('#giftPreviewButton').click();
    assert.equal(await page.locator('body').evaluate(b=>b.classList.contains('is-editing')),false);
    assert.equal(await page.locator('#giftToolbar').isVisible(),false);
    assert.equal(await page.locator('#editGift').isVisible(),false);
    assert(await page.evaluate(()=>document.getElementById('wishIntro').open&&document.getElementById('wishIntro').dataset.stage==='ready'),'Preview must start at the beginning');
    await page.screenshot({path:'qa/editor-desktop-preview.png'});
    // Returning to the demo restores every default but retains our detached draft.
    await page.locator('#giftPreviewDemoButton').click();
    assert(await page.evaluate(()=>JSON.stringify(WISHBOUND.snapshot())===JSON.stringify(WISHBOUND.defaults)));
    assert.equal(await page.evaluate(()=>document.body.dataset.giftMode),'template');
    assert.equal(await page.locator('#giftToolbar').isVisible(),false);
    assert(await page.locator('#introEditGift').isVisible());
    await page.locator('#introEditGift').click();
    assert.equal(await page.evaluate(()=>WISHBOUND.story.recipient),'Alex Rivera');
    assert.equal(await page.locator('#giftViewSelect').inputValue(),'opening');
    await page.locator('#giftDemoButton').click();
    assert.equal(await page.evaluate(()=>WISHBOUND.story.recipient),'my love');
    await page.reload();await page.locator('#introEditGift').waitFor({state:'visible'});
    assert(await page.evaluate(()=>JSON.stringify(WISHBOUND.snapshot())===JSON.stringify(WISHBOUND.defaults)),'Saved draft replaced the original demo on reload');
    // A second tab in the same browser also starts with the public template.
    const sibling=await context.newPage();await sibling.goto(base+'/ONE_FILE_PREVIEW.html');
    await sibling.locator('#introEditGift').waitFor({state:'visible'});
    assert.equal(await sibling.evaluate(()=>WISHBOUND.story.recipient),'my love');await sibling.close();
    await page.locator('#introEditGift').click();
    assert.equal(await page.evaluate(()=>WISHBOUND.story.recipient),'Alex Rivera');
    assert.equal(await page.evaluate(()=>WISHBOUND.story.reveal.portrait),portrait);
    for(const [path,value] of Object.entries(photoValues)) assert.equal(await page.evaluate(path=>WISHBOUND.get(path),path),value,'Photo changed on reload');
    for(const [key,value] of Object.entries(edgeValues)) assert.equal(await page.evaluate(key=>WISHBOUND.story.presentation[key],key),value,'Edge text changed on reload');
    assert.equal(await page.evaluate(()=>WISHBOUND.story.letter.paragraphs.length),4);
    const download=await downloadGift(page); assert.equal(download.suggestedFilename(),'wishbound-for-alex-rivera.html');
    giftHtml=fs.readFileSync(await download.path(),'utf8');
    assert(!giftHtml.includes('id="giftToolbar"'));
    await checkStartup(giftHtml, 1280, 'exported');
    await checkBirthdayOpening(base+'/personalized.html', 1280, 'Alex Rivera', birthdayCopy.birthdayFirstLine, birthdayCopy.birthdaySecondLine);
    const giftContext=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'});
    const giftPage=await giftContext.newPage();giftPage.on('pageerror',e=>errors.push(e.message));
    await giftPage.route('https://**',route=>route.abort());
    await giftPage.goto(base+'/personalized.html');
    await giftPage.waitForFunction(()=>window.WISHBOUND_GIFT===true);
    assert.equal(await giftPage.locator('[data-editor-ui]').count(),0);
    assert.equal(await giftPage.locator('#giftSaveButton').count(),0);
    assert.equal(await giftPage.evaluate(()=>WISHBOUND.story.recipient),'Alex Rivera');
    for(const [path,value] of Object.entries(photoValues)) assert.equal(await giftPage.evaluate(path=>WISHBOUND.get(path),path),value,'Photo changed in export');
    for(const [key,value] of Object.entries(edgeValues)) assert.equal(await giftPage.evaluate(key=>WISHBOUND.story.presentation[key],key),value,'Edge text changed in export');
    assert.equal(await giftPage.evaluate(()=>WISHBOUND.story.copy.somewhere_between_the_stars_above),hostile);
    assert.equal(await giftPage.evaluate(()=>window.giftXss),undefined);
    assert.equal(await giftPage.locator('script[src]').count(),0);
    assert(await giftPage.locator('img').evaluateAll(imgs=>imgs.every(i=>i.src.startsWith('data:image/'))));
    await giftPage.locator('#startWish').click();
    for(let i=0;i<3;i++) {
      await giftPage.locator('#replayPortraitWish').click();
      assert.equal(await giftPage.locator('#wishIntro').getAttribute('data-stage'),'revealed');
      assert.equal(await giftPage.evaluate(()=>WISHBOUND.story.recipient),'Alex Rivera');
      assert.equal(await giftPage.evaluate(()=>WISHBOUND.story.reveal.portrait),portrait);
    }
    await giftPage.locator('#enterBook').click();
    await giftPage.waitForFunction(()=>!document.getElementById('wishIntro').open);
    await giftPage.locator('#pagination button').nth(4).click();
    await giftPage.getByRole('button',{name:'Read your letter'}).click();
    assert.equal(await giftPage.locator('#letterDialog .dialog-inner p').count(),4);
    await giftPage.locator('#closeLetter').click();
    await giftPage.screenshot({path:'qa/editor-exported-gift.png'});
    await giftContext.close();
    // Editable gifts must work from an actual local HTML file, entirely offline.
    await page.locator('#giftDownloadButton').click();
    await page.locator('#giftDownloadDialog [data-close-editor]').click();
    assert.equal(await page.locator('#giftDownloadDialog').isVisible(), false);
    const editableHtml = fs.readFileSync(await (await downloadGift(page, true)).path(),'utf8');
    const secondGiftHtml = fs.readFileSync(await (await downloadGift(page, true)).path(),'utf8');
    const localFile = path.join(__dirname,'qa','editable-gift.html');
    const otherFile = path.join(__dirname,'qa','other-gift.html');
    fs.writeFileSync(localFile,editableHtml); fs.writeFileSync(otherFile,secondGiftHtml);
    const localContext = await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce',acceptDownloads:true});
    const localPage = await localContext.newPage(); localPage.on('pageerror',e=>errors.push(e.message));
    const localRequests=[];
    localContext.on('request',r=>{if(/^https?:/.test(r.url()) && !r.url().includes('fonts.')) localRequests.push(r.url());});
    await localContext.route(/^https?:/,r=>r.abort());
    await localPage.goto(pathToFileURL(localFile).href);
    await localPage.locator('#introEditGift').waitFor({state:'visible'});
    assert.equal(await localPage.evaluate(()=>WISHBOUND.story.recipient),'Alex Rivera');
    assert.equal(await localPage.locator('#giftDownloadDialog').isVisible(),false,'Download popup interrupted the birthday');
    const giftId = await localPage.evaluate(()=>WISHBOUND_GIFT_ID);
    await localPage.locator('#introEditGift').click();
    assert.equal(await localPage.locator('#giftViewSelect').inputValue(),'opening');
    await localPage.locator('#introTitle').click(); await localPage.locator('#giftTextValue').fill('My locally edited wish');
    await localPage.locator('#giftTextForm button[type=submit]').click();
    await localPage.locator('#giftPhotosButton').click();
    await localPage.getByRole('button',{name:'Opening wish portrait',exact:true}).click();
    await localPage.locator('#giftImageFile').setInputFiles(upload);
    await localPage.locator('#giftImageApply').waitFor({state:'visible'});
    await localPage.waitForFunction(()=>!document.getElementById('giftImageApply').disabled);
    await localPage.locator('#giftImageAlt').fill('Local photo'); await localPage.locator('#giftImageApply').click();
    const localPortrait = await localPage.evaluate(()=>WISHBOUND.story.reveal.portrait);
    await localPage.locator('#giftSaveButton').click();
    await localPage.waitForFunction(()=>document.getElementById('giftSaveStatus').textContent==='Saved in this browser.');
    await localPage.locator('#giftDemoButton').click();
    assert.equal(await localPage.evaluate(()=>WISHBOUND.story.presentation.introTitle),'My locally edited wish');
    assert.equal(await localPage.locator('#giftToolbar').isVisible(),false);
    await localPage.reload(); await localPage.locator('#introEditGift').waitFor({state:'visible'});
    assert.equal(await localPage.locator('#introTitle').textContent(),'My locally edited wish');
    assert.equal(await localPage.evaluate(()=>WISHBOUND.story.reveal.portrait),localPortrait);
    assert.equal(fs.readFileSync(localFile,'utf8'),editableHtml,'Browser save rewrote original file');
    await localPage.locator('#introEditGift').click();
    await localPage.screenshot({path:'qa/editor-local-gift.png'});
    await localPage.locator('#giftDownloadButton').click();
    await localPage.screenshot({path:'qa/editor-download-dialog.png'});
    await localPage.locator('#giftDownloadDialog [data-close-editor]').click();
    const updatedHtml=fs.readFileSync(await (await downloadGift(localPage,true)).path(),'utf8');
    const updatedFile=path.join(__dirname,'qa','updated-gift.html');fs.writeFileSync(updatedFile,updatedHtml);
    await localPage.goto(pathToFileURL(updatedFile).href);await localPage.locator('#introEditGift').waitFor({state:'visible'});
    assert.equal(await localPage.evaluate(()=>WISHBOUND_GIFT_ID),giftId,'Updated copy lost its gift identity');
    assert.equal(await localPage.locator('#introTitle').textContent(),'My locally edited wish');
    // A separate gift in the same file origin must not adopt this gift's edits.
    await localPage.goto(pathToFileURL(otherFile).href);await localPage.locator('#introEditGift').waitFor({state:'visible'});
    assert.notEqual(await localPage.evaluate(()=>WISHBOUND_GIFT_ID),giftId);
    assert.equal(await localPage.locator('#introTitle').textContent(),'A wish for Alex');
    await localPage.goto(pathToFileURL(localFile).href);await localPage.locator('#introEditGift').click();
    const cleanHtml=fs.readFileSync(await (await downloadGift(localPage,false)).path(),'utf8');
    assert(!cleanHtml.includes('id="giftToolbar"'));
    fs.writeFileSync(updatedFile,cleanHtml);
    await localPage.goto(pathToFileURL(updatedFile).href);
    assert.equal(await localPage.locator('[data-editor-ui]').count(),0);
    assert.equal(await localPage.locator('#introTitle').textContent(),'My locally edited wish');
    // Fresh browser: exported changes travel with the file, saved-only edits do not.
    const newContext=await browser.newContext({viewport:{width:375,height:812},reducedMotion:'reduce'});
    const newPage=await newContext.newPage();newPage.on('pageerror',e=>errors.push(e.message));
    await newContext.route(/^https?:/,r=>r.abort());
    await newPage.goto(pathToFileURL(localFile).href);await newPage.locator('#introEditGift').waitFor({state:'visible'});
    assert.equal(await newPage.locator('#introTitle').textContent(),'A wish for Alex');
    await newPage.locator('#introEditGift').click();await newPage.locator('#giftDownloadButton').click();
    assert.equal(await newPage.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await newPage.screenshot({path:'qa/editor-download-mobile.png'});
    await newPage.locator('#giftDownloadDialog [data-close-editor]').click();
    await newPage.goto(pathToFileURL(updatedFile).href);
    assert.equal(await newPage.locator('#introTitle').textContent(),'My locally edited wish');
    // Reset restores this file's embedded content, rather than the public sample.
    await localPage.goto(pathToFileURL(localFile).href);await localPage.locator('#introEditGift').click();
    await localPage.locator('#giftResetButton').click();await localPage.locator('#giftConfirmReset').click();
    assert.equal(await localPage.locator('#introTitle').textContent(),'A wish for Alex','Reset did not restore original embedded content');
    await localPage.locator('#giftSaveButton').click();
    await localPage.waitForFunction(()=>document.getElementById('giftSaveStatus').textContent==='Saved in this browser.');
    await localPage.reload();await localPage.locator('#introEditGift').waitFor({state:'visible'});
    assert.equal(await localPage.locator('#introTitle').textContent(),'A wish for Alex');
    assert.equal(await localPage.evaluate(()=>WISHBOUND.story.reveal.portrait),portrait);
    assert.deepEqual(localRequests,[],'Offline gift tried to fetch content or write over the network');
    await newContext.close();await localContext.close();
    const noStorage=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce',acceptDownloads:true});
    await noStorage.addInitScript(()=>Object.defineProperty(window,'indexedDB',{get(){throw Error('Unavailable');}}));
    await noStorage.route(/^https?:/,r=>r.abort());
    const noStoragePage=await noStorage.newPage();noStoragePage.on('pageerror',e=>errors.push(e.message));
    await noStoragePage.goto(pathToFileURL(localFile).href);await noStoragePage.locator('#introEditGift').click();
    await noStoragePage.locator('#introTitle').click();await noStoragePage.locator('#giftTextValue').fill('Keep this without storage');
    await noStoragePage.locator('#giftTextForm button[type=submit]').click();await noStoragePage.locator('#giftSaveButton').click();
    await noStoragePage.waitForFunction(()=>document.getElementById('giftSaveStatus').textContent.includes('Browser saving is unavailable'));
    const fallbackHtml=fs.readFileSync(await (await downloadGift(noStoragePage,true)).path(),'utf8');
    assert(fallbackHtml.includes('Keep this without storage'),'Failed browser saving blocked portable download');
    await noStorage.close();
    console.log('Local gift checks passed: download options, actual file offline editing, text/photo persistence, updated and clean exports, per-gift isolation, reset, and fresh-browser behavior.');
    const fresh=await browser.newContext({viewport:{width:375,height:812},reducedMotion:'reduce',acceptDownloads:true});
    const phone=await fresh.newPage();phone.on('pageerror',e=>errors.push(e.message));
    await phone.goto(base+'/index.html');
    await phone.locator('#introEditGift').click();
    assert.equal(await phone.evaluate(()=>WISHBOUND.story.recipient),'my love','Draft leaked into another browser context');
    assert(await phone.evaluate(()=>document.getElementById('wishIntro').open&&document.getElementById('wishIntro').dataset.stage==='ready'));
    await phone.locator('#giftViewSelect').selectOption('greeting');
    await phone.locator('[data-story-text="presentation.birthdayMessage"]').click();
    await phone.locator('#giftTextValue').fill('A universe for Jamie'); await phone.locator('#giftTextForm button[type=submit]').click();
    assert.equal(await phone.locator('[data-story-text="presentation.birthdayMessage"]').textContent(), 'A universe for Jamie');
    await phone.screenshot({path:'qa/editor-birthday-mobile-edit.png'});
    await phone.locator('#giftViewSelect').selectOption('reveal');
    await phone.locator('#revealRecipient').click();
    await phone.locator('#giftTextValue').fill('Jamie');await phone.locator('#giftTextForm button[type=submit]').click();
    await phone.locator('#giftSaveButton').click();
    await phone.waitForFunction(()=>document.getElementById('giftSaveStatus').textContent==='Saved in this browser.');
    const sourceGift=fs.readFileSync(await (await downloadGift(phone)).path(),'utf8');
    assert(sourceGift.includes('"recipient":"Jamie"'));
    assert.equal(await phone.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await phone.screenshot({path:'qa/editor-mobile.png'});
    await phone.locator('#giftPreviewButton').click();
    await phone.locator('#startWish').click();
    await phone.locator('#replayPortraitWish').click();
    assert.equal(await phone.locator('#wishIntro').getAttribute('data-stage'),'revealed');
    await phone.locator('#giftBackButton').click();
    await phone.locator('#giftViewSelect').selectOption('book');
    await phone.waitForFunction(()=>!document.getElementById('wishIntro').open);
    // Mobile chapter photos refer to the corresponding desktop slots, never another chapter.
    for(const [chapter,paths] of [[1,['photos.3']],[2,['photos.1','photos.2']],[3,['photos.0','photos.4']]]) {
      await phone.locator('#pagination button').nth(chapter).click();
      await phone.waitForFunction(chapter=>document.getElementById('pageCount').textContent.startsWith(String(chapter+1).padStart(2,'0')),chapter);
      const card=phone.locator('.mobile-card.active');
      assert.deepEqual(await card.locator('img[data-story-image]').evaluateAll(imgs=>imgs.map(i=>i.dataset.storyImage)),paths);
      for(const path of paths) {
        await card.locator(`img[data-story-image="${path}"]`).click();
        assert.equal(await phone.locator('#giftImageTitle').textContent(),await phone.evaluate(path=>'Replace photo · '+WISHBOUND.photoSlot(path).label,path));
        await phone.locator('#giftImageDialog [data-close-editor]').click();
      }
    }
    await phone.locator('[data-story-text="presentation.footerDedication"]').click();
    await phone.locator('#giftTextValue').fill('For Jamie');await phone.locator('#giftTextForm button[type=submit]').click();
    assert.equal(await phone.evaluate(()=>WISHBOUND.story.presentation.footerDedication),'For Jamie');
    await phone.locator('#giftResetButton').click();await phone.locator('#giftConfirmReset').click();
    assert.equal(await phone.evaluate(()=>WISHBOUND.story.recipient),'my love');
    await phone.waitForFunction(()=>document.getElementById('giftSaveStatus').textContent==='Saved in this browser.');
    await phone.reload();await phone.locator('#introEditGift').waitFor({state:'visible'});
    assert.equal(await phone.evaluate(()=>WISHBOUND.story.recipient),'my love');
    // A draft from the previous release keeps the images that used to be shared.
    await phone.evaluate(async ()=>{
      const old=WISHBOUND.clone(WISHBOUND.defaults);old.recipient='Legacy draft';
      old.photos=old.photos.slice(0,3);old.photoAlts=old.photoAlts.slice(0,3);delete old.presentation;
      const c=document.createElement('canvas');c.width=10;c.height=10;const x=c.getContext('2d');x.fillStyle='#25aa66';x.fillRect(0,0,10,10);
      old.reveal.portrait=c.toDataURL('image/png');old.reveal.portraitAlt='Legacy portrait';old.photos[1]=old.reveal.portrait;old.photoAlts[1]='Legacy memory';
      const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('wishbound-gifts',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
      await new Promise((resolve,reject)=>{const tx=db.transaction('drafts','readwrite');tx.objectStore('drafts').put({version:1,story:old},'current:/');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});db.close();
    });
    await phone.reload();await phone.locator('#introEditGift').waitFor({state:'visible'});
    assert.equal(await phone.evaluate(()=>WISHBOUND.story.recipient),'my love');
    await phone.locator('#introEditGift').click();
    assert.equal(await phone.evaluate(()=>WISHBOUND.story.recipient),'Legacy draft');
    assert(await phone.evaluate(()=>WISHBOUND.story.photos[3]===WISHBOUND.story.reveal.portrait&&WISHBOUND.story.photos[4]===WISHBOUND.story.photos[1]));
    assert.equal(await phone.evaluate(()=>WISHBOUND.story.photoAlts[3]),'Legacy portrait');
    assert.equal(await phone.evaluate(()=>WISHBOUND.story.photoAlts[4]),'Legacy memory');
    await phone.locator('#giftResetButton').click();await phone.locator('#giftConfirmReset').click();
    assert(await phone.evaluate(()=>JSON.stringify(WISHBOUND.snapshot())===JSON.stringify(WISHBOUND.defaults)),'Start over did not restore all photo slots and edge text');
    // A gift with the opening disabled still starts editing at the opening,
    // while its clean preview/export honors the setting.
    await phone.locator('#giftDetailsButton').click();await phone.locator('#giftIntroEnabled').uncheck();
    await phone.locator('#giftDetailsForm button[type=submit]').click();
    await phone.locator('#giftPreviewButton').click();await phone.waitForFunction(()=>!document.getElementById('wishIntro').open);
    await phone.locator('#giftBackButton').click();
    await phone.locator('#giftDemoButton').click();await phone.locator('#introEditGift').click();
    assert(await phone.evaluate(()=>document.getElementById('wishIntro').open&&document.getElementById('wishIntro').dataset.stage==='ready'));
    assert.equal(await phone.evaluate(()=>WISHBOUND.story.reveal.enabled),false);
    const disabledGift = fs.readFileSync(await (await downloadGift(phone)).path(),'utf8');
    assert(disabledGift.includes('data-enabled="false"'));
    await checkStartup(disabledGift, 375, 'disabled-export', false);
    // Starting the editor from an already-read demo returns to the first screen.
    await phone.locator('#giftDemoButton').click();await phone.locator('#skipIntro').click();
    await phone.waitForFunction(()=>!document.getElementById('wishIntro').open);
    await phone.locator('#pagination button').nth(3).click();
    await phone.locator('#editGift').click();
    assert.equal(await phone.locator('#giftViewSelect').inputValue(),'opening');
    assert(await phone.locator('#giftToolbar').isVisible());
    // With normal motion, replay immediately restarts the pull and ignores a rapid second click.
    const motionContext=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
    const motionPage=await motionContext.newPage();motionPage.on('pageerror',e=>errors.push(e.message));
    await motionPage.goto(base+'/ONE_FILE_PREVIEW.html');
    assert.equal(await motionPage.locator('#wishIntro').getAttribute('data-welcome'), 'playing');
    await motionPage.locator('#birthdayContinue').click();
    await motionPage.waitForFunction(() => !document.getElementById('wishIntro').dataset.welcome);
    await motionPage.evaluate(()=>{
      window.replayStarts=0;const play=BIRTHDAY_WISH.play;
      BIRTHDAY_WISH.play=()=>{window.replayStarts++;return play();};
    });
    await motionPage.locator('#startWish').click();
    await motionPage.waitForFunction(()=>document.getElementById('wishIntro').dataset.stage==='revealed');
    await motionPage.locator('#replayPortraitWish').click();
    assert.equal(await motionPage.locator('#wishIntro').getAttribute('data-stage'),'wishing');
    assert(await motionPage.locator('#replayPortraitWish').isDisabled());
    await motionPage.evaluate(()=>document.getElementById('replayPortraitWish').click());
    assert.equal(await motionPage.evaluate(()=>window.replayStarts),2);
    await motionPage.waitForFunction(()=>document.getElementById('wishIntro').dataset.stage==='revealed');
    assert.equal(await motionPage.locator('#replayPortraitWish').isDisabled(),false);
    await motionPage.screenshot({path:'qa/editor-portrait-replay.png'});
    await motionPage.locator('#skipIntro').click();await motionPage.waitForFunction(()=>!document.getElementById('wishIntro').open);
    assert.equal(await motionPage.locator('.wish-canvas').getAttribute('data-active'),'false');
    await motionContext.close();
    for (const [width,file] of [[1440,'index.html'],[375,'ONE_FILE_PREVIEW.html']]) {
      await checkBirthdayOpening(base+'/'+file, width, 'my love');
    }
    const interruptContext = await browser.newContext({viewport:{width:375,height:812},reducedMotion:'no-preference'});
    const interruptPage = await interruptContext.newPage(); interruptPage.on('pageerror', e => errors.push(e.message));
    await interruptPage.route('https://**', route => route.abort());
    await interruptPage.goto(base+'/ONE_FILE_PREVIEW.html');
    await interruptPage.keyboard.press('Escape');
    await interruptPage.waitForFunction(() => !document.getElementById('wishIntro').open);
    assert.equal(await interruptPage.locator('#birthdayStarlight').getAttribute('data-active'), 'false');
    await interruptPage.goto(base+'/ONE_FILE_PREVIEW.html');
    await interruptPage.emulateMedia({reducedMotion:'reduce'});
    await interruptPage.waitForFunction(() => !document.getElementById('wishIntro').dataset.welcome);
    assert(await interruptPage.locator('#startWish').isVisible());
    assert.equal(await interruptPage.locator('#birthdayStarlight').getAttribute('data-active'), 'false');
    await interruptContext.close();
    assert.deepEqual(writeRequests,[],'Editor attempted to write changes over the network');
    assert.equal(await (await page.request.get(base+'/ONE_FILE_PREVIEW.html')).text(),originalTemplate,'Public template changed after editing');
    assert.equal(fs.readFileSync(path.join(dir,'ONE_FILE_PREVIEW.html'),'utf8'),originalTemplate);
    await fresh.close();
    assert.deepEqual(errors,[]);
    console.log('Editor checks passed: cinematic birthday opening and automatic handoff, personalized greeting exports, still greeting editing on desktop/mobile, greeting skip/Escape/reduced-motion cleanup, no first-paint book flash, portrait replay, manual browser-only saving, template/draft isolation, inline and edge text, one linked portrait and four independent memory photos, legacy draft migration, letter, crop, invalid uploads, preview, reset, and standalone HTML exports.');
  } catch(e) {
    await page.screenshot({path:'qa/editor-failure.png',fullPage:true}).catch(()=>{}); throw e;
  } finally { await browser.close(); await new Promise(resolve=>server.close(resolve)); }
})().catch(e=>{console.error(e);server.close();process.exit(1);});
