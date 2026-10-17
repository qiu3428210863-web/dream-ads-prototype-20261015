/* Viewport lens coordinates and an origin-clean displacement field; no image readback. */
(()=>{
 'use strict';
 const curvature=.16,compensation=1-.3655*curvature;
 function sample(x,y,width,height){
  const px=x/width-.5,py=y/height-.5,r=Math.hypot(px,py),factor=compensation*(1+curvature*r*r*r);
  return {x:(.5+px*factor)*width,y:(.5+py*factor)*height};
 }
 function quality(width,height,devicePixelRatio=1){
  const pixelRatio=Math.max(1,Math.min(2,Number(devicePixelRatio)||1)),spacing=6/pixelRatio;
  const columns=Math.max(32,Math.ceil(width/spacing)),rows=Math.max(32,Math.ceil(height/spacing));
  const budget=Math.min(1,512/columns,512/rows,Math.sqrt(131072/(columns*rows)));
  // The largest axis displacement occurs on the other axis's centerline.
  const peak=Math.min(.5,Math.cbrt((1-compensation)/(4*compensation*curvature)));
  const maxShift=peak*(1-compensation*(1+curvature*peak**3))*Math.max(width,height);
  const scale=2*(maxShift+.25/pixelRatio);
  return {width:Math.floor(columns*budget),height:Math.floor(rows*budget),pixelRatio,scale,quantizationStep:scale/255,blur:.9/pixelRatio};
 }
 function field(width,height,devicePixelRatio=1){
  const settings=quality(width,height,devicePixelRatio),pixels=new Uint8ClampedArray(settings.width*settings.height*4),scale=settings.scale;
  for(let y=0;y<settings.height;y++)for(let x=0;x<settings.width;x++){
   // PNG samples represent texel centers, not the edges of the viewport.
   const sx=(x+.5)/settings.width*width,sy=(y+.5)/settings.height*height,point=sample(sx,sy,width,height),index=(y*settings.width+x)*4;
   pixels[index]=Math.round(255*(.5+(point.x-sx)/scale));pixels[index+1]=Math.round(255*(.5+(point.y-sy)/scale));pixels[index+2]=128;pixels[index+3]=255;
  }
  return {...settings,pixels};
 }
 globalThis.DreamLens=Object.freeze({curvature,sample,quality,field});
})();
