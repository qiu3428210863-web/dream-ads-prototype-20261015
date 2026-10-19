import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

// Run the shipped Lenis build and the application's actual scroll setup against a small DOM fixture.
function boot(){
 let time=0,nextFrame=0;
 const frames=new Map();
 class Target{
  listeners=new Map();
  addEventListener(type,fn,options={}){const entries=this.listeners.get(type)||[];entries.push({fn,capture:options===true||!!options.capture});this.listeners.set(type,entries);}
  removeEventListener(type,fn){this.listeners.set(type,(this.listeners.get(type)||[]).filter(entry=>entry.fn!==fn));}
  fire(event,capture=false){for(const entry of this.listeners.get(event.type)||[]){if(entry.capture!==capture)continue;entry.fn(event);if(event.stopped)break;}}
  dispatchEvent(event){this.fire(event,true);if(!event.stopped)this.fire(event,false);}
 }
 class Element extends Target{
  classList=new Set();style={};dataset={};scrollLeft=0;scrollTop=0;tagName='DIV';
 clientWidth=1280;clientHeight=580;scrollWidth=7200;scrollHeight=580;offsetLeft=0;offsetTop=0;offsetWidth=560;offsetHeight=450;
  constructor(){super();this.classList.remove=(...names)=>names.forEach(name=>this.classList.delete(name));this.classList.contains=name=>this.classList.has(name);}
  querySelector(selector){return nodes.get(selector);}
  querySelectorAll(selector){return selector==='.work-card'?cards:selector==='[data-showcase-toggle]'?viewButtons:[];}
  attributes={};animations=[];
  setAttribute(name,value){this.attributes[name]=value;}
  animate(keyframes,options){const animation={keyframes,options,cancelled:false,cancel(){this.cancelled=true;},finish(){this.onfinish?.();}};this.animations.push(animation);return animation;}
  contains(element){return element===this||cards.includes(element);}
  closest(){return null;}
  hasAttribute(){return false;}
  getBoundingClientRect(){return {left:0,top:1100-win.scrollY,width:560,height:450,right:560,bottom:1550-win.scrollY};}
  scrollTo({left,top}){if(left!==undefined)this.scrollLeft=left;if(top!==undefined)this.scrollTop=top;}
  setPointerCapture(){}hasPointerCapture(){return true;}releasePointerCapture(){}
 }
 class Window extends Target{
  innerWidth=1280;innerHeight=900;scrollY=650;scrollX=0;
  matchMedia(){return {matches:false,addEventListener(){},removeEventListener(){}};}
  scrollTo({top,left}){if(top!==undefined)this.scrollY=top;if(left!==undefined)this.scrollX=left;}
 }
 const win=new Window(),doc=new Element(),root=new Element(),body=new Element(),grid=new Element();
 root.scrollHeight=5000;root.scrollWidth=1280;
 const cards=Array.from({length:12},(_,i)=>{const card=new Element();card.offsetLeft=32+i*584;return card;});
 const viewButtons=[];
 const header=new Element();header.getBoundingClientRect=()=>({height:76});
 const nodes=new Map([['#showcase-grid',grid],['.carousel-counter',new Element()],['.header',header]]);
 doc.documentElement=root;doc.body=body;
 const sandbox={window:win,document:doc,Window,Element,HTMLElement:Element,HTMLAnchorElement:class extends Element{},
  navigator:{userAgent:'test'},performance:{now:()=>time},console,
  innerHeight:900,innerWidth:1280,matchMedia:win.matchMedia.bind(win),addEventListener:win.addEventListener.bind(win),
  requestAnimationFrame:fn=>{frames.set(++nextFrame,fn);return nextFrame;},cancelAnimationFrame:id=>frames.delete(id),
  ResizeObserver:class{observe(){}disconnect(){}},MutationObserver:class{observe(){}},
  setTimeout:()=>1,clearTimeout(){},CustomEvent:class{constructor(type,options){this.type=type;Object.assign(this,options);}},
  getComputedStyle:()=>({paddingLeft:'32px',paddingRight:'32px',scrollPaddingTop:'0',scrollPaddingLeft:'0',scrollMarginLeft:'0',scrollMarginTop:'0'})};
 Object.defineProperty(sandbox,'scrollY',{get:()=>win.scrollY});
 const context=vm.createContext(sandbox);
 vm.runInContext(readFileSync(new URL('../dist/vendor/lenis-1.3.27.min.js',import.meta.url),'utf8'),context);
 const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8').split('const menuButton')[0];vm.runInContext(app,context);
 const evaluate=code=>vm.runInContext(code,context);
 function advance(count=1){for(let i=0;i<count;i++){time+=1000/60;const batch=[...frames.values()];frames.clear();batch.forEach(callback=>callback(time));}}
 function wheel(deltaY,deltaX=0,deltaMode=0){
  const event={type:'wheel',deltaY,deltaX,deltaMode,target:grid,cancelable:true,preventDefault(){this.defaultPrevented=true;},stopPropagation(){this.stopped=true;},stopImmediatePropagation(){this.stopped=true;},composedPath:()=>[grid,body,root,doc,win]};
  win.fire(event,true);if(!event.stopped)grid.fire(event);if(!event.stopped)win.fire(event);return event;
 }
 return {advance,wheel,evaluate,grid,win,cards,viewButtons};
}
test('the full gallery is the default and vertical gestures remain page scrolls',()=>{
 const app=boot();
 assert.match(readFileSync(new URL('../dist/app.js',import.meta.url),'utf8'),/carouselPinY|showcaseDock/);
 assert.match(readFileSync(new URL('../dist/app.js',import.meta.url),'utf8'),/const horizontal=Math\.abs\(deltaX\)>Math\.abs\(deltaY\)/,'wheel input distinguishes horizontal gestures from vertical page scrolling');
 assert.match(readFileSync(new URL('../dist/app.js',import.meta.url),'utf8'),/if\(horizontal&&grid\.contains\(event\.target\)\)/,'only horizontal gestures over the carousel move its cards');
 assert.equal(app.evaluate('showcaseView'),'grid');
 assert.equal(app.grid.dataset.view,'grid');
 assert.equal(app.evaluate('carouselLimit'),0);
 const vertical=app.wheel(120);app.advance(8);
 assert.equal(app.grid.scrollLeft,0);
 assert.equal(vertical.target,app.grid);
});

test('the full All gallery keeps every concept card without a Partial toggle',()=>{
 const app=boot();app.evaluate('setShowcaseView("grid")');
 assert.equal(app.evaluate('showcaseView'),'grid');
 assert.equal(app.grid.dataset.view,'grid');
 assert.equal(app.cards[0].attributes['aria-roledescription'],'card');
 assert.equal(app.cards.length,12);
 assert.equal(app.viewButtons.length,0);
});

test('reduced motion changes layout without bounce animation',()=>{
 const app=boot();app.evaluate('reducedCarouselMotion.matches=true;setShowcaseView("grid")');
 assert.equal(app.evaluate('showcaseView'),'grid');
 assert.equal(app.cards[0].animations.length,0);
});
