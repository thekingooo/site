import { test, expect, type Page } from '@playwright/test';
async function ready(page:Page){await page.goto('/');await page.waitForFunction(()=>{const v=document.querySelector('video');return v&&v.readyState>=2;});}
async function seek(page:Page,p:number){
 await page.getByRole('slider',{name:'Вращение пространства'}).fill(String(p*1000));
 await expect.poll(()=>page.locator('video').evaluate((v: HTMLVideoElement)=>v.currentTime)).toBeCloseTo(Math.round(p*123)/24,4);
 await expect.poll(()=>page.locator('video').evaluate((v: HTMLVideoElement)=>v.seeking)).toBe(false);
}
async function frame(page:Page){return page.locator('video').evaluate((v: HTMLVideoElement)=>{const canvas=document.createElement('canvas');canvas.width=v.videoWidth;canvas.height=v.videoHeight;canvas.getContext('2d')!.drawImage(v,0,0);return canvas.toDataURL();});}
test('scroll scrubs the provided video forwards and backwards without playback or audio',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await ready(page);
 const initial=await frame(page);
 await seek(page,.5);const middle=await frame(page);
 expect(middle).not.toBe(initial);
 await seek(page,1);await seek(page,.5);expect(await frame(page)).toBe(middle);
 await seek(page,0);expect(await frame(page)).toBe(initial);
 expect(await page.locator('video').evaluate((v: HTMLVideoElement)=>({muted:v.muted,paused:v.paused,autoplay:v.autoplay}))).toEqual({muted:true,paused:true,autoplay:false});
 await page.waitForTimeout(300);expect(await page.locator('video').evaluate((v: HTMLVideoElement)=>v.currentTime)).toBe(0);
 const dimensions=await page.locator('.cs-track').evaluate(e=>({top:e.getBoundingClientRect().top+scrollY,length:e.clientHeight-innerHeight}));
 await page.evaluate(({top,length})=>window.scrollTo({top:top+length*.7,behavior:'instant'}),dimensions);
 await expect.poll(()=>page.locator('video').evaluate((v: HTMLVideoElement)=>v.currentTime)).toBeCloseTo(Math.round(.7*123)/24,2);
 expect((await page.locator('.cs-hero').boundingBox())!.y).toBeCloseTo(0,0);
 await page.evaluate(({top,length})=>window.scrollTo({top:top+length+450,behavior:'instant'}),dimensions);
 await expect(page.locator('#projects')).toBeInViewport();expect((await page.locator('.cs-hero').boundingBox())!.y).toBeLessThan(0);
 expect(errors).toEqual([]);
});
test('mobile reduced motion keeps the scene still and supports accessible frame selection',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});await ready(page);
 await expect(page.locator('.cs-track')).toHaveClass(/is-reduced/);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole('button',{name:'Открыть меню'}).click();await expect(page.getByRole('navigation',{name:'Основная навигация'})).toBeVisible();
 await page.getByRole('button',{name:'Закрыть меню'}).click();
 const slider=page.getByRole('slider');await expect(slider).toBeInViewport();await slider.focus();await page.keyboard.press('End');
 await expect.poll(()=>page.locator('video').evaluate((v: HTMLVideoElement)=>v.currentTime)).toBe(5.125);
 await page.keyboard.press('Home');await expect.poll(()=>page.locator('video').evaluate((v: HTMLVideoElement)=>v.currentTime)).toBe(0);
 await page.evaluate(()=>scrollTo({top:500,behavior:'instant'}));await page.waitForTimeout(200);
 expect(await page.locator('video').evaluate((v: HTMLVideoElement)=>v.currentTime)).toBe(0);
});
test('example navigation, project dialog, services and local brief are usable',async({page})=>{
 await ready(page);await page.getByRole('link',{name:/Смотреть проекты/}).click();
 await page.getByRole('button',{name:/Место встречи/}).click();await expect(page.getByRole('dialog')).toBeVisible();
 await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).not.toBeVisible();
 await page.locator('#services').scrollIntoViewIfNeeded();await page.locator('summary').filter({hasText:'Инженерия'}).click();
 await expect(page.getByText('Соединяем климат, свет и коммуникации в единую систему.')).toBeVisible();
 await page.locator('#contact').scrollIntoViewIfNeeded();await page.getByLabel('Как к вам обращаться').fill('Тест');await page.getByLabel('Контакт для связи').fill('test@example.com');await page.getByLabel('Ваша идея').fill('Пример задачи');
 const requests:string[]=[];page.on('request',r=>{if(r.method()==='POST')requests.push(r.url());});
 const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'Сохранить бриф'}).click();
 expect((await downloaded).suggestedFilename()).toBe('project-brief.txt');expect(requests).toEqual([]);
 await expect(page.locator('.cs-brief-success')).toContainText('Бриф подготовлен');
});
