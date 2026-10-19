import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {existsSync,readFileSync} from 'node:fs';

const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const perspectiveSource=readFileSync(new URL('../dist/page-perspective.js',import.meta.url),'utf8');
const perspectiveCss=readFileSync(new URL('../dist/page-perspective.css',import.meta.url),'utf8');
const showcaseGpuSource=readFileSync(new URL('../dist/showcase-gpu.js',import.meta.url),'utf8');
const showcaseQualitySource=readFileSync(new URL('../dist/showcase-quality.js',import.meta.url),'utf8');
const showcaseCss=readFileSync(new URL('../dist/showcase.css',import.meta.url),'utf8');
const heroCss=readFileSync(new URL('../dist/hero-viewport.css',import.meta.url),'utf8');
const viewCss=readFileSync(new URL('../dist/showcase-view.css',import.meta.url),'utf8');
const playerCss=readFileSync(new URL('../dist/player.css',import.meta.url),'utf8');
const gpuCss=readFileSync(new URL('../dist/showcase-gpu.css',import.meta.url),'utf8');
const appSource=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
const challengeFaqCss=readFileSync(new URL('../dist/challenge-faq.css',import.meta.url),'utf8');
const hyperFramesSteps=['01','02','03'].map(n=>readFileSync(new URL('./fixtures/hyperframes/step-'+n+'.html',import.meta.url),'utf8'));
const hyperFramesSource=hyperFramesSteps.join('\n');
const arenaThemeSource=readFileSync(new URL('../dist/arena-theme.css',import.meta.url),'utf8');

test('the page starts in English and permits browser translation',()=>{
 assert.match(html,/<html lang="en">/);
 assert.doesNotMatch(html,/<html[^>]*translate="no"|content="notranslate"/);
 assert.doesNotMatch(html,/\p{Script=Han}/u,'visible copy and accessibility labels use English');
 assert.doesNotMatch(html,/openart\.ai\/zh-cn\//,'footer destinations use English-language pages');
});

test('native page perspective replaces full-page DOM rasterization while retaining the card renderer',()=>{
 assert.match(html,/href="page-perspective\.css"/);
 assert.match(html,/src="page-perspective\.js" defer/);
 assert.doesNotMatch(html,/page-curvature(?:\.css|\.js)|html2canvas/,'the full-page WebGL renderer and DOM snapshot library are no longer loaded');
 assert.match(html,/showcase-gpu\.js/,'the separate showcase card renderer remains available');
 assert.doesNotMatch(perspectiveSource,/html2canvas|getContext\(|createTexture|texImage2D|createElement\(/,'page perspective never rasterizes or uploads the document');
 assert.doesNotMatch(perspectiveCss,/opacity:0|scale3d|scale\(/,'the native document stays visible and full width');
 assert.match(html,/<footer class="footer openart-footer"[\s\S]*?openart-footer-mark[\s\S]*?<\/footer>/,'the footer and oversized wordmark remain in the native document');
});

test('legacy full-page SVG CRT renderer is removed from runtime and project assets',()=>{
 assert.doesNotMatch(html,/crt\.css|crt\.js|lens-model\.js|crt-viewport|crt-lens/);
 assert.doesNotMatch(perspectiveSource,/feDisplacementMap|toDataURL/);
 for(const path of ['crt.css','crt.js','lens-model.js','assets/crt-grain.svg','assets/crt-displacement.png'])assert.equal(existsSync(new URL('../dist/'+path,import.meta.url)),false,`${path} is obsolete`);
 assert.doesNotMatch(arenaThemeSource,/crt-glass|crt-surface/);
 assert.doesNotMatch(readFileSync(new URL('../dist/player.css',import.meta.url),'utf8'),/crt-gpu-showcase/);
 assert.match(arenaThemeSource,/\.brief-panel,\.step\{color:#171717\}/,'light panels keep dark, readable type on the black theme');
});

test('page resources work under a static project subpath',()=>{
 for(const match of html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="([^"]+)"/g)){
  const url=new URL(match[1],'https://example.invalid/project/');
  assert.equal(url.origin,'https://example.invalid');assert.ok(url.pathname.startsWith('/project/'));
  assert.ok(existsSync(new URL('../dist/'+match[1],import.meta.url)),`${match[1]} exists`);
 }
 for(const path of ['showcase-gpu.css','showcase-quality.js','showcase-gpu.js'])assert.equal((html.match(new RegExp(`(?:src|href)="${path}(?:\\?[^\"]*)?"`,'g'))||[]).length,1,`${path} loads once`);
 for(const path of ['page-perspective.css','page-perspective.js'])assert.equal((html.match(new RegExp(`(?:src|href)="${path}(?:\\?[^\"]*)?"`,'g'))||[]).length,1,`${path} is loaded once`);
});

test('OpenArt-inspired footer has responsive link columns, social destinations, and the official oversized wordmark',()=>{
 const footer=html.match(/<footer class="footer openart-footer"[\s\S]*?<\/footer>/)?.[0]||'';
 assert.ok(footer,'new OpenArt-style footer is present');
 for(const heading of ['Start Creating','AI Models','Features','Resources','Company'])assert.ok(footer.includes(`<h2>${heading}</h2>`),`${heading} navigation column exists`);
 for(const url of ['https://openart.ai/mcp/','https://www.youtube.com/@openart_ai','https://x.com/OpenArtAI','mailto:support@openart.ai'])assert.ok(footer.includes(url),`${url} is wired as a working destination`);
 assert.match(footer,/class="openart-footer-mark"/,'the oversized official OpenArt wordmark remains in the footer');
 assert.match(footer,/<img src="assets\/openart-footer-wordmark\.webp" alt="" width="1920" height="320">/,'the footer uses the high-resolution wordmark asset from the reference site');
 assert.match(footer,/class="openart-footer-subgroup openart-footer-company-group"><h2>Company<\/h2>/,'company links use the same subsection structure as other footer groups');
 assert.match(footer,/class="openart-footer-subgroup openart-footer-help"><h2>Need Help\?<\/h2>/,'help links use the same subsection structure as other footer groups');
 assert.doesNotMatch(footer,/openart-footer-legal|返回顶部|创意练习|◎ 中文/,'the unrelated legal, back-to-top, and language row is removed');
 const footerCss=readFileSync(new URL('../dist/openart-footer.css',import.meta.url),'utf8');
 assert.match(footerCss,/\.openart-footer-main\{[^}]*width:calc\(100% - 64px\);max-width:1440px/,'footer columns align to the same max-width as the page content');
 assert.match(footerCss,/\.openart-footer-bottom\{[^}]*width:calc\(100% - 64px\);max-width:1440px/,'large wordmark aligns to the same width as the footer columns');
 assert.match(footerCss,/\.openart-footer-column a\{[^}]*color:#9c929e/,'nested subsection links share the same muted color and interaction styling');
 assert.doesNotMatch(footerCss,/openart-footer-column[^}]*:after/,'footer navigation links do not draw pink underline animations');
 assert.match(footerCss,/grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
 assert.match(footerCss,/@media\(max-width:700px\)[\s\S]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(footerCss,/@media\(max-width:700px\)[\s\S]*\.openart-footer-company\{grid-column:1\/-1;display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/,'company and help groups sit side by side on mobile');
 assert.match(footerCss,/linear-gradient\(180deg,#080808 0%,#3d1530 45%,#8b1a6e 70%,#d124a4 88%,#fff 105%\)/,'footer background matches the reference site dark gradient');
});

test('showcase retains the curved GPU mesh and legible card rendering',()=>{
 assert.match(showcaseGpuSource,/float sourceRadius=length\(p\)/);
 assert.match(showcaseGpuSource,/uniform float uCurvature/);
 assert.match(showcaseGpuSource,/gl\.drawArrays\(gl\.TRIANGLES,0,columns\*rows\*6\)/);
 assert.match(showcaseGpuSource,/dataset\.showcaseGpuInitialized/);
 assert.match(showcaseGpuSource,/className='showcase-gpu-canvas'/);
 assert.ok(showcaseGpuSource.includes("getPropertyValue('--ui-surface')"));
 assert.ok(showcaseGpuSource.includes('ctx.fillStyle=s.color;ctx.fillText(title.innerText'));
 assert.match(showcaseGpuSource,/drawImage\(hoverVideo,layoutRect\(hoverVideo\.getBoundingClientRect\(\)\)\)/);
 assert.match(gpuCss,/html\.showcase-gpu-active \.showcase-grid \.work-card/);
});

test('showcase quality stays within texture and device budgets',()=>{
 const context=vm.createContext({Math});vm.runInContext(showcaseQualitySource,context);
 const quality=context.DreamShowcaseQuality;
 assert.equal(quality.outputRatio(1920,1080,1,4096),1);
 assert.equal(quality.outputRatio(1440,900,2,8192),2);
 assert.ok(quality.outputRatio(2560,1440,2,2048)<=2048/2560);
 const card=quality.cardRatio(560,620,1,4096,8,8);
 assert.ok(card>1&&card<=1.5);assert.ok(560*620*card*card<=2_500_000);
 const lowPower=quality.cardRatio(560,620,2,4096,4,4);
 assert.ok(lowPower*lowPower*560*620<=1_200_000);assert.equal(quality.lowPowerDevice(4,4),true);
});

test('showcase updates only visible dirty textures and shares bounded animation frames',()=>{
 assert.match(showcaseGpuSource,/for\(const \{item,rect\} of visible\)/);
 assert.match(showcaseGpuSource,/margin=0/);
 assert.match(showcaseGpuSource,/gl\.texSubImage2D\(gl\.TEXTURE_2D,0,0,0,gl\.RGBA,gl\.UNSIGNED_BYTE,item\.canvas\)/);
 assert.match(showcaseGpuSource,/if\(item\.uploadDirty\)/);
 assert.match(showcaseGpuSource,/item\.dirty=false;item\.uploadDirty=true/);
 assert.doesNotMatch(showcaseGpuSource,/hoverVideo\.readyState\s*</);
 assert.match(showcaseGpuSource,/function animateHover\(item\).*item\.hoverUntil=performance\.now\(\)\+\(reducedMotion\.matches\?0:720\)/);
 assert.match(showcaseGpuSource,/if\(reducedMotion\.matches\|\|hoverRaf\|\|raf\)return/);
 assert.doesNotMatch(showcaseGpuSource,/gl\.getError\(\)/);
});

test('hero repeats the actual showcase sleeves instead of the miniature Up next carousel',()=>{
 assert.match(html,/class="hero-card-rail"[\s\S]*class="showcase-grid hero-card-grid" id="hero-showcase-grid"/);
 assert.match(appSource,/heroCardGrid\.innerHTML=concepts\.slice\(0,5\)\.map\(\(c,index\)=>conceptCardMarkup\(c,index,5,true\)\)/,'the hero has its own five-card row');
 assert.match(appSource,/heroConcepts=concepts\.slice\(0,5\),heroPlaylist=heroConcepts\.map\(concept=>concept\.videoSrc\)/,'the hero video playlist follows those five cards');
 assert.match(html,/<img class="hero-video-poster" src="assets\/hero-background-poster\.jpg" alt="" aria-hidden="true"><video class="hero-video" aria-hidden="true" muted playsinline preload="auto" poster="assets\/hero-background-poster\.jpg"><\/video>/,'the hero has a separate transition poster to prevent stale video frames');
 assert.doesNotMatch(html,/hero-background\.mp4/,'the unused background video does not compete with the first featured clip');
 assert.match(appSource,/heroVideoPoster=\$\('\.hero-video-poster'\)/,'the selected card poster is available during video transitions');
 assert.match(appSource,/heroVideo\.classList\.add\('is-switching'\);if\(heroVideoPoster&&concept\.thumbnailUrl\)\{const request=\+\+heroPosterRequest[\s\S]*heroVideoPoster\.src=concept\.thumbnailUrl/,'the old frame is hidden while the matching card image loads');
 assert.match(appSource,/addEventListener\('playing',\(\)=>\{const source=heroVideo\.dataset\.playlistSrc;if\(!source\|\|heroVideo\.currentSrc!==source\)return;revealHeroVideoFrame\(source\);\}\)/,'the matching video waits for its first presented frame before replacing its image');
 assert.match(appSource,/heroCanPlay=false,heroStartupReady=false/,'hero playback waits until the first clip is ready');
 assert.match(appSource,/addEventListener\('canplay',[\s\S]*requestIdleCallback/,'initial playback starts during browser idle time after buffering');
 assert.match(appSource,/requestVideoFrameCallback/,'progress painting follows decoded video frames');
 assert.match(appSource,/lastFallbackProgress>=1000\/30/,'older browsers limit progress painting to 30 frames per second');
 assert.match(appSource,/heroVideo\?\.addEventListener\('ended',[\s\S]*selectHeroVideo\(heroVideoIndex\+1\)/,'hero videos advance and repeat after the fifth clip');
 assert.doesNotMatch(appSource,/document\.body\.append\(rail\)/,'the hero card row stays inside the hero section');
 assert.doesNotMatch(html,/Up next|hero-featured/);
 assert.doesNotMatch(appSource,/featured-progress|featuredElapsed/,'the removed miniature progress carousel does not keep running');
 assert.match(appSource,/grid\.addEventListener\('click',[\s\S]*?openPreview\(button\.dataset\.preview\)/,'only the lower showcase opens the preview dialog');
 assert.match(appSource,/heroCardGrid\.addEventListener\('click',[\s\S]*?selectHeroVideo\(index\)/,'the featured rail plays a selected video inline');
 assert.match(appSource,/const rotateFeaturedCardToCenter=\(card,animate=true\)=>[\s\S]*current\.slice\(start\),\.\.\.current\.slice\(0,start\)/,'the hero cards rotate cyclically around the selected center card');
 assert.match(appSource,/selectHeroVideo=\(index,restart=true,animateCenter=true\)=>[\s\S]*rotateFeaturedCardToCenter\(featuredCards\[heroVideoIndex\],animateCenter\)/,'each newly playing card moves into the center slot');
 assert.match(appSource,/videoFrameToken=heroVideo\.requestVideoFrameCallback/,'the featured playback outline is updated with presented video frames');
 assert.match(appSource,/classList\.contains\('showcase-gpu-active'\)/,'progress refreshes the curved card renderer only when that renderer is active');
 assert.match(heroCss,/\.hero-card-grid \.cover-wordmark,\.hero-card-grid \.work-caption,\.hero-card-grid \.work-meta\{display:none!important\}/,'hero cards omit all labels and overlaid branding below or on thumbnails');
 assert.match(heroCss,/\.hero-card-grid\.showcase-grid \.work-card\{flex:0 0 var\(--hero-card-width,280px\)[^}]*transform:translate3d\(var\(--flip-x\),var\(--hover-lift\),0\)/,'all featured cards keep the same size while they rotate');
 assert.match(heroCss,/\.hero h1\{font-size:var\(--hero-title-size\);line-height:\.98;margin:0;letter-spacing:-\.035em\}/,'the hero headline is larger and less tightly tracked');
 assert.doesNotMatch(heroCss,/--card-scale|scale\(var\(--card-scale\)\)/,'featured card size does not change by carousel position');
 assert.match(heroCss,/\.work-card:not\(\[data-carousel-distance="0"\]\):hover\{--hover-lift:-9px\}/,'only side cards lift smoothly on hover');
 assert.match(heroCss,/\.hero-card-grid\.showcase-grid \.work-card\{flex:0 0 var\(--hero-card-width,280px\);padding:0;border:0;[^}]*background:transparent/,'hero sleeves have no black card backing');
 assert.match(heroCss,/\.hero-card-grid \.work-card:focus-within \.work-disc\{opacity:0!important/,'click focus cannot leave a featured disc permanently popped out');
 assert.match(heroCss,/\.hero-card-grid \.work-card\.is-hero-active \.work-visual::after\{opacity:1;background:var\(--arena-pink,#ff82db\)\}/,'active progress matches the page pink variable');
 assert.match(heroCss,/\.hero-card-rail\{position:absolute[^}]*bottom:clamp\(28px,4vh,40px\)/,'the hero card row sits slightly above the bottom edge');
 assert.match(showcaseGpuSource,/Number\(card\.dataset\.playbackProgress\)/,'the featured card frame follows actual video progress');
 assert.match(showcaseGpuSource,/cards=grids\.flatMap/,'both rails share one GPU renderer');
 assert.match(showcaseGpuSource,/visibleGrids\.has\(item\.owner\)/,'only cards in visible rails are rendered');
 assert.match(showcaseGpuSource,/catch\(error\)\{failed=true;deactivate\(\);return false;\}/,'tainted remote media cleanly restores the accessible DOM instead of hiding every card');
 assert.match(showcaseGpuSource,/getComputedStyle\(caption\)\.display!=='none'/,'the curved renderer respects removed hero thumbnail text');
 assert.match(showcaseGpuSource,/getComputedStyle\(logo\)\.display!=='none'/,'the curved renderer respects removed hero logos');
 assert.match(showcaseGpuSource,/if\(title&&!hero\)/,'the curved renderer omits hero labels below thumbnails');
 assert.ok(showcaseGpuSource.includes("if(!hero){ctx.fillStyle=getComputedStyle"),'hero card backs stay transparent');
 assert.match(heroCss,/\.hero-card-rail\{position:absolute/,'the hero rail is anchored to the hero rather than the browser viewport');
 assert.match(heroCss,/\.hero-card-grid\.showcase-grid \.work-card\{flex:0 0 var\(--hero-card-width,280px\)/,'card size follows the responsive viewport width');
 const viewportSource=readFileSync(new URL('../dist/viewport-layout.js',import.meta.url),'utf8');
 assert.match(viewportSource,/const railWidth=width-32/,'wide screens use the full available viewport for the hero rail');
 assert.match(viewportSource,/Math\.floor\(\(railWidth-48\)\/5\)/,'desktop viewport sizing fits five slightly enlarged cards across the row');
});

test('hero and nearby gallery videos are preloaded without eager full-page downloads',()=>{
 assert.match(appSource,/heroAheadVideo\.preload='auto'/,'one upcoming hero clip is buffered ahead');
 assert.match(appSource,/preloadNextHeroVideo=\(\)=>\{const connection=navigator\.connection/,'preloading respects data-saving and slow-network settings');
 assert.match(appSource,/video\.preload='metadata';video\.src=source;video\.dataset\.loadedSource=source;video\.load\(\)/,'nearby gallery cards fetch video metadata before a preview is opened');
 assert.match(appSource,/\{rootMargin:'500px 0px'\}/,'gallery preloading stays close to the visible cards');
});

test('hero background swaps the poster only after the matching video frame is presented',()=>{
 assert.match(appSource,/const revealHeroVideoFrame=source=>\{const reveal=\(\)=>\{if\(heroVideo\.dataset\.playlistSrc!==source\|\|heroVideo\.currentSrc!==source\|\|heroVideo\.paused\|\|heroVideo\.readyState<2\)return;\+\+heroPosterRequest;heroVideo\.classList\.remove\('is-switching'\);heroVideoPoster\?\.classList\.remove\('is-visible'\)/,'stale or not-yet-rendered video frames cannot uncover the new background');
 assert.match(appSource,/if\(heroVideo\.requestVideoFrameCallback\)heroVideo\.requestVideoFrameCallback\(reveal\)/,'the poster is removed on the browser-presented video frame when supported');
 assert.match(appSource,/heroVideo\?\.addEventListener\('playing',\(\)=>\{const source=heroVideo\.dataset\.playlistSrc;if\(!source\|\|heroVideo\.currentSrc!==source\)return;revealHeroVideoFrame\(source\);\}\)/,'only the currently selected video can complete a background swap');
 assert.match(heroCss,/\.hero-video-poster\{z-index:0;opacity:0;visibility:hidden;filter:brightness\(\.8\);transition:none\}[\s\S]*\.hero-video\{z-index:1;opacity:\.87;filter:brightness\(\.8\);transition:none\}/,'poster and video do not cross-fade different frames over one another');
});

test('header theme control switches and persists a full light palette',()=>{
 assert.match(html,/<button class="button small dark" data-join>Join the Challenge<\/button><button type="button" class="theme-toggle" id="theme-toggle"/,'the theme control sits beside the header CTA');
 assert.match(html,/localStorage\.getItem\('dream-ads-theme'\)/,'the saved palette is applied before styles render');
 assert.match(appSource,/function setPageTheme\(theme,save=true\)[\s\S]*themeRoot\.dataset\.theme=value[\s\S]*localStorage\.setItem\('dream-ads-theme',value\)/,'theme changes persist and update the document theme');
 assert.match(appSource,/themeToggle\?\.addEventListener\('click',\(\)=>setPageTheme/,'the accessible header control toggles both palettes');
 assert.match(html,/href="theme-toggle\.css"/,'the palette stylesheet is loaded');
 assert.match(readFileSync(new URL('../dist/theme-toggle.css',import.meta.url),'utf8'),/html\[data-theme="light"\] \.showcase-grid \.work-card\{background:#fff/,'light mode changes card surfaces and supporting page colors');
 assert.match(readFileSync(new URL('../dist/theme-toggle.css',import.meta.url),'utf8'),/html\[data-theme="light"\] \.hero\{background:#f6f4f7;color:#fff\}/,'the daylight hero base matches the page under its video rail');
 const themeCss=readFileSync(new URL('../dist/theme-toggle.css',import.meta.url),'utf8');
 assert.match(appSource,/themeRoot\.classList\.add\('theme-transitioning'\)[\s\S]*themeRoot\.dataset\.theme=value/,'palette changes run through a short transition state');
 assert.match(themeCss,/@keyframes theme-elastic-settle\{0%\{translate:0 0;scale:1\}54%\{translate:0 2px;scale:\.998\}78%\{translate:0 -1px;scale:1\.001\}/,'the page settles with a subtle elastic movement');
 assert.match(themeCss,/html\[data-theme="light"\] \.hero-card-grid \.work-open,[\s\S]*background:transparent!important;box-shadow:none!important/,'the hero card hit area stays transparent in light mode');
});

test('registration modal keeps readable contrast and uses centered YouTube-inspired confirmation actions',()=>{
 assert.match(html,/class="button dark form-submit" type="submit">Save my challenge draft<\/button>/,'the form action has centered text without a trailing icon');
 assert.match(html,/class="success-symbol" aria-hidden="true"><svg[\s\S]*<h3>Draft saved in this browser\.<\/h3>/,'success uses an accessible vector confirmation mark and clear submitted state');
 assert.match(html,/class="entry-success-actions"><button class="button dark" id="success-done" type="button">Done<\/button><button class="text-button" id="edit-draft" type="button">Keep editing<\/button><\/div>/,'success buttons are stacked, equally sized, and have no icons');
 const themeCss=readFileSync(new URL('../dist/theme-toggle.css',import.meta.url),'utf8');
 assert.match(themeCss,/\.entry-dialog\{background:#fff;color:#211d24\}/,'modal copy remains dark on its white surface in either site theme');
 assert.match(themeCss,/\.entry-dialog \.dialog-close[\s\S]*background:#111!important;color:#fff!important/,'the modal close control is a black circle with a white cross');
 assert.match(themeCss,/\.entry-dialog \.entry-success #success-done[\s\S]*background:var\(--arena-action,#cd009b\);color:#fff/,'success actions use the page purple palette');
 assert.match(themeCss,/\.entry-dialog \.entry-success-actions\{display:grid;gap:12px;width:min\(320px,100%\)/,'success buttons use a vertical layout with equal width');
 assert.match(appSource,/\$\('#success-done'\)\.addEventListener\('click',\(\)=>entryDialog\.close\(\)\)/,'Done closes the submitted state');
});

test('registration accepts and saves a required video attachment with the local draft',()=>{
 assert.match(html,/id="creator-video" name="video" type="file" accept="video\/\*" aria-required="true"/,'the form exposes an accessible video attachment picker');
 assert.match(html,/class="video-upload" for="creator-video"[\s\S]*id="video-file-name" aria-live="polite"/,'the picker shows the selected video name');
 assert.match(appSource,/function saveDraftWithVideo\(draft,video\)[\s\S]*transaction\.objectStore\('drafts'\)\.put\(\{draft,video\},storageKey\)/,'the draft and original video file are stored together in IndexedDB');
 assert.match(appSource,/let videoFile=\$\('#creator-video'\)\.files\?\.\[0\];[\s\S]*if\(!videoFile\)\{\$\('#creator-video'\)\.setCustomValidity\('Please attach your campaign video\.'\)/,'a video is required before submission');
 assert.match(appSource,/video:\{name:videoFile\.name,type:videoFile\.type,size:videoFile\.size/,'saved draft metadata records the video attachment');
 assert.match(appSource,/savedDraft\?\.video\)\{try\{videoFile=await loadSavedDraftVideo\(\)/,'an existing local draft can reuse its stored video');
});

test('gallery hover playback uses compressed full-length previews while dialogs retain source video',()=>{
 const clips=[...appSource.matchAll(/\{id:'([^']+)'[^}]*videoSrc:'([^']+)'/g)];
 assert.equal(clips.length,21,'each gallery concept has a source video');
 assert.match(appSource,/data-video-src="\$\{c\.videoSrc\|\|''\}" data-preview-video-src="\$\{c\.videoSrc\?`assets\/card-previews\/\$\{c\.id\}\.mp4`/,'cards keep the original video for the detail player and point hover playback at the compressed file');
 assert.match(appSource,/dataset\.previewVideoSrc\|\|button\?\.dataset\.videoSrc/,'hover and metadata preloads use the compact preview with a source fallback');
 for(const [,id] of clips)assert.ok(existsSync(new URL(`../dist/assets/card-previews/${id}.mp4`,import.meta.url)),`${id} has a compressed preview`);
});

test('the concept gallery keeps only the full All view',()=>{
 assert.doesNotMatch(html,/data-showcase-toggle|>Partial</,'the Partial selector is removed');
 assert.match(appSource,/let showcaseView='grid'/,'the full gallery is the default view');
 assert.match(appSource,/grid\.dataset\.view='grid'/,'the full gallery is shown before interaction');
 assert.match(appSource,/function activeCarouselCards\(\)\{return showcaseView==='grid'\?carouselCards:carouselCards\.slice\(0,5\);\}/);
 assert.match(viewCss,/\.showcase-grid\[data-view="cards"\] \.work-card:nth-child\(n\+6\)\{display:none\}/);
 assert.match(viewCss,/\.showcase-grid\[data-view="grid"\]\{/,'full gallery layout remains available');
 assert.match(viewCss,/#showcase-grid \.cover-wordmark,#showcase-grid \.work-caption\{display:none!important\}/,'gallery thumbnail logos and overlaid copy are hidden');
 assert.match(viewCss,/\.showcase-grid\[data-view="grid"\]\.has-row-reveal \.work-card\{[\s\S]*rotateX\(16deg\)[\s\S]*transition:opacity \.48s ease-out,transform \.72s cubic-bezier/,'gallery rows fold open with a smooth staggered reveal');
 assert.match(appSource,/const rowRevealObserver=new IntersectionObserver[\s\S]*row\.forEach\(\(card,index\)=>\{card\.style\.setProperty\('--row-card-index',String\(index\)\);card\.classList\.add\('is-row-revealed'\)/,'each row reveals as it enters the viewport');
});

test('showcase hover keeps the detached thin frame and thumbnail scale motion',()=>{
 assert.match(showcaseGpuSource,/roundRect\(ctx,v\.left-gap\+stroke\/2,v\.top-gap\+stroke\/2,v\.width\+gap\*2-stroke,v\.height\+gap\*2-stroke,24\)/);
 assert.match(showcaseCss,/\.work-open:hover \.work-visual\{transform:scale\(\.997\)\}/);
 assert.match(showcaseCss,/\.work-open:hover \.work-cover\{transform:scale\(1\.003009\)\}/);
 assert.match(showcaseCss,/inset:-6px;border-radius:24px;padding:1\.25px/);
});

test('section headings and content below the gallery rise into view once',()=>{
 assert.match(appSource,/function startPageContentReveal\(\)[\s\S]*\.section-top, \.section-heading, \.details-layout, \.how \.step, \.challenge-heading, \.challenge-faq-item, \.challenge-steps, \.faq > div, \.faq-list details, \.final-cta > \*:not\(img\):not\(\.creative-cta-art\), \.openart-footer-column, \.footer-bottom/,'the page reveals section titles, challenge rows, the animation section, and downstream content');
 assert.match(appSource,/new IntersectionObserver\(entries=>entries\.forEach\(entry=>\{if\(!entry\.isIntersecting\)return;entry\.target\.classList\.add\('is-content-revealed'\);observer\.unobserve\(entry\.target\);\}\),\{threshold:\.08,rootMargin:'0px 0px -7% 0px'\}\)/,'each item reveals as it approaches the viewport and is observed only once');
 assert.match(viewCss,/html\.has-content-reveal \.content-reveal-target\{opacity:0;translate:0 24px;transition:opacity \.56s ease-out,translate \.72s/,'content enters with a short upward motion');
 assert.match(viewCss,/html\.has-content-reveal \.content-reveal-target,html\.has-content-reveal \.content-reveal-target\.is-content-revealed\{opacity:1;translate:0 0;transition:none/,'reduced-motion preferences keep all content visible without animation');
});

test('three full-interface workflow clips use a single growing outline and loop in order',()=>{
 const section=html.match(/<section class="how challenge-faq[\s\S]*?<\/section>/)?.[0]||'';
 assert.equal((section.match(/class="challenge-faq-item"/g)||[]).length,6);
 assert.equal((section.match(/class="challenge-step-card"/g)||[]).length,3);
 for(const n of ['01','02','03']){
  assert.ok(section.includes('challenge-step-'+n+'.mp4?v=9'));
  assert.ok(existsSync(new URL('../dist/assets/challenge-step-'+n+'.mp4',import.meta.url)));
 }
 assert.doesNotMatch(section,/challenge-step-index|<svg class="challenge-progress/,'clips retain full interfaces and a single border growth indicator');
 assert.match(appSource,/ctx.moveTo\(width\/2,y\)/,'progress grows from top center like the hero');
 assert.match(appSource,/ctx.setLineDash\(\[perimeter\*progress\/100,perimeter\]\)/,'a single canvas perimeter grows with actual playback');
 assert.doesNotMatch(challengeFaqCss,/challenge-progress-track|stroke-dash|filter:drop-shadow/,'no duplicate track, dashed outlines or flashing glow');
 assert.match(appSource,/playChallengeStep\(\(index\+1\)%challengeStepVideos.length\)/,'the last clip returns to the first');
 assert.match(appSource,/requestAnimationFrame\(tick\)/,'progress updates smoothly with video playback');
 assert.match(appSource,/if\(challengeInView&&!document.hidden&&video.dataset.feedbackState!=='error'\)video.play/,'playback resumes only when visible');
 assert.match(hyperFramesSteps[0],/Choose your product/);
 assert.doesNotMatch(hyperFramesSteps[0],/Start with|something you love|class="lede"/,'the former marketing column is removed');
 for(const component of ['class="sidebar"','class="composer"','class="gallery"','id="output"','id="generate"'])assert.ok(hyperFramesSteps[1].includes(component),component);
 assert.match(hyperFramesSteps[1],/grid-template-columns:repeat\(4,1fr\)/);
 assert.match(hyperFramesSteps[1],/Seedance 2.0/);
 for(const component of ['class="modal"','class="picker"','id="choose-video"','id="open-file"','id="consent"','id="save"','id="done"','Successfully submitted.','Keep editing'])assert.ok(hyperFramesSteps[2].includes(component),component);
 assert.doesNotMatch(hyperFramesSteps[2],/submission-preview|submission-layout/,'submission is the actual white modal, not a side-by-side editor');
 for(const source of hyperFramesSteps){assert.match(source,/getBoundingClientRect\(\)/);assert.match(source,/window.__timelines/);}
 const fit=readFileSync(new URL('../dist/entry-fit.css',import.meta.url),'utf8');
 assert.match(fit,/#entry-dialog #creator-video\{[^}]*width:1px!important[^}]*min-height:0!important/,'the hidden file input cannot create horizontal overflow');
 assert.match(fit,/max-height:none!important[^}]*overflow:clip!important/,'the complete form fits without scrollbar tracks');
 assert.match(html,/entry-fit.js/);
});

test('hero copy keeps its original text layout and rises in sequence',()=>{
 assert.match(html,/<h1 id="hero-title">Make your<br><span class="pink">dream ad\.<\/span><span class="sparkle" aria-hidden="true">✳<\/span><\/h1>/,'the headline retains its original markup and spacing');
 assert.match(appSource,/function startHeroCopyEntrance\(\)[\s\S]*heroSection\.classList\.add\('is-copy-entering'\)/,'hero copy uses a container-level entrance without splitting its text');
 assert.doesNotMatch(appSource,/hero-type-char|createTreeWalker\(target/,'the hero text is no longer split into per-character elements');
 assert.match(heroCss,/\.hero\.is-copy-entering \.hero-copy h1,\.hero\.is-copy-entering \.hero-description,\.hero\.is-copy-entering \.hero-actions\{opacity:0;translate:0 22px;animation:hero-copy-rise/,'headline, description, and CTA rise into place');
 assert.match(heroCss,/\.hero\.is-copy-entering \.hero-description\{animation-delay:140ms\}[\s\S]*\.hero\.is-copy-entering \.hero-actions\{animation-delay:280ms\}/,'description and CTA follow the headline in sequence');
});

test('concept preview controls and error feedback remain available',()=>{
 for(const id of ['preview-video','preview-play','preview-seek','preview-mute','preview-volume','preview-fullscreen','preview-status'])assert.match(html,new RegExp(`id="${id}"`));
 assert.match(html,/class="volume-icon"[\s\S]*class="volume-wave wave-one"[\s\S]*class="volume-wave wave-two"[\s\S]*class="volume-wave wave-three"/);
 assert.match(html,/id="preview-volume" class="player-volume" type="range" min="0" max="100" step="1"/,'volume uses a continuous 100-step range');
 assert.match(html,/id="preview-fullscreen"[\s\S]*class="player-volume-control"[\s\S]*id="preview-mute"/,'volume icon sits next to fullscreen');
 assert.match(html,/id="preview-play" data-state="playing"[\s\S]*class="play-shape"[\s\S]*class="pause-shape"[\s\S]*class="replay-shape"/,'the preview uses crisp vector play, pause, and replay controls');
 assert.match(playerCss,/\.player-play-icon[\s\S]*#preview-play\[data-state="playing"\][\s\S]*#preview-play\[data-state="paused"\]/,'the playback control switches icon states without text glyphs');
 assert.match(appSource,/const beginSeek=\(\)=>\{if\(seeking\)return;seeking=true;resumeAfterSeek=previewMedia\?!previewMedia\.paused:playing;\}/,'seeking remembers whether playback should resume');
 assert.match(appSource,/if\(resume\)setPlaying\(true\);updatePlayback\(\);/,'releasing the seek control restores playback when it was previously playing');
 assert.match(appSource,/if\(!seeking\)\$\('#preview-seek'\)\.value=/,'playback updates do not overwrite the slider while it is being dragged');
 assert.match(appSource,/event\.target\.closest\('\.work-visual'\)/);
 assert.match(appSource,/stopHoverPreviews\(card\)/);
 assert.match(appSource,/media\.muted=true/);
 assert.match(appSource,/previewMedia\.volume=volume\/100/);
 assert.match(appSource,/updateSeekFill\(\)/);
 assert.match(playerCss,/background:linear-gradient\(90deg,#ff82db 0 var\(--range-progress,0%\),#595959/);
 assert.match(playerCss,/\.player-volume-control:not\(\[data-muted=\"true\"\]\):hover \.player-volume-popover,[\s\S]*\.player-volume-control:not\(\[data-muted=\"true\"\]\):focus-within \.player-volume-popover/,'hover and keyboard focus reveal the vertical volume popover only while sound is enabled');
 assert.match(appSource,/previewVideo\.onerror=showMediaError/);
 assert.match(appSource,/No video file attached/);
});

test('failed hover preloads preserve the thumbnail and never paint an oversized error badge',()=>{
 assert.match(appSource,/if\(card\.classList\.contains\('is-previewing'\)\)card\.classList\.add\('preview-load-error'\);media\.pause\(\);media\.removeAttribute\('src'\)/,'only an active preview is marked as failed, and its broken video layer is removed');
 assert.doesNotMatch(showcaseGpuSource,/VIDEO UNAVAILABLE|preview-load-error/,'the curved canvas does not stretch error UI across the card');
 assert.doesNotMatch(playerCss,/preview-load-error\.is-previewing \.work-visual::before/,'failed thumbnails do not get an oversized CSS error layer');
});


test('browser-translated card text invalidates its visible canvas',()=>{
 let onMutation;const observed=[],card={},item={card,dirty:false};let renders=0;
 const block=showcaseGpuSource.match(/const mutations=new MutationObserver[^\n]+/)[0];
 const sandbox={cards:[item],grid:{parentElement:{}},render:()=>renders++,animateLayout(){},MutationObserver:class{constructor(fn){onMutation=fn;}observe(target,options){observed.push(options);}}};
 vm.runInNewContext(block,sandbox);
 onMutation([{target:{nodeType:3,parentElement:{closest:()=>card}}}]);
 assert.equal(item.dirty,true);assert.equal(renders,1);
 assert.equal(observed[0].characterData,true);assert.equal(observed[0].childList,true);
 item.dirty=false;onMutation([{target:{nodeType:1,closest:()=>card}}]);
 assert.equal(item.dirty,true);assert.equal(renders,2);
});


test('only non-text media is excluded from translation, with eagerly loaded studio layers',()=>{
 assert.match(html,/<html lang="en">/);
 assert.equal((html.match(/class="challenge-step-video" translate="no"/g)||[]).length,3);
 assert.match(html,/class="creative-cta-art" translate="no"/);
 for(const name of ['background','subject'])assert.match(html,new RegExp('class="creative-cta-'+name+'"[^>]*loading="eager"'));
 assert.match(appSource,/document.addEventListener\('dream:translation-layout',refreshChallengeMedia\)/);
 assert.match(appSource,/document.addEventListener\('click',event=>\{const button=event.target.closest\('\.challenge-step-button'\)/);
});

test('translated long titles shrink to their existing single-line width',()=>{
 const source=readFileSync(new URL('../dist/translation-compat.js',import.meta.url),'utf8');
 let mutate;const frames=[],notifications=[];let inline='';
 const title={clientWidth:300,get scrollWidth(){return (parseFloat(inline)||100)*5;},style:{removeProperty(){inline='';},set fontSize(value){inline=value;}}};
 const context={document:{querySelector:()=>title,body:{},dispatchEvent:e=>notifications.push(e.type)},getComputedStyle:()=>({fontSize:inline||'100px'}),MutationObserver:class{constructor(fn){mutate=fn;}observe(){}},addEventListener(){},requestAnimationFrame:fn=>{frames.push(fn);return frames.length;},CustomEvent:class{constructor(type){this.type=type;}}};
 vm.runInNewContext(source,context);frames.shift()();
 assert.ok(title.scrollWidth<=title.clientWidth);assert.deepEqual(notifications,['dream:translation-layout']);
 mutate();mutate();assert.equal(frames.length,1,'translation batches share a single update');frames.shift()();assert.ok(title.scrollWidth<=title.clientWidth);
});