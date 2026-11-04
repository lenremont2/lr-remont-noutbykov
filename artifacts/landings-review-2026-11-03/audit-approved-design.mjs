import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { chromium } from "file:///C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";
const output = resolve("artifacts/landings-review-2026-11-03/comparison/design-review");
mkdirSync(output,{recursive:true});
const browser = await chromium.launch({executablePath:"C:/Program Files/Google/Chrome/Application/chrome.exe",headless:true});
const url = "http://127.0.0.1:4322/";
const ids = ["lr-hero","lr-symptoms","lr-manufacturers","lr-formats","lr-reviews","lr-workshop-gallery","lr-business-trust","lr-guarantee"];
const results = [];
try {
 for (const width of [390,1440,320]) {
  const height = width===1440?900:width===390?844:740;
  const page = await browser.newPage({viewport:{width,height},hasTouch:width<500,isMobile:width<500,reducedMotion:"reduce"});
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  const response=await page.goto(url,{waitUntil:"networkidle"});await page.addStyleTag({content:'astro-dev-toolbar{display:none!important}'});await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:join(output,"fold-"+width+".jpg"),type:"jpeg",quality:85});
  const sections=[];
  for(const id of ids) {
   const section=page.locator("#"+id);await section.scrollIntoViewIfNeeded();
   await section.evaluate(async e=>{await Promise.all([...e.querySelectorAll("img")].map(async image=>{image.loading="eager";await image.decode().catch(()=>{});}));});
   await section.screenshot({path:join(output,id+"-"+width+".jpg"),type:"jpeg",quality:85,animations:"disabled"});
   sections.push(await section.evaluate(e=>({id:e.id,height:Math.round(e.getBoundingClientRect().height),heading:[...e.querySelectorAll("h2")].slice(0,2).map(h=>({text:h.textContent.trim(),size:getComputedStyle(h).fontSize})),clipped:[...e.querySelectorAll("h2,h3,p,strong")].filter(n=>n.scrollWidth>n.clientWidth+2&&n.clientWidth>0).map(n=>({tag:n.tagName,text:n.textContent.trim().slice(0,110),width:n.clientWidth,scroll:n.scrollWidth}))})));
  }
  const state=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-innerWidth,bullets:document.querySelectorAll(".lr-hero__benefit").length,brands:document.querySelectorAll(".lr-marquee__list:not([inert]) a").length,yandexLinks:document.querySelectorAll('#lr-reviews a[href*="yandex"]').length,equipment:document.querySelectorAll(".lr-equipment-reference__card").length,terms:document.querySelectorAll(".lr-business-card__terms li").length,guarantees:document.querySelectorAll(".lr-home-protection__facts article").length,formatRows:[...document.querySelectorAll("#lr-formats .lr-format")].map(e=>({x:Math.round(e.getBoundingClientRect().x),y:Math.round(e.getBoundingClientRect().y)}))}));
  await page.locator('#lr-hero [data-source="hero-request"]').click();const modal=page.locator('[data-lr-modal="lead"]');
  const modalState=await modal.evaluate(e=>{const form=e.querySelector("form"),phone=form.elements.phone,pad=form.querySelector('[data-lr-dialpad]'),submit=form.querySelector('[data-hop-lead-submit]');return {width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height,scrollHeight:e.scrollHeight,viewportHeight:innerHeight,numpadVisible:!pad.hidden,readOnly:phone.readOnly,submitDisabled:submit.disabled,submitBottom:submit.getBoundingClientRect().bottom,visibleFields:[...form.querySelectorAll('input,select')].filter(n=>n.getClientRects().length&&n.type!=='hidden').map(n=>n.name)};});
  await modal.screenshot({path:join(output,"modal-"+width+".jpg"),type:"jpeg",quality:85});
  await page.keyboard.press("Escape");
  const photo=page.locator('#lr-reviews a[href="/media/review-ds-imac-2023.jpg"]');await photo.click();
  const dialog=page.locator('[data-lr-review-photo]');await dialog.locator('img').evaluate(i=>i.decode());
  const photoState=await dialog.evaluate(e=>{const i=e.querySelector('img');return {dialogWidth:e.getBoundingClientRect().width,imageWidth:i.getBoundingClientRect().width,imageHeight:i.getBoundingClientRect().height,naturalWidth:i.naturalWidth,naturalHeight:i.naturalHeight,src:i.getAttribute('src')};});
  await dialog.screenshot({path:join(output,"photo-"+width+".jpg"),type:"jpeg",quality:82});await page.keyboard.press('Escape');
  const savedFocus=await photo.evaluate(e=>e===document.activeElement);
  const thumbnails=await page.locator('#lr-reviews .lr-review__photo').evaluateAll(links=>links.slice(0,3).map(a=>{const card=a.closest('article'),i=a.querySelector('img'),s=getComputedStyle(card);return {src:i.getAttribute('src'),cardWidth:card.getBoundingClientRect().width,contentWidth:card.clientWidth-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight),linkWidth:a.getBoundingClientRect().width,linkHeight:a.getBoundingClientRect().height,imageWidth:i.getBoundingClientRect().width,imageHeight:i.getBoundingClientRect().height,naturalWidth:i.naturalWidth,naturalHeight:i.naturalHeight};}));
  results.push({width,height,status:response.status(),state,sections,modalState,photoState,thumbnails,savedFocus,errors});await page.close();console.log("Audited "+width);
 }
 const motion=await browser.newPage({viewport:{width:1440,height:900}});await motion.goto(url,{waitUntil:'networkidle'});const marquee=motion.locator('[data-lr-marquee]');await marquee.scrollIntoViewIfNeeded();await motion.mouse.move(0,0);
 const movement=await marquee.evaluate(async e=>{const track=e.querySelector('.lr-marquee__track'),animation=track.getAnimations()[0],viewport=e.querySelector('.lr-marquee__viewport'),first=e.querySelector('.lr-marquee__list'),other=first.lastElementChild;const duration=Number(animation.effect.getTiming().duration),groupWidth=first.getBoundingClientRect().width;const firstOtherMs=Math.max(0,(other.offsetLeft-viewport.clientWidth)/groupWidth)*duration;animation.pause();animation.currentTime=duration*.985;await new Promise(requestAnimationFrame);const bounds=viewport.getBoundingClientRect();const copies=[...e.querySelectorAll('[inert] a')].map(a=>({a,r:a.getBoundingClientRect()}));const match=copies.find(({r})=>r.left>bounds.left+3&&r.right<bounds.right-3);if(!match)return {firstOtherMs,groupWidth,visibleInert:false};const x=match.r.x+match.r.width/2,y=match.r.y+match.r.height/2;const target=document.elementFromPoint(x,y);return {firstOtherMs,groupWidth,duration,visibleInert:true,label:match.a.textContent.trim(),href:match.a.getAttribute('href'),x,y,hitTag:target?.tagName,hitClass:target?.className,hitLink:target?.closest('a')?.getAttribute('href')??null};});
 await marquee.screenshot({path:join(output,'marquee-inert.jpg'),type:'jpeg',quality:85});const before=motion.url();if(movement.x){await motion.mouse.click(movement.x,movement.y);await motion.waitForTimeout(120);movement.navigated=motion.url()!==before;}await motion.close();
 const desktop=await browser.newPage({viewport:{width:768,height:900},hasTouch:false,isMobile:false});await desktop.goto(url,{waitUntil:'networkidle'});await desktop.locator('#lr-hero [data-source="hero-request"]').click();const narrowDesktop=await desktop.evaluate(()=>({coarse:matchMedia('(pointer: coarse)').matches,hover:matchMedia('(hover: hover)').matches,numpadVisible:!document.querySelector('[data-lr-modal="lead"] [data-lr-dialpad]').hidden,readOnly:document.querySelector('[data-lr-modal="lead"] [name="phone"]').readOnly}));await desktop.locator('[data-lr-modal="lead"]').screenshot({path:join(output,'modal-desktop-768.jpg'),type:'jpeg',quality:85});await desktop.close();
 writeFileSync(join(output,'evidence.json'),JSON.stringify({url,results,movement,narrowDesktop,submission:'Not performed'},null,2));console.log(JSON.stringify({movement,narrowDesktop}));
} finally {await browser.close();}
