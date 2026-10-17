/* Separate the final display surface from the higher-resolution scene texture. */
(()=>{
 'use strict';
 function settings(width,height,dpr=1,maxTexture=4096,memory=8,cores=8){
  width=Math.max(1,width);height=Math.max(1,height);dpr=Math.max(1,Number(dpr)||1);maxTexture=Math.max(1,Number(maxTexture)||4096);
  const area=width*height,lowPower=(Number(memory)>0&&Number(memory)<=4)||(Number(cores)>0&&Number(cores)<=4);
  const outputBudget=12_000_000,sourceBudget=lowPower?12_000_000:16_000_000;
  const textureLimit=Math.min(maxTexture/width,maxTexture/height);
  const outputRatio=Math.min(dpr,4,Math.sqrt(outputBudget/area),textureLimit);
  const desiredSourceRatio=Math.max(outputRatio*1.75,Math.min(2,dpr)*1.75);
  const sourceRatio=Math.min(desiredSourceRatio,Math.sqrt(sourceBudget/area),textureLimit);
  return {outputRatio,sourceRatio,outputPixels:Math.round(area*outputRatio*outputRatio),sourcePixels:Math.round(area*sourceRatio*sourceRatio),lowPower};
 }
 globalThis.DreamShowcaseQuality=Object.freeze({settings});
})();
