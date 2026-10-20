import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
const heroCss=readFileSync(new URL('../dist/hero-viewport.css',import.meta.url),'utf8');
test('a local high priority poster is visible before JavaScript or any video frame',()=>{
 assert.match(html,/<img class="hero-video-poster is-visible"[^>]*src="assets\/posters\/openart-activewear\.webp"[^>]*fetchpriority="high"/);
 assert.match(html,/<link rel="preload" as="image" href="assets\/posters\/openart-activewear\.webp"/);
 assert.match(html,/<video class="hero-video is-switching"/);
 assert.match(heroCss,/\.hero-video-poster\.is-visible\{opacity:1;visibility:visible\}/);
 assert.ok(statSync(new URL('../dist/assets/posters/openart-activewear.webp',import.meta.url)).size<150000);
});
test('noncritical art and workflow videos do not compete with the hero',()=>{
 for(const name of ['background','subject'])assert.match(html,new RegExp('class="creative-cta-'+name+'"[^>]*src="[^\"]+\\.webp"[^>]*loading="lazy"'));
 assert.equal((html.match(/<video muted playsinline preload="none" poster="assets\/challenge-step-/g)||[]).length,3);
 assert.doesNotMatch(app,/video\.preload='metadata';video\.src=source/);
 assert.match(app,/loading="\$\{featured\?'eager':'lazy'\}"/);
});
test('hero clips and card posters are served from this site rather than blocking on external CDN',()=>{
 assert.match(app,/concept\.thumbnailUrl=`assets\/posters\/\$\{concept\.id\}\.webp`/);
 assert.match(app,/new URL\(`assets\/hero-streams\/\$\{concept\.id\}\.mp4\?v=20261020-hd`,document\.baseURI\)\.href/);
 for(const id of ['openart-activewear','openart-orange-soda','openart-energy-drink','openart-pink-fashion','openart-fox-film']){
  const bytes=readFileSync(new URL('../dist/assets/hero-streams/'+id+'.mp4',import.meta.url));
  assert.ok(bytes.length<25000000,'HD hero remains moderately compressed');
  let avc=bytes.indexOf(Buffer.from('avc1'));
  while(avc>=0&&(bytes.readUInt32BE(avc-4)<86||bytes.readUInt32BE(avc-4)>bytes.length))avc=bytes.indexOf(Buffer.from('avc1'),avc+4);
  assert.ok(avc>=0,'H.264 sample entry exists');
  assert.ok(bytes.readUInt16BE(avc+28)>=1280&&bytes.readUInt16BE(avc+30)>=720,'full-screen clips retain original HD dimensions');assert.ok(bytes.indexOf(Buffer.from('moov'))<bytes.indexOf(Buffer.from('mdat')),'MP4 metadata precedes video frames for progressive startup');
 }
});

test('hero encoding uses original sources with moderate quality rather than recompressing card previews',()=>{
 const encoder=readFileSync(new URL('../tools/encode-hero-hd.py',import.meta.url),'utf8');
 assert.doesNotMatch(encoder,/card-previews/);assert.match(encoder,/'-crf', '20'/);assert.match(encoder,/'-maxrate', '6000k'/);assert.match(encoder,/hero-source/);
});
