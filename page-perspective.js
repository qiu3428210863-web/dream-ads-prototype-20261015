/* Scroll-linked compositor transforms. All content remains live, interactive DOM. */
(()=>{
 'use strict';
 const root=document.documentElement;
 // One transform per content group: never tilt a parent and its children together.
 // Full-bleed video and footer gradient stay on their original, untransformed layers.
 const surfaces=[...document.querySelectorAll('.hero-copy,main > section > .section-top,main > section > .section-heading,.details-layout,.exercise-note,.steps > .step,.faq > div:first-child,.faq-list > details,.final-cta,.openart-footer-brand,.openart-footer-column,.openart-footer-bottom')];
 const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
 if(!surfaces.length||root.dataset.pagePerspectiveInitialized==='true')return;
 root.dataset.pagePerspectiveInitialized='true';
 surfaces.forEach(element=>element.classList.add('page-perspective-surface'));
 let points=[],measureFrame=0,updateFrame=0,lastY=NaN,viewWidth=1,viewHeight=1,motionDisabled=false;
 const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
 function documentOffset(element,property){let value=0;for(let node=element;node&&node!==document.documentElement;node=node.offsetParent)value+=node[property];return value;}
 function measure(){
  measureFrame=0;
  viewWidth=Math.max(1,document.documentElement.clientWidth);viewHeight=Math.max(1,window.visualViewport?.height||innerHeight);
  points=surfaces.map(element=>{const top=documentOffset(element,'offsetTop');return{element,top,bottom:top+element.offsetHeight,x:documentOffset(element,'offsetLeft')+element.offsetWidth/2,y:top+element.offsetHeight/2};});
  lastY=NaN;
  update();
 }
 function set(element,name,value){if(element.style.getPropertyValue(name)!==value)element.style.setProperty(name,value);}
 function clear(element,names){for(const name of names)element.style.removeProperty(name);}
 function update(){
  if(reducedMotion.matches){if(!motionDisabled){for(const {element} of points){clear(element,['--page-tilt-x','--page-tilt-y']);element.classList.remove('is-page-perspective-visible');}motionDisabled=true;}lastY=NaN;return false;}
  motionDisabled=false;
  // Native scroll position covers scrollbar drags, keyboard, touch, and Lenis alike.
  const y=window.scrollY||0;if(y===lastY)return false;lastY=y;
  const half=viewHeight/2,strength=viewWidth<=700?4:6.5;
  for(const point of points){
   const visible=point.bottom>=y-140&&point.top<=y+viewHeight+140;
   point.element.classList.toggle('is-page-perspective-visible',visible);if(!visible)continue;
   const v=clamp((point.y-y-half)/(half+Math.min(point.bottom-point.top,viewHeight)*.25),-1,1);
   const x=clamp((point.x-viewWidth/2)/(viewWidth/2),-1,1);
   set(point.element,'--page-tilt-x',(-v*strength).toFixed(3)+'deg');
   set(point.element,'--page-tilt-y',(-x*strength*.55).toFixed(3)+'deg');
  }
  return false;
 }
 function scheduleMeasure(){if(!measureFrame)measureFrame=requestAnimationFrame(measure);}
 function scheduleUpdate(){if(!updateFrame)updateFrame=requestAnimationFrame(()=>{updateFrame=0;update();});}
 measure();
 if(window.DreamScroll)window.DreamScroll.onFrame(update);
 // Scrollbar dragging and other native scroll sources do not wake the Lenis RAF clock.
 // Keep the perspective synced to the browser's actual scroll position as well.
 addEventListener('scroll',scheduleUpdate,{passive:true});
 addEventListener('resize',scheduleMeasure,{passive:true});
 addEventListener('dream:layout',scheduleMeasure);
 window.visualViewport?.addEventListener('resize',scheduleMeasure,{passive:true});
 if('ResizeObserver'in window){const observer=new ResizeObserver(scheduleMeasure);surfaces.forEach(element=>observer.observe(element));}
 document.fonts?.ready?.then(scheduleMeasure);
 reducedMotion.addEventListener?.('change',update);
})();
