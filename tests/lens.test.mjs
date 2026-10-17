import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync,existsSync} from 'node:fs';

const modelSource=readFileSync(new URL('../dist/lens-model.js',import.meta.url),'utf8');
const crtSource=readFileSync(new URL('../dist/crt.js',import.meta.url),'utf8');
const showcaseGpuSource=readFileSync(new URL('../dist/showcase-gpu.js',import.meta.url),'utf8');
function model(){const context=vm.createContext({Uint8ClampedArray,Math});vm.runInContext(modelSource,context);return context.DreamLens;}

test('lens bends the screen perimeter while keeping its center fixed',()=>{
 const lens=model(),center=lens.sample(720,450,1440,900),edge=lens.sample(0,450,1440,900),corner=lens.sample(0,0,1440,900);
 assert.equal(center.x,720);assert.equal(center.y,450);
 assert.ok(Math.abs(edge.x-28.547712)<1e-6);assert.ok(edge.x-corner.x>20,'straight edge acquires visible curvature');
});
test('displacement encoding preserves the reference lens for desktop and mobile dimensions',()=>{
 const lens=model();
 for(const [width,height] of [[1440,900],[2560,1440],[390,844],[320,568]]){
  const quality=lens.quality(width,height,1),field=lens.field(width,height,quality,quality.taps[0]);
  for(let y=0;y<field.height;y+=7)for(let x=0;x<field.width;x+=7){
   const sx=(x+.5)/field.width*width,sy=(y+.5)/field.height*height,index=(y*field.width+x)*4,point=lens.sample(sx+quality.taps[0][0],sy+quality.taps[0][1],width,height);
   const dx=(field.pixels[index]/255-.5)*field.scale,dy=(field.pixels[index+1]/255-.5)*field.scale;
   assert.ok(Math.abs(sx+dx-point.x)<=field.scale/510+1e-7);assert.ok(Math.abs(sy+dy-point.y)<=field.scale/510+1e-7);
   assert.equal(field.pixels[index+3],255);
  }
 }
});

function boot(protocol='file:',options={}){
 const events=new Map(),subscribers=[],observers=[],trace={canvases:0,pixels:[],dataURLs:0};
 const styles=()=>({values:new Map(),setProperty(name,value){this.values.set(name,value);},getPropertyValue(name){return this.values.get(name);}});
 let sandbox;
 class Element{
  children=[];parentElement=null;style=styles();attributes=new Map();classList=new Set();dataset={};scrollHeight=4600;
  constructor(tag='div'){this.tagName=tag;this.classList.remove=name=>this.classList.delete(name);}
  append(...nodes){for(const node of nodes){if(node.parentElement){const siblings=node.parentElement.children;siblings.splice(siblings.indexOf(node),1);}node.parentElement=this;this.children.push(node);}}
  before(node){const siblings=this.parentElement.children;node.parentElement=this.parentElement;siblings.splice(siblings.indexOf(this),0,node);}
  setAttribute(name,value){this.attributes.set(name,value);}
  setAttributeNS(ns,name,value){this.setAttribute(name,value);}
  getAttribute(name){return this.attributes.get(name);}
  addEventListener(){}
  getBoundingClientRect(){return {top:76-sandbox.scrollY,height:this.scrollHeight};}
  querySelector(selector){return this.children.find(node=>selector[0]==='#'?node.id===selector.slice(1):node.tagName===selector)||this.children.map(node=>node.querySelector(selector)).find(Boolean);}
  querySelectorAll(selector){return this.children.flatMap(node=>[...(node.tagName===selector?[node]:[]),...node.querySelectorAll(selector)]);}
  set innerHTML(value){
   this.children=[];
   for(const match of value.matchAll(/<(filter|feImage|feGaussianBlur|feDisplacementMap|feComposite)\b([^>]*)/g)){
    const node=new Element(match[1]);for(const attr of match[2].matchAll(/([\w:-]+)="([^"]*)"/g))node.setAttribute(attr[1],attr[2]);this.append(node);
   }
  }
 }
 const body=new Element('body'),header=new Element('header'),main=new Element('main'),footer=new Element('footer'),root=new Element('html');
 root.clientWidth=1440;body.append(header,main,footer);
 const document={documentElement:root,body,hidden:false,querySelector:selector=>selector==='main'?main:selector==='.footer'?footer:selector==='.header'?header:body.querySelector(selector),addEventListener(){},
  createElement(tag){
   if(tag!=='canvas')return new Element(tag);
   trace.canvases++;
   return {getContext(type){assert.equal(type,'2d','no WebGL context or product texture is required');return {
    createImageData:(width,height)=>({data:new Uint8ClampedArray(width*height*4)}),putImageData(image){trace.pixels.push(image.data);},
    drawImage(){throw Error('Reading product files is forbidden in this file-origin test');}
   };},toDataURL(){trace.dataURLs++;return 'data:image/png;base64,fixture';}};
  },createElementNS:(ns,tag)=>new Element(tag)};
 const mediaQueries=[];
 const matchMedia=query=>{const media={query,matches:query.includes('forced-colors')&&!!options.contrast,addEventListener(type,fn){this.change=fn;},removeEventListener(){}};mediaQueries.push(media);return media;};
 const window={devicePixelRatio:options.dpr||1,CSS:{supports:()=>!options.unsupported},SVGFEDisplacementMapElement:class{},SVGFECompositeElement:class{},DreamScroll:{position:()=>({x:0,y:sandbox.visualY}),onFrame:fn=>subscribers.push(fn),requestFrame(){}},ResizeObserver:class{constructor(fn){observers.push(fn);}observe(){}}};
 if(options.noComposite)delete window.SVGFECompositeElement;
 sandbox={window,document,ResizeObserver:window.ResizeObserver,location:{protocol},innerHeight:900,scrollY:500,visualY:500.25,console,
  navigator:{deviceMemory:options.memory??8,hardwareConcurrency:options.cores??8},matchMedia,
  addEventListener(type,fn){events.set(type,fn);},requestAnimationFrame:fn=>{sandbox.raf=fn;return 1;}};
 const context=vm.createContext(sandbox);vm.runInContext(modelSource,context);vm.runInContext(crtSource,context);
 return {sandbox,body,header,main,root,surface:body.querySelector('#crt-surface'),filter:body.querySelector('filter'),warp:body.querySelector('feDisplacementMap'),trace,subscribers,events,observers,mediaQueries,reinitialize(){vm.runInContext(crtSource,context);},flushRaf(){const callback=sandbox.raf;sandbox.raf=null;callback?.();}};
}
test('file-origin initialization activates the live lens without reading any product image',()=>{
 const app=boot();
 assert.equal(app.surface.dataset.crtStatus,'ready');assert.equal(app.surface.dataset.crtRenderer,'svg-live-viewport');assert.equal(app.surface.dataset.crtProtocol,'file:');
 assert.ok(app.root.classList.has('crt-enabled'));assert.equal(app.trace.canvases,4);assert.equal(app.trace.dataURLs,4);
 assert.equal(app.header.parentElement,app.body,'navigation stays outside the lens');assert.equal(app.main.parentElement,app.surface);
 assert.equal(app.warp.getAttribute('in'),'SourceGraphic');assert.equal(app.filter.getAttribute('width'),'1440');assert.equal(app.filter.getAttribute('height'),'900');
});
test('loading the live DOM lens twice does not create a second effect layer',()=>{
 const app=boot();app.reinitialize();
 assert.equal(app.body.children.filter(node=>node.id==='crt-viewport').length,1);
 assert.equal(app.body.children.filter(node=>node.className==='crt-glass').length,1);
 assert.equal(app.trace.canvases,4,'duplicate script execution cannot rebuild the SVG fields');
});
test('scroll updates live content offsets without rebuilding the viewport displacement field',()=>{
 const app=boot();assert.equal(app.surface.style.getPropertyValue('--crt-offset-y'),'-424.25px');
 for(let i=0;i<30;i++){app.sandbox.visualY+=.5;app.subscribers[0]();}
 assert.equal(app.surface.style.getPropertyValue('--crt-offset-y'),'-439.25px');assert.equal(app.trace.canvases,4);assert.equal(app.filter.getAttribute('y'),'0');
 app.surface.scrollHeight=4900;app.observers[0]();app.flushRaf();assert.equal(app.body.children.find(node=>node.className==='crt-spacer').style.height,'4900px');assert.equal(app.trace.canvases,4);
});
test('HTTP hosting uses the same renderer and viewport resizing regenerates only its field',()=>{
 const app=boot('https:');assert.equal(app.surface.dataset.crtProtocol,'https:');
 app.root.clientWidth=390;app.sandbox.innerHeight=844;app.events.get('resize')();
 app.flushRaf();
 assert.equal(app.filter.getAttribute('width'),'390');assert.equal(app.filter.getAttribute('height'),'844');assert.equal(app.trace.canvases,8);assert.equal(app.surface.dataset.crtStatus,'ready');
});

test('reconstruction averages actual source samples with normalized weights',()=>{
 const app=boot(),warps=app.filter.querySelectorAll('feDisplacementMap'),blends=app.filter.querySelectorAll('feComposite');
 assert.equal(warps.length,4);assert.equal(blends.length,3);
 for(const warp of warps)assert.equal(warp.getAttribute('in'),'SourceGraphic');
 const weights=new Map(warps.map((warp,index)=>[warp.getAttribute('result'),[0,1,2,3].map(i=>i===index?1:0)]));
 for(const blend of blends){
  const a=weights.get(blend.getAttribute('in')),b=weights.get(blend.getAttribute('in2'));
  weights.set(blend.getAttribute('result'),a.map((value,i)=>value*Number(blend.getAttribute('k2'))+b[i]*Number(blend.getAttribute('k3'))));
 }
 assert.deepEqual(weights.get('reconstructed'),[.25,.25,.25,.25]);
 assert.equal(app.filter.querySelectorAll('feGaussianBlur').length,0,'text is not fed into a blur');
});

test('pixel density and memory bound reconstruction workload independently of OS',()=>{
 const lens=model();
 for(const [w,h,dpr,memory,cores,count] of [[1440,900,1,8,8,4],[1920,1080,1,8,8,2],[390,844,3,4,8,1],[2560,1440,2,16,16,1],[1440,900,1.25,8,4,2]]){
  const quality=lens.quality(w,h,dpr,memory,cores);
  assert.equal(quality.taps.length,count);assert.ok(quality.width*quality.height<=131072);
  for(const [x,y] of quality.taps){assert.ok(Math.abs(x*dpr)<=.25);assert.ok(Math.abs(y*dpr)<=.25);}
 }
});

test('moving between different-density screens rebuilds the pipeline once',()=>{
 const app=boot();app.sandbox.window.devicePixelRatio=2;
 app.mediaQueries.find(query=>query.query.includes('resolution:')).change();
 app.flushRaf();
 assert.equal(app.surface.dataset.crtPixelRatio,'2');assert.equal(app.surface.dataset.crtSamples,'1');
 assert.equal(app.trace.canvases,5);
 app.events.get('resize')();assert.equal(app.trace.canvases,5);
});

test('unsupported filters and forced colors leave live native content readable',()=>{
 for(const options of [{unsupported:true},{contrast:true}]){
  const app=boot('file:',options);
  assert.equal(app.surface.dataset.crtRenderer,'native-dom');assert.equal(app.trace.canvases,0);
  assert.ok(!app.root.classList.has('crt-enabled'));
  app.sandbox.visualY+=20;app.subscribers[0]();
  assert.equal(app.surface.style.getPropertyValue('--crt-offset-y'),'-444.25px');
 }
 const app=boot('https:',{noComposite:true});assert.equal(app.surface.dataset.crtSamples,'1');assert.equal(app.surface.dataset.crtStatus,'ready');
});

test('sustained slow motion lowers sampling once per observation window without losing the lens',()=>{
 const app=boot();
 for(let i=0;i<25;i++){app.sandbox.visualY+=1;app.subscribers[0](i*34);}
 assert.equal(app.surface.dataset.crtSamples,'2');assert.ok(app.root.classList.has('crt-enabled'));
 assert.equal(app.surface.dataset.crtQualityReason,'frame-budget');assert.equal(app.trace.canvases,6);
 for(let i=25;i<49;i++){app.sandbox.visualY+=1;app.subscribers[0](i*34);}
 assert.equal(app.surface.dataset.crtSamples,'1');assert.equal(app.trace.canvases,7);
 for(let i=49;i<90;i++)app.subscribers[0](i*16.7+1000);
 assert.equal(app.trace.canvases,7,'sampling must not oscillate or regenerate every frame');
});

test('healthy frame intervals and idle gaps do not trigger quality rebuilds',()=>{
 const app=boot();for(let i=0;i<90;i++)app.subscribers[0](i*16.7);
 app.subscribers[0](9000);app.subscribers[0](9016.7);
 assert.equal(app.surface.dataset.crtSamples,'4');assert.equal(app.trace.canvases,4);
});
test('startup resources work under a static project subpath without a screenshot dependency',()=>{
 const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
 for(const match of html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="([^"]+)"/g)){
  const url=new URL(match[1],'https://example.invalid/project/');
  assert.equal(url.origin,'https://example.invalid');assert.ok(url.pathname.startsWith('/project/'));assert.ok(existsSync(new URL('../dist/'+match[1],import.meta.url)));
 }
 assert.ok(!html.includes('html2canvas'));assert.ok(!/<script[^>]*type=["']module["']/.test(html));
 for(const path of ['crt.js','showcase-gpu.js'])assert.equal((html.match(new RegExp(`<script[^>]+src="${path}"`,'g'))||[]).length,1,`${path} must be loaded exactly once`);
});

test('GPU showcase follows the reference radial curve with mipmapped sampling and edge coverage',()=>{
 assert.match(showcaseGpuSource,/factor=\(1\.0-\.3655\*uCurvature\)\*\(1\.0\+uCurvature\*r\*r\*r\)/);
 assert.match(showcaseGpuSource,/gl\.LINEAR_MIPMAP_LINEAR/);
 assert.match(showcaseGpuSource,/gl\.generateMipmap\(gl\.TEXTURE_2D\)/);
 assert.match(showcaseGpuSource,/smoothstep\(-feather,feather,edge\)/);
 assert.match(showcaseGpuSource,/uniform float uChromaticStrength/);
 assert.match(showcaseGpuSource,/uniformChromatic,\.8/);
 assert.match(showcaseGpuSource,/dataset\.crtShowcaseGpuInitialized/);
});
