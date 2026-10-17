/* Viewport lens coordinates and an origin-clean displacement field; no image readback. */
(()=>{
 'use strict';
 const curvature=.16,compensation=1-.3655*curvature;
 function sample(x,y,width,height){
  const px=x/width-.5,py=y/height-.5,r=Math.hypot(px,py),factor=compensation*(1+curvature*r*r*r);
  return {x:(.5+px*factor)*width,y:(.5+py*factor)*height};
 }
 function quality(width,height,devicePixelRatio=1,memory=8,cores=4){
  const pixelRatio=Math.max(.5,Math.min(4,Number(devicePixelRatio)||1));
  const physicalPixels=width*height*pixelRatio*pixelRatio;
  // Bound viewport-sized intermediate images, rather than multiplying every phone's workload.
  const lowMemory=memory<=4,tapCount=lowMemory||physicalPixels>3000000?1:physicalPixels<=1800000&&cores>=8?4:2;
  const d=.25/pixelRatio;
  const taps=tapCount===4?[[-d,-d],[d,-d],[-d,d],[d,d]]:tapCount===2?[[-d,-d],[d,d]]:[[0,0]];
  // Keep the control field close to the output's physical pixel grid. A coarse
  // map produces visible stepping along glyph edges after the lens warp.
  const columns=Math.max(32,Math.ceil(width*pixelRatio/2)),rows=Math.max(32,Math.ceil(height*pixelRatio/2));
  const budget=Math.min(1,1024/columns,1024/rows,Math.sqrt(524288/(columns*rows)));
  const peak=Math.min(.5,Math.cbrt((1-compensation)/(4*compensation*curvature)));
  const maxShift=peak*(1-compensation*(1+curvature*peak**3))*Math.max(width,height);
  return {pixelRatio,taps,width:Math.max(1,Math.floor(columns*budget)),height:Math.max(1,Math.floor(rows*budget)),scale:2*(maxShift+.75/pixelRatio)};
 }
 function field(width,height,settings=quality(width,height),tap=[0,0]){
  const pixels=new Uint8ClampedArray(settings.width*settings.height*4),scale=settings.scale;
  for(let y=0;y<settings.height;y++)for(let x=0;x<settings.width;x++){
   const sx=(x+.5)/settings.width*width,sy=(y+.5)/settings.height*height;
   // Each branch reads the actual SourceGraphic at P(output + subpixelOffset).
   const point=sample(sx+tap[0],sy+tap[1],width,height),index=(y*settings.width+x)*4;
   pixels[index]=Math.round(255*(.5+(point.x-sx)/scale));pixels[index+1]=Math.round(255*(.5+(point.y-sy)/scale));pixels[index+2]=128;pixels[index+3]=255;
  }
  return {pixels,scale,width:settings.width,height:settings.height};
 }
 function pipeline(count){
  let markup='';
  for(let i=0;i<count;i++)markup+=`<feImage preserveAspectRatio="none" result="field-${i}"/><feDisplacementMap in="SourceGraphic" in2="field-${i}" xChannelSelector="R" yChannelSelector="G" result="tap-${i}"/>`;
  const average=(a,b,result)=>`<feComposite in="${a}" in2="${b}" operator="arithmetic" k1="0" k2=".5" k3=".5" k4="0" result="${result}"/>`;
  if(count===2)markup+=average('tap-0','tap-1','reconstructed');
  if(count===4)markup+=average('tap-0','tap-1','pair-0')+average('tap-2','tap-3','pair-1')+average('pair-0','pair-1','reconstructed');
  return markup;
 }
 globalThis.DreamLens=Object.freeze({curvature,sample,quality,field,pipeline});
})();
