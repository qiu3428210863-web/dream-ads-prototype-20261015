import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
function harness(){
 const classes=()=>{const values=new Set();return {add:x=>values.add(x),remove:x=>values.delete(x),contains:x=>values.has(x)};};
 const loads=[],frames=[];
 const video={classList:classes(),dataset:{},pause(){this.paused=true},load(){this.currentSrc=this.src},requestVideoFrameCallback:fn=>frames.push(fn),readyState:2};
 const poster={classList:classes(),addEventListener:(name,fn)=>loads.push(fn),complete:false};
 const context=vm.createContext({heroVideo:video,heroVideoPoster:poster,heroPlaylist:['clip-a','clip-b'],heroConcepts:[{thumbnailUrl:'a.jpg'},{thumbnailUrl:'b.jpg'}],heroVideoIndex:0,heroPosterRequest:0,heroCanPlay:false,featuredCards:[],setActiveFeatured(){},rotateFeaturedCardToCenter(){},syncHeroVideo(){},preloadNextHeroVideo(){}});
 const select=source.slice(source.indexOf('const selectHeroVideo='),source.indexOf('const heroAheadVideo='));
 const reveal=source.slice(source.indexOf('const revealHeroVideoFrame='),source.indexOf("heroVideo?.addEventListener('playing'"));
 vm.runInContext(`${select}\n${reveal}\nthis.select=selectHeroVideo;this.reveal=revealHeroVideoFrame;`,context);
 return {context,video,poster,loads,frames,play(){video.paused=false;context.reveal(video.currentSrc);frames.shift()();}};
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
