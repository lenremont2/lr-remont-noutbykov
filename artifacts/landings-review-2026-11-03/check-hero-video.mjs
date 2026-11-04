import { chromium } from "file:///C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";
import { mkdirSync, writeFileSync } from "node:fs";
const out="artifacts/landings-review-2026-11-03/hero-video-check";mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:"C:/Program Files/Google/Chrome/Application/chrome.exe",headless:true});
const results=[];
try{for(const width of [320,390,768,1024,1440]){
const p=await browser.newPage({viewport:{width,height:900},hasTouch:width<1024,isMobile:width<500,reducedMotion:"no-preference"});const errors=[],requests=[];p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.url().includes('hero-van.mp4'))requests.push({status:r.status(),type:r.headers()['content-type']});});await p.goto('http://127.0.0.1:4322/',{waitUntil:'networkidle'});await p.addStyleTag({content:'astro-dev-toolbar{display:none!important}'});
const video=p.locator('[data-lr-hero-video]');await video.evaluate(v=>new Promise(resolve=>{if(v.readyState>=2)resolve();else{v.addEventListener('loadeddata',resolve,{once:true});setTimeout(resolve,5000);}}));
const initial=await video.evaluate(v=>v.currentTime);await p.waitForTimeout(1200);
const facts=await video.evaluate(v=>{const box=v.getBoundingClientRect(),stage=v.parentElement.getBoundingClientRect(),s=getComputedStyle(v);const ratio=v.videoWidth/v.videoHeight,target=box.width/box.height;return{paused:v.paused,muted:v.muted,loop:v.loop,playsInline:v.playsInline,controls:v.controls,readyState:v.readyState,error:v.error?.message??null,time:v.currentTime,duration:v.duration,natural:[v.videoWidth,v.videoHeight],box:[box.width,box.height],stage:[stage.width,stage.height],fit:s.objectFit,position:s.objectPosition,visibleFraction:Math.min(ratio/target,target/ratio),overflow:document.documentElement.scrollWidth-innerWidth};});
await p.locator('.lr-hero__stage').screenshot({path:`${out}/stage-${width}.jpg`,type:'jpeg',quality:90});
await p.locator('#lr-symptoms').scrollIntoViewIfNeeded();await p.waitForTimeout(150);const offscreenPaused=await video.evaluate(v=>v.paused);await video.scrollIntoViewIfNeeded();await p.waitForTimeout(150);const resumed=await video.evaluate(v=>!v.paused);
results.push({width,...facts,advancing:facts.time>initial,offscreenPaused,resumed,requests,errors});await p.close();
}
const p=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});await p.goto('http://127.0.0.1:4322/',{waitUntil:'networkidle'});results.push({reducedMotion:await p.locator('[data-lr-hero-video]').evaluate(v=>({paused:v.paused,autoplay:v.autoplay,time:v.currentTime,poster:v.poster}))});await p.close();
writeFileSync(`${out}/evidence.json`,JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
}finally{await browser.close();}
