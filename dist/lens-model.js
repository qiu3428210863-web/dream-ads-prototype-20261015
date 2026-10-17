/* Viewport lens coordinates and an origin-clean displacement field; no image readback. */
(()=>{
 'use strict';
 const curvature=.16,compensation=1-.3655*curvature;
 function sample(x,y,width,height){
  const px=x/width-.5,py=y/height-.5,r=Math.hypot(px,py),factor=compensation*(1+curvature*r*r*r);
  return {x:(.5+px*factor)*width,y:(.5+py*factor)*height};
 }
 function field(width,height,resolution=96){
  const pixels=new Uint8ClampedArray(resolution*resolution*4),scale=Math.max(width,height)*.06;
  for(let y=0;y<resolution;y++)for(let x=0;x<resolution;x++){
   const sx=x/(resolution-1)*width,sy=y/(resolution-1)*height,point=sample(sx,sy,width,height),index=(y*resolution+x)*4;
   pixels[index]=Math.round(255*(.5+(point.x-sx)/scale));pixels[index+1]=Math.round(255*(.5+(point.y-sy)/scale));pixels[index+2]=128;pixels[index+3]=255;
  }
  return {pixels,scale,width:resolution,height:resolution};
 }
 globalThis.DreamLens=Object.freeze({curvature,sample,field});
})();
