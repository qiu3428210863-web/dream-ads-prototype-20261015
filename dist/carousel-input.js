/* Let the browser own touch scrolling; prevent a completed swipe becoming a click. */
(()=>{
 'use strict';
 const bound=new WeakSet();
 function bind(rail){
  if(!rail||bound.has(rail))return;bound.add(rail);
  let gesture=null,settleTimer=0,suppressUntil=0,scrolling=false;
  const clear=()=>{clearTimeout(settleTimer);settleTimer=0;};
  const active=()=>{clear();if(!rail.classList.contains('is-interacting')){rail.classList.add('is-interacting');rail.dispatchEvent(new CustomEvent('dream:rail-interaction',{bubbles:true}));}};
  const settle=()=>{clear();settleTimer=setTimeout(()=>{if(gesture)return;scrolling=false;rail.classList.remove('is-interacting');},180);};
  rail.addEventListener('pointerdown',event=>{
   if(event.isPrimary===false||event.button>0)return;
   suppressUntil=0;scrolling=false;gesture={id:event.pointerId,x:event.clientX,y:event.clientY,left:rail.scrollLeft,moved:false};active();
  },{passive:true});
  rail.addEventListener('pointermove',event=>{
   if(!gesture||gesture.id!==event.pointerId)return;
   if(Math.hypot(event.clientX-gesture.x,event.clientY-gesture.y)>8)gesture.moved=true;
  },{passive:true});
  const finish=event=>{
   if(!gesture||gesture.id!==event.pointerId)return;
   const moved=gesture.moved||Math.abs(rail.scrollLeft-gesture.left)>3||event.type==='pointercancel';
   gesture=null;if(moved){suppressUntil=performance.now()+400;scrolling=true;}settle();
  };
  rail.addEventListener('pointerup',finish,{passive:true});rail.addEventListener('pointercancel',finish,{passive:true});
  rail.addEventListener('scroll',()=>{
   if(!gesture&&!scrolling)return;
   if(gesture)gesture.moved=true;
   active();suppressUntil=performance.now()+400;scrolling=true;settle();
  },{passive:true});
  rail.addEventListener('click',event=>{
   // Keyboard activation remains available, including immediately after scrolling.
   if(event.detail===0)return;
   if(gesture?.moved||performance.now()<suppressUntil){event.preventDefault();event.stopImmediatePropagation();}
  },true);
  window.addEventListener('blur',()=>{gesture=null;settle();});
 }
 window.DreamCarouselInput=Object.freeze({bind});
})();
