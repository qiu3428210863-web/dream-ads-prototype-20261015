import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../dist/media-feedback.js',import.meta.url),'utf8');
function fixture(){
 const timers=new Map();let clock=0,loads=0,plays=0;
 class Node{constructor(){this.classList={remove(){}};this.handlers={};this.dataset={};this.attrs={};this.children=[];this.hidden=false;this.isConnected=true;}addEventListener(e,fn){this.handlers[e]=fn;}setAttribute(k,v){this.attrs[k]=v;}append(...nodes){this.children.push(...nodes);}querySelectorAll(){return [];}querySelector(){return null;}dispatchEvent(e){this.handlers[e.type]?.(e);}}
 const host=new Node(),video=new Node();video.id='';video.paused=false;video.readyState=0;video.matches=s=>s==='.hero-video';video.closest=s=>s==='.hero'?host:null;video.load=()=>loads++;video.play=()=>{plays++;return Promise.resolve();};video.pause=()=>{video.paused=true;video.handlers.pause?.();};
 const doc=new Node();doc.hidden=false;doc.querySelectorAll=()=>[video];doc.createElement=()=>new Node();
 vm.runInNewContext(source,{document:doc,navigator:{onLine:true},WeakMap,CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail;}},setTimeout:fn=>{timers.set(++clock,fn);return clock;},clearTimeout:id=>timers.delete(id)});
 return {video,doc,box:host.children[0],timers,get loads(){return loads;},get plays(){return plays;}};
}
test('media failure exposes a recovery action and retry reloads the real video',()=>{const f=fixture();f.video.handlers.error();assert.equal(f.box.dataset.state,'error');assert.equal(f.box.hidden,false);f.box.children[1].handlers.click();assert.equal(f.loads,1);assert.equal(f.plays,0,'hero retry reloads and waits for the app canplay handler');f.video.handlers.playing();assert.equal(f.box.hidden,true);assert.equal(f.timers.size,0);});
test('loading timeout offers retry, while intentional pause cancels the timeout',()=>{const f=fixture();f.video.handlers.waiting();assert.equal(f.box.dataset.state,'loading');[...f.timers.values()][0]();assert.equal(f.box.dataset.state,'error');assert.match(f.box.children[0].textContent,/too long/);f.video.paused=false;f.video.handlers.waiting();f.video.pause();assert.equal(f.timers.size,0);});
test('autoplay permission rejection offers a user initiated play action; aborts do not report errors',()=>{const f=fixture();f.video.handlers.playing();f.video.handlers['dream:play-rejected']({detail:{name:'AbortError'}});assert.equal(f.box.hidden,true);f.video.handlers['dream:play-rejected']({detail:{name:'NotAllowedError'}});assert.equal(f.box.children[1].textContent,'Play video');assert.equal(f.box.hidden,false);});
test('translation rescans preserve existing feedback without duplicate handlers',()=>{const f=fixture();const handler=f.video.handlers.error;f.doc.handlers['dream:translation-layout']();assert.equal(f.video.handlers.error,handler);});

test('an initial hero load that never starts playing still times out with a retry action',()=>{const f=fixture();f.video.paused=true;f.video.handlers.loadstart();assert.equal(f.box.dataset.state,'loading');[...f.timers.values()][0]();assert.equal(f.box.dataset.state,'error');assert.match(f.box.children[0].textContent,/too long/);});
