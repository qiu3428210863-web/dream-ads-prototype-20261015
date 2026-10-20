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

test('restored pointer focus cannot keep a disc out; suppression and open dialogs win over hover',()=>{
 let hover=false,focusVisible=false,suppressed=false,dialog=false,interacting=false,hero=false;
 const sandbox={hoverInput:{matches:true},document:{querySelector:()=>dialog?{}:null}};
 vm.runInNewContext(extract(' function discIsActive(', ' function paintDisc(')+';globalThis.active=discIsActive;',sandbox);
 const parts={card:{classList:{contains:()=>suppressed},matches:()=>hover},owner:{classList:{contains:c=>c==='hero-card-grid'?hero:interacting}},open:{matches:()=>focusVisible}};
 assert.equal(sandbox.active(parts),false,'pointer focus alone is not keyboard focus');
 hover=true;assert.equal(sandbox.active(parts),true);suppressed=true;assert.equal(sandbox.active(parts),false);suppressed=false;dialog=true;assert.equal(sandbox.active(parts),false);
 dialog=false;hover=false;focusVisible=true;assert.equal(sandbox.active(parts),true,'keyboard navigation still exposes the disc');hero=true;assert.equal(sandbox.active(parts),false);hero=false;interacting=true;assert.equal(sandbox.active(parts),false);interacting=false;focusVisible=false;hover=true;sandbox.hoverInput.matches=false;assert.equal(sandbox.active(parts),false,'touch hover never sticks');
});
test('only the explicitly marked uploaded example gets a gallery badge',()=>{
 const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8'),start=app.indexOf('function conceptCardMarkup('),end=app.indexOf('function startHeroCopyEntrance(',start),sandbox={};
 vm.runInNewContext(app.slice(start,end)+';globalThis.card=conceptCardMarkup;',sandbox);
 const concept={id:'demo',title:'Demo',product:'Demo',headline:'Demo',thumbnailUrl:'poster.webp',videoSrc:'demo.mp4'};
 assert.doesNotMatch(sandbox.card(concept,0,2),/work-example-badge/);assert.match(sandbox.card({...concept,example:true},0,2),/work-example-badge/);assert.doesNotMatch(sandbox.card({...concept,example:true},0,2,true),/work-example-badge/);
 assert.equal((app.match(/example:true/g)||[]).length,1);
});

test('minor pointer movement inside a returned card cannot undo disc suppression',()=>{
 const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8'),start=app.indexOf('const clearSuppression=event=>'),end=app.indexOf(";document.addEventListener('pointermove',clearSuppression,true)",start);let removed=0;const inside={};
 const sandbox={returningCard:{contains:target=>target===inside,classList:{remove:()=>removed++}},document:{removeEventListener(){}}};
 vm.runInNewContext(app.slice(start,end)+';globalThis.clear=clearSuppression;',sandbox);
 sandbox.clear({type:'pointermove',target:inside});assert.equal(removed,0);
 sandbox.clear({type:'pointermove',target:{}});assert.equal(removed,1);
 sandbox.clear({type:'keydown',target:inside});assert.equal(removed,2,'fresh keyboard input resumes normal interaction');
});
