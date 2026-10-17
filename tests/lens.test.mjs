import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync,existsSync} from 'node:fs';
import {legacyField,reconstructionError} from './lens-metrics.mjs';

const modelSource=readFileSync(new URL('../dist/lens-model.js',import.meta.url),'utf8');
function model(){const context=vm.createContext({Uint8ClampedArray,Math});vm.runInContext(modelSource,context);return context.DreamLens;}

test('lens bends the screen perimeter while keeping its center fixed',()=>{
 const lens=model(),center=lens.sample(720,450,1440,900),edge=lens.sample(0,450,1440,900),corner=lens.sample(0,0,1440,900);
 assert.equal(center.x,720);assert.equal(center.y,450);
 assert.ok(Math.abs(edge.x-28.547712)<1e-6);assert.ok(edge.x-corner.x>20,'straight edge acquires visible curvature');
});
test('displacement encoding preserves the reference lens for desktop and mobile dimensions',()=>{
 const lens=model();
 for(const [width,height] of [[1440,900],[2560,1440],[390,844],[320,568]]){
  const field=lens.field(width,height);
  for(let y=0;y<field.height;y+=7)for(let x=0;x<field.width;x+=7){
   const sx=(x+.5)/field.width*width,sy=(y+.5)/field.height*height,index=(y*field.width+x)*4,point=lens.sample(sx,sy,width,height);
   const dx=(field.pixels[index]/255-.5)*field.scale,dy=(field.pixels[index+1]/255-.5)*field.scale;
   assert.ok(Math.abs(sx+dx-point.x)<=field.scale/510+1e-7);assert.ok(Math.abs(sy+dy-point.y)<=field.scale/510+1e-7);
   assert.equal(field.pixels[index+3],255);
  }
 }
});

function boot(protocol='file:'){
 const events=new Map(),subscribers=[],observers=[],densityEvents=[],trace={canvases:0,pixels:[],dataURLs:0};
 const styles=()=>({values:new Map(),setProperty(name,value){this.values.set(name,value);},getPropertyValue(name){return this.values.get(name);}});
 let sandbox;
 class Element{
  children=[];parentElement=null;style=styles();attributes=new Map();classList=new Set();dataset={};scrollHeight=4600;
  constructor(tag='div'){this.tagName=tag;this.classList.remove=name=>this.classList.delete(name);}
  append(...nodes){for(const node of nodes){if(node.parentElement){const siblings=node.parentElement.children;siblings.splice(siblings.indexOf(node),1);}node.parentElement=this;this.children.push(node);}}
  before(node){const siblings=this.parentElement.children;node.parentElement=this.parentElement;siblings.splice(siblings.indexOf(this),0,node);}
  setAttribute(name,value){this.attributes.set(name,value);}
  getAttribute(name){return this.attributes.get(name);}
  addEventListener(){}
  getBoundingClientRect(){return {top:76-sandbox.scrollY,height:this.scrollHeight};}
  querySelector(selector){return this.children.find(node=>selector[0]==='#'?node.id===selector.slice(1):node.tagName===selector)||this.children.map(node=>node.querySelector(selector)).find(Boolean);}
  set innerHTML(value){
   for(const match of value.matchAll(/<(filter|feImage|feGaussianBlur|feDisplacementMap)\b([^>]*)/g)){
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
 const window={DreamScroll:{position:()=>({x:0,y:sandbox.visualY}),onFrame:fn=>subscribers.push(fn),requestFrame(){}},ResizeObserver:class{constructor(fn){observers.push(fn);}observe(){}},matchMedia:()=>({addEventListener(type,fn){densityEvents.push(fn);},removeEventListener(){}})};
 sandbox={window,document,ResizeObserver:window.ResizeObserver,location:{protocol},devicePixelRatio:1,innerHeight:900,scrollY:500,visualY:500.25,console,
  addEventListener(type,fn){events.set(type,fn);},requestAnimationFrame:()=>1};
 const context=vm.createContext(sandbox);vm.runInContext(modelSource,context);vm.runInContext(readFileSync(new URL('../dist/crt.js',import.meta.url),'utf8'),context);
 return {sandbox,body,header,main,root,surface:body.querySelector('#crt-surface'),filter:body.querySelector('filter'),warp:body.querySelector('feDisplacementMap'),trace,subscribers,events,observers,densityEvents};
}
test('file-origin initialization activates the live lens without reading any product image',()=>{
 const app=boot();
 assert.equal(app.surface.dataset.crtStatus,'ready');assert.equal(app.surface.dataset.crtRenderer,'svg-live-viewport');assert.equal(app.surface.dataset.crtProtocol,'file:');
 assert.ok(app.root.classList.has('crt-enabled'));assert.equal(app.trace.canvases,1);assert.equal(app.trace.dataURLs,1);
 assert.equal(app.header.parentElement,app.body,'navigation stays outside the lens');assert.equal(app.main.parentElement,app.surface);
 assert.equal(app.warp.getAttribute('in'),'SourceGraphic');assert.equal(app.filter.getAttribute('width'),'1440');assert.equal(app.filter.getAttribute('height'),'900');
});
test('scroll updates live content offsets without rebuilding the viewport displacement field',()=>{
 const app=boot();assert.equal(app.surface.style.getPropertyValue('--crt-offset-y'),'-424.25px');
 for(let i=0;i<30;i++){app.sandbox.visualY+=.5;app.subscribers[0]();}
 assert.equal(app.surface.style.getPropertyValue('--crt-offset-y'),'-439.25px');assert.equal(app.trace.canvases,1);assert.equal(app.filter.getAttribute('y'),'0');
 app.surface.scrollHeight=4900;app.observers[0]();assert.equal(app.body.children.find(node=>node.className==='crt-spacer').style.height,'4900px');assert.equal(app.trace.canvases,1);
});
test('HTTP hosting uses the same renderer and viewport resizing regenerates only its field',()=>{
 const app=boot('https:');assert.equal(app.surface.dataset.crtProtocol,'https:');
 app.root.clientWidth=390;app.sandbox.innerHeight=844;app.events.get('resize')();
 assert.equal(app.filter.getAttribute('width'),'390');assert.equal(app.filter.getAttribute('height'),'844');assert.equal(app.trace.canvases,2);assert.equal(app.surface.dataset.crtStatus,'ready');
});
test('startup resources work under a static project subpath without a screenshot dependency',()=>{
 const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
 for(const match of html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="([^"]+)"/g)){
  const url=new URL(match[1],'https://example.invalid/project/');
  assert.equal(url.origin,'https://example.invalid');assert.ok(url.pathname.startsWith('/project/'));assert.ok(existsSync(new URL('../dist/'+match[1],import.meta.url)));
 }
 assert.ok(!html.includes('html2canvas'));assert.ok(!/<script[^>]*type=["']module["']/.test(html));
});
test('adaptive field density has a fixed memory ceiling and tighter displacement precision',()=>{
 const lens=model();
 for(const [width,height,dpr] of [[1920,1080,1],[2560,1440,2],[3840,2160,3],[390,844,3]]){
  const field=lens.field(width,height,dpr);
  assert.ok(field.width<=512&&field.height<=512);assert.ok(field.width*field.height<=131072);
  assert.ok(field.scale<Math.max(width,height)*.06*.7,'encode the actual displacement range instead of a loose bound');
 }
 assert.ok(lens.quality(1920,1080,2).width>lens.quality(1920,1080,1).width);
});
test('texel-centered interpolation reduces reconstructed lens-coordinate error',()=>{
 const lens=model();
 for(const [width,height,dpr] of [[1440,900,1],[1920,1080,1],[2560,1440,2],[390,844,3]]){
  const before=reconstructionError(lens,legacyField(lens,width,height),width,height);
  const after=reconstructionError(lens,lens.field(width,height,dpr),width,height);
  assert.ok(after.rms<before.rms*.4,'reconstructed coordinates stay closer to the unchanged analytic lens');
  assert.ok(after.max<.3,'model reconstruction stays within 0.3 CSS pixel on the probe grid');
 }
});
test('moving to a different pixel density rebuilds the field without changing curvature or layout size',()=>{
 const app=boot(),region=app.filter.getAttribute('width');
 app.sandbox.devicePixelRatio=2;app.densityEvents[0]();
 assert.equal(app.trace.canvases,2);assert.equal(app.filter.getAttribute('width'),region);assert.equal(app.surface.dataset.crtDpr,'2');
 assert.equal(app.surface.dataset.crtCurvature,'0.16');assert.equal(app.filter.getAttribute('image-rendering'),'optimizeQuality');
 assert.equal(app.warp.getAttribute('in'),'SourceGraphic');assert.equal(app.body.querySelector('feGaussianBlur').getAttribute('in'),'field-raw');
});
