const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
require('node:fs').mkdirSync(path.join(__dirname,'qa'),{recursive:true});
try{
for(const [width,motion] of [[1440,'no-preference'],[375,'no-preference'],[320,'reduce']]) {
 const page=await browser.newPage({viewport:{width,height:900},reducedMotion:motion}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://**',r=>r.abort());await page.goto(pathToFileURL(path.join(__dirname,'site','ONE_FILE_PREVIEW.html')).href);
 await page.locator('#skipIntro').click();await page.locator('#pagination button').nth(6).click();
 await page.evaluate(()=>{WISHBOUND.set('recipient','Alex');WISHBOUND.refresh();});
 await page.evaluate(()=>{
   const count=8000,bytes=new Uint8Array(44+count*2),view=new DataView(bytes.buffer);
   const text=(at,s)=>{for(let i=0;i<s.length;i++)bytes[at+i]=s.charCodeAt(i)};
   text(0,'RIFF');view.setUint32(4,bytes.length-8,true);text(8,'WAVEfmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,8000,true);view.setUint32(28,16000,true);view.setUint16(32,2,true);view.setUint16(34,16,true);text(36,'data');view.setUint32(40,count*2,true);
   for(let i=0;i<count;i++)view.setInt16(44+i*2,Math.sin(i/8000*Math.PI*880)*800,true);
   const a=document.getElementById('visitorMusicAudio');a.src=URL.createObjectURL(new Blob([bytes],{type:'audio/wav'}));a.volume=.35;a.loop=true;
 });
 await page.locator('#visitorMusicPlay').evaluate(e=>e.click());
 await page.waitForFunction(()=>{const a=document.getElementById('visitorMusicAudio');return !a.paused&&a.volume>.3});
 await page.locator('#closeStory').click();
 assert(await page.locator('#visitorMusicAudio').evaluate(a=>!a.paused),'Closing does not cut music immediately');
 await page.waitForTimeout(600);
 assert(await page.locator('#visitorMusicAudio').evaluate(a=>!a.paused&&a.volume>0&&a.volume<.35),'Closing music fades gradually');
 if(width===1440){await page.waitForTimeout(450);await page.screenshot({path:path.join(__dirname,'qa','book-closing.png')});}
 await page.waitForFunction(()=>!document.getElementById('closedStory').hidden);
 await page.waitForFunction(()=>document.activeElement.id==='restartStory');
 assert(await page.locator('#pageCount').textContent().then(t=>t.startsWith('01')));
 assert.equal(await page.locator('#book').evaluate(b=>b.getAnimations().length),0,'Closing layers removed');
 assert(await page.locator('#wishPullAudio').evaluate(a=>a.paused));
 await page.waitForFunction(()=>{const a=document.getElementById('visitorMusicAudio');return a.paused&&a.volume===0});
 await page.screenshot({path:path.join(__dirname,'qa','book-closed-'+width+'.png'),fullPage:true});
 await page.locator('#restartStory').click();
 assert(await page.locator('#wishIntro').evaluate(d=>d.open));assert.equal(await page.evaluate(()=>BIRTHDAY_STORY.recipient),'Alex','Personalized gift preserved');
 if(motion!=='reduce')assert.equal(await page.locator('#wishIntro').getAttribute('data-welcome'),'playing','Replay includes birthday greeting');
 await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.getElementById('wishIntro').open);
 assert.deepEqual(errors,[]);console.log('Close, centered cover, replay from greeting, personalization and audio cleanup passed:',width,motion);
 await page.close();
}
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
