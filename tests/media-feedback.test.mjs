import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../dist/media-feedback.js',import.meta.url),'utf8');
function fixture(kind='hero'){
 const timers=new Map();let clock=0,loads=0,plays=0;
 class Node{constructor(){this.style={};this.classList={remove(){},add(){}};this.handlers={};this.dataset={};this.attrs={};this.children=[];this.hidden=false;this.isConnected=true;}addEventListener(e,fn){this.handlers[e]=fn;}setAttribute(k,v){this.attrs[k]=v;}append(...nodes){this.children.push(...nodes);}querySelectorAll(){return [];}querySelector(){return null;}dispatchEvent(e){this.handlers[e.type]?.(e);}}
 const host=new Node(),video=new Node();video.id=kind==='preview'?'preview-video':'';video.paused=false;video.readyState=0;video.matches=s=>s===(kind==='hero'?'.hero-video':kind==='work'?'.work-hover-video':'never');video.closest=s=>(kind==='hero'&&s==='.hero')||(kind==='step'&&['.challenge-step-card','.challenge-step-video'].includes(s))||(kind==='work'&&['.work-card','.work-visual'].includes(s))?host:null;video.load=()=>loads++;video.play=()=>{plays++;return Promise.resolve();};video.pause=()=>{video.paused=true;video.handlers.pause?.();};
 const doc=new Node();doc.hidden=false;doc.querySelectorAll=()=>[video];doc.querySelector=()=>host;doc.createElement=()=>new Node();
 vm.runInNewContext(source,{document:doc,navigator:{onLine:true},WeakMap,CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail;}},setTimeout:fn=>{timers.set(++clock,fn);return clock;},clearTimeout:id=>timers.delete(id)});
 return {video,doc,box:host.children[0],loader:host.children[1],timers,get loads(){return loads;},get plays(){return plays;}};
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
