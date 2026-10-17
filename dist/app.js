'use strict';
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const concepts = [
 {id:'beauty', category:'Beauty & fragrance',title:'A scent beyond the ordinary.',product:'REVERIE · Fragrance',art:'perfume.svg',headline:'Bottle a\ndaydream.',description:'A sculptural fragrance floats through a world of soft pink light. An everyday ritual becomes a moment of escape.',scenes:['An everyday ritual.','A little imagination.','Bottle a daydream.']},
 {id:'lifestyle',category:'Food & lifestyle',title:'A fresh perspective.',product:'DAYBREAK · Sparkling refreshment',art:'can.svg',headline:'A little\nmore zest.',description:'A citrus-inspired sparkling drink takes center stage. Bright colors and a playful shift in scale make a simple refreshment extraordinary.',scenes:['Meet the everyday.','Add a little possibility.','A little more zest.']},
 {id:'tech',category:'Tech & innovation',title:'Tune into another world.',product:'FORM · Wireless audio',art:'headphones.svg',headline:'Feel\neverything.',description:'Silver headphones drift through a quiet, sculptural soundscape. The product becomes a portal to a world of your own.',scenes:['Turn down the noise.','Turn up your world.','Feel everything.']},
 {id:'beauty-night',category:'Beauty & fragrance',title:'A softer kind of escape.',product:'REVERIE · After hours',art:'perfume.svg',headline:'Stay in the\ndaydream.',description:'A familiar fragrance returns after dark, wrapped in quiet light and a slower, more cinematic rhythm.',scenes:['The city slows down.','A familiar note returns.','Stay in the daydream.']},
 {id:'lifestyle-sunrise',category:'Food & lifestyle',title:'A brighter start.',product:'DAYBREAK · First light',art:'can.svg',headline:'Make room\nfor bright.',description:'A crisp citrus ritual meets the first light of morning, turning a small pause into a fresh beginning.',scenes:['A new day opens.','A little brightness.','Make room for bright.']},
 {id:'tech-sound',category:'Tech & innovation',title:'Find your frequency.',product:'FORM · Studio session',art:'headphones.svg',headline:'Find your\nown rhythm.',description:'A focused listening session moves from soft reflections to bold, immersive color.',scenes:['The world fades out.','Your own rhythm begins.','Find your frequency.']},
 {id:'beauty-dusk',category:'Beauty & fragrance',title:'Leave the ordinary behind.',product:'REVERIE · Velvet hour',art:'perfume.svg',headline:'Leave the\nday behind.',description:'A signature fragrance marks the quiet transition from a busy day to a softer, more personal evening.',scenes:['The day slows down.','A softer mood arrives.','Leave the day behind.']},
 {id:'lifestyle-picnic',category:'Food & lifestyle',title:'A brighter kind of break.',product:'DAYBREAK · Citrus picnic',art:'can.svg',headline:'Take a\ntaste break.',description:'A sparkling citrus drink turns a simple outdoor pause into a vivid little escape.',scenes:['Step outside.','Take in the color.','Take a taste break.']},
 {id:'tech-studio',category:'Tech & innovation',title:'Sound takes shape.',product:'FORM · Studio edition',art:'headphones.svg',headline:'Make room\nfor sound.',description:'Sculptural headphones transform a focused studio session into an immersive world of sound.',scenes:['Find the quiet.','Build the rhythm.','Make room for sound.']},
 {id:'beauty-morning',category:'Beauty & fragrance',title:'A note of possibility.',product:'REVERIE · Morning light',art:'perfume.svg',headline:'Wake up\nto wonder.',description:'A bright fragrance ritual sets the tone for a day that feels open, considered, and full of possibility.',scenes:['First light arrives.','A familiar ritual.','Wake up to wonder.']},
 {id:'lifestyle-night',category:'Food & lifestyle',title:'Refresh after hours.',product:'DAYBREAK · Night citrus',art:'can.svg',headline:'Keep the\nnight bright.',description:'Crisp citrus and sparkling water bring a playful flash of energy to a late-night gathering.',scenes:['The evening begins.','The lights come up.','Keep the night bright.']},
 {id:'tech-travel',category:'Tech & innovation',title:'Carry your own world.',product:'FORM · On the move',art:'headphones.svg',headline:'Go where\nyou feel.',description:'Wireless audio turns the everyday commute into a personal soundtrack and a world of your own.',scenes:['Step into the day.','Find your own pace.','Go where you feel.']}
];
const grid = $('#showcase-grid');
function renderConcepts() {
 grid.innerHTML = concepts.map((c,index) => {const theme=c.id.startsWith('beauty')?'beauty':c.id.startsWith('lifestyle')?'lifestyle':'tech';return `<article class="work-card" aria-roledescription="slide" aria-label="${index+1} of ${concepts.length}"><div class="work-disc ${theme}" aria-hidden="true"><div class="disc-art"><img src="assets/${c.art}" alt="" width="680" height="680" draggable="false"></div><span class="disc-hub"></span></div><button class="work-open" data-preview="${c.id}" data-category="${theme}" aria-label="Preview ${c.title}" draggable="false"><div class="work-visual ${theme}"><div class="work-cover"><img class="cover-wordmark" src="assets/openart-logo.svg" alt="" width="403" height="69" draggable="false"><img class="work-product" src="assets/${c.art}" alt="${c.product} concept illustration" width="680" height="680" draggable="false"><span class="work-caption">${c.headline.replace('\n','<br>')}</span></div></div><div class="work-meta"><h3>${c.title}</h3><p>${c.product}</p></div></button></article>`;}).join('');
}
renderConcepts();
const reducedCarouselMotion=matchMedia('(prefers-reduced-motion: reduce)');
const carouselCards=$$('.work-card',grid),carouselCounter=$('.carousel-counter');
let carouselStep=0,carouselLimit=0,lastCarouselIndex=-1,carouselPinY=Infinity,showcaseDock=null;
let showcaseView='cards',viewAnimations=[],railReentry=false;
const viewButtons=$$('[data-showcase-view]');
function updateCarousel(){
 const left=grid.scrollLeft,index=Math.min(carouselCards.length-1,Math.round(left/(carouselStep||1)));
 if(index!==lastCarouselIndex){carouselCounter.textContent=String(index+1).padStart(2,'0')+' / '+String(carouselCards.length).padStart(2,'0');lastCarouselIndex=index;}
}
function measureCarousel(){
 const first=carouselCards[0],last=carouselCards[carouselCards.length-1];
 const gutter=parseFloat(getComputedStyle(grid).paddingRight)||0;
 // FLIP transforms affect bounding rectangles and scrollWidth, but not layout offsets.
 carouselStep=carouselCards[1].offsetLeft-first.offsetLeft;
 carouselLimit=showcaseView==='grid'?0:Math.max(0,last.offsetLeft+last.offsetWidth+gutter-grid.clientWidth);
 const rail=grid.getBoundingClientRect(),header=$('.header').getBoundingClientRect();
 carouselPinY=Math.max(0,rail.top+scrollY+first.offsetTop+first.offsetHeight*.5-(innerHeight+header.height)*.5);
 updateCarousel();
}
// The same engine and damping model as shader.se; one clock drives both axes.
const pageScroll=new Lenis({autoRaf:false,lerp:.1,smoothWheel:true,syncTouch:false,anchors:{onStart:()=>{showcaseDock=null;resumeScrollClock();}},stopInertiaOnNavigate:true,prevent:element=>element.tagName==='DIALOG'||element.tagName==='TEXTAREA'||element.isContentEditable});
// A single capture listener routes wheel input; the nested Lenis must not consume it again.
const railScroll=new Lenis({wrapper:grid,content:grid,autoRaf:false,orientation:'horizontal',gestureOrientation:'horizontal',lerp:.12,smoothWheel:true,syncTouch:false,overscroll:true,virtualScroll:({event})=>showcaseView!=='grid'&&!event.type.includes('wheel')});
const scrollFrameSubscribers=new Set();
window.DreamScroll={onFrame(callback){scrollFrameSubscribers.add(callback);return()=>scrollFrameSubscribers.delete(callback);},requestFrame:resumeScrollClock,position(){return{x:railScroll.animatedScroll,y:pageScroll.animatedScroll};},scrollTo(y){showcaseDock=null;pageScroll.scrollTo(y);resumeScrollClock();}};
let scrollFrame=0;
function tickScroll(time){
 pageScroll.raf(time);
 railScroll.raf(time);let visualActive=false;for(const callback of scrollFrameSubscribers)visualActive=callback(time)||visualActive;
 scrollFrame=visualActive||pageScroll.isScrolling==='smooth'||railScroll.isScrolling==='smooth'?requestAnimationFrame(tickScroll):0;
}
function resumeScrollClock(){if(!scrollFrame){pageScroll.time=railScroll.time=0;scrollFrame=requestAnimationFrame(tickScroll);}}
addEventListener('wheel',resumeScrollClock,{passive:true});
addEventListener('keydown',event=>{if(!event.defaultPrevented&&['PageUp','PageDown','Home','End','ArrowUp','ArrowDown',' '].includes(event.key)&&!event.target.closest('input,textarea,select,button,[contenteditable]')){showcaseDock=null;pageScroll.scrollTo(scrollY,{immediate:true});}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(scrollFrame);scrollFrame=0;}else resumeScrollClock();});
function scrollCarouselTo(value,immediate=false){railScroll.scrollTo(Math.max(0,Math.min(carouselLimit,value)),{programmatic:false,lerp:.12,immediate:immediate||reducedCarouselMotion.matches});resumeScrollClock();}
function beginShowcaseDock(direction,pending=0){
 const phase={direction,pending};showcaseDock=phase;
 const distance=Math.abs(carouselPinY-pageScroll.animatedScroll),speed=Math.max(500,Math.abs(pageScroll.velocity)*60);
 const duration=Math.max(.28,Math.min(.6,3*distance/speed));
 pageScroll.scrollTo(carouselPinY,{duration,easing:t=>1-(1-t)**3,onComplete:()=>{
  if(showcaseDock!==phase)return;showcaseDock=null;
  if(phase.pending)scrollCarouselTo(railScroll.targetScroll+phase.pending);
 }});resumeScrollClock();
}
// FLIP animates the existing sleeves; covers, CD hover and preview listeners stay intact.
function setShowcaseView(view){
 if(!['cards','grid'].includes(view)||view===showcaseView)return;
 viewAnimations.forEach(animation=>animation.cancel());viewAnimations=[];
 const fromView=showcaseView;
 // A grid has a stable origin. Reset the rail before measuring so a switch from
 // the middle/end of the carousel does not send cards flying across the page.
 if(view==='grid')railScroll.scrollTo(0,{immediate:true});
 const before=carouselCards.map(card=>card.getBoundingClientRect());
 showcaseDock=null;pageScroll.scrollTo(pageScroll.animatedScroll,{immediate:true});
 if(drag&&grid.hasPointerCapture(drag.id))grid.releasePointerCapture(drag.id);
 drag=null;grid.classList.remove('is-dragging');
 if(view!=='grid')railScroll.scrollTo(0,{immediate:true});showcaseView=view;grid.dataset.view=view;railReentry=view==='cards';
 grid.setAttribute('aria-label',view==='grid'?'Concept gallery, grid view':'Concept gallery, horizontal card view');
 viewButtons.forEach(button=>{
  button.setAttribute('aria-pressed',String(button.dataset.showcaseView===view));
  button.parentElement.dataset.view=view;
 });
 carouselCards.forEach(card=>card.setAttribute('aria-roledescription',view==='grid'?'card':'slide'));
 railScroll.resize();pageScroll.resize();measureCarousel();
 if(!reducedCarouselMotion.matches&&typeof carouselCards[0]?.animate==='function'){
  viewAnimations=carouselCards.map((card,index)=>{
   const from=before[index],to=card.getBoundingClientRect();
   if(fromView==='cards'&&view==='grid'){
    const dx=from.left+from.width/2-(to.left+to.width/2),dy=from.top+from.height/2-(to.top+to.height/2);
    return card.animate([
     {transform:`translate(${dx}px,${dy}px) scale(${from.width/to.width},${from.height/to.height})`,transformOrigin:'center center',offset:0},
     {transform:'translate(0,0) scale(1)',transformOrigin:'center center',offset:.78},
     {transform:'translate(0,0) scale(1.025)',transformOrigin:'center center',offset:.91},
     {transform:'translate(0,0) scale(1)',transformOrigin:'center center',offset:1}
    ],{duration:900,easing:'cubic-bezier(.2,.72,.24,1)',fill:'none'});
   }
   return card.animate([
    {transform:`translate(${from.left-to.left}px,${from.top-to.top}px) scale(${from.width/to.width},${from.height/to.height})`,offset:0},
    {transform:'translate(0,0) scale(.78)',offset:.55},
    {transform:'translate(0,0) scale(1.045)',offset:.8},
    {transform:'translate(0,0) scale(1)',offset:1}
   ],{duration:860,easing:'cubic-bezier(.22,.7,.26,1)',fill:'none'});
  });
  const batch=viewAnimations;let remaining=batch.length;
  batch.forEach(animation=>{animation.onfinish=()=>{
   if(viewAnimations!==batch||--remaining!==0)return;
   viewAnimations=[];railScroll.resize();pageScroll.resize();measureCarousel();resumeScrollClock();
  };});
 }
 resumeScrollClock();
}
viewButtons.forEach(button=>button.addEventListener('click',()=>setShowcaseView(button.dataset.showcaseView)));
// Enter the horizontal sequence only when the cards reach the viewport's center.
addEventListener('wheel',event=>{
 if(showcaseView==='grid'||event.ctrlKey||!carouselLimit||document.body.classList.contains('modal-open'))return;
 const unit=event.deltaMode===1?100/6:event.deltaMode===2?innerHeight:1;
 const deltaX=event.deltaX*unit,deltaY=event.deltaY*unit;
 const delta=Math.abs(deltaX)>Math.abs(deltaY)?deltaX:deltaY;
 if(delta===0)return;
 const horizontal=Math.abs(deltaX)>Math.abs(deltaY),y=pageScroll.animatedScroll,centered=Math.abs(y-carouselPinY)<=.75;
 if(showcaseDock){
  event.preventDefault();event.stopImmediatePropagation();
  if(!horizontal&&deltaY*showcaseDock.direction<0){showcaseDock=null;pageScroll.scrollTo(y+deltaY,{programmatic:false,lerp:.1});resumeScrollClock();}
  else showcaseDock.pending+=delta*(horizontal?1:1.25);
  return;
 }
 if(centered)railReentry=false;
 if(!centered){
  // A view change can leave the page beyond the rail's new center. Re-enter smoothly.
  const x=railScroll.targetScroll,canMove=deltaY>0?x<carouselLimit-1:x>1;
  if(railReentry&&!horizontal&&grid.contains(event.target)&&canMove){
   event.preventDefault();event.stopImmediatePropagation();railReentry=false;
   beginShowcaseDock(Math.sign(deltaY),deltaY*1.25);return;
  }
  if(horizontal&&grid.contains(event.target)){event.preventDefault();event.stopImmediatePropagation();scrollCarouselTo(railScroll.targetScroll+deltaX);}
  else if(!horizontal){
   const target=pageScroll.targetScroll+deltaY,x=railScroll.targetScroll;
   if((deltaY>0&&y<carouselPinY&&target>=carouselPinY&&x<carouselLimit-1)||(deltaY<0&&y>carouselPinY&&target<=carouselPinY&&x>1)){
    event.preventDefault();event.stopImmediatePropagation();beginShowcaseDock(Math.sign(deltaY),(target-carouselPinY)*1.25);
   }
  }
  return;
 }
 const position=railScroll.targetScroll,atStart=position<=1,atEnd=carouselLimit-position<=1;
 if((delta<0&&atStart)||(delta>0&&atEnd)){
  if(horizontal){event.preventDefault();event.stopImmediatePropagation();pageScroll.scrollTo(pageScroll.targetScroll+deltaX,{programmatic:false,lerp:.1});resumeScrollClock();}
  return;
 }
 event.preventDefault();event.stopImmediatePropagation();
 if(pageScroll.isScrolling)beginShowcaseDock(Math.sign(delta),delta*(horizontal?1:1.25));
 else scrollCarouselTo(position+delta*(horizontal?1:1.25));
},{capture:true,passive:false});
function moveCarousel(direction){scrollCarouselTo(railScroll.targetScroll+direction*carouselStep);}
railScroll.on('scroll',updateCarousel);
grid.addEventListener('keydown',event=>{
 if(showcaseView==='grid')return;
 if(event.key==='ArrowRight'){event.preventDefault();moveCarousel(1);}
 else if(event.key==='ArrowLeft'){event.preventDefault();moveCarousel(-1);}
 else if(event.key==='Home'){event.preventDefault();scrollCarouselTo(0);}
 else if(event.key==='End'){event.preventDefault();scrollCarouselTo(carouselLimit);}
});
// Keep a float target in Lenis rather than reading rounded DOM scrollLeft back.
let drag=null,suppressClickUntil=0;
grid.addEventListener('pointerdown',event=>{
 if(showcaseView==='grid'||event.pointerType!=='mouse'||event.button!==0)return;
 railScroll.scrollTo(grid.scrollLeft,{immediate:true});
 drag={id:event.pointerId,x:event.clientX,y:event.clientY,left:grid.scrollLeft,lastX:event.clientX,lastTime:event.timeStamp,velocity:0,active:false};
});
grid.addEventListener('pointermove',event=>{
 if(!drag||event.pointerId!==drag.id)return;
 const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
 if(!drag.active){if(Math.abs(dy)>8&&Math.abs(dy)>Math.abs(dx)){drag=null;return;}if(Math.abs(dx)<7)return;drag.active=true;grid.classList.add('is-dragging');grid.setPointerCapture(event.pointerId);}
 const elapsed=event.timeStamp-drag.lastTime;
 if(elapsed>0)drag.velocity=drag.velocity*.65+(drag.lastX-event.clientX)/elapsed*.35;
 drag.lastX=event.clientX;drag.lastTime=event.timeStamp;
 event.preventDefault();scrollCarouselTo(drag.left-dx,true);
});
function finishCarouselDrag(event){
 if(!drag||event.pointerId!==drag.id)return;
 const gesture=drag;drag=null;grid.classList.remove('is-dragging');
 if(gesture.active){
  suppressClickUntil=performance.now()+250;
  if(grid.hasPointerCapture(gesture.id))grid.releasePointerCapture(gesture.id);
  if(event.type==='pointerup'&&event.timeStamp-gesture.lastTime<90&&!reducedCarouselMotion.matches)scrollCarouselTo(grid.scrollLeft+Math.max(-carouselStep*.65,Math.min(carouselStep*.65,gesture.velocity*160)));
 }
}
grid.addEventListener('pointerup',finishCarouselDrag);grid.addEventListener('pointercancel',finishCarouselDrag);
grid.addEventListener('lostpointercapture',()=>{drag=null;grid.classList.remove('is-dragging');});
grid.addEventListener('click',event=>{if(performance.now()<suppressClickUntil){event.preventDefault();event.stopImmediatePropagation();}},true);
grid.addEventListener('focusin',event=>{
 if(showcaseView==='grid')return;
 const card=event.target.closest('.work-card');if(!card||!event.target.matches(':focus-visible'))return;
 const cardRect=card.getBoundingClientRect(),viewport=grid.getBoundingClientRect(),gutter=parseFloat(getComputedStyle(grid).paddingLeft);
 if(cardRect.left<viewport.left+gutter||cardRect.right>viewport.right-gutter)scrollCarouselTo(grid.scrollLeft+cardRect.left-viewport.left-gutter);
});
new ResizeObserver(measureCarousel).observe(grid);measureCarousel();
new MutationObserver(()=>{const blocked=document.body.classList.contains('modal-open');if(blocked){showcaseDock=null;pageScroll.stop();railScroll.stop();}else{pageScroll.start();railScroll.start();}}).observe(document.body,{attributes:true,attributeFilter:['class']});
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
function openPreview(id){const concept=concepts.find(c=>c.id===id);if(!concept)return;const theme=id.startsWith('beauty')?'beauty':id.startsWith('lifestyle')?'lifestyle':'tech';currentConcept=concept;$('#preview-title').textContent=concept.title;$('#preview-description').textContent=concept.description;$('#preview-category').textContent=concept.category;$('#preview-art').src=`assets/${concept.art}`;$('#preview-art').alt=concept.product;$('.preview-stage').dataset.category=theme;elapsed=0;updatePlayback();previewDialog.showModal();document.body.classList.add('modal-open');setPlaying(true);clearInterval(playbackInterval);playbackInterval=setInterval(()=>{const now=performance.now();if(playing&&!document.hidden){elapsed=Math.min(15,elapsed+(now-lastTick)/1000);updatePlayback();if(elapsed>=15)setPlaying(false);}lastTick=now;},100);}
grid.addEventListener('click',event=>{const button=event.target.closest('[data-preview]');if(button)openPreview(button.dataset.preview);});
$('#preview-play').addEventListener('click',()=>{if(elapsed>=15){elapsed=0;updatePlayback();const art=$('#preview-art');art.style.animation='none';void art.offsetWidth;art.style.animation='';}setPlaying(!playing);});
$$('dialog').forEach(dialog=>{$('.dialog-close',dialog).addEventListener('click',()=>dialog.close());dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});dialog.addEventListener('close',()=>{if(!document.querySelector('dialog[open]'))document.body.classList.remove('modal-open');if(dialog===previewDialog){clearInterval(playbackInterval);setPlaying(false);}});});
const sectionObserver=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){$$('.desktop-nav a').forEach(link=>link.classList.toggle('active',link.hash===`#${entry.target.id}`));}});},{rootMargin:'-20% 0px -55% 0px'});
$$('#home,#showcase,#details,#how-it-works').forEach(section=>sectionObserver.observe(section));
