'use strict';
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const concepts = [
 {id:'beauty', category:'Beauty & fragrance',title:'A scent beyond the ordinary.',product:'REVERIE · Fragrance',art:'perfume.svg',headline:'Bottle a\ndaydream.',description:'A sculptural fragrance floats through a world of soft pink light. An everyday ritual becomes a moment of escape.',scenes:['An everyday ritual.','A little imagination.','Bottle a daydream.']},
 {id:'lifestyle',category:'Food & lifestyle',title:'A fresh perspective.',product:'DAYBREAK · Sparkling refreshment',art:'can.svg',headline:'A little\nmore zest.',description:'A citrus-inspired sparkling drink takes center stage. Bright colors and a playful shift in scale make a simple refreshment extraordinary.',scenes:['Meet the everyday.','Add a little possibility.','A little more zest.']},
 {id:'tech',category:'Tech & innovation',title:'Tune into another world.',product:'FORM · Wireless audio',art:'headphones.svg',headline:'Feel\neverything.',description:'Silver headphones drift through a quiet, sculptural soundscape. The product becomes a portal to a world of your own.',scenes:['Turn down the noise.','Turn up your world.','Feel everything.']}
];
const grid = $('#showcase-grid');
function renderConcepts() {
 grid.innerHTML = concepts.map((c,index) => `<article class="work-card" aria-roledescription="slide" aria-label="${index+1} of ${concepts.length}"><div class="work-disc ${c.id}" aria-hidden="true"><div class="disc-art"><img src="assets/${c.art}" alt="" width="680" height="680" draggable="false"></div><span class="disc-hub"></span></div><button class="work-open" data-preview="${c.id}" aria-label="Preview ${c.title}" draggable="false"><div class="work-visual ${c.id}"><div class="work-cover"><img class="cover-wordmark" src="assets/openart-logo.svg" alt="" width="403" height="69" draggable="false"><img class="work-product" src="assets/${c.art}" alt="${c.product} concept illustration" width="680" height="680" draggable="false"><span class="work-caption">${c.headline.replace('\n','<br>')}</span></div></div><div class="work-meta"><h3>${c.title}</h3><p>${c.product}</p></div></button></article>`).join('');
}
renderConcepts();
const previousConcept=$('#carousel-prev'),nextConcept=$('#carousel-next');
const reducedCarouselMotion=matchMedia('(prefers-reduced-motion: reduce)');
const carouselCards=$$('.work-card',grid),carouselCounter=$('.carousel-counter');
let carouselStep=0,carouselLimit=0,lastCarouselIndex=-1;
function updateCarousel(){
 const left=grid.scrollLeft,index=Math.min(carouselCards.length-1,Math.round(left/(carouselStep||1)));
 if(index!==lastCarouselIndex){carouselCounter.textContent=String(index+1).padStart(2,'0')+' / '+String(carouselCards.length).padStart(2,'0');lastCarouselIndex=index;}
 const atStart=left<1,atEnd=carouselLimit-left<1;
 if(previousConcept.disabled!==atStart)previousConcept.disabled=atStart;
 if(nextConcept.disabled!==atEnd)nextConcept.disabled=atEnd;
}
function measureCarousel(){carouselStep=carouselCards[1].offsetLeft-carouselCards[0].offsetLeft;carouselLimit=Math.max(0,grid.scrollWidth-grid.clientWidth);updateCarousel();}
// The same engine and damping model as shader.se; one clock drives both axes.
const pageScroll=new Lenis({autoRaf:false,lerp:.1,smoothWheel:true,syncTouch:false,anchors:{onStart:resumeScrollClock},stopInertiaOnNavigate:true,prevent:element=>element.tagName==='DIALOG'||element.tagName==='TEXTAREA'||element.isContentEditable});
const railScroll=new Lenis({wrapper:grid,content:grid,autoRaf:false,orientation:'horizontal',gestureOrientation:'both',lerp:.1,smoothWheel:true,syncTouch:false,overscroll:true});
let scrollFrame=0;
function tickScroll(time){pageScroll.raf(time);railScroll.raf(time);scrollFrame=pageScroll.isScrolling==='smooth'||railScroll.isScrolling==='smooth'?requestAnimationFrame(tickScroll):0;}
function resumeScrollClock(){if(!scrollFrame){pageScroll.time=railScroll.time=0;scrollFrame=requestAnimationFrame(tickScroll);}}
addEventListener('wheel',resumeScrollClock,{passive:true});
addEventListener('keydown',event=>{if(!event.defaultPrevented&&['PageUp','PageDown','Home','End','ArrowUp','ArrowDown',' '].includes(event.key)&&!event.target.closest('input,textarea,select,button,[contenteditable]'))pageScroll.scrollTo(scrollY,{immediate:true});});
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(scrollFrame);scrollFrame=0;}else resumeScrollClock();});
function scrollCarouselTo(value,immediate=false){railScroll.scrollTo(Math.max(0,Math.min(carouselLimit,value)),{immediate:immediate||reducedCarouselMotion.matches});resumeScrollClock();}
function moveCarousel(direction){scrollCarouselTo(railScroll.targetScroll+direction*carouselStep);}
previousConcept.addEventListener('click',()=>moveCarousel(-1));nextConcept.addEventListener('click',()=>moveCarousel(1));
railScroll.on('scroll',updateCarousel);
grid.addEventListener('keydown',event=>{
 if(event.key==='ArrowRight'){event.preventDefault();moveCarousel(1);}
 else if(event.key==='ArrowLeft'){event.preventDefault();moveCarousel(-1);}
 else if(event.key==='Home'){event.preventDefault();scrollCarouselTo(0);}
 else if(event.key==='End'){event.preventDefault();scrollCarouselTo(carouselLimit);}
});
// Keep a float target in Lenis rather than reading rounded DOM scrollLeft back.
let drag=null,suppressClickUntil=0;
grid.addEventListener('pointerdown',event=>{
 if(event.pointerType!=='mouse'||event.button!==0)return;
 railScroll.scrollTo(grid.scrollLeft,{immediate:true});
 drag={id:event.pointerId,x:event.clientX,y:event.clientY,left:grid.scrollLeft,lastX:event.clientX,lastTime:event.timeStamp,velocity:0,active:false};
});
grid.addEventListener('pointermove',event=>{
 if(!drag||event.pointerId!==drag.id)return;
 const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
 if(!drag.active){if(Math.abs(dy)>8&&Math.abs(dy)>Math.abs(dx)){drag=null;return;}if(Math.abs(dx)<7)return;drag.active=true;grid.classList.add('is-dragging');grid.setPointerCapture(event.pointerId);}
 const elapsed=event.timeStamp-drag.lastTime;
 if(elapsed>0)drag.velocity=(drag.lastX-event.clientX)/elapsed;
 drag.lastX=event.clientX;drag.lastTime=event.timeStamp;
 event.preventDefault();scrollCarouselTo(drag.left-dx,true);
});
function finishCarouselDrag(event){
 if(!drag||event.pointerId!==drag.id)return;
 const gesture=drag;drag=null;grid.classList.remove('is-dragging');
 if(gesture.active){
  suppressClickUntil=performance.now()+250;
  if(grid.hasPointerCapture(gesture.id))grid.releasePointerCapture(gesture.id);
  if(event.type==='pointerup'&&event.timeStamp-gesture.lastTime<90&&!reducedCarouselMotion.matches)scrollCarouselTo(grid.scrollLeft+Math.max(-110,Math.min(110,gesture.velocity*90)));
 }
}
grid.addEventListener('pointerup',finishCarouselDrag);grid.addEventListener('pointercancel',finishCarouselDrag);
grid.addEventListener('lostpointercapture',()=>{drag=null;grid.classList.remove('is-dragging');});
grid.addEventListener('click',event=>{if(performance.now()<suppressClickUntil){event.preventDefault();event.stopImmediatePropagation();}},true);
grid.addEventListener('focusin',event=>{
 const card=event.target.closest('.work-card');if(!card||!event.target.matches(':focus-visible'))return;
 const cardRect=card.getBoundingClientRect(),viewport=grid.getBoundingClientRect(),gutter=parseFloat(getComputedStyle(grid).paddingLeft);
 if(cardRect.left<viewport.left+gutter||cardRect.right>viewport.right-gutter)scrollCarouselTo(grid.scrollLeft+cardRect.left-viewport.left-gutter);
});
new ResizeObserver(measureCarousel).observe(grid);measureCarousel();
new MutationObserver(()=>{const blocked=document.body.classList.contains('modal-open');if(blocked){pageScroll.stop();railScroll.stop();}else{pageScroll.start();railScroll.start();}}).observe(document.body,{attributes:true,attributeFilter:['class']});
const menuButton = $('.menu-toggle');
const mobileNav = $('#mobile-nav');
function closeMenu(){menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Open menu');mobileNav.hidden=true;}
menuButton.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')!=='true';menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Close menu':'Open menu');mobileNav.hidden=!open;});
$$('a',mobileNav).forEach(link=>link.addEventListener('click',closeMenu));
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu();});
window.addEventListener('resize',()=>{if(window.innerWidth>1050)closeMenu();});
let toastTimer;
function toast(message){$('.toast').textContent=message;$('.toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('.toast').classList.remove('show'),3500);}
function downloadFile(name,content,type='text/plain;charset=utf-8'){const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('#download-button').addEventListener('click',()=>{downloadFile('dream-ads-creative-brief.txt',`DREAM ADS — CREATIVE BRIEF\n\nFictional campaign / Design exercise\n\nMake Your Dream Ad.\nPick a real or imaginary product. Imagine its next campaign. Bring it to life with OpenArt.\n\nWho: Designers, AI artists, content creators, and anyone with a big advertising idea.\nDeliverable: One original video ad of around 15 seconds made with OpenArt, plus an English creative concept of up to 100 words.\nDuration: 14 days from the opening of submissions. Exact dates will be announced.\nRewards: Three winners each receive $100 in OpenArt creative credits and a feature in the official community.\nJudging: Creative concept 40%; Product communication 30%; Visual quality 30%.\n\nAll activity details and rewards above are fictional. This demo does not submit entries to OpenArt.\n`);toast('Creative brief downloaded. Make it yours.');});
$('#share-button').addEventListener('click',async()=>{const url=new URL(window.location.href);url.hash='showcase';try{if(navigator.share){await navigator.share({title:'Dream Ads — Make Your Dream Ad.',url:url.href});}else{await navigator.clipboard.writeText(url.href);toast('Challenge link copied.');}}catch(error){if(error.name!=='AbortError')toast('Copy the page URL from your address bar to share this challenge.');}});
$('#judging-toggle').addEventListener('click',()=>{const button=$('#judging-toggle');const open=button.getAttribute('aria-expanded')!=='true';button.setAttribute('aria-expanded',String(open));$('#judging-notes').hidden=!open;});
const entryDialog=$('#entry-dialog');
const form=$('#entry-form');
const storageKey='dreamAdsDraft.v1';
let savedDraft=null;
try{const draft=JSON.parse(localStorage.getItem(storageKey)||'null');if(draft&&typeof draft.name==='string'&&typeof draft.email==='string'&&typeof draft.concept==='string'&&typeof draft.category==='string')savedDraft=draft;}catch{/* Storage may be unavailable in private mode. */}
function wordCount(){const text=$('#creator-concept').value.trim();return text?text.split(/\s+/).length:0;}
function updateWordCount(){const count=wordCount();$('#word-count').textContent=`${count} / 100 words`;$('#word-count').classList.toggle('over',count>100);$('#creator-concept').setCustomValidity(count>100?'Please keep your concept to 100 words or fewer.':'');}
$('#creator-concept').addEventListener('input',updateWordCount);
function openEntry(){closeMenu();form.hidden=false;$('.entry-success').hidden=true;$('#form-error').textContent='';if(savedDraft){$('#creator-name').value=savedDraft.name;$('#creator-email').value=savedDraft.email;$('#creator-category').value=savedDraft.category;$('#creator-concept').value=savedDraft.concept;}updateWordCount();entryDialog.showModal();document.body.classList.add('modal-open');}
$$('[data-join]').forEach(button=>button.addEventListener('click',openEntry));
form.addEventListener('submit',event=>{event.preventDefault();if(!form.reportValidity())return;const draft={name:$('#creator-name').value.trim(),email:$('#creator-email').value.trim(),category:$('#creator-category').value,concept:$('#creator-concept').value.trim(),savedAt:new Date().toISOString(),status:'local-demo-only'};if(!draft.name){$('#form-error').textContent='Please enter your creator name.';$('#creator-name').focus();return;}try{localStorage.setItem(storageKey,JSON.stringify(draft));savedDraft=draft;form.hidden=true;$('.entry-success').hidden=false;$('#export-draft').focus();}catch{$('#form-error').textContent='Your browser could not save this draft. Please allow local storage and try again.';}});
$('#edit-draft').addEventListener('click',()=>{form.hidden=false;$('.entry-success').hidden=true;$('#creator-concept').focus();});
$('#export-draft').addEventListener('click',()=>{if(savedDraft)downloadFile('dream-ads-my-draft.json',JSON.stringify(savedDraft,null,2),'application/json');});
const previewDialog=$('#preview-dialog');
let playbackInterval=null,elapsed=0,playing=false,lastTick=0,currentConcept=null;
function updatePlayback(){const seconds=Math.min(15,Math.floor(elapsed));$('#preview-time').textContent=`00:${String(seconds).padStart(2,'0')} / 00:15`;$('.preview-progress>span').style.width=`${Math.min(100,elapsed/15*100)}%`;$('.preview-progress').setAttribute('aria-valuenow',String(seconds));$('#preview-scene').textContent=currentConcept.scenes[Math.min(2,Math.floor(elapsed/5))];}
function setPlaying(value){playing=value;$('#preview-play').textContent=value?'Ⅱ':elapsed>=15?'↺':'▶';$('#preview-play').setAttribute('aria-label',value?'Pause storyboard':elapsed>=15?'Replay storyboard':'Play storyboard');$('.preview-stage').classList.toggle('paused',!value);lastTick=performance.now();}
function openPreview(id){const concept=concepts.find(c=>c.id===id);if(!concept)return;currentConcept=concept;$('#preview-title').textContent=concept.title;$('#preview-description').textContent=concept.description;$('#preview-category').textContent=concept.category;$('#preview-art').src=`assets/${concept.art}`;$('#preview-art').alt=concept.product;$('.preview-stage').dataset.category=concept.id;elapsed=0;updatePlayback();previewDialog.showModal();document.body.classList.add('modal-open');setPlaying(true);clearInterval(playbackInterval);playbackInterval=setInterval(()=>{const now=performance.now();if(playing&&!document.hidden){elapsed=Math.min(15,elapsed+(now-lastTick)/1000);updatePlayback();if(elapsed>=15)setPlaying(false);}lastTick=now;},100);}
grid.addEventListener('click',event=>{const button=event.target.closest('[data-preview]');if(button)openPreview(button.dataset.preview);});
$('#preview-play').addEventListener('click',()=>{if(elapsed>=15){elapsed=0;updatePlayback();const art=$('#preview-art');art.style.animation='none';void art.offsetWidth;art.style.animation='';}setPlaying(!playing);});
$$('dialog').forEach(dialog=>{$('.dialog-close',dialog).addEventListener('click',()=>dialog.close());dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});dialog.addEventListener('close',()=>{if(!document.querySelector('dialog[open]'))document.body.classList.remove('modal-open');if(dialog===previewDialog){clearInterval(playbackInterval);setPlaying(false);}});});
const sectionObserver=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){$$('.desktop-nav a').forEach(link=>link.classList.toggle('active',link.hash===`#${entry.target.id}`));}});},{rootMargin:'-20% 0px -55% 0px'});
$$('#home,#showcase,#details,#how-it-works').forEach(section=>sectionObserver.observe(section));
