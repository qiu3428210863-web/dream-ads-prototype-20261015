/* Mobile playback follows viewport attention, with no autoplay permission overlay. */
(()=>{
 'use strict';
 const mobile=matchMedia('(max-width:900px), (hover:none), (pointer:coarse)'),motion=matchMedia('(prefers-reduced-motion: reduce)'),blocked=new Set(),pending=new WeakMap(),recoveries=new WeakMap(),observed=new WeakSet();
 let timer=0,activeCards=[];
 function visibility(element){
  const r=element.getBoundingClientRect(),top=64,bottom=innerHeight;
  if(r.width<=0||r.height<=0)return {ratio:0,distance:Infinity};
  const width=Math.max(0,Math.min(r.right,innerWidth)-Math.max(r.left,0)),height=Math.max(0,Math.min(r.bottom,bottom)-Math.max(r.top,top));
  return {ratio:width*height/(r.width*Math.min(r.height,bottom-top)),distance:Math.abs((r.top+r.bottom)/2-(top+bottom)/2)};
 }
 function pickVisible(elements){
  let best=-1,distance=Infinity;elements.forEach((e,i)=>{const v=visibility(e);if(v.ratio>=.55&&v.distance<distance){best=i;distance=v.distance;}});return best;
 }
 function eligible(video){
  if(!video.isConnected||video.dataset.feedbackState==='error'||video.dataset.viewportPaused==='true'||document.hidden||!mobile.matches||motion.matches||visibility(video).ratio<.25)return false;
  const dialog=video.closest('dialog'),open=document.querySelector('dialog[open]');if(open&&dialog!==open)return false;
  const card=video.closest('.work-card');if(card&&!card.classList.contains('is-previewing'))return false;
  const step=video.closest('.challenge-step-card');if(step&&!step.classList.contains('is-active'))return false;
  return !dialog||dialog.open;
 }
 const sourceKey=video=>video.dataset.playlistSrc||video.dataset.loadedSource||video.currentSrc||video.src||'';
 function recover(video){
  if(!eligible(video))return;
  const source=sourceKey(video);let state=recoveries.get(video);
  if(!state||state.source!==source){if(state?.timer)clearTimeout(state.timer);state={source,count:0,timer:0};recoveries.set(video,state);}
  if(state.timer||state.count>=3)return;
  const delay=[250,750,1500][state.count++];
  state.timer=setTimeout(()=>{state.timer=0;if(sourceKey(video)===source&&eligible(video))attempt(video);},delay);
 }
 function block(video){blocked.add(video);video.dataset.autoplayBlocked='true';video.pause();video.dispatchEvent(new CustomEvent('dream:autoplay-blocked'));recover(video);}
 async function attempt(video){
  const source=sourceKey(video);if(!eligible(video)||pending.get(video)?.source===source||(video.paused===false&&video.readyState>=3&&!blocked.has(video)))return;
  const request={source};pending.set(video,request);video.muted=true;video.defaultMuted=true;video.playsInline=true;
  try{await video.play();if(pending.get(video)!==request)return;blocked.delete(video);delete video.dataset.autoplayBlocked;}
  catch(error){if(pending.get(video)!==request)return;if(error.name==='NotAllowedError')block(video);else if(error.name==='AbortError'){if(video.paused)recover(video);}else video.dispatchEvent(new CustomEvent('dream:play-rejected',{detail:{name:error.name}}));}
  finally{if(pending.get(video)===request)pending.delete(video);}
 }
 function stop(card){card.classList.remove('is-previewing','is-hover-ready');card.querySelector('.work-hover-video')?.pause();}
 function sync(){
  clearTimeout(timer);timer=0;
  if(!mobile.matches){activeCards.forEach(stop);activeCards=[];return;}
  const candidates=[...document.querySelectorAll('#showcase-grid .work-card')].map(card=>({card,...visibility(card.querySelector('.work-visual'))})).filter(x=>x.ratio>=.65).sort((a,b)=>a.distance-b.distance);
  const next=document.hidden||motion.matches||document.querySelector('dialog[open]')?[]:candidates.slice(0,2).map(x=>x.card);
  activeCards.filter(card=>!next.includes(card)).forEach(stop);activeCards=next;
  for(const card of activeCards){
   const video=card.querySelector('.work-hover-video'),button=card.querySelector('[data-preview]'),src=button?.dataset.previewVideoSrc||button?.dataset.videoSrc;
   if(!video||!src||video.dataset.feedbackState==='error')continue;
   card.classList.add('has-video-source','is-previewing');
   if(video.dataset.loadedSource!==src){video.src=src;video.dataset.loadedSource=src;}
   if(video.paused)attempt(video);
  }
  document.dispatchEvent(new CustomEvent('dream:viewport-media'));
 }
 function schedule(){clearTimeout(timer);timer=setTimeout(sync,160);}
 const observer=typeof IntersectionObserver!=='undefined'?new IntersectionObserver(schedule,{threshold:[0,.25,.55,.65,.9,1]}):null;
 function scan(){document.querySelectorAll('.hero,.challenge-step-video,#showcase-grid .work-visual').forEach(element=>{if(!observed.has(element)){observed.add(element);observer?.observe(element);}});if(!timer)timer=setTimeout(sync,160);}
 // A policy refusal is not a corrupt video. Keep the poster and retry on real user input.
 document.addEventListener('dream:play-rejected',event=>{if(mobile.matches&&event.detail?.name==='NotAllowedError'){event.stopImmediatePropagation();block(event.target);}},true);
 document.addEventListener('playing',event=>{const recovery=recoveries.get(event.target);if(recovery?.timer){clearTimeout(recovery.timer);recovery.timer=0;}blocked.delete(event.target);if(event.target.dataset)delete event.target.dataset.autoplayBlocked;},true);
 document.addEventListener('canplay',event=>{if(blocked.has(event.target))attempt(event.target);},true);
 const retry=()=>{blocked.forEach(video=>{if(!video.isConnected)blocked.delete(video);else attempt(video);});};
 document.addEventListener('pause',event=>{if(event.target.matches?.('.hero-video')&&!blocked.has(event.target))recover(event.target);},true);
 addEventListener('pageshow',()=>{document.querySelectorAll('.hero-video').forEach(video=>{pending.delete(video);if(eligible(video))attempt(video);});schedule();});
 for(const name of ['pointerdown','touchstart','pointerup','touchend','keydown'])document.addEventListener(name,retry,{capture:true,passive:true});
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){activeCards.forEach(stop);activeCards=[];}else retry();schedule();});
 document.addEventListener('toggle',event=>{if(event.target.matches?.('dialog')){if(event.newState==='open')sync();else schedule();}},true);
 document.addEventListener('close',schedule,true);
 document.addEventListener('dream:translation-layout',scan);
 mobile.addEventListener('change',sync);motion.addEventListener('change',sync);
 globalThis.DreamMobilePlayback={mobile,pickVisible,visibility,attempt,block,recover,sync};scan();
})();
