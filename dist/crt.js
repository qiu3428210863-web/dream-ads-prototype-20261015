/* Live, viewport-bounded CRT: filter real DOM pixels without screenshots or image readback. */
(()=>{
 'use strict';
 const root=document.documentElement,lens=globalThis.DreamLens,svgNS='http://www.w3.org/2000/svg';
 const main=document.querySelector('main'),footer=document.querySelector('.footer'),header=document.querySelector('.header');
 const surface=document.createElement('div');surface.id='crt-surface';surface.className='crt-surface';surface.dataset.crtBuild='1.11.0';
 main.before(surface);surface.append(main,footer);
 const spacer=document.createElement('div');spacer.className='crt-spacer';spacer.setAttribute('aria-hidden','true');surface.before(spacer);
 const viewport=document.createElement('div');viewport.id='crt-viewport';viewport.className='crt-viewport';surface.before(viewport);viewport.append(surface);
 const defs=document.createElementNS(svgNS,'svg');defs.classList.add('crt-filter-defs');defs.setAttribute('aria-hidden','true');
 defs.innerHTML='<defs><filter id="crt-lens" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feImage preserveAspectRatio="none" result="field-raw"/><feGaussianBlur in="field-raw" stdDeviation="1.2" result="field"/><feDisplacementMap in="SourceGraphic" in2="field" xChannelSelector="R" yChannelSelector="G"/></filter></defs>';
 document.body.append(defs);
 const glass=document.createElement('div');glass.className='crt-glass';glass.setAttribute('aria-hidden','true');document.body.append(glass);
 const filter=defs.querySelector('filter'),map=defs.querySelector('feImage'),warp=defs.querySelector('feDisplacementMap');
 let width=0,height=0,surfaceTop=0,lastY=NaN,ready=false,redirecting=false,frame=0;
 const position=()=>window.DreamScroll?.position().y??scrollY;
 function measure(){
  const nextWidth=root.clientWidth,nextHeight=innerHeight;
  root.style.setProperty('--viewport-width',nextWidth+'px');
  spacer.style.height=surface.scrollHeight+'px';surfaceTop=spacer.getBoundingClientRect().top+scrollY;
  if(nextWidth!==width||nextHeight!==height){
   width=nextWidth;height=nextHeight;surface.dataset.crtStatus='building-field';
   try{
    const field=lens.field(width,height),canvas=document.createElement('canvas');canvas.width=field.width;canvas.height=field.height;
    const context=canvas.getContext('2d');if(!context)throw Error('Cannot create displacement field');
    const pixels=context.createImageData(field.width,field.height);pixels.data.set(field.pixels);context.putImageData(pixels,0,0);
    // Only generated numbers enter this canvas. Product files never enter a readback operation.
    map.setAttribute('href',canvas.toDataURL('image/png'));warp.setAttribute('scale',String(field.scale));
    for(const node of [filter,map]){node.setAttribute('x','0');node.setAttribute('y','0');node.setAttribute('width',String(width));node.setAttribute('height',String(height));}
    ready=true;root.classList.add('crt-enabled');surface.dataset.crtStatus='ready';surface.dataset.crtRenderer='svg-live-viewport';
    surface.dataset.crtCurvature=String(lens.curvature);surface.dataset.crtProtocol=location.protocol;delete surface.dataset.crtError;
   }catch(error){ready=false;root.classList.remove('crt-enabled');surface.dataset.crtStatus='error';surface.dataset.crtError=error.message;console.warn('CRT lens:',error.message);}
  }
  lastY=NaN;draw();
 }
 function draw(){
  const y=position();
  if(y!==lastY){surface.style.setProperty('--crt-offset-y',(surfaceTop-y)+'px');lastY=y;}
  return false;
 }
 function wake(){
  if(window.DreamScroll){window.DreamScroll.requestFrame();return;}
  if(!frame)frame=requestAnimationFrame(()=>{frame=0;draw();});
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
 addEventListener('scroll',wake,{passive:true});addEventListener('resize',measure,{passive:true});addEventListener('pageshow',measure);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){measure();wake();}});
 if('ResizeObserver' in window)new ResizeObserver(measure).observe(surface);
 measure();
})();
