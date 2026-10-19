/* Device-aware budgets for the showcase output canvas and visible-card textures. */
(()=>{
 'use strict';
 function lowPowerDevice(memory,cores){return (Number(memory)>0&&Number(memory)<=4)||(Number(cores)>0&&Number(cores)<=4);}
 function outputRatio(width,height,dpr=1,maxTexture=4096){
  width=Math.max(1,width);height=Math.max(1,height);dpr=Math.max(1,Number(dpr)||1);maxTexture=Math.max(1,Number(maxTexture)||4096);
  return Math.min(dpr,3,Math.sqrt(12_000_000/(width*height)),maxTexture/width,maxTexture/height);
 }
 function cardRatio(width,height,dpr=1,maxTexture=4096,memory=8,cores=8){
  width=Math.max(1,width);height=Math.max(1,height);dpr=Math.max(1,Number(dpr)||1);maxTexture=Math.max(1,Number(maxTexture)||4096);
  const budget=lowPowerDevice(memory,cores)?1_200_000:2_500_000;
  return Math.min(dpr*1.5,3,Math.sqrt(budget/(width*height)),maxTexture/width,maxTexture/height);
 }
 globalThis.DreamShowcaseQuality=Object.freeze({outputRatio,cardRatio,lowPowerDevice});
})();
