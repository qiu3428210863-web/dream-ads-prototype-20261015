import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const script=readFileSync(new URL('../dist/viewport-layout.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../dist/hero-viewport.css',import.meta.url),'utf8');

test('hero fills the visible client viewport below the measured navigation',()=>{
 const values=new Map();let headerHeight=76,viewportHeight=820,resizeFrame;
 const root={style:{setProperty:(name,value)=>values.set(name,value)}};
 const header={getBoundingClientRect:()=>({height:headerHeight})};
 const windowEvents=new Map(),viewportEvents=new Map();let resizeObserved;
 const visualViewport={get height(){return viewportHeight;},addEventListener:(name,callback)=>viewportEvents.set(name,callback)};
 class ResizeObserver{constructor(callback){resizeObserved=callback;}observe(){}}
 const sandbox={document:{documentElement:root,querySelector:()=>header},window:{visualViewport,innerHeight:900,ResizeObserver},ResizeObserver,
  addEventListener:(name,callback)=>windowEvents.set(name,callback),requestAnimationFrame:callback=>{resizeFrame=callback;return 1;}};
 vm.runInNewContext(script,sandbox);
 assert.equal(values.get('--app-viewport-height'),'820px');assert.equal(values.get('--app-header-height'),'76px');
 viewportHeight=620;viewportEvents.get('resize')();resizeFrame();
 assert.equal(values.get('--app-viewport-height'),'620px','browser chrome changes update the usable height');
 headerHeight=64;resizeObserved();resizeFrame();
 assert.equal(values.get('--app-header-height'),'64px','responsive navigation height is measured rather than guessed');
 assert.match(css,/\.hero\{[\s\S]*?width:100%;max-width:none;margin:0/);
 assert.match(css,/min-height:calc\(var\(--app-viewport-height,100vh\) - var\(--app-header-height,76px\)\)/);
 assert.match(css,/@media\(max-width:600px\)[\s\S]*?\.hero-art\{min-height:clamp\(180px,30vh,250px\)/);
 const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
 assert.match(html,/href="hero-viewport\.css"/);assert.match(html,/src="viewport-layout\.js" defer><\/script><script src="app\.js"/);
});
