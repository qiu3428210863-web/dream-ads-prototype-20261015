import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
function boot(native=true){
 let centered=0,appended=0;const frames=[];
 const cards=Array.from({length:5},(_,id)=>({id,style:{setProperty(){}},getBoundingClientRect(){return{left:id*222,top:0,width:210,height:118};}}));
 const rail={children:[...cards],classList:{add(){},remove(){}},offsetWidth:844,append(fragment){appended++;this.children=[...fragment.children];}};
 const doc={createDocumentFragment:()=>({children:[],append(card){this.children.push(card);}}),documentElement:{classList:{contains:()=>false}}};
 const context={heroCardGrid:rail,nativeFeatured:{matches:native},applyFeaturedDepth(){},centerFeaturedCard(){centered++;},document:doc,requestAnimationFrame:fn=>frames.push(fn),performance:{now:()=>0}};
 const code=app.slice(app.indexOf('const rotateFeaturedCardToCenter='),app.indexOf('const updateFeaturedProgress='));
 vm.runInNewContext(code+';this.rotate=rotateFeaturedCardToCenter;',context);
 return {cards,rail,frames,context,get centered(){return centered;},get appended(){return appended;}};
}
test('mobile playback changes never reorder cards or overwrite a user scroll position',()=>{const h=boot();h.context.rotate(h.cards[0]);h.context.rotate(h.cards[3]);h.context.rotate(h.cards[1]);assert.deepEqual(h.rail.children.map(c=>c.id),[0,1,2,3,4]);assert.equal(h.appended,0);assert.equal(h.centered,0);assert.equal(h.frames.length,0);});
test('desktop retains its centered cyclic carousel',()=>{const h=boot(false);h.context.rotate(h.cards[0]);assert.equal(h.rail.children[2],h.cards[0]);assert.equal(h.centered,1);assert.equal(h.appended,1);});
const gpu=readFileSync(new URL('../dist/showcase-gpu.js',import.meta.url),'utf8');
function gpuResize(native){
 let paints=0,releases=0,allocations=0;
 const c={nativeCards:{matches:native},root:{clientWidth:844,classList:{remove(){}}},innerHeight:376,window:{devicePixelRatio:2},maxTextureSize:4096,output:{dataset:{},remove(){}},gl:{viewport(){allocations++;},uniform2f(){}},cards:[],uniformViewport:0,render(){paints++;},deactivate(){releases++;},suspended:false,active:false};
 vm.runInNewContext(gpu.slice(gpu.indexOf('function resize(){'),gpu.indexOf('function ensureCanvas('))+';resize();',c);
 return {suspended:c.suspended,paints,releases,allocations};
}
test('native mobile scroll never paints through a separate fixed WebGL overlay',()=>{const h=gpuResize(true);assert.equal(h.suspended,true);assert.equal(h.releases,1);assert.equal(h.paints,0);assert.equal(h.allocations,0);});
test('desktop keeps the curved GPU renderer',()=>{const h=gpuResize(false);assert.equal(h.suspended,false);assert.equal(h.paints,1);assert.equal(h.allocations,1);});
const input=readFileSync(new URL('../dist/carousel-input.js',import.meta.url),'utf8');
function inputHarness(){
 let now=0,id=0;const timers=new Map(),handlers=new Map(),classes=new Set(),windowHandlers=new Map();
 const rail={scrollLeft:0,classList:{contains:n=>classes.has(n),add:n=>classes.add(n),remove:n=>classes.delete(n)},addEventListener(type,fn,options){const rows=handlers.get(type)||[];rows.push({fn,options});handlers.set(type,rows);},dispatchEvent(){}};
 const window={addEventListener:(type,fn)=>windowHandlers.set(type,fn)};
 vm.runInNewContext(input,{window,WeakSet,Math,performance:{now:()=>now},setTimeout:(fn,ms)=>{timers.set(++id,{fn,at:now+ms});return id;},clearTimeout:id=>timers.delete(id),CustomEvent:class{constructor(type){this.type=type;}}});window.DreamCarouselInput.bind(rail);
 const fire=(type,values={})=>{const event={type,pointerType:'touch',pointerId:1,isPrimary:true,button:0,clientX:100,clientY:100,detail:1,preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;},...values};for(const {fn} of handlers.get(type)||[]){fn(event);if(event.stopped)break;}return event;};
 return{rail,handlers,classes,fire,rebind:()=>window.DreamCarouselInput.bind(rail),advance(ms){now+=ms;for(const [id,{fn,at}] of timers)if(at<=now){timers.delete(id);fn();}}};
}
test('a stationary touch tap still selects a card',()=>{const h=inputHarness();h.fire('pointerdown');h.fire('pointerup');assert.equal(h.fire('click').prevented,undefined);});
test('a swipe cannot become a card click and never prevents native panning',()=>{const h=inputHarness();const down=h.fire('pointerdown'),move=h.fire('pointermove',{clientX:50});h.fire('pointerup',{clientX:50});assert.equal(down.prevented,undefined);assert.equal(move.prevented,undefined);assert.equal(h.fire('click').prevented,true);assert.equal(h.classes.has('is-interacting'),true);h.advance(450);assert.equal(h.fire('click').prevented,undefined);assert.equal(h.classes.has('is-interacting'),false);});
test('cancelled touch streams and momentum remain guarded until scrolling settles',()=>{const h=inputHarness();h.fire('pointerdown');h.fire('pointercancel');h.advance(100);h.rail.scrollLeft=200;h.fire('scroll');h.advance(100);assert.equal(h.fire('click').prevented,true);h.advance(350);assert.equal(h.classes.has('is-interacting'),false);});
test('vertical swipes remain native and keyboard activation is never swallowed',()=>{const h=inputHarness();h.fire('pointerdown');const event=h.fire('pointermove',{clientY:250});h.fire('pointerup',{clientY:250});assert.equal(event.prevented,undefined);assert.equal(h.fire('click',{detail:0}).prevented,undefined);});
test('a fresh tap after a swipe is intentional and translator rescans do not duplicate guards',()=>{const h=inputHarness();h.rebind();assert.equal(h.handlers.get('pointerdown').length,1);h.fire('pointerdown');h.fire('pointermove',{clientX:10});h.fire('pointerup');h.fire('pointerdown',{pointerId:2});h.fire('pointerup',{pointerId:2});assert.equal(h.fire('click').prevented,undefined);});
