import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../dist/mobile-playback.js',import.meta.url),'utf8');
function fixture(){
 const handlers=new Map(),queries=[],state={cards:[],dialog:null},doc={hidden:false,querySelector:()=>state.dialog,querySelectorAll:s=>s==='#showcase-grid .work-card'?state.cards:[],addEventListener:(name,fn)=>handlers.set(name,fn),dispatchEvent(){}};
 const env={document:doc,innerWidth:390,innerHeight:844,matchMedia:q=>{const m={matches:!q.includes('reduced-motion'),addEventListener(){}};queries.push(m);return m;},addEventListener(){},setTimeout:()=>1,clearTimeout(){},IntersectionObserver:class{observe(){}},CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail;}}};vm.runInNewContext(source,env);
 const rect=(top,height=180)=>({left:0,right:320,top,bottom:top+height,width:320,height});
 const media=(top=300)=>({isConnected:true,dataset:{},paused:true,calls:0,pauses:0,events:[],getBoundingClientRect:()=>rect(top),closest:()=>null,pause(){this.pauses++;this.paused=true;},play(){this.calls++;this.paused=false;return Promise.resolve();},dispatchEvent(e){this.events.push(e);}});
 return {api:env.DreamMobilePlayback,doc,handlers,queries,state,rect,media};
}
test('mobile autoplay policy refusal keeps a poster, without propagating a Play video prompt',async()=>{
 const f=fixture(),v=f.media();let stopped=false;
 f.handlers.get('dream:play-rejected')({target:v,detail:{name:'NotAllowedError'},stopImmediatePropagation(){stopped=true;}});
 assert.equal(stopped,true);assert.equal(v.dataset.autoplayBlocked,'true');assert.equal(v.events[0].type,'dream:autoplay-blocked');
 f.handlers.get('pointerup')();await new Promise(resolve=>setImmediate(resolve));assert.equal(v.calls,1);assert.equal(v.muted,true);assert.equal(v.defaultMuted,true);assert.equal(v.playsInline,true);assert.equal(v.dataset.autoplayBlocked,undefined);
});
test('retry waits for visible media and does not restart offscreen or hidden players',async()=>{
 const f=fixture(),v=f.media(1000);f.api.block(v);f.handlers.get('pointerup')();await Promise.resolve();assert.equal(v.calls,0);
 v.getBoundingClientRect=()=>f.rect(300);f.doc.hidden=true;await f.api.attempt(v);assert.equal(v.calls,0);f.doc.hidden=false;await f.api.attempt(v);assert.equal(v.calls,1);
});
test('unsupported media is still reported as a real failure',async()=>{
 const f=fixture(),v=f.media();v.play=()=>Promise.reject({name:'NotSupportedError'});await f.api.attempt(v);assert.equal(v.events[0].type,'dream:play-rejected');assert.equal(v.events[0].detail.name,'NotSupportedError');
});
test('workflow selection follows the most visible card nearest the viewport center',()=>{
 const f=fixture();assert.equal(f.api.pickVisible([f.media(80),f.media(330),f.media(1000)]),1);assert.equal(f.api.pickVisible([f.media(-200),f.media(1000)]),-1);
});
test('only two visible gallery previews load; opening a modal pauses both',async()=>{
 const f=fixture();f.state.cards=[90,330,550].map(top=>{const classes=new Set(),v=f.media(top),card={classList:{add:(...a)=>a.forEach(x=>classes.add(x)),remove:(...a)=>a.forEach(x=>classes.delete(x)),contains:x=>classes.has(x)},querySelector:s=>s==='.work-visual'?{getBoundingClientRect:()=>f.rect(top,120)}:s==='.work-hover-video'?v:{dataset:{previewVideoSrc:'preview.mp4'}}};v.closest=s=>s==='.work-card'?card:null;return card;});
 f.api.sync();await Promise.resolve();assert.equal(f.state.cards.filter(c=>c.querySelector('.work-hover-video').calls>0).length,2);assert.equal(f.state.cards[0].querySelector('.work-hover-video').calls,0);
 f.state.dialog={};f.api.sync();assert.equal(f.state.cards.filter(c=>c.classList.contains('is-previewing')).length,0);
});
test('reduced motion and desktop retain their existing behavior',async()=>{
 const f=fixture(),v=f.media();f.queries[1].matches=true;await f.api.attempt(v);assert.equal(v.calls,0);f.queries[0].matches=false;let stopped=false;f.handlers.get('dream:play-rejected')({target:v,detail:{name:'NotAllowedError'},stopImmediatePropagation(){stopped=true;}});assert.equal(stopped,false);
});

test('workflow autoplay follows the visible step and pauses the sequence when it leaves the screen',()=>{
 const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8'),start=app.indexOf('function syncChallengePlayback(){'),end=app.indexOf("if(challengeSteps&&'IntersectionObserver'in window)",start);let selected=2;const starts=[],videos=[0,1,2].map(()=>({dataset:{},pauses:0,pause(){this.pauses++;},play:()=>Promise.resolve()}));
 const env={window:{DreamMobilePlayback:{mobile:{matches:true},pickVisible:()=>selected}},reducedCarouselMotion:{matches:false},document:{hidden:false,querySelector:()=>null},challengeStepVideos:videos,activeChallengeStep:0,playChallengeStep:i=>starts.push(i)};
 vm.runInNewContext(app.slice(start,end)+';globalThis.sync=syncChallengePlayback;',env);env.sync();assert.deepEqual(starts,[2]);selected=-1;env.sync();assert.equal(videos[0].pauses,1);assert.equal(env.challengeInView,false);
});

test('a genuine media error is not silently retried by the autoplay queue',async()=>{
 const f=fixture(),v=f.media();f.api.block(v);v.dataset.feedbackState='error';f.handlers.get('pointerup')();await new Promise(resolve=>setImmediate(resolve));assert.equal(v.calls,0);
});
