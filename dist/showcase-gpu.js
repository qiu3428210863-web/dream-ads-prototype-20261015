/* Visible-card GPU renderer. DOM remains the accessible and interactive hit layer. */
(()=>{
 'use strict';
 const root=document.documentElement,grids=[...document.querySelectorAll('.showcase-grid')];
 const nativeCards=matchMedia('(max-width:900px), (hover:none), (pointer:coarse)');
 const hoverInput=matchMedia('(hover:hover) and (pointer:fine)');
 const contrast=matchMedia('(forced-colors: active)'),reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
 if(!grids.length||!window.WebGL2RenderingContext||contrast.matches||root.dataset.showcaseGpuInitialized==='true')return;
 root.dataset.showcaseGpuInitialized='true';
 const inlineAssets=window.DreamShowcaseAssets||{};
 grids.forEach(grid=>grid.querySelectorAll('img').forEach(image=>{const name=image.getAttribute('src')?.split('/').pop();if(inlineAssets[name])image.src=inlineAssets[name];}));
 const cards=grids.flatMap(grid=>[...grid.querySelectorAll('.work-card')].map((card,index)=>({
  card,owner:grid,index,disc:card.querySelector('.work-disc'),discImage:card.querySelector('.work-disc img'),
  visual:card.querySelector('.work-visual'),cover:card.querySelector('.work-cover'),product:card.querySelector('.work-product'),
  badge:card.querySelector('.work-example-badge'),logo:card.querySelector('.cover-wordmark'),caption:card.querySelector('.work-caption'),meta:card.querySelector('.work-meta'),
  title:card.querySelector('.work-meta h3'),sub:card.querySelector('.work-meta p'),open:card.querySelector('.work-open'),hoverVideo:card.querySelector('.work-hover-video'),
  canvas:null,ctx:null,texture:null,textureWidth:0,textureHeight:0,ratio:0,dirty:true,lastVisible:0,hoverUntil:0
 })));
 const output=document.createElement('canvas');output.className='showcase-gpu-canvas';output.setAttribute('aria-hidden','true');output.setAttribute('role','presentation');
 const gl=output.getContext('webgl2',{alpha:true,antialias:true,premultipliedAlpha:true,preserveDrawingBuffer:false,powerPreference:'high-performance'});
 if(!gl)return;
 const vertex=`#version 300 es
 precision highp float;
 in vec4 aVertex;
 uniform vec2 uViewport;
 uniform float uCurvature;
 out vec2 vUv;
 void main(){
  vec2 p=aVertex.xy/uViewport-.5;
  float sourceRadius=length(p);
  float radius=sourceRadius/max(1.0-.3655*uCurvature,.001);
  float compensation=1.0-.3655*uCurvature;
  for(int i=0;i<4;i++){
   float r2=radius*radius;
   float r3=r2*radius;
   float f=compensation*(radius+uCurvature*radius*r3);
   float derivative=compensation*(1.0+4.0*uCurvature*r3);
   radius-=(f-sourceRadius)/max(derivative,.001);
  }
  vec2 warped=sourceRadius>0.00001?p*(radius/sourceRadius):p;
  vec2 screen=(warped+.5)*uViewport;
  gl_Position=vec4(screen.x/uViewport.x*2.0-1.0,1.0-screen.y/uViewport.y*2.0,0.0,1.0);
  vUv=aVertex.zw;
 }`;
 const fragment=`#version 300 es
 precision highp float;
 uniform sampler2D uCard;
 in vec2 vUv;
 uniform float uAlpha;
 out vec4 color;
 void main(){color=texture(uCard,vUv)*uAlpha;}`;
 function compile(type,source){const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));return shader;}
 let program,buffer,uniformViewport,uniformCurvature,uniformCard,uniformAlpha,active=false,failed=false,suspended=false,raf=0,hoverRaf=0,resizeRaf=0,cleanupFrame=0;
 try{
  program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);const vao=gl.createVertexArray();gl.bindVertexArray(vao);buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  const position=gl.getAttribLocation(program,'aVertex');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,4,gl.FLOAT,false,16,0);
  uniformViewport=gl.getUniformLocation(program,'uViewport');uniformCurvature=gl.getUniformLocation(program,'uCurvature');uniformCard=gl.getUniformLocation(program,'uCard');uniformAlpha=gl.getUniformLocation(program,'uAlpha');
  gl.uniform1i(uniformCard,0);gl.uniform1f(uniformCurvature,.16);
  gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
 }catch(error){failed=true;console.warn('Showcase GPU renderer:',error.message);return;}

 const maxTextureSize=gl.getParameter(gl.MAX_TEXTURE_SIZE);
 let viewportWidth=0,viewportHeight=0,outputRatio=1;
 function resize(){
  // Fixed main-thread canvas cannot track compositor-driven mobile momentum atomically.
  // Restore live DOM before native scrolling; retain GPU curves on fine-pointer desktops.
  if(nativeCards.matches){suspended=true;deactivate();return;}
  const width=Math.max(1,root.clientWidth),height=Math.max(1,innerHeight),dpr=Math.max(1,window.devicePixelRatio||1);
  outputRatio=window.DreamShowcaseQuality?.outputRatio(width,height,dpr,maxTextureSize)??Math.min(dpr,3,Math.sqrt(12_000_000/(width*height)),maxTextureSize/width,maxTextureSize/height);
  if(outputRatio<1){suspended=true;root.classList.remove('showcase-gpu-active');output.remove();active=false;return;}
  suspended=false;viewportWidth=width;viewportHeight=height;
  const pixelWidth=Math.max(1,Math.round(width*outputRatio)),pixelHeight=Math.max(1,Math.round(height*outputRatio));
  if(output.width!==pixelWidth||output.height!==pixelHeight){output.width=pixelWidth;output.height=pixelHeight;}
  gl.viewport(0,0,pixelWidth,pixelHeight);gl.uniform2f(uniformViewport,width,height);
  output.dataset.outputDpr=String(outputRatio);output.dataset.renderer='visible-card-meshes';
  cards.forEach(item=>{item.dirty=true;});
  render();
 }
 function ensureCanvas(item,rect,bounds){
  const ratio=window.DreamShowcaseQuality?.cardRatio(rect.width,rect.height,window.devicePixelRatio||1,maxTextureSize,navigator.deviceMemory,navigator.hardwareConcurrency)??Math.min((window.devicePixelRatio||1)*1.5,3,Math.sqrt(2_500_000/Math.max(1,rect.width*rect.height)));
  const width=Math.max(1,Math.ceil(bounds.width*ratio)),height=Math.max(1,Math.ceil(bounds.height*ratio));
  if(!item.canvas){item.canvas=document.createElement('canvas');item.ctx=item.canvas.getContext('2d',{alpha:true});}
  if(!item.ctx)return false;
  if(item.canvas.width!==width||item.canvas.height!==height||item.ratio!==ratio){
   item.canvas.width=width;item.canvas.height=height;item.ratio=ratio;item.dirty=true;
   if(item.texture){gl.deleteTexture(item.texture);item.texture=null;}
  }
  if(!item.texture){item.texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,item.texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);}
  return true;
 }
 let ctx=null,frame=null;
 function layoutRect(rect){
  if(!frame)return {left:rect.left,top:rect.top,width:rect.width,height:rect.height,right:rect.right,bottom:rect.bottom};
  const left=frame.baseLeft+(rect.left-frame.screen.left)/frame.scaleX,top=frame.baseTop+(rect.top-frame.screen.top)/frame.scaleY,width=rect.width/frame.scaleX,height=rect.height/frame.scaleY;
  return {left,top,width,height,right:left+width,bottom:top+height};
 }
 function roundRect(c,x,y,w,h,r){r=Math.max(0,Math.min(r,w/2,h/2));c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
 function drawImage(image,rect,filter='none'){
  const drawable=image&&(image.videoWidth>0&&image.videoHeight>0||image.complete&&image.naturalWidth>0);
  if(!drawable||rect.width<1||rect.height<1)return;
  const sourceWidth=image.videoWidth||image.naturalWidth,sourceHeight=image.videoHeight||image.naturalHeight,scale=Math.max(rect.width/sourceWidth,rect.height/sourceHeight),cropWidth=rect.width/scale,cropHeight=rect.height/scale;
  ctx.save();ctx.filter=filter;ctx.drawImage(image,(sourceWidth-cropWidth)/2,(sourceHeight-cropHeight)/2,cropWidth,cropHeight,rect.left,rect.top,rect.width,rect.height);ctx.restore();
 }
 function productBackground(){return getComputedStyle(root).getPropertyValue('--ui-surface').trim()||'#151515';}
 function paintDisc(parts){
  const {disc,discImage:img,card,owner}=parts,hero=owner.classList.contains('hero-card-grid');if(!disc||hero&&card.matches(':focus-within')||(!card.matches(':hover')&&!card.matches(':focus-within')))return;
  const r=layoutRect(disc.getBoundingClientRect());if(r.bottom<-120||r.top>innerHeight+120)return;
  const cx=r.left+r.width/2,cy=r.top+r.height/2;
  const colors=['#d8dce1','#f9fdff','#afc8d9','#efd4ef','#faffff','#abb8bd','#e1d4f0','#fffcea','#b8dcdf','#f8ebf4','#d8dce1'];
  const gradient=ctx.createConicGradient?ctx.createConicGradient(.2,cx,cy):ctx.createRadialGradient(cx-r.width*.2,cy-r.height*.3,0,cx,cy,r.width/2);
  colors.forEach((color,i)=>gradient.addColorStop(i/(colors.length-1),color));
  ctx.save();ctx.fillStyle=gradient;ctx.beginPath();ctx.arc(cx,cy,r.width/2,0,Math.PI*2);ctx.fill();
  if(img?.complete&&img.naturalWidth){ctx.beginPath();ctx.arc(cx,cy,r.width*.42,0,Math.PI*2);ctx.clip();drawImage(img,layoutRect(img.getBoundingClientRect()));}
  ctx.restore();ctx.save();ctx.strokeStyle='#ffffffd9';ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy,r.width*.095,0,Math.PI*2);ctx.stroke();ctx.restore();
 }
 function paintFeedback(card){
  const box=card.querySelector(':scope > .media-feedback');if(!box||box.hidden)return;
  const r=layoutRect(box.getBoundingClientRect()),style=getComputedStyle(box);ctx.save();roundRect(ctx,r.left,r.top,r.width,r.height,parseFloat(style.borderRadius)||12);ctx.fillStyle=style.backgroundColor;ctx.fill();ctx.strokeStyle=style.borderTopColor;ctx.lineWidth=1;ctx.stroke();
  const message=box.querySelector('p'),button=box.querySelector('button');
  if(message){const p=layoutRect(message.getBoundingClientRect()),s=getComputedStyle(message),lineHeight=parseFloat(s.lineHeight)||18;ctx.font=`${s.fontWeight} ${parseFloat(s.fontSize)||13}px ${s.fontFamily}`;ctx.fillStyle=s.color;ctx.textAlign='left';ctx.textBaseline='top';let line='',y=p.top;const flush=()=>{ctx.fillText(line.trim(),p.left,y);line='';y+=lineHeight;};for(const word of message.textContent.split(/(\s+)/)){if(line&&ctx.measureText(line+word).width>p.width)flush();for(const character of word){if(line&&ctx.measureText(line+character).width>p.width)flush();line+=character;}}if(line)flush();}
  if(button&&!button.hidden){const b=layoutRect(button.getBoundingClientRect()),s=getComputedStyle(button);roundRect(ctx,b.left,b.top,b.width,b.height,parseFloat(s.borderRadius)||20);ctx.fillStyle=s.backgroundColor;ctx.fill();ctx.fillStyle=s.color;ctx.font=`${s.fontWeight} ${parseFloat(s.fontSize)||13}px ${s.fontFamily}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(button.textContent,b.left+b.width/2,b.top+b.height/2);}
  ctx.restore();
 }
 function paintCard(parts,cardRect){
  const {card,owner,visual,cover,product,logo,caption,meta,title,sub}=parts;if(!visual||!cover||!meta)return;const hero=owner.classList.contains('hero-card-grid');
  const v=layoutRect(visual.getBoundingClientRect()),m=layoutRect(meta.getBoundingClientRect()),radius=parseFloat(getComputedStyle(card).borderRadius)||18,visualRadius=parseFloat(getComputedStyle(visual).borderRadius)||18;
  ctx.save();roundRect(ctx,cardRect.left,cardRect.top,cardRect.width,cardRect.height,radius);if(!hero){ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--ui-surface').trim()||'#151515';ctx.fill();}ctx.clip();
  roundRect(ctx,v.left,v.top,v.width,v.height,visualRadius);ctx.fillStyle=productBackground(v);ctx.fill();ctx.save();roundRect(ctx,v.left,v.top,v.width,v.height,visualRadius);ctx.clip();
  const hoverVideo=parts.hoverVideo;
  if(card.classList.contains('is-previewing')&&!hoverVideo?.paused&&hoverVideo?.readyState>=2)drawImage(hoverVideo,layoutRect(hoverVideo.getBoundingClientRect()));
  else{const pr=layoutRect(product.getBoundingClientRect());drawImage(product,pr,getComputedStyle(product).filter);}
  if(getComputedStyle(logo).display!=='none')drawImage(logo,layoutRect(logo.getBoundingClientRect()),getComputedStyle(logo).filter);
  if(getComputedStyle(caption).display!=='none'){const style=getComputedStyle(caption),fontSize=parseFloat(style.fontSize)||60,line=parseFloat(style.lineHeight)||fontSize*.91;
   const lines=caption.innerText.split(/\n|\r/).map(value=>value.trim()).filter(Boolean),centerX=v.left+v.width/2;
   ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.fontKerning='normal';ctx.font=`900 ${fontSize}px ${style.fontFamily||'Impact, sans-serif'}`;
   ctx.save();ctx.translate(centerX,v.top+v.height*.25+fontSize);ctx.rotate(-4*Math.PI/180);lines.forEach((text,index)=>{ctx.fillStyle='#171817';ctx.fillText(text.toUpperCase(),0,index*line);});ctx.restore();}ctx.restore();
  if(parts.badge&&!hero){const r=layoutRect(parts.badge.getBoundingClientRect()),s=getComputedStyle(parts.badge);ctx.save();roundRect(ctx,r.left,r.top,r.width,r.height,parseFloat(s.borderRadius)||8);ctx.fillStyle=s.backgroundColor;ctx.fill();ctx.font=`${s.fontWeight} ${parseFloat(s.fontSize)||12}px ${s.fontFamily}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=s.color;ctx.fillText(parts.badge.textContent,r.left+r.width/2,r.top+r.height/2);ctx.restore();}
  if(!hero){ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--ui-surface').trim()||'#151515';ctx.fillRect(m.left,m.top,m.width,m.height);}
  if(title&&!hero){const r=layoutRect(title.getBoundingClientRect()),s=getComputedStyle(title);ctx.font=`${s.fontWeight} ${parseFloat(s.fontSize)||23}px ${s.fontFamily}`;ctx.textAlign='left';ctx.textBaseline='top';ctx.fillStyle=s.color;ctx.fillText(title.innerText,r.left,r.top);}
  if(sub&&getComputedStyle(sub).display!=='none'){const r=layoutRect(sub.getBoundingClientRect()),s=getComputedStyle(sub);ctx.font=`${s.fontWeight} ${parseFloat(s.fontSize)||14}px ${s.fontFamily}`;ctx.textAlign='left';ctx.textBaseline='top';ctx.fillStyle=s.color;ctx.fillText(sub.innerText,r.left,r.top);}
  const loader=card.querySelector('.media-loader');if(loader&&!loader.hidden)window.DreamMediaLoader?.draw(ctx,v,performance.now(),reducedMotion.matches);
  paintFeedback(card);
  const progress=Math.max(0,Math.min(1,Number(card.dataset.playbackProgress)||0));
  if(progress>0){const gap=6,stroke=2.25,x=v.left-gap+stroke/2,y=v.top-gap+stroke/2,w=v.width+gap*2-stroke,h=v.height+gap*2-stroke,r=24,perimeter=2*(w+h-4*r)+2*Math.PI*r;ctx.save();ctx.strokeStyle='#e89bd3';ctx.lineWidth=stroke;ctx.lineCap='round';if(progress<.999)ctx.setLineDash([perimeter*progress,perimeter*(1-progress)]);roundRect(ctx,x,y,w,h,r);ctx.stroke();ctx.restore();}
  else if(card.matches(':hover')||parts.open?.matches(':focus-visible')){const gap=6,stroke=1.25;ctx.save();ctx.strokeStyle='#e89bd3';ctx.lineWidth=stroke;roundRect(ctx,v.left-gap+stroke/2,v.top-gap+stroke/2,v.width+gap*2-stroke,v.height+gap*2-stroke,24);ctx.stroke();ctx.restore();}
  ctx.restore();
 }
 function prepareFrame(item,rect){
  const layoutWidth=item.card.offsetWidth||rect.width,layoutHeight=item.card.offsetHeight||rect.height;
  const scaleX=rect.width/Math.max(1,layoutWidth),scaleY=rect.height/Math.max(1,layoutHeight);
  const baseLeft=rect.left+(rect.width-layoutWidth)/2,baseTop=rect.top+(rect.height-layoutHeight)/2;
  frame={screen:rect,baseLeft,baseTop,scaleX,scaleY};
  const layoutCard={left:baseLeft,top:baseTop,width:layoutWidth,height:layoutHeight,right:baseLeft+layoutWidth,bottom:baseTop+layoutHeight};
  // Reserve disc space once; hover must not resize and recreate the GPU texture.
  const bleed=Math.ceil(layoutWidth*.18)+12,textureTop=baseTop-bleed;
  return {layoutCard,textureBounds:{left:baseLeft,top:textureTop,width:layoutWidth,height:layoutHeight+bleed},displayBounds:{left:rect.left,top:rect.top-bleed*scaleY,width:rect.width,height:rect.height+bleed*scaleY}};
 }
 function updateTexture(item,rect,bounds,layoutCard){
  if(!ensureCanvas(item,layoutCard,bounds))return false;
   if(item.dirty){
   ctx=item.ctx;ctx.setTransform(item.ratio,0,0,item.ratio,-bounds.left*item.ratio,-bounds.top*item.ratio);ctx.clearRect(bounds.left,bounds.top,bounds.width,bounds.height);
   paintDisc(item);paintCard(item,layoutCard);item.dirty=false;item.uploadDirty=true;
  }
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,item.texture);
  try{
   if(item.textureWidth!==item.canvas.width||item.textureHeight!==item.canvas.height){
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,item.canvas);item.textureWidth=item.canvas.width;item.textureHeight=item.canvas.height;item.uploadDirty=false;
   }else if(item.uploadDirty){gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,gl.RGBA,gl.UNSIGNED_BYTE,item.canvas);item.uploadDirty=false;}
  }catch(error){failed=true;deactivate();return false;}
  return true;
 }
 const columns=12,rows=8,meshData=new Float32Array(columns*rows*6*4);
 gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,meshData.byteLength,gl.DYNAMIC_DRAW);
 function mesh(rect,bounds){
  const data=meshData;let offset=0;
  const point=(x,y,u,v)=>{data[offset++]=bounds.left+x*bounds.width;data[offset++]=bounds.top+y*bounds.height;data[offset++]=u;data[offset++]=v;};
  for(let y=0;y<rows;y++)for(let x=0;x<columns;x++){
   const x0=x/columns,x1=(x+1)/columns,y0=y/rows,y1=(y+1)/rows;
   point(x0,y0,x0,y0);point(x1,y0,x1,y0);point(x0,y1,x0,y1);point(x0,y1,x0,y1);point(x1,y0,x1,y0);point(x1,y1,x1,y1);
  }
  return data;
 }
 function render(){
  if(failed||suspended||!cards.length)return false;
  const visibleGrids=new Set(grids.filter(grid=>{const rect=grid.getBoundingClientRect();return rect.bottom>0&&rect.top<innerHeight&&getComputedStyle(grid).visibility!=='hidden';}));
  if(!visibleGrids.size){deactivate();return false;}
  const activeCards=cards.filter(item=>visibleGrids.has(item.owner)&&(item.owner.dataset.view==='grid'||item.index<5)),margin=0;
  const visible=activeCards.map(item=>({item,rect:item.card.getBoundingClientRect()})).filter(({rect})=>rect.bottom>-margin&&rect.top<innerHeight+margin&&rect.right>-margin&&rect.left<viewportWidth+margin&&rect.width>0&&rect.height>0);
  if(!visible.length){deactivate();return false;}
  gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(program);gl.uniform2f(uniformViewport,viewportWidth,viewportHeight);
  for(const {item,rect} of visible){
   const alpha=Number(getComputedStyle(item.card).opacity);if(Number.isFinite(alpha)&&alpha<=.01)continue;
   const {layoutCard,textureBounds,displayBounds}=prepareFrame(item,rect);if(textureBounds.height<=0)continue;item.lastVisible=performance.now();if(!updateTexture(item,rect,textureBounds,layoutCard)){if(failed)return false;continue;}
   gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferSubData(gl.ARRAY_BUFFER,0,mesh(rect,displayBounds));gl.uniform1f(uniformAlpha,Number.isFinite(alpha)?alpha:1);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,item.texture);gl.drawArrays(gl.TRIANGLES,0,columns*rows*6);
  }
  if(!active){document.body.append(output);root.classList.add('showcase-gpu-active');active=true;}
  if(++cleanupFrame%60===0)evictTextures();
  return false;
 }
 function evictTextures(){const now=performance.now();for(const item of cards)if(item.texture&&now-item.lastVisible>1800){gl.deleteTexture(item.texture);item.texture=null;item.textureWidth=item.textureHeight=0;item.dirty=true;if(item.canvas){item.canvas.width=0;item.canvas.height=0;item.ctx=null;item.canvas=null;}}}
 function deactivate(){if(active){root.classList.remove('showcase-gpu-active');output.remove();active=false;}for(const item of cards)if(item.texture){gl.deleteTexture(item.texture);item.texture=null;item.textureWidth=item.textureHeight=0;item.dirty=true;if(item.canvas){item.canvas.width=0;item.canvas.height=0;item.ctx=null;item.canvas=null;}}}
 function invalidate(item){if(item)item.dirty=true;else cards.forEach(card=>card.dirty=true);render();}
 function stopHoverVideoFrames(item){item.videoFrameGeneration=(item.videoFrameGeneration||0)+1;if(item.videoFrameToken){if(item.hoverVideo.cancelVideoFrameCallback)item.hoverVideo.cancelVideoFrameCallback(item.videoFrameToken);else cancelAnimationFrame(item.videoFrameToken);}item.videoFrameToken=0;}
 function startHoverVideoFrames(item){stopHoverVideoFrames(item);const media=item.hoverVideo,generation=item.videoFrameGeneration;const tick=()=>{if(generation!==item.videoFrameGeneration)return;item.videoFrameToken=0;if(media.paused||media.ended)return;item.dirty=true;render();item.videoFrameToken=media.requestVideoFrameCallback?media.requestVideoFrameCallback(tick):requestAnimationFrame(tick);};tick();}
 function markHoverFrames(now){let activeHover=false;for(const card of cards)if(card.hoverUntil>now){card.dirty=true;activeHover=true;}return activeHover;}
 function animateHover(item){if(!item)return;item.hoverUntil=performance.now()+(reducedMotion.matches?0:720);item.dirty=true;render();if(reducedMotion.matches||hoverRaf||raf)return;const tick=now=>{const activeHover=markHoverFrames(now);render();if(activeHover&&!raf)hoverRaf=requestAnimationFrame(tick);else hoverRaf=0;};hoverRaf=requestAnimationFrame(tick);}
 function animateLayout(){if(reducedMotion.matches)return;cancelAnimationFrame(raf);if(hoverRaf){cancelAnimationFrame(hoverRaf);hoverRaf=0;}const end=performance.now()+920;const tick=now=>{const activeHover=markHoverFrames(now);render();if(performance.now()<end||activeHover)raf=requestAnimationFrame(tick);else raf=0;};raf=requestAnimationFrame(tick);}
 let themeFrame=0;
 function animateTheme(){cancelAnimationFrame(themeFrame);const end=performance.now()+740;const tick=()=>{cards.forEach(item=>{item.dirty=true;});render();themeFrame=performance.now()<end?requestAnimationFrame(tick):0;};tick();}
 function scheduleResize(){if(resizeRaf)return;resizeRaf=requestAnimationFrame(()=>{resizeRaf=0;resize();});}
 let nativeFrame=0;
 function scheduleRender(){if(!nativeFrame)nativeFrame=requestAnimationFrame(()=>{nativeFrame=0;render();});}
 let loaderFrame=0;
 function animateLoaders(){
  if(loaderFrame)return;
  const tick=()=>{loaderFrame=0;let visibleLoading=false;for(const item of cards){if(item.hoverVideo?.dataset.feedbackState==='loading'){const r=item.card.getBoundingClientRect();if(r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth){item.dirty=true;visibleLoading=true;}}}render();if(visibleLoading&&!suspended&&!document.hidden&&!reducedMotion.matches)loaderFrame=requestAnimationFrame(tick);};
  tick();
 }
 addEventListener('scroll',animateLoaders,{passive:true});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)animateLoaders();});
 document.addEventListener('dream:media-state',event=>{const item=cards.find(candidate=>candidate.hoverVideo===event.detail.video);if(item){item.dirty=true;render();if(event.detail.state==='loading')animateLoaders();}});
 document.addEventListener('dream:card-progress' ,event=>{const item=cards.find(candidate=>candidate.card===event.target);if(item){item.dirty=true;scheduleRender();}});
 resize();
 window.DreamScroll?.onFrame(()=>render());
 addEventListener('scroll',scheduleRender,{passive:true});
 addEventListener('dream:layout',scheduleRender);
 addEventListener('resize',scheduleResize,{passive:true});addEventListener('pageshow',scheduleResize);
 if('ResizeObserver'in window){const observer=new ResizeObserver(entries=>{for(const entry of entries){const item=cards.find(candidate=>candidate.card===entry.target);if(item)item.dirty=true;}render();});grids.forEach(grid=>observer.observe(grid));cards.forEach(item=>observer.observe(item.card));}
 grids.forEach(grid=>{
 grid.addEventListener('scroll',scheduleRender,{passive:true});
 grid.addEventListener('pointerover',event=>{if(event.pointerType==='touch'||event.pointerType==='pen'||!hoverInput.matches||grid.classList.contains('is-interacting'))return;const card=event.target.closest('.work-card');if(card&&!card.contains(event.relatedTarget))animateHover(cards.find(item=>item.card===card));});
 grid.addEventListener('pointerout',event=>{if(event.pointerType==='touch'||event.pointerType==='pen'||!hoverInput.matches)return;const card=event.target.closest('.work-card');if(card&&!card.contains(event.relatedTarget))animateHover(cards.find(item=>item.card===card));});
 grid.addEventListener('focusin',event=>{const card=event.target.closest('.work-card');if(card)animateHover(cards.find(item=>item.card===card));});
 grid.addEventListener('focusout',event=>{const card=event.target.closest('.work-card');if(card&&!card.contains(event.relatedTarget))animateHover(cards.find(item=>item.card===card));});
 grid.addEventListener('playing',event=>{
  if(!event.target.matches('.work-hover-video'))return;const item=cards.find(candidate=>candidate.hoverVideo===event.target);if(!item||item.owner.classList.contains('hero-card-grid'))return;
  startHoverVideoFrames(item);
 },true);
 ['pause','ended','emptied'].forEach(type=>grid.addEventListener(type,event=>{if(!event.target.matches('.work-hover-video'))return;const item=cards.find(candidate=>candidate.hoverVideo===event.target);if(item){stopHoverVideoFrames(item);invalidate(item);}},true));
 grid.addEventListener('dream:gallery-reveal',animateLayout);
 grid.addEventListener('error',event=>{if(event.target.matches('.work-hover-video'))invalidate(cards.find(item=>item.hoverVideo===event.target));},true);
 grid.addEventListener('load',event=>{const card=event.target.closest('.work-card');if(card)invalidate(cards.find(item=>item.card===card));},true);
 const mutations=new MutationObserver(records=>{let layoutChanged=false;for(const record of records){const element=record.target.nodeType===1?record.target:record.target.parentElement,card=element?.closest?.('.work-card'),item=cards.find(candidate=>candidate.card===card);if(item)item.dirty=true;else if(record.target===grid){cards.filter(card=>card.owner===grid).forEach(card=>card.dirty=true);layoutChanged=record.attributeName==='data-view';}}if(layoutChanged)animateLayout();else render();});mutations.observe(grid,{attributes:true,subtree:true,characterData:true,childList:true,attributeFilter:['data-view','class']});mutations.observe(grid.parentElement,{attributes:true,attributeFilter:['class']});
 });
 nativeCards.addEventListener?.('change',scheduleResize);
 document.fonts?.ready?.then(()=>invalidate());
 new MutationObserver(animateTheme).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
 output.addEventListener('webglcontextlost',event=>{event.preventDefault();failed=true;deactivate();});
 contrast.addEventListener?.('change',()=>{if(contrast.matches){failed=true;deactivate();}});
})();
