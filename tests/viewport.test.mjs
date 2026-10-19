import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const script=readFileSync(new URL('../dist/viewport-layout.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../dist/hero-viewport.css',import.meta.url),'utf8');
const parallax=readFileSync(new URL('../dist/hero-parallax.js',import.meta.url),'utf8');
function boot({visual=true,observe=true}={}){
 const values=new Map(),events=new Map(),documentEvents=new Map(),viewportEvents=new Map(),frames=[],notifications=[];
 const state={width:1280,height:820,innerHeight:900,headerHeight:76,copyHeight:300,railHeight:320,scale:1};
 const root={get clientWidth(){return state.width;},style:{setProperty:(name,value)=>values.set(name,value),getPropertyValue:name=>values.get(name)||''}};
 const body={append(element){element.parentElement=body;}};
 const header={getBoundingClientRect:()=>({height:state.headerHeight})};
 const hero={dataset:{},append(element){element.parentElement=hero;},getBoundingClientRect:()=>({bottom:state.height})};
 const copy={get offsetHeight(){return state.copyHeight;}};
 const rail={get offsetHeight(){return state.railHeight;},parentElement:hero,querySelector:()=>({}),classList:{toggle(){}}};
 const nodes=new Map([['.header',header],['.hero',hero],['.hero-copy',copy],['.hero-card-rail',rail]]);
 const visualViewport={get height(){return state.height;},get scale(){return state.scale;},addEventListener:(name,fn)=>viewportEvents.set(name,fn)};
 let observeResize;
 class ResizeObserver{constructor(fn){observeResize=fn;}observe(){}}
 const sandbox={document:{documentElement:root,body,querySelector:name=>nodes.get(name),addEventListener:(name,fn)=>documentEvents.set(name,fn)},
  window:{visualViewport:visual?visualViewport:null,...(observe?{ResizeObserver}:{}),get innerHeight(){return state.innerHeight;},get innerWidth(){return state.width+15;},dispatchEvent:event=>notifications.push(event.type)},
  ResizeObserver,CustomEvent:class{constructor(type){this.type=type;}},
  addEventListener:(name,fn)=>events.set(name,fn),requestAnimationFrame:fn=>{frames.push(fn);return frames.length;}};
 vm.runInNewContext(script,sandbox);
 function flush(){for(let i=0;frames.length&&i<8;i++){const batch=frames.splice(0);batch.forEach(fn=>fn());}assert.equal(frames.length,0,'responsive sizing settles instead of running a resize loop');}
 flush();return{state,values,events,documentEvents,viewportEvents,body,hero,rail,notifications,flush,resize:()=>observeResize()};
}

test('layout uses the visible height and excludes the scrollbar from full-width rails',()=>{
 const app=boot();assert.equal(app.values.get('--app-viewport-height'),'820px');
 assert.equal(app.values.get('--viewport-width'),'1280px','100vw scrollbar overflow is avoided');
 assert.equal(app.values.get('--app-header-height'),'76px');assert.equal(app.hero.dataset.heroLayout,'hero');
 app.state.headerHeight=64;app.resize();app.flush();assert.equal(app.values.get('--app-header-height'),'64px');
 assert.ok(app.notifications.includes('dream:layout'),'scroll geometry is refreshed after the layout changes');
});

test('short windows keep the rail in hero flow without moving it to the viewport',()=>{
 const app=boot();app.state.height=620;app.viewportEvents.get('resize')();app.flush();
 assert.equal(app.hero.dataset.heroLayout,'flow');assert.equal(app.rail.parentElement,app.hero);
 app.state.height=900;app.events.get('orientationchange')();app.flush();
 assert.equal(app.hero.dataset.heroLayout,'hero');assert.equal(app.rail.parentElement,app.hero);
 app.state.copyHeight=700;app.resize();app.flush();assert.equal(app.hero.dataset.heroLayout,'flow','browser font enlargement cannot overlap the cards');
});

test('pinch zoom does not collapse the responsive page to the zoomed visual viewport height',()=>{
 const app=boot();app.state.scale=2;app.state.height=310;app.viewportEvents.get('resize')();app.flush();
 assert.equal(app.values.get('--app-viewport-height'),'900px');assert.equal(app.hero.dataset.heroLayout,'hero');
});

test('clients without VisualViewport or ResizeObserver retain the window-resize fallback',()=>{
 const app=boot({visual:false,observe:false});assert.equal(app.values.get('--app-viewport-height'),'900px');
 app.state.innerHeight=640;app.events.get('resize')();app.flush();
 assert.equal(app.values.get('--app-viewport-height'),'640px');
 assert.equal(app.hero.dataset.heroLayout,'flow');
});

test('hero retains viewport fallbacks and covers the complete responsive scene',()=>{
 assert.match(css,/--app-viewport-height:100vh/);
 assert.match(css,/@supports\(height:100dvh\)/);
 assert.match(css,/min-height:var\(--app-viewport-height,100vh\)/);
 assert.match(css,/\.hero\[data-hero-layout="flow"\]/);
 assert.match(script,/width\*\(width<=700\?\.165:\.08\)[\s\S]*\(height-headerHeight\)\*\.125\),40,118/,'responsive hero typography scales up while respecting short viewports');
 assert.match(css,/inset:-4%;width:108%;height:108%;[\s\S]*?object-fit:cover/);
 const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
 assert.match(html,/width=device-width,initial-scale=1,viewport-fit=cover/);
 assert.match(html,/href="responsive-layout\.css"/);
 assert.match(html,/src="viewport-layout\.js"[\s\S]*src="hero-parallax\.js"[\s\S]*src="carousel-input\.js(?:\?[^"]*)?"[\s\S]*src="app\.js(?:\?[^"]*)?"/,'layout and gesture policies initialize before the application');
});

test('hero video parallax moves at 0.3x and stays clipped to the hero',()=>{
 assert.match(parallax,/Math\.min\(Math\.max\(0,-rect\.top\),rect\.height\)\*\.7/);
 assert.doesNotMatch(parallax,/clipPath|clip=`inset\(/,'native hero clipping replaces the asynchronous viewport clip');
 assert.match(parallax,/prefers-reduced-motion/);
 assert.match(css,/html\.hero-parallax-ready \.hero-video-poster,html\.hero-parallax-ready \.hero-video\{[\s\S]*position:absolute/);
 assert.match(css,/\.hero::before\{[\s\S]*linear-gradient\(0deg,#090909 0%,#090909d9 22%/,'the video background fades into the next black section instead of ending in a hard seam');
});


test('hero parallax reverses without a separate viewport clip or moving the gradient',()=>{
 const values=new Map(),events=new Map(),frames=[];let top=0;
 const root={classList:{add(){},remove(){}},style:{setProperty:(k,v)=>values.set(k,v),removeProperty:k=>values.delete(k)}};
 const hero={getBoundingClientRect:()=>({top,height:800})};
 const motion={matches:false,addEventListener(){}};
 const context={document:{documentElement:root,querySelector:()=>hero,querySelectorAll:()=>[{style:{}}]},matchMedia:()=>motion,window:{},addEventListener:(k,v)=>events.set(k,v),requestAnimationFrame:fn=>{frames.push(fn);return frames.length;}};
 vm.runInNewContext(parallax,context);
 for(const [position,expected] of [[-400,'280.00px'],[-150,'105.00px'],[0,'0.00px']]){
  top=position;events.get('scroll')();frames.shift()();assert.equal(values.get('--hero-parallax-offset'),expected);
 }
 motion.matches=true;events.get('scroll')();frames.shift()();assert.equal(values.has('--hero-parallax-offset'),false);
});
