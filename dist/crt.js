/* GPU radial glass: cache the DOM once, warp in float precision every frame. */
(()=>{
 'use strict';
 const root=document.documentElement,preference=matchMedia('(prefers-reduced-motion: reduce)');
 const surface=document.createElement('div');surface.className='crt-surface';surface.id='crt-surface';
 const main=document.querySelector('main');main.before(surface);[main,document.querySelector('.footer')].forEach(node=>surface.append(node));
 const glass=document.createElement('div');glass.className='crt-glass';glass.setAttribute('aria-hidden','true');document.body.append(glass);
 const canvas=document.createElement('canvas');canvas.id='crt-display';canvas.setAttribute('aria-hidden','true');canvas.dataset.html2canvasIgnore='true';document.body.append(canvas);
 const gl=canvas.getContext('webgl',{alpha:false,antialias:true,premultipliedAlpha:false,preserveDrawingBuffer:false});
 const rail=document.querySelector('#showcase-grid'),cards=[...rail.querySelectorAll('.work-card')];
 let width=0,height=0,surfaceTop=0,sourceWidth=1,sourceHeight=1,railWidth=1,railHeight=1,row=[0,0],cardBoxes=[],coverBoxes=[],titleBoxes=[];
 let ready=false,capturing=false,pending=false,captureTimer=0,lastTime=0,pointer=null,redirecting=false;
 const hover=Array(cards.length).fill(0),grayImages=new Map(),textures=[],CURVE=.16;
 const wake=()=>window.DreamScroll?.requestFrame();
 function viewport(){width=root.clientWidth;height=innerHeight;root.style.setProperty('--viewport-width',width+'px');const ratio=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);canvas.style.width=width+'px';canvas.style.height=height+'px';if(gl)gl.viewport(0,0,canvas.width,canvas.height);}
 function position(){return window.DreamScroll?.position()||{x:rail.scrollLeft,y:scrollY};}
 // Reference lens: cubic radial sampling plus center compensation, in viewport UV space.
 function unwarp(x,y){const px=x/width-.5,py=y/height-.5,r=Math.hypot(px,py),factor=(1-.3655*CURVE)*(1+CURVE*r*r*r);return{x:(.5+px*factor)*width,y:(.5+py*factor)*height};}
 const vertex='attribute vec2 aPosition;varying vec2 vUv;void main(){vUv=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}';
 const fragment=`precision highp float;
 varying vec2 vUv;uniform sampler2D uPage,uRailPage;uniform sampler2D uDisc0;uniform sampler2D uDisc1;uniform sampler2D uDisc2;
 uniform vec2 uViewport,uSource,uRailSource,uRow;uniform float uScroll,uRail,uTop;uniform vec4 uCards[${cards.length}],uCovers[${cards.length}],uTitles[${cards.length}];uniform float uHover[${cards.length}];
 float box(vec2 p,vec2 size,float radius){vec2 q=abs(p)-size*.5+radius;return length(max(q,0.))+min(max(q.x,q.y),0.)-radius;}
 vec4 page(vec2 p){
  if(p.y>=uRow.x&&p.y<=uRow.y){vec2 q=vec2(p.x,p.y-uRow.x);if(q.x<0.||q.x>uRailSource.x)return vec4(.98,.98,.98,1.);return texture2D(uRailPage,q/uRailSource);}
  if(p.x<0.||p.y<0.||p.x>uSource.x||p.y>uSource.y)return vec4(.98,.98,.98,1.);return texture2D(uPage,p/uSource);
 }
 void main(){
  vec2 uv=vec2(vUv.x,1.-vUv.y),p=uv-.5;float r=length(p);uv=.5+p*(1.+${CURVE}*r*r*r)*(1.-.3655*${CURVE});
  vec2 doc=vec2(uv.x*uViewport.x,uv.y*uViewport.y+uScroll-uTop);
  if(doc.y>=uRow.x&&doc.y<=uRow.y)doc.x+=uRail;
  vec4 color=page(doc);float fringe=smoothstep(.08,.68,r)*.42;vec4 red=page(doc+vec2(0.,-fringe));vec4 blue=page(doc+vec2(0.,fringe));color.rgb=vec3(red.r,color.g,blue.b);
  for(int i=0;i<${cards.length};i++){
   float h=uHover[i];vec4 card=uCards[i],cover=uCovers[i],title=uTitles[i];
   if(h>.001){
    float diameter=card.z*.62;vec2 center=vec2(card.x+card.z*.5,card.y+diameter*(.68-.40*h));
    vec2 q=(doc-center)/diameter;float angle=mix(-.2094395,.1396263,h),c=cos(angle),s=sin(angle);q=mat2(c,-s,s,c)*q+vec2(.5);
    if(doc.y<card.y+1.&&q.x>=0.&&q.y>=0.&&q.x<=1.&&q.y<=1.){vec4 cd;float kind=mod(float(i),3.);if(kind<.5)cd=texture2D(uDisc0,q);else if(kind<1.5)cd=texture2D(uDisc1,q);else cd=texture2D(uDisc2,q);color=mix(color,vec4(cd.rgb,1.),cd.a*h);}
    vec2 local=doc-(cover.xy+cover.zw*.5);float distance=box(local,cover.zw,18.);
    if(distance<0.){float scale=mix(1.,.968,h);vec2 point=local/scale;if(box(point,cover.zw,18.)<0.)color=page(cover.xy+cover.zw*.5+point);else color=vec4(1.);}
    vec3 pink=mix(vec3(1.,.5098,.8588),vec3(.8039,0.,.6078),clamp((local.x+local.y)/max(cover.z,1.)+.5,0.,1.));
    float ring=(1.-smoothstep(1.,2.8,abs(distance+1.)))*h;color.rgb=mix(color.rgb,pink,ring);
    if(doc.x>=title.x&&doc.y>=title.y&&doc.x<=title.x+title.z&&doc.y<=title.y+title.w){float ink=1.-smoothstep(.35,.9,dot(color.rgb,vec3(.3333)));color.rgb=mix(color.rgb,vec3(.8039,0.,.6078),ink*h);}
   }
  }
  float grain=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5;color.rgb+=grain*.006;
  gl_FragColor=color;
 }`;
 let program,uniforms={};
 function compile(type,source){const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));return shader;}
 function texture(index,image){const value=textures[index]||(textures[index]=gl.createTexture());gl.activeTexture(gl.TEXTURE0+index);gl.bindTexture(gl.TEXTURE_2D,value);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);}
 function initialize(){
  program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const attr=gl.getAttribLocation(program,'aPosition');gl.enableVertexAttribArray(attr);gl.vertexAttribPointer(attr,2,gl.FLOAT,false,0,0);
  for(const name of ['uPage','uRailPage','uDisc0','uDisc1','uDisc2','uViewport','uSource','uRailSource','uRow','uScroll','uRail','uTop','uCards[0]','uCovers[0]','uTitles[0]','uHover[0]'])uniforms[name]=gl.getUniformLocation(program,name);
  ['uPage','uDisc0','uDisc1','uDisc2','uRailPage'].forEach((name,index)=>gl.uniform1i(uniforms[name],index));
 }
 async function grayImage(src,invert=false){
  const key=src+invert;if(grayImages.has(key))return grayImages.get(key);
  const image=new Image();image.src=src;await image.decode();const result=document.createElement('canvas');result.width=src.includes('openart-logo')?806:(image.naturalWidth||680);result.height=src.includes('openart-logo')?138:(image.naturalHeight||680);const context=result.getContext('2d');context.filter=invert?'invert(1)':'grayscale(1)';context.drawImage(image,0,0,result.width,result.height);const data=result.toDataURL();grayImages.set(key,data);return data;
 }
 async function discTexture(src,index){
  const image=new Image();image.src=await grayImage(src);await image.decode();const result=document.createElement('canvas');result.width=result.height=512;const context=result.getContext('2d');
  context.save();context.beginPath();context.arc(256,256,253,0,Math.PI*2);context.clip();const shine=context.createConicGradient(.26,256,256);[['#d8dce1',0],['#f9fdff',.12],['#afc8d9',.19],['#efd4ef',.27],['#faffff',.39],['#abb8bd',.48],['#e1d4f0',.59],['#fffcea',.69],['#b8dcdf',.8],['#f8ebf4',.91],['#d8dce1',1]].forEach(([color,stop])=>shine.addColorStop(stop,color));context.fillStyle=shine;context.fillRect(0,0,512,512);
  context.beginPath();context.arc(256,256,214,0,Math.PI*2);context.clip();context.fillStyle='#f3f5f4';context.fillRect(0,0,512,512);context.translate(256,256);context.rotate(-.14);context.globalAlpha=.88;context.drawImage(image,-246,-358,492,492);context.restore();context.beginPath();context.arc(256,256,49,0,Math.PI*2);context.fillStyle='#d4d6decc';context.fill();context.strokeStyle='#ffffffcc';context.lineWidth=3;context.stroke();context.globalCompositeOperation='destination-out';context.beginPath();context.arc(256,256,34,0,Math.PI*2);context.fill();texture(index,result);
 }
 function rect(element){const value=element.getBoundingClientRect();return[value.left+rail.scrollLeft,value.top+scrollY-surfaceTop,value.width,value.height];}
 async function capture(){
  clearTimeout(captureTimer);if(capturing){pending=true;return;}if(document.body.classList.contains('modal-open')||!gl)return;
  capturing=true;surface.dataset.crtStatus='capturing';
  try{
   await document.fonts.ready;viewport();surfaceTop=surface.getBoundingClientRect().top+scrollY;
   const images=[...surface.querySelectorAll('.hero-product,.work-product,.cover-wordmark,.footer .brand-wordmark')];
   const replacements=await Promise.all(images.map(async image=>({src:image.getAttribute('src'),invert:image.closest('.footer')!==null,data:await grayImage(image.src,image.closest('.footer')!==null)})));
   const captureWidth=Math.ceil(width),captureHeight=Math.ceil(surface.scrollHeight),limit=gl.getParameter(gl.MAX_TEXTURE_SIZE);
   const scale=Math.min(2,limit/captureWidth,limit/captureHeight,Math.sqrt(32000000/(captureWidth*captureHeight)));
   const onclone=doc=>{
    const clone=doc.getElementById('crt-surface');clone.style.setProperty('opacity','1','important');clone.style.setProperty('filter','none','important');
    doc.documentElement.style.setProperty('overflow','visible','important');doc.body.style.setProperty('overflow','visible','important');
    const clonedRail=doc.getElementById('showcase-grid');clonedRail.style.setProperty('overflow','visible','important');clonedRail.scrollLeft=0;
    const style=doc.createElement('style');style.textContent='.crt-surface *{animation:none!important;transition:none!important}.work-disc{display:none!important}.work-visual::after{opacity:0!important}.work-cover{transform:scale(1)!important}.work-caption{transform:perspective(650px) rotateY(-9deg) rotateZ(-4deg)!important}.work-meta h3{color:#171817!important}.cover-wordmark{transform:none!important;left:calc(50% - 44px)!important;width:88px!important;height:15px!important;max-width:none!important;filter:none!important}';doc.head.append(style);
    for(const replacement of replacements)clone.querySelectorAll('img').forEach(img=>{if(img.getAttribute('src')===replacement.src&&(img.closest('.footer')!==null)===replacement.invert)img.src=replacement.data;});
   };
   const options={backgroundColor:'#fafafa',windowWidth:innerWidth,windowHeight:innerHeight,scrollX:0,scrollY:0,logging:false,onclone};
   const image=await html2canvas(surface,{...options,scale,width:captureWidth,height:captureHeight});
   // Cache the long rail separately; extra cards must not reduce text resolution across the whole page.
   railWidth=Math.ceil(rail.scrollWidth);railHeight=Math.ceil(rail.getBoundingClientRect().height);
   const railScale=Math.min(2,limit/railWidth,limit/railHeight,Math.sqrt(12000000/(railWidth*railHeight)));
   const railImage=await html2canvas(rail,{...options,scale:railScale,width:railWidth,height:railHeight});
   surface.dataset.crtTexture=image.width+'x'+image.height;surface.dataset.crtRailTexture=railImage.width+'x'+railImage.height;
   texture(0,image);texture(4,railImage);sourceWidth=captureWidth;sourceHeight=captureHeight;
   cardBoxes=cards.map(rect);coverBoxes=cards.map(card=>rect(card.querySelector('.work-visual')));titleBoxes=cards.map(card=>rect(card.querySelector('h3')));
   const railBox=rail.getBoundingClientRect();row=[railBox.top+scrollY-surfaceTop,railBox.bottom+scrollY-surfaceTop];
   ready=true;surface.dataset.crtStatus='ready';delete surface.dataset.crtError;surface.dataset.crtCurvature=String(CURVE);surface.dataset.crtRenderer='webgl';draw(performance.now());root.classList.add('crt-enabled');wake();
  }catch(error){root.classList.remove('crt-enabled');ready=false;surface.dataset.crtStatus='fallback';surface.dataset.crtError=error.message;console.warn('Curved display unavailable:',error.message);}
  finally{capturing=false;if(pending){pending=false;scheduleCapture();}}
 }
 function scheduleCapture(){clearTimeout(captureTimer);captureTimer=setTimeout(capture,180);}
 function draw(time){
  if(!ready||document.hidden)return false;
  const scroll=position(),elapsed=Math.min(50,lastTime?time-lastTime:16);lastTime=time;
  const point=pointer?unwarp(pointer.x,pointer.y):null;let active=false;
  for(let i=0;i<cards.length;i++){
   const box=cardBoxes[i],docY=point?point.y+scroll.y-surfaceTop:-1,docX=point?point.x+scroll.x:-1;
   const target=point&&docX>=box[0]&&docX<=box[0]+box[2]&&docY>=box[1]&&docY<=box[1]+box[3]?1:0;
   hover[i]+=(target-hover[i])*(1-Math.exp(-elapsed/125));if(Math.abs(target-hover[i])<.002)hover[i]=target;else active=true;
  }
  gl.useProgram(program);gl.uniform2f(uniforms.uViewport,width,height);gl.uniform2f(uniforms.uSource,sourceWidth,sourceHeight);gl.uniform2f(uniforms.uRailSource,railWidth,railHeight);gl.uniform2fv(uniforms.uRow,row);gl.uniform1f(uniforms.uScroll,scroll.y);gl.uniform1f(uniforms.uRail,scroll.x);gl.uniform1f(uniforms.uTop,surfaceTop);gl.uniform4fv(uniforms['uCards[0]'],cardBoxes.flat());gl.uniform4fv(uniforms['uCovers[0]'],coverBoxes.flat());gl.uniform4fv(uniforms['uTitles[0]'],titleBoxes.flat());gl.uniform1fv(uniforms['uHover[0]'],hover);gl.drawArrays(gl.TRIANGLES,0,6);return active;
 }
 // Redirect only clicks whose visual and logical targets differ under the lens.
 surface.addEventListener('click',event=>{
  if(!ready||redirecting||event.detail===0)return;
  const point=unwarp(event.clientX,event.clientY),candidate=document.elementFromPoint(point.x,point.y)?.closest('button,a,summary'),original=event.target.closest('button,a,summary');
  if(candidate===original)return;
  event.preventDefault();event.stopImmediatePropagation();if(candidate&&surface.contains(candidate)){redirecting=true;candidate.focus({preventScroll:true});candidate.click();redirecting=false;}
 },true);
 addEventListener('pointermove',event=>{pointer={x:event.clientX,y:event.clientY};wake();},{passive:true});document.addEventListener('pointerleave',()=>{pointer=null;wake();});
 addEventListener('scroll',wake,{passive:true});rail.addEventListener('scroll',wake,{passive:true});
 addEventListener('resize',()=>{viewport();wake();scheduleCapture();},{passive:true});addEventListener('pageshow',wake);
 new ResizeObserver(()=>{const w=root.clientWidth,h=innerHeight;if(w!==width||h!==height){viewport();scheduleCapture();}}).observe(root);
 new MutationObserver(records=>{if(records.some(record=>!record.target.closest?.('.carousel-counter')&&!record.target.parentElement?.closest('.carousel-counter')))scheduleCapture();}).observe(surface,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['open','hidden','aria-expanded']});
 new MutationObserver(()=>{if(!document.body.classList.contains('modal-open'))scheduleCapture();}).observe(document.body,{attributes:true,attributeFilter:['class']});
 preference.addEventListener('change',()=>{if(!ready)capture();else wake();});
 canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();ready=false;root.classList.remove('crt-enabled');surface.dataset.crtStatus='context-lost';});
  viewport();if(gl){try{initialize();Promise.all(cards.slice(0,3).map((card,index)=>discTexture(card.querySelector('.work-product').src,index+1))).then(()=>capture()).catch(error=>{ready=false;root.classList.remove('crt-enabled');surface.dataset.crtStatus='fallback';surface.dataset.crtError=error.message;console.warn('Curved display assets unavailable:',error.message);});window.DreamScroll?.onFrame(draw);}catch(error){surface.dataset.crtStatus='fallback';surface.dataset.crtError=error.message;console.warn('Curved display initialization failed:',error.message);}}else surface.dataset.crtStatus='unsupported';
})();
