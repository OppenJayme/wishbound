const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const dir = path.join(__dirname, 'albedo-beidou-birthday-codex-v4/birthday_codex_albedo_beidou');
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
  try {
    await page.goto(base + '/ONE_FILE_PREVIEW.html');
    assert.equal(await page.evaluate(()=>document.body.dataset.giftMode),'template');
    await page.locator('#introEditGift').click();
    assert(await page.evaluate(()=>document.getElementById('wishIntro').open&&document.getElementById('wishIntro').dataset.stage==='ready'),'Editing skipped the first wish screen');
    assert.equal(await page.locator('#giftViewSelect').inputValue(),'opening');
    assert(await page.locator('#giftToolbar').isVisible());
    assert(await page.locator('#giftToolbar').evaluate(el=>el.parentElement.id==='wishIntro'),'Toolbar is blocked by the modal');
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
    assert(await page.locator('#giftToolbar').evaluate(el=>el.parentElement===document.body));
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
    assert.equal(slots.length,6);
    const photoValues={'reveal.portrait':portrait};
    for (const [index,slot] of slots.entries()) {
      if (slot.path==='reveal.portrait') continue;
      const before=await page.evaluate(()=>WISHBOUND.photoSlots.map(s=>WISHBOUND.get(s.path)));
      const colorPng=await page.evaluate(index=>{
        const c=document.createElement('canvas');c.width=320;c.height=400;
        const x=c.getContext('2d');x.fillStyle=`hsl(${index*55},75%,45%)`;x.fillRect(0,0,320,400);
        return c.toDataURL('image/png').split(',')[1];
      },index);
      await page.locator('#giftPhotosButton').click();
      assert.equal(await page.locator('#giftPhotoGrid button').count(),6);
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
    assert.equal(new Set(Object.values(photoValues)).size,6,'Independent slots lost their distinct images');
    // Restore only one placeholder, then put its upload back; no other slot may change.
    const slot=slots[2]; const snapshot=await page.evaluate(()=>WISHBOUND.snapshot());
    await page.locator('#giftPhotosButton').click();await page.getByRole('button',{name:slot.label,exact:true}).click();
    await page.locator('#giftImageDefault').click();
    assert.notEqual(await page.evaluate(path=>WISHBOUND.get(path),slot.path),photoValues[slot.path]);
    for(const other of slots.filter(s=>s.path!==slot.path)) assert.equal(await page.evaluate(path=>WISHBOUND.get(path),other.path),photoValues[other.path]);
    await page.evaluate(snapshot=>{WISHBOUND.apply(snapshot);WISHBOUND.refresh();},snapshot);
    // Click the actual surrounding labels, including the caption formerly ignoring pointer events.
    const edgeValues={};
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
    const pending = page.waitForEvent('download');
    await page.locator('#giftDownloadButton').click();
    const download=await pending; assert.equal(download.suggestedFilename(),'wishbound-for-alex-rivera.html');
    giftHtml=fs.readFileSync(await download.path(),'utf8');
    assert(!giftHtml.includes('id="giftToolbar"'));
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
    await giftPage.locator('#enterBook').click();
    await giftPage.waitForFunction(()=>!document.getElementById('wishIntro').open);
    await giftPage.locator('#pagination button').nth(4).click();
    await giftPage.getByRole('button',{name:'Read your letter'}).click();
    assert.equal(await giftPage.locator('#letterDialog .dialog-inner p').count(),4);
    await giftPage.locator('#closeLetter').click();
    await giftPage.screenshot({path:'qa/editor-exported-gift.png'});
    await giftContext.close();
    const fresh=await browser.newContext({viewport:{width:375,height:812},reducedMotion:'reduce',acceptDownloads:true});
    const phone=await fresh.newPage();phone.on('pageerror',e=>errors.push(e.message));
    await phone.goto(base+'/index.html');
    await phone.locator('#introEditGift').click();
    assert.equal(await phone.evaluate(()=>WISHBOUND.story.recipient),'my love','Draft leaked into another browser context');
    assert(await phone.evaluate(()=>document.getElementById('wishIntro').open&&document.getElementById('wishIntro').dataset.stage==='ready'));
    await phone.locator('#giftViewSelect').selectOption('reveal');
    await phone.locator('#revealRecipient').click();
    await phone.locator('#giftTextValue').fill('Jamie');await phone.locator('#giftTextForm button[type=submit]').click();
    await phone.locator('#giftSaveButton').click();
    await phone.waitForFunction(()=>document.getElementById('giftSaveStatus').textContent==='Saved in this browser.');
    const sourceDownload=phone.waitForEvent('download');await phone.locator('#giftDownloadButton').click();
    const sourceGift=fs.readFileSync(await (await sourceDownload).path(),'utf8');
    assert(sourceGift.includes('"recipient":"Jamie"'));
    assert.equal(await phone.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await phone.screenshot({path:'qa/editor-mobile.png'});
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
    // Starting the editor from an already-read demo returns to the first screen.
    await phone.locator('#giftDemoButton').click();await phone.locator('#skipIntro').click();
    await phone.waitForFunction(()=>!document.getElementById('wishIntro').open);
    await phone.locator('#pagination button').nth(3).click();
    await phone.locator('#editGift').click();
    assert.equal(await phone.locator('#giftViewSelect').inputValue(),'opening');
    assert(await phone.locator('#giftToolbar').isVisible());
    assert.deepEqual(writeRequests,[],'Editor attempted to write changes over the network');
    assert.equal(await (await page.request.get(base+'/ONE_FILE_PREVIEW.html')).text(),originalTemplate,'Public template changed after editing');
    assert.equal(fs.readFileSync(path.join(dir,'ONE_FILE_PREVIEW.html'),'utf8'),originalTemplate);
    await fresh.close();
    assert.deepEqual(errors,[]);
    console.log('Editor checks passed: manual browser-only saving on desktop and mobile, first-screen editing, template/draft isolation on reload and new tabs, return to template, read-only network use, inline and edge text, six independent photos, desktop/mobile slot mapping, legacy draft migration, names, letter, crop, invalid uploads, local drafts, private copies, preview, reset, and standalone HTML export on desktop and mobile.');
  } catch(e) {
    await page.screenshot({path:'qa/editor-failure.png',fullPage:true}).catch(()=>{}); throw e;
  } finally { await browser.close(); await new Promise(resolve=>server.close(resolve)); }
})().catch(e=>{console.error(e);server.close();process.exit(1);});
