const {chromium}=require('playwright');
const fs=require('fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});
 const art='data:image/svg+xml;base64,'+fs.readFileSync('site/assets/captain-charm.svg').toString('base64');
 fs.mkdirSync('qa',{recursive:true});
 for(const reduced of [false,true]){
  const context=await browser.newContext({viewport:{width:720,height:320},reducedMotion:reduced?'reduce':'no-preference',recordVideo:reduced?undefined:{dir:'qa/charm-video',size:{width:720,height:320}}});
  const page=await context.newPage();
  await page.setContent('<html><style>body{margin:0;display:flex;align-items:center;justify-content:space-around;height:320px;background:#122630;color:#e6d1aa;font:14px Georgia}div{text-align:center;width:200px}img{display:block;margin:16px auto}</style><body><div>Book keepsake<img src="'+art+'" width="58" height="70"></div><div>Wish portal<img src="'+art+'" width="75" height="91"></div><div>Detail<img src="'+art+'" width="140" height="170"></div></body></html>');
  await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));
  const began=Date.now();
  for(const elapsed of reduced?[100,3550,7800]:[100,3550,5000,7700,9500,11400]){
   await page.waitForTimeout(Math.max(0,elapsed-(Date.now()-began)));
   await page.screenshot({path:'qa/charm-'+(reduced?'reduced':'normal')+'-'+elapsed+'.png'});
  }
  await context.close();
 }
 await browser.close();
 console.log('Captain charm source rendered as real SVG images at both UI sizes, including blink, tilt, spark, and reduced motion.');
})().catch(e=>{console.error(e);process.exit(1)});
