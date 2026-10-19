(()=>{
 'use strict';
 const root=document.documentElement,hero=document.querySelector('.hero');
 const layers=[...document.querySelectorAll('.hero-video,.hero-video-poster')];
 const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
 if(!hero||!layers.length)return;
 let frame=0,lastOffset='';
 function update(){
  frame=0;
  if(reducedMotion.matches){root.classList.remove('hero-parallax-ready');root.style.removeProperty('--hero-parallax-offset');lastOffset='';return;}
  const rect=hero.getBoundingClientRect();
  // The hero moves at -1x; compensate by +0.7x for a net -0.3x media drift.
  // Native overflow clips media and gradients together, even between JS frames.
  const offset=`${(Math.min(Math.max(0,-rect.top),rect.height)*.7).toFixed(2)}px`;
  root.classList.add('hero-parallax-ready');
  if(offset!==lastOffset){root.style.setProperty('--hero-parallax-offset',offset);lastOffset=offset;}
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(update);}
 update();
 addEventListener('scroll',schedule,{passive:true});
 addEventListener('resize',schedule,{passive:true});
 addEventListener('orientationchange',schedule,{passive:true});
 addEventListener('pageshow',schedule,{passive:true});
 window.visualViewport?.addEventListener('resize',schedule,{passive:true});
 window.visualViewport?.addEventListener('scroll',schedule,{passive:true});
 if('ResizeObserver'in window)new ResizeObserver(schedule).observe(hero);
 reducedMotion.addEventListener?.('change',schedule);
})();
