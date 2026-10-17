/* Reference-matched analytical GPU lens for showcase visuals; real DOM stays interactive. */
(()=>{
 'use strict';
 const root=document.documentElement,grid=document.querySelector('#showcase-grid'),section=document.querySelector('#showcase'),contrast=matchMedia('(forced-colors: active)'),reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
 if(!grid||!section||!window.WebGL2RenderingContext||contrast.matches)return;
 if(root.dataset.crtShowcaseGpuInitialized==='true')return;
 root.dataset.crtShowcaseGpuInitialized='true';
 const inlineAssets=window.DreamShowcaseAssets||{};
 grid.querySelectorAll('img').forEach(image=>{const name=image.getAttribute('src')?.split('/').pop();if(inlineAssets[name])image.src=inlineAssets[name];});
 const output=document.createElement('canvas');output.className='crt-gpu-showcase-layer';output.setAttribute('aria-hidden','true');output.setAttribute('role','presentation');
 const scene=document.createElement('canvas'),ctx=scene.getContext('2d',{alpha:true});
 const gl=output.getContext('webgl2',{alpha:true,antialias:true,premultipliedAlpha:true,preserveDrawingBuffer:false,powerPreference:'high-performance'});
 if(!ctx||!gl)return;
 const vertex=`#version 300 es
 void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.0-1.0,0.0,1.0);}`;
 const fragment=`#version 300 es
 precision highp float;
 uniform sampler2D uScene;
 uniform vec2 uOutputSize;
 uniform float uCurvature;
 uniform float uChromaticStrength;
 out vec4 color;
 void main(){
  vec2 uv=gl_FragCoord.xy/uOutputSize;
  vec2 p=uv-vec2(.5);
  float r=length(p);
  float factor=(1.0-.3655*uCurvature)*(1.0+uCurvature*r*r*r);
  vec2 sourceUV=vec2(.5)+p*factor;
  float edge=min(min(sourceUV.x,sourceUV.y),min(1.0-sourceUV.x,1.0-sourceUV.y));
  float feather=max(fwidth(edge),.5/min(uOutputSize.x,uOutputSize.y));
  float coverage=smoothstep(-feather,feather,edge);
  float aspect=uOutputSize.x/uOutputSize.y;
  vec2 chromaticCoord=p*2.0*vec2(aspect,1.0)/max(aspect,1.0);
  float split=.001*length(chromaticCoord)*2.0*uChromaticStrength;
  vec4 center=texture(uScene,sourceUV);
  vec4 red=texture(uScene,sourceUV-vec2(0.0,split));
  vec4 blue=texture(uScene,sourceUV+vec2(0.0,split));
  color=vec4(red.r,center.g,blue.b,center.a)*coverage;
 }`;
 function shader(type,source){const value=gl.createShader(type);gl.shaderSource(value,source);gl.compileShader(value);if(!gl.getShaderParameter(value,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(value));return value;}
 let program,texture,vao,anisotropy,uniformSize,uniformCurvature,uniformChromatic,dirty=true,lastX=NaN,lastY=NaN,resizeToken=0,raf=0,hoverRaf=0,transitionEnd=0,active=false,failed=false,suspended=false;
 try{
  program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);vao=gl.createVertexArray();gl.bindVertexArray(vao);texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  anisotropy=gl.getExtension('EXT_texture_filter_anisotropic')||gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic')||gl.getExtension('MOZ_EXT_texture_filter_anisotropic');
  if(anisotropy){const maximum=gl.getParameter(anisotropy.MAX_TEXTURE_MAX_ANISOTROPY_EXT)||1;gl.texParameterf(gl.TEXTURE_2D,anisotropy.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(8,maximum));}
  uniformSize=gl.getUniformLocation(program,'uOutputSize');uniformCurvature=gl.getUniformLocation(program,'uCurvature');uniformChromatic=gl.getUniformLocation(program,'uChromaticStrength');
  gl.uniform1i(gl.getUniformLocation(program,'uScene'),0);gl.uniform1f(uniformCurvature,window.DreamLens?.curvature??.16);gl.uniform1f(uniformChromatic,.8);
 }catch(error){console.warn('Showcase GPU lens:',error.message);return;}
 function rounded(c,x,y,w,h,r){
  r=Math.max(0,Math.min(r,w/2,h/2));c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();
 }
 function box(rect){return {left:rect.left,top:rect.top,width:rect.width,height:rect.height,x:rect.left,y:rect.top,w:rect.width,h:rect.height};}
 function drawImage(image,rect,filter='none'){
  if(!image?.complete||!image.naturalWidth||rect.width<1||rect.height<1)return;
  ctx.save();ctx.filter=filter;ctx.drawImage(image,rect.left,rect.top,rect.width,rect.height);ctx.restore();
 }
 function productBackground(theme,rect){
  const palette=['#ffffff','#f3f5f4','#e2e2e2'];
  const g=ctx.createRadialGradient(rect.left+rect.width*.66,rect.top+rect.height*.58,rect.height*.04,rect.left+rect.width*.66,rect.top+rect.height*.58,rect.width*.82);
  g.addColorStop(0,palette[0]);g.addColorStop(.55,palette[1]);g.addColorStop(1,palette[2]);return g;
 }
 function paintDisc(card){
  const disc=card.querySelector('.work-disc'),img=disc?.querySelector('img');
  if(!disc||(!card.matches(':hover')&&!card.matches(':focus-within')))return;
  const r=disc.getBoundingClientRect();if(r.bottom<-80||r.top>innerHeight+80)return;
  const cx=r.left+r.width/2,cy=r.top+r.height/2,gr=ctx.createConicGradient(.2,cx,cy);
  ['#d8dce1','#f9fdff','#afc8d9','#efd4ef','#faffff','#abb8bd','#e1d4f0','#fffcea','#b8dcdf','#f8ebf4','#d8dce1'].forEach((color,i)=>gr.addColorStop(i/10,color));
  ctx.save();ctx.fillStyle=gr;ctx.beginPath();ctx.arc(cx,cy,r.width/2,0,Math.PI*2);ctx.fill();
  if(img?.complete&&img.naturalWidth){ctx.beginPath();ctx.arc(cx,cy,r.width*.42,0,Math.PI*2);ctx.clip();const ir=img.getBoundingClientRect();drawImage(img,ir);}
  ctx.restore();ctx.save();ctx.strokeStyle='#ffffffd9';ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy,r.width*.095,0,Math.PI*2);ctx.stroke();ctx.restore();
 }
 function paintCard(card){
  const cardRect=card.getBoundingClientRect();if(cardRect.bottom<-120||cardRect.top>innerHeight+120)return;
  const visual=card.querySelector('.work-visual'),cover=card.querySelector('.work-cover'),product=card.querySelector('.work-product'),logo=card.querySelector('.cover-wordmark'),caption=card.querySelector('.work-caption'),meta=card.querySelector('.work-meta'),title=meta?.querySelector('h3'),sub=meta?.querySelector('p');
  if(!visual||!cover||!meta)return;
  const v=box(visual.getBoundingClientRect()),m=box(meta.getBoundingClientRect()),radius=parseFloat(getComputedStyle(card).borderRadius)||18;
  ctx.save();rounded(ctx,cardRect.left,cardRect.top,cardRect.width,cardRect.height,radius);ctx.fillStyle='#151515';ctx.fill();ctx.clip();
  rounded(ctx,v.x,v.y,v.w,v.h,18);ctx.fillStyle=productBackground(card.querySelector('.work-open').dataset.category,v);ctx.fill();
  ctx.save();rounded(ctx,v.x,v.y,v.w,v.h,18);ctx.clip();
  const pr=product.getBoundingClientRect(),hoverVideo=card.querySelector('.work-hover-video');
  if(hoverVideo?.readyState>=2){drawImage(hoverVideo,box(hoverVideo.getBoundingClientRect()));}
  else if(card.matches('.is-previewing')){const phase=performance.now()/1000;ctx.save();ctx.translate(pr.left+pr.width/2,pr.top+pr.height/2);ctx.rotate(Math.sin(phase*1.4)*.035);ctx.scale(1+Math.sin(phase*1.1)*.025,1+Math.sin(phase*1.1)*.025);drawImage(product,{left:-pr.width/2,top:-pr.height/2,width:pr.width,height:pr.height},getComputedStyle(product).filter);ctx.restore();}
  else drawImage(product,pr,getComputedStyle(product).filter);
  const lr=logo.getBoundingClientRect();drawImage(logo,lr,getComputedStyle(logo).filter);
  const cs=getComputedStyle(caption),fontSize=parseFloat(cs.fontSize)||60,line=parseFloat(cs.lineHeight)||fontSize*.91;
  const lines=caption.innerText.split(/\n|\r/).map(value=>value.trim()).filter(Boolean),centerX=v.x+v.w/2;
  ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.fontKerning='normal';ctx.textRendering='geometricPrecision';ctx.font=`900 ${fontSize}px ${cs.fontFamily||'Impact, sans-serif'}`;ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetY=0;
  ctx.save();ctx.translate(centerX,v.y+v.h*.25+fontSize);ctx.rotate(-4*Math.PI/180);
  lines.forEach((text,index)=>{ctx.fillStyle='#171817';ctx.fillText(text.toUpperCase(),0,index*line);});
  ctx.restore();
  ctx.restore();
  ctx.fillStyle='#151515';ctx.fillRect(m.x,m.y,m.w,m.h);
  if(title){const r=title.getBoundingClientRect(),style=getComputedStyle(title);ctx.fontKerning='normal';ctx.textRendering='geometricPrecision';ctx.font=`${style.fontWeight} ${parseFloat(style.fontSize)||23}px ${style.fontFamily}`;ctx.textAlign='left';ctx.textBaseline='top';ctx.fillStyle='#f5f5f5';ctx.fillText(title.innerText,r.left,r.top);}
  if(sub){const r=sub.getBoundingClientRect(),style=getComputedStyle(sub);ctx.fontKerning='normal';ctx.textRendering='geometricPrecision';ctx.font=`${style.fontWeight} ${parseFloat(style.fontSize)||14}px ${style.fontFamily}`;ctx.textAlign='left';ctx.textBaseline='top';ctx.fillStyle='#a2a2a2';ctx.fillText(sub.innerText,r.left,r.top);}
  if(card.classList.contains('preview-load-error')){
   const label='VIDEO UNAVAILABLE';
   ctx.save();ctx.font='600 10px Arial,sans-serif';const labelWidth=ctx.measureText(label).width+18,labelX=v.x+14,labelY=v.y+v.h-16;
   ctx.save();rounded(ctx,v.x,v.y,v.w,v.h,18);ctx.clip();rounded(ctx,labelX,labelY-18,labelWidth,24,12);ctx.fillStyle='#431a1ae8';ctx.fill();ctx.fillStyle='#ffbcbc';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(label,labelX+9,labelY-6);ctx.restore();ctx.restore();
  }
  if(card.matches(':hover')||card.querySelector('.work-open:focus-visible')){const stroke=1.25;ctx.save();ctx.strokeStyle='#e89bd3';ctx.lineWidth=stroke;rounded(ctx,v.x+stroke/2,v.y+stroke/2,v.w-stroke,v.h-stroke,18);ctx.stroke();ctx.restore();}
  ctx.restore();
 }
 function size(){
  const width=Math.max(1,root.clientWidth),height=Math.max(1,innerHeight),dpr=Math.max(1,window.devicePixelRatio||1);
  const maxTexture=gl.getParameter(gl.MAX_TEXTURE_SIZE);
  const quality=window.DreamShowcaseQuality?.settings(width,height,dpr,maxTexture,navigator.deviceMemory,navigator.hardwareConcurrency);
  const outputRatio=quality?.outputRatio??Math.min(dpr,4,Math.sqrt(12000000/(width*height)),maxTexture/width,maxTexture/height);
  if(outputRatio<1){suspended=true;root.classList.remove('crt-gpu-showcase');output.remove();active=false;return;}
  suspended=false;
  const sourceRatio=quality?.sourceRatio??Math.min(outputRatio*1.5,Math.sqrt(12000000/(width*height)),maxTexture/width,maxTexture/height);
  const ow=Math.max(1,Math.round(width*outputRatio)),oh=Math.max(1,Math.round(height*outputRatio));
  const sw=Math.max(1,Math.round(width*sourceRatio)),sh=Math.max(1,Math.round(height*sourceRatio));
  if(output.width!==ow||output.height!==oh||scene.width!==sw||scene.height!==sh){output.width=ow;output.height=oh;scene.width=sw;scene.height=sh;dirty=true;}
  ctx.setTransform(sourceRatio,0,0,sourceRatio,0,0);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.clearRect(0,0,width,height);
  gl.viewport(0,0,ow,oh);gl.uniform2f(uniformSize,ow,oh);output.dataset.outputDpr=String(outputRatio);output.dataset.sourceDpr=String(sourceRatio);output.dataset.sourcePixels=String(quality?.sourcePixels??sw*sh);output.dataset.anisotropy=String(Boolean(anisotropy));
 }
 function render(){
  const cards=[...grid.querySelectorAll('.work-card')];if(failed||suspended||!cards.length)return false;
  const scroll=window.DreamScroll?.position?.()??{x:0,y:scrollY};
  if(!dirty&&scroll.x===lastX&&scroll.y===lastY)return false;
  dirty=false;lastX=scroll.x;lastY=scroll.y;
  const width=Math.max(1,root.clientWidth),height=Math.max(1,innerHeight),scale=scene.width/width;
  ctx.setTransform(scale,0,0,scale,0,0);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.clearRect(0,0,width,height);
  try{cards.forEach(paintDisc);cards.forEach(paintCard);}
  catch(error){failed=true;root.classList.remove('crt-gpu-showcase');output.remove();active=false;console.warn('Showcase GPU lens fallback:',error.message);return false;}
  try{
   gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
   gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,scene);gl.generateMipmap(gl.TEXTURE_2D);
   const uploadError=gl.getError();if(uploadError!==gl.NO_ERROR)throw Error('WebGL texture upload failed ('+uploadError+')');
   gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLES,0,3);
   const drawError=gl.getError();if(drawError!==gl.NO_ERROR)throw Error('WebGL draw failed ('+drawError+')');
  }catch(error){failed=true;root.classList.remove('crt-gpu-showcase');output.remove();active=false;console.warn('Showcase GPU lens fallback:',error.message);return false;}
  if(!active){document.body.append(output);root.classList.add('crt-gpu-showcase');active=true;}
  return false;
 }
 function animateFor(duration=700){
  if(reducedMotion.matches)duration=0;
  transitionEnd=Math.max(transitionEnd,performance.now()+duration);
  if(!raf)raf=requestAnimationFrame(function animate(time){raf=0;dirty=true;render();if(time<transitionEnd)raf=requestAnimationFrame(animate);});
 }
 function invalidate(){dirty=true;animateFor();}
 function resize(){if(resizeToken)return;resizeToken=requestAnimationFrame(()=>{resizeToken=0;size();render();});}
 size();render();
 output.addEventListener('webglcontextlost',event=>{event.preventDefault();failed=true;root.classList.remove('crt-gpu-showcase');output.remove();active=false;});
 window.DreamScroll?.onFrame(()=>render());
 addEventListener('resize',resize,{passive:true});addEventListener('pageshow',resize);
 if('ResizeObserver' in window)new ResizeObserver(resize).observe(section);
 let densityQuery;
 function watchDensity(){densityQuery?.removeEventListener?.('change',densityChanged);densityQuery?.removeListener?.(densityChanged);densityQuery=matchMedia(`(resolution: ${window.devicePixelRatio||1}dppx)`);if(densityQuery.addEventListener)densityQuery.addEventListener('change',densityChanged);else densityQuery.addListener?.(densityChanged);}
 function densityChanged(){watchDensity();resize();}watchDensity();contrast.addEventListener?.('change',()=>{if(contrast.matches){failed=true;root.classList.remove('crt-gpu-showcase');output.remove();active=false;}});
 function animateHover(){hoverRaf=0;dirty=true;render();if(grid.querySelector('.work-card.is-previewing'))hoverRaf=requestAnimationFrame(animateHover);}
 function startHoverAnimation(){dirty=true;render();if(!hoverRaf)hoverRaf=requestAnimationFrame(animateHover);}
 grid.addEventListener('pointerover',startHoverAnimation);grid.addEventListener('pointerout',event=>{invalidate();if(!event.relatedTarget?.closest?.('.work-card')){cancelAnimationFrame(hoverRaf);hoverRaf=0;}});grid.addEventListener('focusin',startHoverAnimation);grid.addEventListener('focusout',invalidate);
 grid.addEventListener('play',event=>{if(event.target.matches('.work-hover-video')&&event.target.requestVideoFrameCallback){const redraw=()=>{if(event.target.paused||event.target.ended)return;invalidate();event.target.requestVideoFrameCallback(redraw);};event.target.requestVideoFrameCallback(redraw);}},true);
 grid.addEventListener('load',invalidate,true);
 new MutationObserver(()=>{dirty=true;animateFor(1000);}).observe(grid,{attributes:true,attributeFilter:['data-view']});
 document.fonts?.ready?.then(invalidate);
})();
