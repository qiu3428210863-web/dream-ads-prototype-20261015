/* Live, viewport-bounded CRT: filter real DOM pixels without screenshots or image readback. */
(()=>{
 'use strict';
 const root=document.documentElement,lens=globalThis.DreamLens,svgNS='http://www.w3.org/2000/svg';
 const main=document.querySelector('main'),footer=document.querySelector('.footer'),header=document.querySelector('.header');
 const surface=document.createElement('div');surface.id='crt-surface';surface.className='crt-surface';surface.dataset.crtBuild='1.14.0';
 main.before(surface);surface.append(main,footer);
 const spacer=document.createElement('div');spacer.className='crt-spacer';spacer.setAttribute('aria-hidden','true');surface.before(spacer);
 const viewport=document.createElement('div');viewport.id='crt-viewport';viewport.className='crt-viewport';surface.before(viewport);viewport.append(surface);
 const defs=document.createElementNS(svgNS,'svg');defs.classList.add('crt-filter-defs');defs.setAttribute('aria-hidden','true');
 defs.innerHTML='<defs><filter id="crt-lens" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB"></filter></defs>';
 document.body.append(defs);
 const glass=document.createElement('div');glass.className='crt-glass';glass.setAttribute('aria-hidden','true');document.body.append(glass);
 const filter=defs.querySelector('filter'),contrast=matchMedia('(forced-colors: active)');
 let width=0,height=0,surfaceTop=0,lastY=NaN,ready=false,redirecting=false,frame=0,resizeFrame=0,renderKey='',densityQuery;
 let tapCap=4,previousTime=NaN,budgetFrames=0,slowFrames=0;
 const position=()=>window.DreamScroll?.position().y??scrollY;
 function measure(){
  const nextWidth=Math.max(1,root.clientWidth),nextHeight=Math.max(1,innerHeight);
  root.style.setProperty('--viewport-width',nextWidth+'px');
  spacer.style.height=surface.scrollHeight+'px';surfaceTop=spacer.getBoundingClientRect().top+scrollY;
  const density=window.devicePixelRatio||1;
  const nextKey=[nextWidth,nextHeight,density,contrast.matches].join(':');
  if(nextKey!==renderKey){
   renderKey=nextKey;
   width=nextWidth;height=nextHeight;surface.dataset.crtStatus='building-field';
   try{
    // Unsupported effects must leave readable, interactive DOM, on every operating system.
    if(contrast.matches||!window.CSS?.supports('filter','url(#crt-lens)')||typeof window.SVGFEDisplacementMapElement!=='function'){
     ready=false;root.classList.remove('crt-enabled');surface.dataset.crtStatus='native';surface.dataset.crtRenderer='native-dom';
     surface.dataset.crtSamples='0';surface.dataset.crtFallback=contrast.matches?'forced-colors':'unsupported-filter';lastY=NaN;draw();return;
    }
    const quality=lens.quality(width,height,density,navigator.deviceMemory,navigator.hardwareConcurrency);
    if(typeof window.SVGFECompositeElement!=='function')quality.taps=[[0,0]];
    if(quality.taps.length>tapCap){const d=.25/quality.pixelRatio;quality.taps=tapCap===2?[[-d,-d],[d,d]]:[[0,0]];}
    filter.innerHTML=lens.pipeline(quality.taps.length);
    const maps=[...filter.querySelectorAll('feImage')],warps=[...filter.querySelectorAll('feDisplacementMap')];
    filter.setAttribute('x','0');filter.setAttribute('y','0');filter.setAttribute('width',String(width));filter.setAttribute('height',String(height));
    for(let i=0;i<maps.length;i++){
     const field=lens.field(width,height,quality,quality.taps[i]),canvas=document.createElement('canvas');canvas.width=field.width;canvas.height=field.height;
     const context=canvas.getContext('2d');if(!context)throw Error('Cannot create displacement field');
     const pixels=context.createImageData(field.width,field.height);pixels.data.set(field.pixels);context.putImageData(pixels,0,0);
     // Only generated numbers enter this canvas. Product files never enter a readback operation.
     const url=canvas.toDataURL('image/png');maps[i].setAttribute('href',url);
     maps[i].setAttributeNS('http://www.w3.org/1999/xlink','xlink:href',url);
     warps[i].setAttribute('scale',String(field.scale));
     for(const node of [maps[i],warps[i]]){node.setAttribute('x','0');node.setAttribute('y','0');node.setAttribute('width',String(width));node.setAttribute('height',String(height));}
    }
    ready=true;root.classList.add('crt-enabled');surface.dataset.crtStatus='ready';surface.dataset.crtRenderer='svg-live-viewport';
    surface.dataset.crtCurvature=String(lens.curvature);surface.dataset.crtProtocol=location.protocol;
    surface.dataset.crtSamples=String(quality.taps.length);surface.dataset.crtPixelRatio=String(quality.pixelRatio);
    surface.dataset.crtField=quality.width+'x'+quality.height;
    delete surface.dataset.crtError;delete surface.dataset.crtFallback;
   }catch(error){ready=false;renderKey='';root.classList.remove('crt-enabled');surface.dataset.crtStatus='native';surface.dataset.crtRenderer='native-dom';surface.dataset.crtSamples='0';surface.dataset.crtError=error.message;console.warn('CRT lens:',error.message);}
  }
  lastY=NaN;draw();
 }
 function checkFrameBudget(time){
  if(!Number.isFinite(time))return;
  const gap=time-previousTime;previousTime=time;
  if(!ready||document.hidden||!Number.isFinite(gap)||gap<=0||gap>100){budgetFrames=slowFrames=0;return;}
  if(gap>28)slowFrames++;
  if(++budgetFrames<24)return;
  const count=Number(surface.dataset.crtSamples),shouldReduce=slowFrames>=12&&count>1;
  budgetFrames=slowFrames=0;
  // One-way adaptation avoids quality oscillation or rebuilding a field on every scroll frame.
  if(shouldReduce){tapCap=count/2;renderKey='';surface.dataset.crtQualityReason='frame-budget';measure();}
 }
 function draw(time){
  checkFrameBudget(time);
  const y=position();
  if(y!==lastY){surface.style.setProperty('--crt-offset-y',(surfaceTop-y)+'px');lastY=y;}
  return false;
 }
 function wake(){
  if(window.DreamScroll){window.DreamScroll.requestFrame();return;}
  if(!frame)frame=requestAnimationFrame(()=>{frame=0;draw();});
 }
 function scheduleMeasure(){
  if(resizeFrame)return;
  resizeFrame=requestAnimationFrame(()=>{resizeFrame=0;measure();});
 }
 // SVG filters change pixels but not DOM hit boxes; remap clicks to source coordinates.
 viewport.addEventListener('click',event=>{
  if(!ready||redirecting||event.detail===0)return;
  const point=lens.sample(event.clientX,event.clientY,width,height),candidate=document.elementFromPoint(point.x,point.y)?.closest('button,a,summary'),original=event.target.closest('button,a,summary');
  if(candidate===original)return;
  event.preventDefault();event.stopImmediatePropagation();
  if(candidate&&surface.contains(candidate)){redirecting=true;candidate.focus({preventScroll:true});candidate.click();redirecting=false;}
 },true);
 viewport.addEventListener('focusin',event=>{
  if(!event.target.matches(':focus-visible'))return;
  const rect=event.target.getBoundingClientRect(),top=header.getBoundingClientRect().height;
  if(rect.top<top||rect.bottom>height)window.DreamScroll?.scrollTo(position()+rect.top-top-24);
 });
 window.DreamScroll?.onFrame(draw);
 function watchDensity(){
  densityQuery?.removeEventListener?.('change',densityChanged);
  densityQuery?.removeListener?.(densityChanged);
  densityQuery=matchMedia(`(resolution: ${window.devicePixelRatio||1}dppx)`);
  if(densityQuery.addEventListener)densityQuery.addEventListener('change',densityChanged);
  else densityQuery.addListener?.(densityChanged);
 }
 function densityChanged(){watchDensity();scheduleMeasure();}
 watchDensity();contrast.addEventListener?.('change',measure);
 addEventListener('scroll',wake,{passive:true});addEventListener('resize',scheduleMeasure,{passive:true});addEventListener('pageshow',scheduleMeasure);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){scheduleMeasure();wake();}});
 if('ResizeObserver' in window)new ResizeObserver(scheduleMeasure).observe(surface);
 measure();
})();
