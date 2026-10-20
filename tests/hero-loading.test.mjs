import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
function harness(){
 const classes=()=>{const values=new Set();return {add:x=>values.add(x),remove:x=>values.delete(x),contains:x=>values.has(x)};};
 const loads=[],frames=[],images=[];
 class PendingImage{constructor(){images.push(this);this.complete=false;}set onload(fn){loads.push(fn);}}
 const video={classList:classes(),dataset:{},pause(){this.paused=true},load(){this.currentSrc=this.src},requestVideoFrameCallback:fn=>frames.push(fn),readyState:2};
 const poster={classList:classes(),addEventListener:(name,fn)=>loads.push(fn),complete:false};
 const context=vm.createContext({Image:PendingImage,heroVideo:video,heroVideoPoster:poster,heroPlaylist:['clip-a','clip-b'],heroConcepts:[{thumbnailUrl:'a.jpg'},{thumbnailUrl:'b.jpg'}],heroVideoIndex:0,heroPosterRequest:0,heroCanPlay:false,featuredCards:[],setActiveFeatured(){},rotateFeaturedCardToCenter(){},syncHeroVideo(){},preloadNextHeroVideo(){}});
 const select=source.slice(source.indexOf('const selectHeroVideo='),source.indexOf('const heroAheadVideo='));
 const reveal=source.slice(source.indexOf('const revealHeroVideoFrame='),source.indexOf("heroVideo?.addEventListener('playing'"));
 vm.runInContext(`${select}\n${reveal}\nthis.select=selectHeroVideo;this.reveal=revealHeroVideoFrame;`,context);
 return {context,video,poster,loads,frames,images,play(){video.paused=false;context.reveal(video.currentSrc);frames.shift()();}};
}
test('late poster load cannot restore a still image after a presented video frame',()=>{
 const h=harness();h.context.select(0);h.play();h.loads.shift()();
 assert.equal(h.poster.classList.contains('is-visible'),false);
});
test('poster remains available before the video frame, including on the next selection',()=>{
 const h=harness();h.context.select(0);h.loads.shift()();
 assert.equal(h.poster.classList.contains('is-visible'),true);
 h.play();h.context.select(1);h.loads.shift()();
 assert.equal(h.poster.classList.contains('is-visible'),true);
 h.play();assert.equal(h.poster.classList.contains('is-visible'),false);
});
test('an old decoded frame cannot reveal a newly selected video',()=>{
 const h=harness();h.context.select(0);h.video.paused=false;h.context.reveal('clip-a');h.context.select(1);h.frames.shift()();
 assert.equal(h.video.classList.contains('is-switching'),true);
});

test('hero poster and video share unconstrained cover geometry despite the global responsive-image rule',()=>{
 const css=readFileSync(new URL('../dist/hero-viewport.css',import.meta.url),'utf8');
 const shared=css.match(/\.hero-video-poster,\.hero-video\{([^}]+)\}/)?.[1]||'';
 assert.match(shared,/width:108%/);
 assert.match(shared,/height:108%/);
 assert.match(shared,/max-width:none/,'the image must not inherit img{max-width:100%}: at left -4% it leaves a ~3% right-hand gap');
 assert.match(shared,/object-fit:cover/);
});


test('loading a new poster keeps the last ready image visible even when the candidate never loads',()=>{
 const h=harness();h.poster.src='local-ready.webp';h.context.select(0);
 assert.equal(h.poster.classList.contains('is-visible'),true);
 assert.equal(h.poster.src,'local-ready.webp');
 assert.equal(h.images.length,1);
});
test('a late poster from an old selection cannot replace the current loading image',()=>{
 const h=harness();h.poster.src='local-ready.webp';h.context.select(0);h.context.select(1);
 h.loads[0]();assert.equal(h.poster.src,'local-ready.webp');
 h.loads[1]();assert.equal(h.poster.src,'b.jpg');
});

test('fatal video failure restores a ready poster instead of leaving a black media layer',()=>{
 const h=harness();h.context.select(0);h.play();
 h.context.stopProgressTracking=()=>{};h.video.addEventListener=(name,fn)=>fn();
 const error=source.slice(source.indexOf("heroVideo?.addEventListener('error'"),source.indexOf("heroVideo?.addEventListener('loadedmetadata'"));
 vm.runInContext(error,h.context);
 assert.equal(h.video.classList.contains('is-switching'),true);assert.equal(h.poster.classList.contains('is-visible'),true);
});

function playbackHarness(){
 const calls={play:0,pause:0},video={dataset:{},readyState:2,muted:false,defaultMuted:false,playsInline:false,paused:true,setAttribute(){},play(){calls.play++;return Promise.resolve();},pause(){calls.pause++;this.paused=true;}},mobile={mobile:{matches:true},visibility:()=>({ratio:1}),attempt:v=>{calls.play++;v.paused=false;return Promise.resolve();}};
 const env={heroVideo:video,heroSection:{},heroMotion:{matches:false},heroVisible:true,heroCanPlay:false,heroStartupReady:false,document:{hidden:false,querySelector:()=>null},window:{DreamMobilePlayback:mobile}};
 const start=source.indexOf('function syncHeroVideo(){'),end=source.indexOf("heroVideo?.addEventListener('loadeddata'",start);vm.runInNewContext(source.slice(start,end)+';globalThis.sync=syncHeroVideo;',env);return {env,calls,video,mobile};
}
test('a decoded first frame can start mobile playback even when canplay has not fired',()=>{
 const h=playbackHarness();h.env.sync();assert.equal(h.calls.play,1,'HAVE_CURRENT_DATA must start playback rather than wait forever on canplay');assert.equal(h.video.muted,true);assert.equal(h.video.defaultMuted,true);assert.equal(h.video.playsInline,true);
});
test('offscreen hero playback remains deliberately paused rather than automatically recovered',()=>{
 const h=playbackHarness();h.mobile.visibility=()=>({ratio:0});h.env.sync();assert.equal(h.calls.play,0);assert.equal(h.video.dataset.viewportPaused,'true');assert.equal(h.video.autoplay,false);
});
