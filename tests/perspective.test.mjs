import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../dist/page-perspective.js',import.meta.url),'utf8');
function boot(){
 const events=new Map(),frames=[],root={dataset:{},clientWidth:1280};let reads=0;
 function surface(top){
  const props=new Map(),classes=new Set();
  return {style:{getPropertyValue:key=>props.get(key)||'',setProperty:(key,value)=>props.set(key,value),removeProperty:key=>props.delete(key)},props,
   classList:{add:key=>classes.add(key),remove:key=>classes.delete(key),toggle:(key,on)=>on?classes.add(key):classes.delete(key)},
   get offsetTop(){reads++;return top;},get offsetLeft(){reads++;return 100;},get offsetWidth(){reads++;return 1080;},get offsetHeight(){reads++;return 300;},offsetParent:null};
 }
 const near=surface(550),far=surface(3000),motion={matches:false,addEventListener:(_,fn)=>events.set('motion',fn)};
 let subscriber;const win={scrollY:0,visualViewport:null,DreamScroll:{position:()=>({y:0}),onFrame:fn=>{subscriber=fn;}}};
 const sandbox={window:win,document:{documentElement:root,querySelectorAll:()=>[near,far]},innerHeight:900,matchMedia:()=>motion,
  requestAnimationFrame:fn=>{frames.push(fn);return frames.length;},addEventListener:(name,fn)=>events.set(name,fn)};
 vm.runInNewContext(source,sandbox);
 return {near,far,win,motion,events,frames,get reads(){return reads;},tick:()=>subscriber(),flush(){const batch=frames.splice(0);batch.forEach(fn=>fn());}};
}

test('native scrollbar movement updates perspective even when the smooth-scroll position is stale',()=>{
 const app=boot(),before=parseFloat(app.near.props.get('--page-tilt-x'));const reads=app.reads;
 app.win.scrollY=500;app.events.get('scroll')();app.flush();
 const after=parseFloat(app.near.props.get('--page-tilt-x'));
 assert.ok(before<0&&after>0,'the surface tilts through neutral as it crosses the viewport center');
 assert.equal(app.reads,reads,'scroll frames do not remeasure layout');
 assert.equal(app.far.props.size,0,'offscreen content does not receive per-frame style changes');
});

test('perspective shares the scroll clock and has no permanent animation loop',()=>{
 const app=boot();app.win.scrollY=100;assert.equal(app.tick(),false);
 assert.equal(app.frames.length,0,'idle page perspective does not schedule more frames');
 app.events.get('scroll')();app.events.get('scroll')();assert.equal(app.frames.length,1,'native scroll events share one pending frame');
});

test('reduced motion restores neutral content without hiding any elements',()=>{
 const app=boot();assert.ok(app.near.props.has('--page-tilt-x'));
 app.motion.matches=true;app.events.get('motion')();assert.equal(app.near.props.size,0);
 app.motion.matches=false;app.events.get('motion')();assert.ok(app.near.props.has('--page-tilt-x'));
});
