/* Media feedback follows the live video node, including translator replacements. */
(()=>{
 const bindings=new WeakMap();
 function bind(video){
  if(bindings.has(video))return;
  const isPreview=video.id==='preview-video',isHero=video.matches('.hero-video'),isStep=video.closest('.challenge-step-card');
  const host=isPreview?document.querySelector('.preview-player'):isHero?video.closest('.hero'):isStep||video.closest('.work-card');
  if(!host)return;
  host.querySelectorAll(':scope > .media-feedback').forEach(node=>node.remove());
  const box=document.createElement('div'),message=document.createElement('p'),retry=document.createElement('button');
  box.className='media-feedback';box.hidden=true;message.setAttribute('role','status');message.setAttribute('aria-live','polite');
  retry.type='button';retry.textContent='Try again';box.append(message,retry);host.append(box);
  let timer=0;
  const clear=()=>{clearTimeout(timer);timer=0;};
  const state=(value,text)=>{clear();box.dataset.state=value;video.dataset.feedbackState=value;if(message.textContent!==text)message.textContent=text;box.hidden=value==='ready';retry.hidden=value==='loading';video.setAttribute('aria-busy',String(value==='loading'));};
  const failed=()=>state('error',navigator.onLine===false?'You are offline. Reconnect, then try again.':'Video could not load. Check your connection and try again.');
  const loading=()=>{state('loading','Loading video…');timer=setTimeout(()=>{if(!video.isConnected||document.hidden||(!isPreview&&video.paused)){clear();return;}video.pause();state('error','Video is taking too long to load. Try again.');},15000);};
  video.addEventListener('loadstart',()=>{if(isPreview||isHero||!video.paused)loading();});
  video.addEventListener('waiting',loading);video.addEventListener('stalled',()=>{if(!video.paused)loading();});
  video.addEventListener('playing',()=>state('ready',''));video.addEventListener('ended',()=>state('ready',''));
  video.addEventListener('pause',clear);video.addEventListener('error',failed);
  video.addEventListener('dream:play-rejected',event=>{if(event.detail?.name==='AbortError')return;state('error',event.detail?.name==='NotAllowedError'?'Playback needs your permission. Select Play video to start.':'Video could not play. Try again.');retry.textContent=event.detail?.name==='NotAllowedError'?'Play video':'Try again';});
  retry.addEventListener('click',()=>{
   retry.textContent='Try again';loading();
   if(isPreview){document.dispatchEvent(new CustomEvent('dream:retry-preview'));return;}
   if(isStep){video.load();isStep.querySelector('.challenge-step-button')?.click();return;}
   host.classList.remove('preview-load-error');
   if(video.matches('.work-hover-video')){const button=host.querySelector('[data-preview]'),src=button?.dataset.previewVideoSrc||button?.dataset.videoSrc;if(src){video.src=src;video.dataset.loadedSource=src;host.classList.add('has-video-source','is-previewing');}}
   video.load();video.play().catch(error=>video.dispatchEvent(new CustomEvent('dream:play-rejected',{detail:{name:error.name}})));
  });
  bindings.set(video,{box,clear});
  if(video.error)failed();else if(video.readyState<3&&!video.paused)loading();
 }
 const scan=()=>document.querySelectorAll('.hero-video,.challenge-step-video video,#preview-video,.work-hover-video').forEach(bind);
 scan();document.addEventListener('dream:translation-layout',scan);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)document.querySelectorAll('video').forEach(video=>bindings.get(video)?.clear());});
})();
