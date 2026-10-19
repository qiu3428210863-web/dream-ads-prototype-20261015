(()=>{
 'use strict';
 const dialog=document.querySelector('#entry-dialog');
 if(!dialog)return;
 let frame=0;
 function fit(){
  frame=0;if(!dialog.open)return;
  const width=Math.max(240,(window.visualViewport?.width||innerWidth)-28),height=Math.max(200,(window.visualViewport?.height||innerHeight)-28);
  dialog.style.setProperty('--entry-fit','1');
  dialog.style.width=Math.min(720,width)+'px';
  let scale=1;
  for(let pass=0;pass<3;pass++){
   const measured=dialog.getBoundingClientRect();
   if(measured.height<=height&&measured.width<=width)break;
   scale*=Math.min(height/Math.max(1,measured.height),width/Math.max(1,measured.width));
   dialog.style.setProperty('--entry-fit',String(scale));
  }
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(fit);}
 new MutationObserver(schedule).observe(dialog,{attributes:true,attributeFilter:['open'],childList:false});
 new MutationObserver(schedule).observe(dialog.querySelector('.entry-content'),{subtree:true,attributes:true,attributeFilter:['hidden'],childList:true,characterData:true});
 addEventListener('resize',schedule,{passive:true});
 window.visualViewport?.addEventListener('resize',schedule,{passive:true});
 document.fonts?.ready?.then(schedule);
})();
