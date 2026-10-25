import { test, expect, type Page } from '@playwright/test';
import spaces from '../../src/lib/cube-spaces.json';
async function ready(page:Page) {
 await page.goto('/');
 await page.waitForFunction(() => [...document.querySelectorAll<HTMLImageElement>('.cs-scene-image')].length===5 && [...document.querySelectorAll<HTMLImageElement>('.cs-scene-image')].every(image => image.complete && image.naturalWidth > 0));
}
async function seek(page:Page,p:number) {
 await page.getByRole('slider',{name:'Смена интерьеров'}).fill(String(p*1000));
 await expect.poll(()=>page.locator('.cs-hero').getAttribute('data-progress')).toBe(p.toFixed(5));
}
test('five still interiors blend with scroll, restore in reverse and release the sticky hero',async({page})=>{
 const errors:string[]=[]; const videoRequests:string[]=[];
 page.on('pageerror',e=>errors.push(e.message)); page.on('request',r=>{if(/\.mp4/.test(r.url()))videoRequests.push(r.url());});
 await ready(page);await expect(page.locator('video')).toHaveCount(0);
 for(let i=0;i<spaces.length;i++) {
  await page.locator('.cs-types button').nth(i).click();
  await expect(page.locator('.cs-hero')).toHaveAttribute('data-scene',spaces[i].id);
  await expect.poll(()=>page.locator('.cs-scene-image').nth(i).evaluate(e=>Number(getComputedStyle(e).opacity))).toBe(1);
 }
 await seek(page,.125);
 await expect.poll(()=>page.locator('.cs-scene-image').nth(1).evaluate(e=>Number(getComputedStyle(e).opacity))).toBeCloseTo(.407,2);
 const mid=await page.locator('.cs-scene-image').evaluateAll(images=>images.map(e=>getComputedStyle(e).opacity));
 await seek(page,1);await seek(page,.125);
 expect(await page.locator('.cs-scene-image').evaluateAll(images=>images.map(e=>getComputedStyle(e).opacity))).toEqual(mid);
 await seek(page,0);
 const dimensions=await page.locator('.cs-track').evaluate(e=>({top:e.getBoundingClientRect().top+scrollY,length:e.clientHeight-innerHeight}));
 await page.evaluate(({top,length})=>window.scrollTo({top:top+length*.75,behavior:'instant'}),dimensions);
 await expect(page.locator('.cs-hero')).toHaveAttribute('data-scene','clinic');
 expect((await page.locator('.cs-hero').boundingBox())!.y).toBeCloseTo(0,0);
 await page.evaluate(({top,length})=>window.scrollTo({top:top+length+450,behavior:'instant'}),dimensions);
 expect((await page.locator('.cs-hero').boundingBox())!.y).toBeLessThan(0);
 expect(videoRequests).toEqual([]);expect(errors).toEqual([]);
});
test('pointer gently tilts the shared plane and leaving returns to rest',async({page})=>{
 await ready(page);
 const plane=page.locator('.cs-scene-plane');
 const rest=await plane.evaluate(e=>getComputedStyle(e).transform);
 const glowRest=await page.locator('.cs-scene-glow').evaluate(e=>getComputedStyle(e).transform);
 await page.mouse.move(1300,250);
 await expect.poll(()=>plane.evaluate(e=>getComputedStyle(e).transform)).not.toBe(rest);
 await expect.poll(()=>page.locator('.cs-scene-glow').evaluate(e=>getComputedStyle(e).transform)).not.toBe(glowRest);
 await expect(page.locator('.cs-hero')).toHaveAttribute('data-progress','0.00000');
 await page.locator('.cs-hero').dispatchEvent('pointerleave');
 await expect.poll(()=>plane.evaluate(e=>getComputedStyle(e).transform)).toBe(rest);
});
test('mobile reduced motion supports keyboard selection without pointer or scroll animation',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});await ready(page);
 await expect(page.locator('.cs-track')).toHaveClass(/is-reduced/);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole('button',{name:'Открыть меню'}).click();await expect(page.getByRole('navigation',{name:'Основная навигация'})).toBeVisible();
 await page.getByRole('button',{name:'Закрыть меню'}).click();
 const slider=page.getByRole('slider');await expect(slider).toBeInViewport();await slider.focus();await page.keyboard.press('End');
 await expect(page.locator('.cs-hero')).toHaveAttribute('data-scene','hotel');
 await page.keyboard.press('Home');await expect(page.locator('.cs-hero')).toHaveAttribute('data-scene','cafe');
 const reducedTransform=await page.locator('.cs-scene-plane').evaluate(e=>getComputedStyle(e).transform);
 await page.mouse.move(300,400);expect(await page.locator('.cs-scene-plane').evaluate(e=>getComputedStyle(e).transform)).toBe(reducedTransform);
 await page.evaluate(()=>scrollTo({top:500,behavior:'instant'}));await page.waitForTimeout(200);
 await expect(page.locator('.cs-hero')).toHaveAttribute('data-progress','0.00000');
});
test('FP Group identity, company facts, services and contacts come from the presentation',async({page})=>{
 await ready(page);
 await expect(page.locator('.cs-brand img')).toHaveCount(2);
 await page.getByRole('link',{name:/Наши направления/}).click();
 await page.getByRole('button',{name:/Место встречи/}).click();await expect(page.getByRole('dialog')).toBeVisible();
 await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).not.toBeVisible();
 await page.locator('#services').scrollIntoViewIfNeeded();await page.locator('summary').filter({hasText:'Мебель и обстановка'}).click();
 await expect(page.getByText(/Изготавливаем мебель на собственном производстве/)).toBeVisible();
 await expect(page.locator('.cs-company-facts')).toContainText('100+');
 await expect(page.locator('.cs-contact-details a').first()).toHaveAttribute('href','tel:+79509343388');
 await expect(page.getByRole('link',{name:'proekt@fp-g.ru'})).toHaveAttribute('href','mailto:proekt@fp-g.ru');
});

test('all five cutouts have transparent canvas edges and contain visible architecture',async({page})=>{
 await ready(page);
 const alpha=await page.locator('.cs-scene-image').evaluateAll(images=>images.map(element=>{
  const image=element as HTMLImageElement, canvas=document.createElement('canvas');
  canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
  const ctx=canvas.getContext('2d')!;ctx.drawImage(image,0,0);
  return {corner:ctx.getImageData(0,0,1,1).data[3],center:ctx.getImageData(Math.floor(canvas.width/2),Math.floor(canvas.height/2),1,1).data[3]};
 }));
 for(const sample of alpha){expect(sample.corner).toBe(0);expect(sample.center).toBeGreaterThan(245);}
});
