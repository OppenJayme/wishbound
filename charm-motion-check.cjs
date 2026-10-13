const {chromium}=require('playwright');
const fs=require('fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});
 const art='data:image/svg+xml;base64,'+fs.readFileSync('site/assets/captain-charm.svg').toString('base64');
 const still='data:image/svg+xml;base64,'+fs.readFileSync('site/assets/captain-charm-still.svg').toString('base64');
 fs.mkdirSync('qa',{recursive:true});
 for(const reduced of [false,true]){
  const context=await browser.newContext({viewport:{width:720,height:320},reducedMotion:reduced?'reduce':'no-preference',recordVideo:reduced?undefined:{dir:'qa/charm-video',size:{width:720,height:320}}});
  const page=await context.newPage();
  const picture=(label,w,h)=>'<div>'+label+'<picture><source media="(prefers-reduced-motion: reduce)" srcset="'+still+'" type="image/svg+xml"><img src="'+art+'" width="'+w+'" height="'+h+'"></picture></div>';
  await page.setContent('<html><style>body{margin:0;display:flex;align-items:center;justify-content:space-around;height:320px;background:#122630;color:#e6d1aa;font:14px Georgia}div{text-align:center;width:200px}img{display:block;margin:16px auto}</style><body>'+picture('Book keepsake',58,70)+picture('Wish portal',75,91)+picture('Detail',140,170)+'</body></html>');
  await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));
  await page.waitForFunction(expected=>[...document.images].every(i=>i.currentSrc===expected),reduced?still:art);
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
