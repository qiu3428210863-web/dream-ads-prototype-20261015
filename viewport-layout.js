(()=>{
 'use strict';
 const root=document.documentElement,header=document.querySelector('.header');
 let frame=0;
 function syncViewport(){
  frame=0;
  const height=window.visualViewport?.height||window.innerHeight;
  if(height>0)root.style.setProperty('--app-viewport-height',`${height}px`);
  if(header){const headerHeight=header.getBoundingClientRect().height;if(headerHeight>0)root.style.setProperty('--app-header-height',`${headerHeight}px`);}
 }
 function scheduleSync(){if(!frame)frame=requestAnimationFrame(syncViewport);}
 syncViewport();
 addEventListener('resize',scheduleSync,{passive:true});
 window.visualViewport?.addEventListener('resize',scheduleSync,{passive:true});
 if(header&&'ResizeObserver'in window)new ResizeObserver(scheduleSync).observe(header);
})();
