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
  querySelectorAll(selector){return selector==='.work-card'?cards:selector==='[data-showcase-view]'?viewButtons:[];}
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
 const viewButtons=['cards','grid'].map(view=>{const button=new Element();button.dataset.showcaseView=view;button.parentElement=grid;return button;});
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
function arrive(app){app.wheel(app.evaluate('carouselPinY-pageScroll.animatedScroll'));app.advance(60);}

test('vertical input remains vertical until the cards reach the center',()=>{
 const app=boot();app.wheel(100);app.advance(45);
 assert.equal(app.grid.scrollLeft,0);assert.ok(app.win.scrollY>650);assert.ok(app.win.scrollY<app.evaluate('carouselPinY'));
});
test('crossing the card center pins the page and accumulates horizontal wheel distance',()=>{
 const app=boot();arrive(app);
 const pin=app.evaluate('carouselPinY');assert.equal(app.win.scrollY,pin);
 app.wheel(120);app.advance(2);app.wheel(120);app.advance(2);
 assert.equal(app.evaluate('railScroll.targetScroll'),300);
 const released=app.grid.scrollLeft;app.advance(8);
 assert.ok(app.grid.scrollLeft>released,'rail continues moving after wheel input ends');assert.equal(app.win.scrollY,pin);
});
test('both boundaries hand outward wheel input back to the page',()=>{
 const app=boot();arrive(app);
 const pin=app.evaluate('carouselPinY');app.evaluate('scrollCarouselTo(carouselLimit,true)');
 app.wheel(120);app.advance(30);assert.ok(app.win.scrollY>pin);
 app.wheel(-500);app.advance(40);assert.equal(app.win.scrollY,pin);
 app.evaluate('scrollCarouselTo(0,true)');app.wheel(-120);app.advance(30);assert.ok(app.win.scrollY<pin);
});
test('outward horizontal touchpad input becomes vertical motion at the end',()=>{
 const app=boot();arrive(app);app.evaluate('scrollCarouselTo(carouselLimit,true)');
 const y=app.win.scrollY;app.wheel(0,160);app.advance(20);assert.ok(app.win.scrollY>y);
});
test('line wheel units match pixel units and fractional touchpad deltas are retained',()=>{
 const app=boot();arrive(app);app.wheel(3,0,1);
 assert.equal(app.evaluate('railScroll.targetScroll'),62.5);
 app.wheel(.2);assert.equal(app.evaluate('railScroll.targetScroll'),62.75);
});
test('arrival decelerates over multiple frames and transfers excess distance after docking',()=>{
 const app=boot(),start=app.win.scrollY,pin=app.evaluate('carouselPinY');app.wheel(400);
 const positions=[];for(let i=0;i<42;i++){app.advance();positions.push(app.win.scrollY);}
 assert.ok(positions[2]>start&&positions[2]<pin-20,'arrival does not jump to the pin');
 assert.ok(positions.every(y=>y<=pin),'no vertical overshoot');
 assert.ok(positions[6]-positions[5]>positions[30]-positions[29],'arrival velocity decreases');
 assert.equal(app.win.scrollY,pin);assert.ok(app.grid.scrollLeft>0,'excess distance eases into the rail');
});
test('reversing during arrival cancels docking and does not leave an input lock',()=>{
 const app=boot();app.wheel(400);app.advance(8);const y=app.win.scrollY;
 app.wheel(-120);app.advance(50);
 assert.ok(app.win.scrollY<y);assert.equal(app.grid.scrollLeft,0);assert.equal(app.evaluate('showcaseDock'),null);
});

test('grid switch cancels docking, releases vertical scroll, and preserves card nodes',()=>{
 const app=boot();app.wheel(400);app.advance(8);
 assert.ok(app.evaluate('showcaseDock'));
 app.cards.slice(3).forEach((card,index)=>{const left=1800+index*584;card.getBoundingClientRect=()=>({left,top:300,width:560,height:450,right:left+560,bottom:750});});
 app.viewButtons[1].dispatchEvent({type:'click'});
 assert.equal(app.evaluate('showcaseView'),'grid');
 assert.equal(app.evaluate('showcaseDock'),null);
 assert.equal(app.evaluate('carouselLimit'),0);
 assert.equal(app.viewButtons[1].attributes['aria-pressed'],'true');
 assert.equal(app.viewButtons[0].attributes['aria-pressed'],'false');
 assert.equal(app.cards[0].attributes['aria-roledescription'],'card');
 const y=app.win.scrollY;app.wheel(180);app.advance(40);
 assert.ok(app.win.scrollY>y,'grid must not capture vertical input');
 assert.equal(app.grid.scrollLeft,0);
 assert.equal(app.cards[0].animations.length,1);
 const frames=app.cards[0].animations[0].keyframes;
 assert.equal(frames.length,4,'transition settles before a restrained bounce');
 assert.equal(frames[1].transform,'translate(0,0) scale(1)');
 assert.equal(frames[2].transform,'translate(0,0) scale(1.025)');
 assert.equal(frames[3].transform,'translate(0,0) scale(1)');
 assert.equal(frames[0].transformOrigin,'center center');
 assert.equal(app.cards[0].animations[0].options.duration,900);
 app.cards.slice(3).forEach(card=>{
  const offscreenFrames=card.animations[0].keyframes;
  assert.equal(offscreenFrames.length,4,'offscreen cards use the full position transition too');
  assert.match(offscreenFrames[0].transform,/^translate\(/);
  assert.equal(offscreenFrames[0].transformOrigin,'center center');
  assert.equal('opacity' in offscreenFrames[0],false,'opacity reveal cannot flicker above the curved canvas');
 });
});

test('switching back cancels unfinished animations and restores rail capture',()=>{
 const app=boot();app.evaluate('setShowcaseView("grid")');
 const first=app.cards[0].animations[0];
 app.viewButtons[0].dispatchEvent({type:'click'});
 assert.ok(first.cancelled);
 assert.equal(app.evaluate('showcaseView'),'cards');
 assert.ok(app.evaluate('carouselLimit')>0);
 arrive(app);const y=app.win.scrollY;app.wheel(120);app.advance(20);
 assert.equal(app.win.scrollY,y);assert.ok(app.grid.scrollLeft>0);
});

test('reduced motion changes layout without bounce animation',()=>{
 const app=boot();app.evaluate('reducedCarouselMotion.matches=true;setShowcaseView("grid")');
 assert.equal(app.evaluate('showcaseView'),'grid');
 assert.equal(app.cards[0].animations.length,0);
});

test('featured rail exposes five cards while grid mode keeps the full concept set',()=>{
 const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
 const css=readFileSync(new URL('../dist/showcase-view.css',import.meta.url),'utf8');
 const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
 assert.match(html,/data-showcase-view="cards"[^>]*>5 featured<\/button>/);
 assert.match(html,/data-showcase-view="grid"[^>]*>All concepts<\/button>/);
 assert.match(css,/\.showcase-grid\[data-view="cards"\] \.work-card:nth-child\(n\+6\)\{display:none\}/);
 assert.match(app,/function activeCarouselCards\(\)\{return showcaseView==='grid'\?carouselCards:carouselCards\.slice\(0,5\);\}/);
 assert.match(app,/carouselLimit=showcaseView==='grid'\?0:Math\.max\(0,last\.offsetLeft\+last\.offsetWidth\+gutter-grid\.clientWidth\)/);
});

test('layout measurements ignore animated card bounds and transformed scroll overflow',()=>{
 const app=boot(),pin=app.evaluate('carouselPinY');
 app.evaluate('setShowcaseView("grid");setShowcaseView("cards")');
 const limit=app.evaluate('carouselLimit');
 app.cards[0].getBoundingClientRect=()=>({top:-400,width:260,height:200,left:500});
 app.grid.scrollWidth=12000;
 app.evaluate('measureCarousel()');
 assert.equal(app.evaluate('carouselPinY'),pin,'temporary FLIP pixels cannot change the stop position');
 assert.equal(app.evaluate('carouselLimit'),limit,'temporary FLIP overflow cannot enlarge the rail');
});

test('wheel over restored cards eases back to center even when the page is below the stop',()=>{
 const app=boot();app.evaluate('setShowcaseView("grid");pageScroll.scrollTo(carouselPinY+180,{immediate:true});setShowcaseView("cards")');
 const y=app.win.scrollY;app.wheel(120);app.advance(3);
 assert.ok(app.win.scrollY<y,'recapture eases to the center rather than continuing down the page');
 app.advance(80);
 assert.equal(app.win.scrollY,app.evaluate('carouselPinY'));assert.ok(app.grid.scrollLeft>0);
});

test('an old cancelled transition cannot overwrite geometry after a rapid view change',()=>{
 const app=boot();app.evaluate('setShowcaseView("grid")');
 const first=app.cards.map(card=>card.animations[0]);app.evaluate('setShowcaseView("cards")');
 const current=app.cards.map(card=>card.animations[1]);
 first.forEach(animation=>animation.finish());
 assert.equal(app.evaluate('viewAnimations.length'),12);
 current.forEach(animation=>animation.finish());
 assert.equal(app.evaluate('viewAnimations.length'),0);
 assert.equal(app.evaluate('showcaseView'),'cards');
});
