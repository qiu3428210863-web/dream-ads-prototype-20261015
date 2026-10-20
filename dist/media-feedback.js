/* Frame-local loading and recovery, shared by native and GPU players. */
(()=>{
 const bindings=new WeakMap();
 // One vector and timing model for native players and the desktop GPU card copy.
 let ringLength=200;
 const ringPath='M8 15 C8 12 10 11 13 13 L49 42 C64 55 91 47 91 29 C91 11 71 4 57 16 L14 48 C11 50 8 49 8 46 Z';
 const ease=t=>t*t*(3-2*t);
 const growth=now=>{const t=(now%2400)/2400;return t<.65?{length:ease(t/.65),offset:0}:{length:1-ease((t-.65)/.35),offset:ease((t-.65)/.35)};};
 globalThis.DreamMediaLoader={growth,draw(ctx,rect,now,reduced){
  const small=rect.height<180,size=small?44:68,x=rect.left+rect.width/2,y=rect.top+rect.height/2-(small?10:14),phase=growth(now);
  ctx.save();ctx.fillStyle='#0d0b14a8';ctx.fillRect(rect.left,rect.top,rect.width,rect.height);ctx.translate(x,y);ctx.save();ctx.scale(size/100,size/100);ctx.translate(-50,-30);ctx.lineWidth=6;ctx.lineJoin='round';ctx.lineCap='round';const path=new Path2D(ringPath);ctx.strokeStyle='#ffffff26';ctx.stroke(path);ctx.strokeStyle='#fff';ctx.setLineDash(reduced?[]:[Math.max(.001,ringLength*phase.length),ringLength*2]);ctx.lineDashOffset=reduced?0:-ringLength*phase.offset;ctx.stroke(path);ctx.restore();
  const font=small?11:14;ctx.font=`500 ${font}px Arial,sans-serif`;ctx.textBaseline='middle';ctx.textAlign='left';const label='Loading video',width=ctx.measureText(label).width,start=-width/2-5,baseline=size*.3+(small?16:21);ctx.fillStyle='#f5f3fa';ctx.fillText(label,start,baseline);
  for(let i=0;i<3;i++){const t=((now-i*160)%1500+1500)%1500/1500,lift=reduced?0:Math.sin(Math.PI*Math.min(1,t/.8));ctx.globalAlpha=reduced?1:.25+.75*lift;ctx.fillText('.',start+width+3+i*4,baseline-4*lift);}ctx.restore();
 }};
 function bind(video){
  if(bindings.has(video))return;
  const isPreview=video.id==='preview-video',isHero=video.matches('.hero-video'),stepVideo=video.closest('.challenge-step-video'),stepCard=video.closest('.challenge-step-card'),isStep=Boolean(stepVideo),workCard=video.closest('.work-card'),isWork=video.matches('.work-hover-video');
  const host=isPreview?document.querySelector('.preview-player'):isHero?video.closest('.hero'):stepCard||workCard;
  if(!host)return;
  const frame=isPreview?document.querySelector('.preview-stage'):isHero?host:stepVideo||video.closest('.work-visual')||host;
  const feedbackHost=isPreview?frame:host;
  feedbackHost.querySelectorAll(':scope > .media-feedback').forEach(node=>node.remove());
  const box=document.createElement('div'),message=document.createElement('p'),retry=document.createElement('button');
  box.className='media-feedback';box.hidden=true;box.dataset.state='ready';
  const symbol=document.createElement('span'),title=document.createElement('strong');symbol.className='media-error-symbol';symbol.setAttribute('aria-hidden','true');symbol.innerHTML='<svg viewBox="0 0 40 40"><rect x="5" y="9" width="30" height="22" rx="6"/><path d="m17 15 9 5-9 5z"/><path d="m7 6 27 28"/></svg>';title.className='media-error-title';title.textContent='Video unavailable';
  retry.type='button';retry.textContent='Try again';box.append(message,retry,symbol,title);feedbackHost.append(box);
  // Keep retry buttons outside the card's existing play button, aligned to its frame.
  const fit=()=>{if(!isPreview&&!isHero&&frame.offsetHeight){box.style.height=frame.offsetHeight+'px';box.style.width=frame.offsetWidth+'px';let node=frame,left=0,top=0;while(node&&node!==feedbackHost){left+=node.offsetLeft||0;top+=node.offsetTop||0;node=node.offsetParent;}if(node===feedbackHost){box.style.left=left+'px';box.style.top=top+'px';}}};fit();
  if(typeof ResizeObserver!=='undefined')new ResizeObserver(fit).observe(frame);
  frame.querySelectorAll(':scope > .media-loader').forEach(node=>node.remove());
  const loader=document.createElement('span');loader.className='media-loader';loader.hidden=true;loader.setAttribute('role','status');loader.setAttribute('aria-label','Loading video');loader.setAttribute('translate','no');
  loader.innerHTML='<svg viewBox="0 0 100 60" aria-hidden="true"><path class="media-loader-track" d="'+ringPath+'"/><path class="media-loader-ring" pathLength="200" d="'+ringPath+'"/></svg><span class="media-loading-label" aria-hidden="true">Loading video<span class="media-loading-dots"><span>.</span><span>.</span><span>.</span></span></span>';
  frame.append(loader);ringLength=loader.querySelector('path')?.getTotalLength?.()||ringLength;
  let timer=0;
  const clear=()=>{clearTimeout(timer);timer=0;};
  const state=(value,text)=>{clear();box.dataset.state=value;video.dataset.feedbackState=value;if(message.textContent!==text)message.textContent=text;box.hidden=value!=='error';loader.hidden=value!=='loading';retry.hidden=value==='loading';retry.disabled=value==='loading';video.setAttribute('aria-busy',String(value==='loading'));box.setAttribute('role',value==='error'?'alert':'status');box.setAttribute('aria-live',value==='error'?'assertive':'polite');document.dispatchEvent(new CustomEvent('dream:media-state',{detail:{video,state:value}}));};
  const fallback=reason=>{
   if(isPreview)document.dispatchEvent(new CustomEvent('dream:preview-media-failed',{detail:{reason}}));
   if(isHero){video.classList.add?.('is-switching');document.querySelector?.('.hero-video-poster')?.classList.add?.('is-visible');}
   if(isStep){video.classList.add('is-media-failed');stepVideo.style.backgroundImage=video.poster?'url("'+video.poster+'")':'';}
   if(isWork){video.classList.add('is-media-failed');workCard?.classList.remove('has-video-source','is-previewing','is-hover-ready');}
  };
  const failed=(text,reason='error',action='Try again')=>{fit();retry.textContent=action;title.textContent=reason==='permission'?'Ready when you are':navigator.onLine===false?'You are offline':reason==='timeout'?'Taking longer than expected':'Video unavailable';state('error',text);fallback(reason);};
  const loading=()=>{state('loading','Loading video\u2026');timer=setTimeout(()=>{if(!video.isConnected||document.hidden||(!isPreview&&!isHero&&video.paused)){state('ready','');return;}video.pause();failed(navigator.onLine===false?'You are offline. Reconnect, then try again.':'Video is taking too long to load. Check your connection, then try again.','timeout');},15000);};
  video.addEventListener('loadstart',()=>{if(isPreview||isHero||!video.paused)loading();});
  video.addEventListener('waiting',loading);video.addEventListener('stalled',()=>{if(!video.paused)loading();});
  video.addEventListener('playing',()=>{video.classList.remove('is-media-failed');if(isStep)stepVideo.style.backgroundImage='';if(isWork)workCard?.classList.add('has-video-source','is-previewing','is-hover-ready');state('ready','');});
  video.addEventListener('ended',()=>state('ready',''));
  video.addEventListener('pause',()=>{clear();if(box.dataset.state==='loading')state('ready','');});
  video.addEventListener('emptied',()=>{if(box.dataset.state==='loading')state('ready','');});
  video.addEventListener('play',()=>{if(video.readyState<3)loading();});
  video.addEventListener('error',()=>failed(navigator.onLine===false?'You are offline. Reconnect, then try again.':'Video could not play. Check your connection, then try again.'));
  video.addEventListener('dream:play-rejected',event=>{if(event.detail?.name==='AbortError')return;const blocked=event.detail?.name==='NotAllowedError';retry.textContent=blocked?'Play video':'Try again';failed(blocked?'Playback needs your permission. Select Play video to start.':'Video could not play. Try again.',blocked?'permission':'play',blocked?'Play video':'Try again');});
  retry.addEventListener('click',event=>{event?.stopPropagation?.();
   if(isPreview){retry.textContent='Try again';loading();document.dispatchEvent(new CustomEvent('dream:retry-preview'));return;}
   if(isHero){const playbackPermission=retry.textContent==='Play video';loading();if(playbackPermission){video.classList.remove('is-switching');video.play().catch(error=>video.dispatchEvent(new CustomEvent('dream:play-rejected',{detail:{name:error.name}})));}else{video.pause();video.classList.add?.('is-switching');document.querySelector?.('.hero-video-poster')?.classList.add?.('is-visible');video.load();}return;}
   if(isStep){video.classList.remove('is-media-failed');stepVideo.style.backgroundImage='';retry.textContent='Try again';loading();video.load();stepCard?.querySelector('.challenge-step-button')?.click();return;}
   if(isWork){const button=workCard?.querySelector('[data-preview]'),src=button?.dataset.previewVideoSrc||button?.dataset.videoSrc;if(src){video.classList.remove('is-media-failed');video.src=src;video.dataset.loadedSource=src;workCard.classList.add('has-video-source','is-previewing');}retry.textContent='Try again';loading();video.load();video.play().catch(error=>video.dispatchEvent(new CustomEvent('dream:play-rejected',{detail:{name:error.name}})));}
  });
  if(isWork)host.addEventListener('pointerleave',()=>{if(box.dataset.state!=='ready'){state('ready','');video.classList.remove('is-media-failed');}});
  bindings.set(video,{box,clear});
  if(video.error)failed('Video could not play. Check your connection, then try again.');else if(video.readyState<3&&!video.paused)loading();
 }
 const scan=()=>document.querySelectorAll('.hero-video,.challenge-step-video video,#preview-video,.work-hover-video').forEach(bind);
 scan();document.addEventListener('dream:translation-layout',scan);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)document.querySelectorAll('video').forEach(video=>bindings.get(video)?.clear());});
})();
