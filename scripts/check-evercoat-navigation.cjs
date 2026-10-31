const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const url=process.env.EVERCOAT_URL||'http://127.0.0.1:3340';
const dir=process.env.EVERCOAT_QA_DIR||path.join(__dirname,'../test-results/evercoat-navigation');fs.mkdirSync(dir,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[],results=[];
 page.on('pageerror',error=>errors.push(error.message));await page.goto(url);await page.evaluate(()=>document.fonts.ready);
 assert.ok(Math.abs(await page.locator('.header').evaluate(el=>el.getBoundingClientRect().height)-79.9)<.1);
 const checkbox=page.getByRole('checkbox',{name:'Без анимации'});
 const order=await page.locator('#flight-motion-label').evaluate(el=>{const box=el.querySelector('.motion-box').getBoundingClientRect(),text=el.firstElementChild.getBoundingClientRect();return box.left>text.right;});assert.ok(order);
 await page.evaluate(()=>{window.played=[];document.querySelectorAll('.flight-film').forEach(player=>player.addEventListener('playing',()=>window.played.push(player.getAttribute('src'))));});
 async function navigate(index){await page.locator('.flight-route>button').nth(index).click();await page.waitForFunction(index=>window.fpFlight.room===index&&!window.fpFlight.busy,index);assert.equal(await page.locator('.flight-route>button').nth(index).getAttribute('aria-current'),'step');}
 async function frameState(){return page.locator('#flight-still').evaluate(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return{src:el.currentSrc,x:r.x,y:r.y,w:r.width,h:r.height,fit:s.objectFit,position:s.objectPosition,transform:s.transform};});}
 for(const index of [2,4,0,1,3]){
  await navigate(index);const before=await frameState();await checkbox.check();assert.deepEqual(await frameState(),before);await checkbox.uncheck();assert.deepEqual(await frameState(),before);results.push({room:index,sameFrame:true});
 }
 const played=await page.evaluate(()=>window.played);
 const clips=played.filter((clip,i)=>i===0||clip!==played[i-1]);
 assert.deepEqual(clips.slice(0,4),['media/forward-0.mp4','media/forward-1.mp4','media/forward-2.mp4','media/forward-3.mp4']);
 assert.deepEqual(clips.slice(4,8),['media/reverse-3.mp4','media/reverse-2.mp4','media/reverse-1.mp4','media/reverse-0.mp4']);
 await checkbox.check();await navigate(0);assert.equal(await page.evaluate(()=>window.played.length),played.length);await checkbox.uncheck();
 await page.screenshot({path:path.join(dir,'hero.png')});
 assert.equal(await page.locator('#spaces img,#spaces figure,#spaces .image-credit').count(),0);
 assert.ok(await page.locator('#spaces').evaluate(el=>el.offsetHeight<500));
 assert.deepEqual(await page.locator('.project-meta span:first-child').allTextContents(),['БАР','КОФЕЙНЯ','СТОМАТОЛОГИЯ','КОФЕЙНЯ']);
 assert.deepEqual(await page.locator('.project-meta span:last-child').allTextContents(),['111 М²','215 М²','73 М²','168 М²']);
 for(const id of ['projects','spaces']){await page.locator('#'+id).evaluate(el=>el.scrollIntoView({behavior:'instant'}));await page.waitForTimeout(650);await page.screenshot({path:path.join(dir,id+'.png')});}
 await page.evaluate(()=>{const s=document.getElementById('process');scrollTo({top:scrollY+s.getBoundingClientRect().top-document.querySelector('.header').getBoundingClientRect().height,behavior:'instant'});});
 await page.waitForFunction(()=>!window.fpJourney.busy&&window.fpJourney.step===0);
 await page.mouse.move(700,440);
 async function waitArrival(index){await page.waitForFunction(index=>!window.fpJourney.busy&&window.fpJourney.step===index&&Math.abs(window.fpJourney.distance-window.fpJourney.stops[index])<.01,index);}
 await page.waitForTimeout(350);await page.mouse.wheel(0,1);await page.waitForFunction(()=>window.fpJourney.busy);await page.waitForTimeout(200);
 const middle=await page.evaluate(()=>window.fpJourney);assert.ok(middle.distance>middle.stops[0]&&middle.distance<middle.stops[1]);
 // A sustained input burst includes the inertial tail after animation completion.
 for(let i=0;i<12;i++){await page.mouse.wheel(0,20);await page.waitForTimeout(80);}
 await waitArrival(1);await page.waitForTimeout(350);await page.mouse.wheel(0,1);await waitArrival(2);
 await page.waitForTimeout(350);await page.mouse.wheel(0,-1);await waitArrival(1);
 for(let i=2;i<9;i++){await page.waitForTimeout(350);await page.mouse.wheel(0,1);await waitArrival(i);}
 const endY=await page.evaluate(()=>scrollY);await page.waitForTimeout(350);await page.mouse.wheel(0,180);await page.waitForTimeout(250);assert.ok(await page.evaluate(()=>scrollY)>endY);
 // Re-enter from below at the final stop, then make one reverse leg.
 await page.evaluate(()=>{const s=document.getElementById('process'),p=s.querySelector('.process-pin');scrollTo({top:scrollY+s.getBoundingClientRect().top-document.querySelector('.header').getBoundingClientRect().height+s.offsetHeight-p.offsetHeight,behavior:'instant'});});
 await page.waitForTimeout(350);await page.mouse.wheel(0,-1);await waitArrival(7);
 await page.waitForTimeout(200);await page.locator('.road-step[data-step="4"]').click();await waitArrival(4);
 await page.screenshot({path:path.join(dir,'process.png')});
 assert.equal(await page.locator('.journey-footer,#journey-counter,#journey-current').count(),0);
 for(const width of [320,390,640,768,900,1024,1440]){
  await page.setViewportSize({width,height:900});await page.waitForTimeout(250);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  const rows=await page.locator('.trust>div').evaluateAll(items=>{const rows=[];for(const el of items){const r=el.getBoundingClientRect();let row=rows.find(row=>Math.abs(row.top-r.top)<3);if(!row){row={top:r.top,left:r.left,right:r.right,count:0};rows.push(row);}row.left=Math.min(row.left,r.left);row.right=Math.max(row.right,r.right);row.count++;}return rows;});
  for(const row of rows)assert.ok(Math.abs((row.left+row.right)/2-width/2)<1.5,`Row not centered at ${width}`);
  results.push({width,rows:rows.map(row=>row.count)});
  if(width===390||width===900){await page.locator('.trust').scrollIntoViewIfNeeded();await page.locator('.trust').screenshot({path:path.join(dir,`trust-${width}.png`)});}
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(dir,'navigation-results.json'),JSON.stringify({passed:true,errors,played,results},null,2));console.log('PASS room buttons, identical static frames, stage gestures, compact section and centered facts');await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});
