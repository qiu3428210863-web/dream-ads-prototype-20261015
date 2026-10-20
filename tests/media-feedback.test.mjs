import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../dist/media-feedback.js',import.meta.url),'utf8');
function fixture(kind='hero'){
 const timers=new Map();let clock=0,loads=0,plays=0;
 class Node{constructor(){this.style={};this.classList={remove(){},add(){}};this.handlers={};this.dataset={};this.attrs={};this.children=[];this.hidden=false;this.isConnected=true;}addEventListener(e,fn){this.handlers[e]=fn;}setAttribute(k,v){this.attrs[k]=v;}append(...nodes){this.children.push(...nodes);}querySelectorAll(){return [];}querySelector(){return null;}dispatchEvent(e){this.handlers[e.type]?.(e);}}
 const host=new Node(),frame=kind==='hero'?host:new Node(),video=new Node();frame.offsetHeight=180;frame.offsetWidth=320;frame.offsetTop=8;frame.offsetLeft=8;frame.offsetParent=host;video.id=kind==='preview'?'preview-video':'';video.paused=false;video.readyState=0;video.matches=s=>s===(kind==='hero'?'.hero-video':kind==='work'?'.work-hover-video':'never');video.closest=s=>s==='.hero'&&kind==='hero'?host:s==='.challenge-step-card'&&kind==='step'||s==='.work-card'&&kind==='work'?host:s==='.challenge-step-video'&&kind==='step'||s==='.work-visual'&&kind==='work'?frame:null;video.load=()=>loads++;video.play=()=>{plays++;return Promise.resolve();};video.pause=()=>{video.paused=true;video.handlers.pause?.();};
 const doc=new Node();doc.hidden=false;doc.querySelectorAll=()=>[video];doc.querySelector=s=>s==='.preview-stage'?frame:host;doc.createElement=()=>new Node();
 const environment={document:doc,navigator:{onLine:true},WeakMap,CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail;}},setTimeout:fn=>{timers.set(++clock,fn);return clock;},clearTimeout:id=>timers.delete(id)};vm.runInNewContext(source,environment);
 return {video,doc,host,frame,model:environment.DreamMediaLoader,box:(kind==='preview'?frame:host).children[0],loader:frame.children[kind==='preview'||kind==='hero'?1:0],timers,get loads(){return loads;},get plays(){return plays;}};
}
test('media failure exposes a recovery action and retry reloads the real video',()=>{const f=fixture();f.video.handlers.error();assert.equal(f.box.dataset.state,'error');assert.equal(f.box.hidden,false);f.box.children[1].handlers.click();assert.equal(f.loads,1);assert.equal(f.plays,0,'hero retry reloads and waits for the app canplay handler');f.video.handlers.playing();assert.equal(f.box.hidden,true);assert.equal(f.timers.size,0);});
test('loading timeout offers retry, while intentional pause cancels the timeout',()=>{const f=fixture();f.video.handlers.waiting();assert.equal(f.box.dataset.state,'loading');[...f.timers.values()][0]();assert.equal(f.box.dataset.state,'error');assert.match(f.box.children[0].textContent,/too long/);f.video.paused=false;f.video.handlers.waiting();f.video.pause();assert.equal(f.timers.size,0);});
test('autoplay permission rejection offers a user initiated play action; aborts do not report errors',()=>{const f=fixture();f.video.handlers.playing();f.video.handlers['dream:play-rejected']({detail:{name:'AbortError'}});assert.equal(f.box.hidden,true);f.video.handlers['dream:play-rejected']({detail:{name:'NotAllowedError'}});assert.equal(f.box.children[1].textContent,'Play video');assert.equal(f.box.hidden,false);});
test('translation rescans preserve existing feedback without duplicate handlers',()=>{const f=fixture();const handler=f.video.handlers.error;f.doc.handlers['dream:translation-layout']();assert.equal(f.video.handlers.error,handler);});

test('an initial hero load that never starts playing still times out with a retry action',()=>{const f=fixture();f.video.paused=true;f.video.handlers.loadstart();assert.equal(f.box.dataset.state,'loading');[...f.timers.values()][0]();assert.equal(f.box.dataset.state,'error');assert.match(f.box.children[0].textContent,/too long/);});

for(const kind of ['hero','preview','step','work'])test(`${kind}: buffering shows the frame loader; playback, pause and failure remove it`,()=>{
 const f=fixture(kind);f.video.handlers.waiting();assert.equal(f.loader.hidden,false);assert.equal(f.box.hidden,true,'loading should not create an extra panel');assert.equal(f.loader.attrs.role,'status');assert.match(f.loader.innerHTML,/pathLength="200"/);
 f.video.handlers.playing();assert.equal(f.loader.hidden,true);
 f.video.handlers.waiting();f.video.pause();assert.equal(f.loader.hidden,true);
 f.video.handlers.waiting();f.video.handlers.error();assert.equal(f.loader.hidden,true);assert.equal(f.box.hidden,false);
 f.video.handlers.waiting();f.video.handlers.emptied();assert.equal(f.loader.hidden,true);
});

test('modal failure stays in the picture; card recovery buttons remain outside the existing play button',()=>{
 const modal=fixture('preview');assert.ok(modal.frame.children.includes(modal.box));assert.ok(!modal.host.children.includes(modal.box));
 for(const kind of ['step','work']){const f=fixture(kind);assert.ok(f.host.children.includes(f.box));assert.ok(!f.frame.children.includes(f.box));assert.equal(f.box.style.height,'180px');assert.equal(f.box.style.width,'320px');assert.equal(f.box.style.top,'8px');assert.equal(f.box.style.left,'8px');}
});
test('growth fills the complete ring then clears the tail and loops without a rotating fixed segment',()=>{
 const {growth}=fixture().model;
 assert.equal(growth(0).length,0);assert.ok(growth(780).length>.45&&growth(780).length<.55);assert.equal(growth(1560).length,1);assert.equal(growth(1560).offset,0);assert.ok(growth(1980).length<.6);assert.ok(growth(1980).offset>.4);assert.equal(growth(2400).length,0);
});
test('failure survives source cleanup until an actual retry or playback occurs',()=>{
 const f=fixture();f.video.handlers.error();f.video.handlers.emptied();assert.equal(f.box.dataset.state,'error');assert.equal(f.box.hidden,false);
});

test('loading mark has a real open crossing and no gray underlay in native or GPU rendering',()=>{
 const f=fixture();assert.doesNotMatch(f.loader.innerHTML,/media-loader-track/);assert.equal((f.loader.innerHTML.match(/<path /g)||[]).length,1);assert.match(f.model.path,/^M26 24/);assert.match(f.model.path,/L42 36$/);assert.doesNotMatch(f.model.path,/Z/i);
 const strokes=[],colors=[];const ctx={save(){},restore(){},fillRect(){},translate(){},scale(){},setLineDash(){},stroke(path){strokes.push(path);colors.push(this.strokeStyle);},measureText(){return {width:80};},fillText(){}};
 // GPU path uses the same vector and only one white stroke per animation frame.
 const script=source;
 const document={querySelectorAll:()=>[],addEventListener(){}};const env={document,WeakMap,Path2D:class{constructor(path){this.path=path;}}};vm.runInNewContext(script,env);env.DreamMediaLoader.draw(ctx,{left:0,top:0,width:320,height:180},1200,false);assert.equal(strokes.length,1);assert.equal(strokes[0].path,f.model.path);assert.deepEqual(colors,['#fff']);
});
