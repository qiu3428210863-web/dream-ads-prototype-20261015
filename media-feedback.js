/* Keep recovery beside the player and preserve its poster when media stalls. */
(()=>{
 const bindings=new WeakMap();
 function bind(video){
  if(bindings.has(video))return;
  const isPreview=video.id==='preview-video',isHero=video.matches('.hero-video'),stepVideo=video.closest('.challenge-step-video'),stepCard=video.closest('.challenge-step-card'),isStep=Boolean(stepVideo),workCard=video.closest('.work-card'),isWork=video.matches('.work-hover-video');
  const host=isPreview?document.querySelector('.preview-player'):isHero?video.closest('.hero'):stepCard||workCard;
  if(!host)return;
  host.querySelectorAll(':scope > .media-feedback').forEach(node=>node.remove());
  const box=document.createElement('div'),message=document.createElement('p'),retry=document.createElement('button');
  box.className='media-feedback';box.hidden=true;box.dataset.state='ready';
  retry.type='button';retry.textContent='Try again';box.append(message,retry);host.append(box);
  let timer=0;
  const clear=()=>{clearTimeout(timer);timer=0;};
  const state=(value,text)=>{clear();box.dataset.state=value;video.dataset.feedbackState=value;if(message.textContent!==text)message.textContent=text;box.hidden=value==='ready';retry.hidden=value==='loading';retry.disabled=value==='loading';video.setAttribute('aria-busy',String(value==='loading'));box.setAttribute('role',value==='error'?'alert':'status');box.setAttribute('aria-live',value==='error'?'assertive':'polite');};
  const fallback=reason=>{
   if(isPreview)document.dispatchEvent(new CustomEvent('dream:preview-media-failed',{detail:{reason}}));
   if(isHero){video.classList.add?.('is-switching');document.querySelector?.('.hero-video-poster')?.classList.add?.('is-visible');}
   if(isStep){video.classList.add('is-media-failed');stepVideo.style.backgroundImage=video.poster?'url("'+video.poster+'")':'';}
   if(isWork){video.classList.add('is-media-failed');workCard?.classList.remove('has-video-source','is-previewing','is-hover-ready');}
  };
  const failed=(text,reason='error',action='Try again')=>{retry.textContent=action;state('error',text);fallback(reason);};
  const loading=()=>{state('loading','Loading video\u2026');timer=setTimeout(()=>{if(!video.isConnected||document.hidden||(!isPreview&&!isHero&&video.paused)){clear();return;}video.pause();failed(navigator.onLine===false?'You are offline. Reconnect, then try again.':'Video is taking too long to load. Check your connection, then try again.','timeout');},15000);};
  video.addEventListener('loadstart',()=>{if(isPreview||isHero||!video.paused)loading();});
  video.addEventListener('waiting',loading);video.addEventListener('stalled',()=>{if(!video.paused)loading();});
  video.addEventListener('playing',()=>{video.classList.remove('is-media-failed');if(isStep)stepVideo.style.backgroundImage='';if(isWork)workCard?.classList.add('has-video-source','is-previewing','is-hover-ready');state('ready','');});
  video.addEventListener('ended',()=>state('ready',''));
  video.addEventListener('pause',clear);
  video.addEventListener('error',()=>failed(navigator.onLine===false?'You are offline. Reconnect, then try again.':'Video could not play. Check your connection, then try again.'));
  video.addEventListener('dream:play-rejected',event=>{if(event.detail?.name==='AbortError')return;const blocked=event.detail?.name==='NotAllowedError';retry.textContent=blocked?'Play video':'Try again';failed(blocked?'Playback needs your permission. Select Play video to start.':'Video could not play. Try again.',blocked?'permission':'play',blocked?'Play video':'Try again');});
  retry.addEventListener('click',()=>{
   if(isPreview){retry.textContent='Try again';loading();document.dispatchEvent(new CustomEvent('dream:retry-preview'));return;}
   if(isHero){const playbackPermission=retry.textContent==='Play video';loading();if(playbackPermission){video.classList.remove('is-switching');video.play().catch(error=>video.dispatchEvent(new CustomEvent('dream:play-rejected',{detail:{name:error.name}})));}else{video.pause();video.classList.add?.('is-switching');document.querySelector?.('.hero-video-poster')?.classList.add?.('is-visible');video.load();}return;}
   if(isStep){video.classList.remove('is-media-failed');stepVideo.style.backgroundImage='';retry.textContent='Try again';loading();video.load();stepCard?.querySelector('.challenge-step-button')?.click();return;}
   if(isWork){const button=workCard?.querySelector('[data-preview]'),src=button?.dataset.previewVideoSrc||button?.dataset.videoSrc;if(src){video.classList.remove('is-media-failed');video.src=src;video.dataset.loadedSource=src;workCard.classList.add('has-video-source','is-previewing');}retry.textContent='Try again';loading();video.load();video.play().catch(error=>video.dispatchEvent(new CustomEvent('dream:play-rejected',{detail:{name:error.name}})));}
  });
  if(isWork)host.addEventListener('pointerleave',()=>{if(box.dataset.state==='error'){state('ready','');video.classList.remove('is-media-failed');}});
  bindings.set(video,{box,clear});
  if(video.error)failed('Video could not play. Check your connection, then try again.');else if(video.readyState<3&&!video.paused)loading();
 }
 const scan=()=>document.querySelectorAll('.hero-video,.challenge-step-video video,#preview-video,.work-hover-video').forEach(bind);
 scan();document.addEventListener('dream:translation-layout',scan);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)document.querySelectorAll('video').forEach(video=>bindings.get(video)?.clear());});
})();
