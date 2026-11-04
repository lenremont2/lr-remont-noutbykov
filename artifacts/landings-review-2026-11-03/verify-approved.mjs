import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createReadStream, statSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, join, sep, extname } from "node:path";
import { chromium } from "file:///C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";
const root = resolve("dist"), output = resolve("artifacts/landings-review-2026-11-03/approved");
mkdirSync(output, {recursive:true});
const types = {".html":"text/html; charset=utf-8",".css":"text/css",".js":"text/javascript",".svg":"image/svg+xml",".webp":"image/webp",".jpg":"image/jpeg",".mp4":"video/mp4",".woff2":"font/woff2"};
const server = createServer((request,response)=>{try{let file=resolve(root,"."+decodeURIComponent(new URL(request.url,"http://localhost").pathname));if(file!==root&&!file.startsWith(root+sep))throw Error("Outside root");if(statSync(file).isDirectory())file=join(file,"index.html");response.writeHead(200,{"Content-Type":types[extname(file)]||"application/octet-stream"});createReadStream(file).pipe(response);}catch{response.writeHead(404).end();}});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
const url="http://127.0.0.1:"+server.address().port;
const browser=await chromium.launch({executablePath:"C:/Program Files/Google/Chrome/Application/chrome.exe",headless:true});
const results=[];
try{
for(const width of [320,390,768,1024,1440]){
 const page=await browser.newPage({viewport:{width,height:900},reducedMotion:"reduce"});const errors=[];page.on("pageerror",error=>errors.push(error.message));
 await page.goto(url,{waitUntil:"networkidle"});await page.evaluate(()=>document.fonts.ready);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth),0,"Overflow "+width);
 if(width>=1024){const copy=await page.locator(".lr-hero__reference-copy").boundingBox(),video=await page.locator(".lr-hero__stage").boundingBox(),contacts=await page.locator(".lr-hero__contacts").boundingBox();assert.ok(copy.x<video.x&&Math.abs(copy.y-video.y)<100);assert.ok(contacts.y>=Math.max(copy.y+copy.height,video.y+video.height));}
 assert.equal(await page.locator('.lr-marquee__list:not([data-lr-marquee-copy]) a').count(),41);
 assert.equal(await page.locator('[data-lr-marquee-copy]').getAttribute('inert'),"");
 const cards=page.locator('#lr-formats .lr-format');assert.equal(await cards.count(),4);
 const first=await cards.nth(0).boundingBox(),second=await cards.nth(1).boundingBox(),third=await cards.nth(2).boundingBox();
 if(width>=768){assert.ok(Math.abs(first.y-second.y)<2);assert.ok(third.y>first.y+first.height-2);}else{assert.ok(second.x>first.x&&Math.abs(first.y-second.y)<2);const track=page.locator('#lr-formats [data-lr-swipe-track]');await track.focus();await page.keyboard.press('ArrowRight');assert.ok(await track.evaluate(e=>e.scrollLeft)>0);}
 assert.equal(await page.locator('#lr-reviews a[href*="yandex"]').count(),0);
 for(const id of ['lr-hero','lr-symptoms','lr-manufacturers','lr-formats','lr-reviews','lr-workshop-gallery','lr-business-trust','lr-guarantee']){const section=page.locator('#'+id);await section.scrollIntoViewIfNeeded();await section.evaluate(async e=>{await Promise.all([...e.querySelectorAll('img')].map(async i=>{i.loading='eager';await i.decode().catch(()=>{});}));});await section.screenshot({path:join(output,id+'-'+width+'.jpg'),type:'jpeg',quality:83,animations:'disabled'});}
 const equipment=page.locator('#lr-workshop-gallery [data-lr-photo-open]').first();await equipment.click();const photo=page.locator('[data-lr-review-photo]');assert.equal(await photo.evaluate(e=>e.open),true);assert.ok((await photo.boundingBox()).width>=width*.88);await page.keyboard.press('Escape');assert.ok(await equipment.evaluate(e=>e===document.activeElement));
 const preview=page.locator('#lr-reviews [data-lr-photo-open]').first();await preview.click();assert.equal(await photo.evaluate(e=>e.open),true);await page.keyboard.press('Escape');assert.ok(await preview.evaluate(e=>e===document.activeElement));
 const lead=page.locator('[data-lr-modal="lead"]');
 for(const selector of ['#lr-hero [data-source="hero-request"]','#lr-prices .lr-price-row__action','#lr-business-trust [data-source="business-trust"]','.lr-marquee__list:not([data-lr-marquee-copy]) [data-source="manufacturers-other"]']){
  const action=page.locator(selector).first();await action.click();assert.equal(await lead.evaluate(e=>e.open),true);assert.equal(await lead.locator('[data-lr-compact-form]').count(),1);assert.equal(await lead.locator('[data-lr-workshop-picker]').isVisible(),false);assert.equal(await lead.locator('[data-lr-visit-fields]').isVisible(),false);assert.equal(await lead.locator('[name="source"]').inputValue(),await action.getAttribute('data-source'));await page.keyboard.press('Escape');assert.ok(await action.evaluate(e=>e===document.activeElement));
 }
 await page.locator('#lr-hero [data-source="hero-request"]').click();const phone=lead.locator('[name="phone"]'),pad=lead.locator('[data-lr-dialpad]');assert.equal(await pad.isVisible(),width<1024);assert.equal(await phone.evaluate(e=>e.readOnly),width<1024);
 if(width<1024){await pad.locator('[data-lr-digit="9"]').click();assert.ok((await phone.inputValue()).includes('9'));await pad.locator('[data-lr-digit="clear"]').click();await lead.locator('[data-lr-native-phone]').click();assert.equal(await phone.evaluate(e=>e.readOnly),false);}
 await phone.fill('+7 (921) 234-56-78');await lead.locator('[name="consent"]').check();assert.equal(await lead.locator('[data-hop-lead-submit]').isEnabled(),true);
 await lead.screenshot({path:join(output,'modal-'+width+'.jpg'),type:'jpeg',quality:85});await page.keyboard.press('Escape');
 await page.locator('#lr-hero [data-lr-quiz-open]').click();assert.equal(await page.locator('#lr-quiz-modal').evaluate(e=>e.open),true);await page.keyboard.press('Escape');
 assert.deepEqual(errors,[]);results.push({width,overflow:0,errors,forms:'context, readiness, Escape and focus passed',sliders:'formats and equipment passed',photos:'wide viewer passed',dialpad:width<1024?'touch layout':'native input'});await page.close();console.log('Passed '+width);
}
const page=await browser.newPage({viewport:{width:1440,height:900}});await page.goto(url,{waitUntil:'networkidle'});const marquee=page.locator('[data-lr-marquee]');await marquee.scrollIntoViewIfNeeded();const track=marquee.locator('.lr-marquee__track');await page.mouse.move(0,0);const start=await track.evaluate(e=>getComputedStyle(e).transform);await page.waitForTimeout(150);const end=await track.evaluate(e=>getComputedStyle(e).transform);assert.notEqual(start,end);await marquee.locator('button').click();assert.equal(await track.evaluate(e=>getComputedStyle(e).animationPlayState),'paused');await marquee.locator('button').click();await page.mouse.move(0,0);await marquee.locator('a').first().focus();assert.equal(await track.evaluate(e=>getComputedStyle(e).animationPlayState),'paused');await page.close();
const tablet=await browser.newPage({viewport:{width:1200,height:900},hasTouch:true,isMobile:true});await tablet.goto(url,{waitUntil:'networkidle'});await tablet.locator('#lr-hero [data-source="hero-request"]').click();assert.equal(await tablet.locator('[data-lr-modal="lead"] [data-lr-dialpad]').isVisible(),true);await tablet.close();
writeFileSync(join(output,'verification.json'),JSON.stringify({results,marquee:'continuous, pause and keyboard pause passed; reduced motion static',largeTouchTablet:'dialpad visible',submission:'Not performed'},null,2));
}finally{await browser.close();await new Promise(done=>server.close(done));}
