import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../dist/showcase-gpu.js',import.meta.url),'utf8');
function extract(start,end){return source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start)));}
test('hovering a disc never resizes the card texture or shifts its content origin',()=>{
 let hover=false,discTop=100;
 const card={offsetWidth:240,offsetHeight:220,matches:()=>hover};
 const item={card,owner:{classList:{contains:()=>false}},disc:{getBoundingClientRect:()=>({left:50,top:discTop,width:100,height:100})}};
 const sandbox={frame:null,layoutRect:r=>r};
 vm.runInNewContext(extract(' function prepareFrame(', ' function updateTexture(')+';globalThis.prepare=prepareFrame;',sandbox);
 const rect={left:10,top:100,width:240,height:220};
 const idle=sandbox.prepare(item,rect);
 hover=true;discTop=70;const entering=sandbox.prepare(item,rect);
 discTop=55;const settled=sandbox.prepare(item,rect);
 assert.equal(idle.textureBounds.height,entering.textureBounds.height);
 assert.equal(entering.textureBounds.height,settled.textureBounds.height);
 assert.equal(idle.textureBounds.top,settled.textureBounds.top);
});
test('portrait and landscape media fill the thumbnail using centered cover cropping',()=>{
 let args;
 const sandbox={ctx:{save(){},restore(){},drawImage(...values){args=values;}}};
 vm.runInNewContext(extract(' function drawImage(', ' function productBackground(')+';globalThis.draw=drawImage;',sandbox);
 sandbox.draw({complete:true,naturalWidth:800,naturalHeight:1200},{left:10,top:20,width:200,height:100});
 assert.equal(args.length,9);
 assert.equal(args[2],400);
 assert.equal(args[3],800);
 assert.equal(args[4],400);
 assert.equal(args[7],200);
 assert.equal(args[8],100);
});
test('repeated playback resumes keep only one GPU video-frame subscription',()=>{
 let next=0,renders=0;const callbacks=new Map();
 const media={paused:false,ended:false,requestVideoFrameCallback(fn){callbacks.set(++next,fn);return next;},cancelVideoFrameCallback(token){callbacks.delete(token);}};
 const sandbox={render(){renders++;},requestAnimationFrame(){throw Error('video callback expected');},cancelAnimationFrame(){}};
 vm.runInNewContext(extract(' function stopHoverVideoFrames(', ' function markHoverFrames(')+';globalThis.start=startHoverVideoFrames;globalThis.stop=stopHoverVideoFrames;',sandbox);
 const item={hoverVideo:media};sandbox.start(item);const stale=[...callbacks.values()][0];
 sandbox.start(item);assert.equal(callbacks.size,1);stale();assert.equal(callbacks.size,1);assert.equal(renders,2);
 sandbox.stop(item);assert.equal(callbacks.size,0);
});
