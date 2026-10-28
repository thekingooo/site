const { chromium }=require('playwright');
const fs=require('fs');
const path=require('path');
const {pathToFileURL}=require('url');
const root=path.resolve(__dirname,'..');
const qaDir=process.env.FLIGHT_QA_DIR||path.join(root,'test-results/flight-preview');
fs.mkdirSync(qaDir,{recursive:true});
const baseURL=process.env.FLIGHT_URL||'http://127.0.0.1:3335/index.html';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(baseURL);await page.waitForTimeout(500);
 await page.screenshot({path:path.join(qaDir,'final-desktop.png')});
 await page.mouse.wheel(0,1);await page.waitForFunction(()=>window.fpFlight.state==='playing');
 for(let i=0;i<80;i++){await page.mouse.wheel(0,100);await page.waitForTimeout(50);}
 await page.waitForTimeout(600);let state=await page.evaluate(()=>window.fpFlight);if(state.room!==1||state.busy)throw Error('Continuous wheel crossed multiple rooms');
 await page.screenshot({path:path.join(qaDir,'final-restaurant.png')});
 await page.mouse.wheel(0,-1);await page.waitForFunction(()=>window.fpFlight.busy);await page.waitForFunction(()=>!window.fpFlight.busy);if((await page.evaluate(()=>window.fpFlight.room))!==0)throw Error('Reverse wrong');
 await page.waitForTimeout(300);await page.keyboard.press('ArrowDown');await page.waitForFunction(()=>window.fpFlight.busy);await page.waitForFunction(()=>!window.fpFlight.busy);if((await page.evaluate(()=>window.fpFlight.room))!==1)throw Error('Keyboard wrong');
 for(let n=2;n<=4;n++){await page.locator('#flight-next').click();await page.waitForFunction(n=>!window.fpFlight.busy&&window.fpFlight.room===n,n);}
 await page.waitForTimeout(700);await page.screenshot({path:path.join(qaDir,'final-hotel.png')});
 await page.locator('#flight-next').click();await page.waitForTimeout(1300);if((await page.evaluate(()=>scrollY))<800)throw Error('Did not exit');
 // Returning from lower sections preserves the last room and re-arms the hero.
 await page.locator('.lm-brand').click();await page.waitForTimeout(1300);await page.mouse.wheel(0,-1);await page.waitForFunction(()=>window.fpFlight.busy);await page.waitForFunction(()=>!window.fpFlight.busy);if((await page.evaluate(()=>window.fpFlight.room))!==3)throw Error('Return from lower page wrong');
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await mobile.goto(baseURL);await mobile.waitForTimeout(500);
 await mobile.screenshot({path:path.join(qaDir,'final-mobile.png')});
 const cdp=await mobile.context().newCDPSession(mobile);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:220,y:620}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:220,y:450}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await mobile.waitForFunction(()=>window.fpFlight.busy);await mobile.waitForFunction(()=>!window.fpFlight.busy);await mobile.waitForTimeout(700);
 if((await mobile.evaluate(()=>window.fpFlight.room))!==1)throw Error('Swipe failed');
 await mobile.screenshot({path:path.join(qaDir,'final-mobile-restaurant.png')});
 const reduced=await browser.newPage({viewport:{width:320,height:700},reducedMotion:'reduce'});await reduced.goto(baseURL);await reduced.mouse.wheel(0,1);await reduced.waitForFunction(()=>window.fpFlight.room===1);
 if(!(await reduced.evaluate(()=>window.fpFlight.reduced&&document.getElementById('flight-still').src.includes('original-1'))))throw Error('Reduced motion wrong');
 if((await reduced.evaluate(()=>document.documentElement.scrollWidth>innerWidth)))throw Error('320 overflow');
 await reduced.screenshot({path:path.join(qaDir,'reduced-320.png')});
 const failed=await browser.newPage({viewport:{width:1280,height:800}});await failed.route('**/*.mp4',r=>r.abort());await failed.goto(baseURL);await failed.waitForTimeout(500);await failed.mouse.wheel(0,1);await failed.waitForFunction(()=>window.fpFlight.room===1&&!window.fpFlight.busy);if(!(await failed.locator('#flight-status').textContent()).includes('недоступно'))throw Error('No failure fallback');
 let fileOk='not tested';
 try {
  const file=await browser.newPage({viewport:{width:1280,height:800}});await file.goto(pathToFileURL(path.join(root,'public/flight-preview/index.html')).href);await file.locator('#flight-next').click();await file.waitForFunction(()=>window.fpFlight.busy);await file.waitForFunction(()=>!window.fpFlight.busy);fileOk=await file.evaluate(()=>window.fpFlight.room===1&&!document.getElementById('flight-status').textContent.includes('недоступно'));if(!fileOk)throw Error('file URL video failed');
 } catch(e) { if(!e.message.includes('ERR_BLOCKED_BY_ADMINISTRATOR'))throw e;fileOk='blocked by managed browser file URL policy'; }
 fs.writeFileSync(path.join(qaDir,'final-results.json'),JSON.stringify({passed:true,errors,continuousWheelOneRoom:true,reverse:true,keyboard:true,touchSwipe:true,exitAndReenter:true,reducedMotion:true,failedMediaFallback:true,fileProtocol:fileOk},null,2));
 console.log('Final tests passed',errors);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
