// Numerical field reconstruction only: this is not a browser text-quality or FPS measurement.
export function legacyField(lens,width,height){
 const size=96,pixels=new Uint8ClampedArray(size*size*4),scale=Math.max(width,height)*.06;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const sx=x/(size-1)*width,sy=y/(size-1)*height,point=lens.sample(sx,sy,width,height),index=(y*size+x)*4;
  pixels[index]=Math.round(255*(.5+(point.x-sx)/scale));pixels[index+1]=Math.round(255*(.5+(point.y-sy)/scale));
 }
 return {width:size,height:size,pixels,scale};
}
export function reconstructionError(lens,field,width,height){
 let sum=0,max=0,count=0;
 const pick=(x,y,channel)=>field.pixels[(Math.max(0,Math.min(field.height-1,y))*field.width+Math.max(0,Math.min(field.width-1,x)))*4+channel]/255;
 for(let y=0;y<72;y++)for(let x=0;x<128;x++){
  const sx=(x+.5)/128*width,sy=(y+.5)/72*height,u=sx/width*field.width-.5,v=sy/height*field.height-.5,ix=Math.floor(u),iy=Math.floor(v),tx=u-ix,ty=v-iy;
  const displacement=[0,1].map(channel=>{
   const a=pick(ix,iy,channel)*(1-tx)+pick(ix+1,iy,channel)*tx,b=pick(ix,iy+1,channel)*(1-tx)+pick(ix+1,iy+1,channel)*tx;
   return (a*(1-ty)+b*ty-.5)*field.scale;
  });
  const point=lens.sample(sx,sy,width,height),error=(sx+displacement[0]-point.x)**2+(sy+displacement[1]-point.y)**2;
  sum+=error;max=Math.max(max,Math.sqrt(error));count++;
 }
 return {rms:Math.sqrt(sum/count),max,probes:count};
}
