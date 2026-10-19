(()=>{
 'use strict';
 const root=document.documentElement,header=document.querySelector('.header'),hero=document.querySelector('.hero'),copy=document.querySelector('.hero-copy'),rail=document.querySelector('.hero-card-rail');
 let frame=0,lastLayout='';
 const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
 function set(name,value){if(root.style.getPropertyValue(name)!==value)root.style.setProperty(name,value);}
 function syncViewport(){
  frame=0;
  const visual=window.visualViewport;
  // Pinch zoom changes the visual viewport, not the page's responsive layout.
  const visibleHeight=visual&&(!visual.scale||Math.abs(visual.scale-1)<.01)?visual.height:window.innerHeight;
  const height=Math.max(1,visibleHeight||window.innerHeight);
  const width=Math.max(1,root.clientWidth||window.innerWidth);
  const headerHeight=header?.getBoundingClientRect().height||64;
  set('--app-viewport-height',`${height}px`);set('--app-header-height',`${headerHeight}px`);
  set('--viewport-width',`${width}px`);
  const railWidth=width-32;
  const preferredCard=width<=900?Math.min(280,width*.78):Math.floor((railWidth-48)/5);
  set('--hero-card-width',`${Math.round(Math.min(preferredCard,clamp(height*.4,210,390),width-32))}px`);
  set('--hero-title-size',`${clamp(Math.min(width*(width<=700?.165:.08),(height-headerHeight)*.125),40,118).toFixed(1)}px`);
  set('--hero-hover-space',height<650?'38px':height<800?'52px':'64px');
  let mode='',railHeight=0,copyHeight=0;
  if(hero&&copy&&rail&&rail.querySelector('.work-card')){
   railHeight=rail.offsetHeight;copyHeight=copy.offsetHeight;
   set('--hero-rail-height',`${railHeight}px`);
   mode=headerHeight+16+copyHeight+railHeight+14-20>height+1?'flow':'hero';
   if(hero.dataset.heroLayout!==mode){
    hero.dataset.heroLayout=mode;
    scheduleSync();
   }
  }
  const layout=[width,height,headerHeight,railHeight,copyHeight,mode].join(':');
  if(layout!==lastLayout){lastLayout=layout;window.dispatchEvent(new CustomEvent('dream:layout'));}
 }
 function scheduleSync(){if(!frame)frame=requestAnimationFrame(syncViewport);}
 syncViewport();
 addEventListener('resize',scheduleSync,{passive:true});
 window.visualViewport?.addEventListener('resize',scheduleSync,{passive:true});
 addEventListener('orientationchange',scheduleSync,{passive:true});
 addEventListener('pageshow',scheduleSync);
 document.addEventListener('dream:hero-ready',scheduleSync);
 document.fonts?.ready?.then(scheduleSync);
 if('ResizeObserver'in window){const observer=new ResizeObserver(scheduleSync);[header,copy,rail].filter(Boolean).forEach(element=>observer.observe(element));}
})();
