/* Translation may wrap text or replace nodes; keep layout and media in sync. */
(()=>{
 'use strict';
 let frame=0;
 function fitHeading(){
  const title=document.querySelector('#join-title');if(!title)return;
  title.style.removeProperty('font-size');
  for(let pass=0;pass<3&&title.scrollWidth>title.clientWidth+1;pass++){
   const size=parseFloat(getComputedStyle(title).fontSize);
   title.style.fontSize=`${(size*title.clientWidth/title.scrollWidth*.98).toFixed(2)}px`;
  }
 }
 function update(){frame=0;fitHeading();document.dispatchEvent(new CustomEvent('dream:translation-layout'));}
 function schedule(){if(!frame)frame=requestAnimationFrame(update);}
 new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true,characterData:true});
 addEventListener('resize',schedule,{passive:true});
 document.fonts?.ready?.then(schedule);
 schedule();
})();
