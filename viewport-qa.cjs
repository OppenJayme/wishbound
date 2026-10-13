const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

// Test the visible book content at laptop, monitor, and phone sizes.
// The website can scroll; the fixed desktop book pages must not clip content.
const sizes = [[1366,600],[1280,560],[1024,620],[1920,900],[1440,900],
  [1024,480],[1920,640],[910,500],[375,812],[320,568]];
(async () => {
  const browser = await chromium.launch({executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true});
  const context = await browser.newContext({reducedMotion:'reduce'});
  const page = await context.newPage();
  const errors = []; const failures = [];
  page.on('pageerror', error => errors.push(error.message));
  fs.mkdirSync(path.join(__dirname,'qa'), {recursive:true});
  try {
    for (const file of ['index.html','ONE_FILE_PREVIEW.html']) {
      for (const [width,height] of sizes) {
        await page.setViewportSize({width,height});
        await page.goto(pathToFileURL(path.join(__dirname,'site',file)).href);
        await page.evaluate(() => document.fonts.ready);
        await page.locator('#skipIntro').click();
        await page.waitForFunction(() => !document.getElementById('wishIntro').open);
        for (let chapter=0;chapter<7;chapter++) {
          await page.locator('.page-dot').nth(chapter).click();
          await page.waitForFunction(i => document.querySelectorAll('.page-dot')[i].getAttribute('aria-current') === 'step' && !document.getElementById('book').classList.contains('is-turning'),chapter);
          const problems = await page.evaluate(() => {
            const pages = innerWidth <= 900 ? [...document.querySelectorAll('.mobile-card.active .page')] : [...document.querySelectorAll('.face[aria-hidden="false"] .page')];
            const issues = [];
            const overlaps = (a,b) => Math.min(a.right,b.right)-Math.max(a.left,b.left)>2 && Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>2;
            for (const p of pages) {
              if (p.scrollHeight > p.clientHeight+2 || p.scrollWidth > p.clientWidth+2) issues.push({page:p.className,reason:'clipped content',height:p.clientHeight,scrollHeight:p.scrollHeight,width:p.clientWidth,scrollWidth:p.scrollWidth});
              for (const decoration of p.querySelectorAll('.page-keepsake')) {
                const a=decoration.getBoundingClientRect(); const bounds=p.getBoundingClientRect();
                if (a.left<bounds.left-1 || a.right>bounds.right+1 || a.top<bounds.top-1 || a.bottom>bounds.bottom+1) issues.push({page:p.className,reason:'keepsake outside page'});
                for (const node of p.querySelectorAll('[data-story-text],img[data-story-image],button,.page-number')) {
                  if (overlaps(a,node.getBoundingClientRect())) issues.push({page:p.className,reason:'keepsake overlaps content',text:node.textContent.slice(0,60)});
                }
                const img=decoration.querySelector('img');
                if (!img.complete || !img.naturalWidth) issues.push({page:p.className,reason:'keepsake failed to load'});
              }
            }
            return issues;
          });
          if (problems.length) {
            failures.push({file,width,height,chapter:chapter+1,problems});
            await page.screenshot({path:path.join(__dirname,'qa',`viewport-failure-${file.replace('.html','')}-${width}-${height}-${chapter+1}.png`),fullPage:true});
          }
        }
        console.log(`Layout checked: ${file}, ${width}×${height}, seven chapters.`);
      }
    }
    if (failures.length) console.error(JSON.stringify(failures,null,2));
    assert.deepEqual(errors, [], 'Browser errors during layout checks');
    assert.equal(failures.length, 0, 'Book content is clipped or a keepsake overlaps content; see details and screenshots above.');
    console.log('Source and portable layouts passed: ten viewport sizes, all seven chapters, no clipped content or overlapping keepsakes.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
