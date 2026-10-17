/* Opt-in measurements only: append ?scrollDebug=1; no data leaves the page. */
(()=>{
 if(!new URLSearchParams(location.search).has('scrollDebug'))return;
 const output=document.createElement('output');output.id='scroll-diagnostics';output.hidden=true;document.body.append(output);
 const rail=document.querySelector('#showcase-grid');let frame=0,lastInput=0,samples=[],longFrames=[];
 if('PerformanceObserver' in window&&PerformanceObserver.supportedEntryTypes.includes('long-animation-frame')){
  new PerformanceObserver(list=>{for(const entry of list.getEntries())if(frame)longFrames.push({duration:entry.duration,forcedLayout:entry.scripts.reduce((total,s)=>total+(s.forcedStyleAndLayoutDuration||0),0)});}).observe({type:'long-animation-frame'});
 }
 function tick(time){
  samples.push({time,y:scrollY,x:rail.scrollLeft});
  if(time-lastInput<900){frame=requestAnimationFrame(tick);return;}
  frame=0;
  const gaps=samples.slice(1).map((s,i)=>s.time-samples[i].time).sort((a,b)=>a-b);
  const after=samples.find(s=>s.time>=lastInput+30)||samples[0],end=samples.at(-1);
  output.textContent=JSON.stringify({crt:{...document.getElementById('crt-surface')?.dataset},frames:samples.length,p50:Math.round(gaps[Math.floor(gaps.length*.5)]*100)/100,p95:Math.round(gaps[Math.floor(gaps.length*.95)]*100)/100,max:Math.round(Math.max(...gaps)*100)/100,over25ms:gaps.filter(n=>n>25).length,longFrames,driftAfter30ms:{x:end.x-after.x,y:end.y-after.y},start:samples[0],end,samples:samples.map(s=>({t:Math.round(s.time-lastInput),x:Math.round(s.x*100)/100,y:Math.round(s.y*100)/100}))});
 }
 function input(){lastInput=performance.now();if(!frame){samples=[];longFrames=[];frame=requestAnimationFrame(tick);}}
 addEventListener('wheel',input,{passive:true});addEventListener('pointerup',input,{passive:true});
})();
