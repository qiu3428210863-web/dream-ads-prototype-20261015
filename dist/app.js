'use strict';
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const themeToggle=$('#theme-toggle'),themeColor=$('meta[name="theme-color"]'),themeRoot=document.documentElement;
let themeTransitionTimer=0;
function setPageTheme(theme,save=true){
 const value=theme==='light'?'light':'dark';
 if(save){themeRoot.classList.add('theme-transitioning');clearTimeout(themeTransitionTimer);themeTransitionTimer=setTimeout(()=>themeRoot.classList.remove('theme-transitioning'),680);}
 themeRoot.dataset.theme=value;
 const switchTo=value==='light'?'dark':'light',label=`Switch to ${switchTo} mode`;
 themeToggle?.setAttribute('aria-label',label);themeToggle?.setAttribute('title',label);themeToggle?.setAttribute('aria-pressed',String(value==='light'));
 if(themeColor)themeColor.content=value==='light'?'#f6f4f7':'#090909';
 if(save)try{localStorage.setItem('dream-ads-theme',value);}catch{}
}
setPageTheme(themeRoot.dataset.theme||'dark',false);
themeToggle?.addEventListener('click',()=>setPageTheme(themeRoot.dataset.theme==='dark'?'light':'dark'));
const heroSection=$('.hero'),heroVideo=$('.hero-video'),heroVideoPoster=$('.hero-video-poster'),heroMotion=matchMedia('(prefers-reduced-motion: reduce)');let heroVisible=true,heroCanPlay=false,heroStartupReady=false,heroPosterRequest=0;
function syncHeroVideo(){if(!heroVideo)return;if(heroMotion.matches||!heroVisible||document.hidden)heroVideo.pause();else if(heroCanPlay&&heroStartupReady)heroVideo.play().catch(error=>heroVideo.dispatchEvent(new CustomEvent('dream:play-rejected',{detail:{name:error.name}})));}
if('IntersectionObserver'in window&&heroSection){new IntersectionObserver(entries=>{heroVisible=entries.some(entry=>entry.isIntersecting);syncHeroVideo();},{threshold:.02}).observe(heroSection);}
heroMotion.addEventListener?.('change',syncHeroVideo);
document.addEventListener('visibilitychange',syncHeroVideo);
const concepts = [
 {id:'openart-activewear',theme:'tech',category:'Marketing & Advertising',title:'Movement, Made Electric.',product:'Activewear · Performance campaign',thumbnailUrl:'https://cdn.openart.ai/community-post-assets/701994ea2d3a595ab9323adeeab39d0e/thumbnail/0.webp',videoSrc:'https://cdn.openart.ai/community-post-assets/701994ea2d3a595ab9323adeeab39d0e/output/0.mp4',headline:'Move with\nintention.',description:'A runner cuts through a winter landscape in a vivid performance-wear spot, bringing color and energy to a quiet outdoor scene.',scenes:['A quiet winter morning.','Find your pace.','Move with intention.']},
 {id:'openart-orange-soda',theme:'lifestyle',category:'Marketing & Advertising',title:'A Sip of Something Bigger.',product:'Sparkling beverage · Product ad',thumbnailUrl:'https://cdn.openart.ai/community-post-assets/b6e98468ba045f4594d11fc058cff392/thumbnail/0.webp',videoSrc:'https://cdn.openart.ai/community-post-assets/b6e98468ba045f4594d11fc058cff392/output/0.mp4',headline:'Taste the\nunexpected.',description:'A bright drink, a crisp blue set, and oversized orange lettering turn an everyday sip into a playful product moment.',scenes:['A bright blue backdrop.','Take a refreshing sip.','Taste the unexpected.']},
 {id:'openart-energy-drink',theme:'beauty',category:'Marketing & Advertising',title:'Energy with a New Angle.',product:'Berry energy drink · Product film',thumbnailUrl:'https://cdn.openart.ai/community-post-assets/0418e93a6f175c2eb86de73ab0b2eb3a/thumbnail/0.webp',videoSrc:'https://cdn.openart.ai/community-post-assets/0418e93a6f175c2eb86de73ab0b2eb3a/output/0.mp4',headline:'A different\nkind of energy.',description:'A berry-packed energy drink fills the frame between city towers in a punchy, low-angle product shot.',scenes:['Look up.','A burst of berry energy.','See it differently.']},
 {id:'openart-pink-fashion',theme:'tech',category:'Marketing & Advertising',title:'Color That Takes the Room.',product:'Fashion · Brand campaign',thumbnailUrl:'https://cdn.openart.ai/community-post-assets/10bb04a78496557a9feab69c26e14d49/thumbnail/0.webp',videoSrc:'https://cdn.openart.ai/community-post-assets/10bb04a78496557a9feab69c26e14d49/output/0.mp4',headline:'Make an\nentrance.',description:'A sculptural magenta look stands out against a clean blue studio backdrop in a confident fashion campaign.',scenes:['A clean blue set.','A bold silhouette arrives.','Make an entrance.']},
 {id:'openart-fox-film',theme:'beauty',category:'Marketing & Advertising',title:'A Wild Little Story.',product:'Lifestyle · Cinematic campaign',thumbnailUrl:'https://cdn.openart.ai/community-post-assets/JUzQtYCtLTfnB6nuEezw/thumbnail/0.webp',videoSrc:'https://cdn.openart.ai/community-post-assets/JUzQtYCtLTfnB6nuEezw/output/0.mp4',headline:'Let the\nstory run wild.',description:'A warm, storybook-like scene turns a playful animal moment into a cinematic brand vignette.',scenes:['A warm evening interior.','A little chaos unfolds.','Let the story run wild.']},
 {id:'openart-comtex-tennis',theme:'tech',category:'Marketing & Advertising',title:'Comtex, Court-side.',product:'Comtex · Tennis campaign',thumbnailUrl:'https://cdn.openart.ai/community-post-assets/wn3QmPENd8MzDXDdcQ4y/thumbnail/0.webp',videoSrc:'https://cdn.openart.ai/community-post-assets/wn3QmPENd8MzDXDdcQ4y/output/0.mp4',headline:'Play beyond\nthe lines.',description:'A tennis serve freezes in motion before the camera tracks the outfit and court. The rally resolves into a Comtex wordmark formed from tennis balls.',scenes:['Step onto the court.','Hold the moment.','Play beyond the lines.']},
 {id:'openart-handmade-bag',theme:'lifestyle',category:'Marketing & Advertising',title:'Leather in Motion.',product:'Fandy · Handmade summer bag',thumbnailUrl:'https://cdn.openart.ai/community-post-assets/PZ5mUesM8bsVqaG7LOpW/thumbnail/0.webp',videoSrc:'https://cdn.openart.ai/community-post-assets/PZ5mUesM8bsVqaG7LOpW/output/0.mp4',headline:'Made to\nbe felt.',description:'A tactile product film puts Fandy’s handmade summer bag in the spotlight, focusing on leather, surface, light, and craft.',scenes:['Notice the texture.','Follow the light.','Made to be felt.']},
 {id:'openart-mochi-maker',theme:'beauty',category:'Marketing & Advertising',title:'Freshly Made, in Miniature.',product:'MOCHI · Skincare maker',thumbnailUrl:'https://cdn.openart.ai/community-post-assets/gOAEDxJ0GntWUTWcUre9/thumbnail/0.webp',videoSrc:'https://cdn.openart.ai/community-post-assets/gOAEDxJ0GntWUTWcUre9/output/0.mp4',headline:'A little\nritual, made.',description:'A pastel-pink skincare machine mixes fresh ingredients and dispenses a finished product in a compact, playful product demo.',scenes:['Drop in the ingredients.','Watch the blend come together.','A little ritual, made.']},
 {id:'openart-four-star-oats',theme:'lifestyle',category:'Marketing & Advertising',title:'Four Star Oats.',product:'Four Star Oats · Breakfast campaign',thumbnailUrl:'https://cdn.openart.ai/community-post-assets/7e1bc3eefa25c7ab6013631b81d6a265/thumbnail/0.jpg',videoSrc:'https://cdn.openart.ai/community-post-assets/7e1bc3eefa25c7ab6013631b81d6a265/output/0.mp4',headline:'Start with\nsomething good.',description:'A breakfast campaign for Four Star Oats, shaped around a warm, thoughtful everyday moment.',scenes:['A slower morning.','A simple breakfast.','Start with something good.']},
 {id:'openart-diesel',theme:'tech',category:'Marketing & Advertising',title:'Branding Ads for Diesel.',product:'DIESEL · Streetwear campaign',thumbnailUrl:'https://cdn.openart.ai/community-post-assets/be1159e964825d3c9a1e9a8bfbb10053/thumbnail/0.webp',videoSrc:'https://cdn.openart.ai/community-post-assets/be1159e964825d3c9a1e9a8bfbb10053/output/0.mp4',headline:'Wear your\nown attitude.',description:'A fast-paced Diesel streetwear manifesto builds attitude and brand identity through an expressive fashion world.',scenes:['Own the street.','Set your own pace.','Wear your own attitude.']},
 {id:'openart-koko-eyewear',theme:'beauty',category:'Marketing & Advertising',title:'KOKO in Focus.',product:'KOKO · Eyewear campaign',thumbnailUrl:'https://cdn.openart.ai/community-post-assets/a60cc61afeeb80b0e3ed717fe55f9089/thumbnail/0.webp',videoSrc:'https://cdn.openart.ai/community-post-assets/a60cc61afeeb80b0e3ed717fe55f9089/output/0.mp4',headline:'See it\nyour way.',description:'A kinetic eyewear spot gives KOKO glasses a vivid visual treatment with energetic edits and graphic effects.',scenes:['A new point of view.','Color comes into focus.','See it your way.']},
 {id:'openart-camera-story',theme:'tech',category:'Marketing & Advertising',title:'Framing Moments.',product:'Camera · Brand story',thumbnailUrl:'https://cdn.openart.ai/community-post-assets/2db97b27fd0a20ca3f2bf8b815fba1ee/thumbnail/0.webp',videoSrc:'https://cdn.openart.ai/community-post-assets/2db97b27fd0a20ca3f2bf8b815fba1ee/output/0.mp4',headline:'Find the\nframe that matters.',description:'A camera commercial connects its product to a clear story about the moments worth remembering.',scenes:['A moment begins.','Choose your frame.','Framing moments.']}
 ,{id:'openart-emily-portrait',theme:'lifestyle',category:'Marketing & Advertising',title:'A Moment, Reimagined.',product:'Lifestyle · Social campaign',thumbnailUrl:'https://cdn.openart.ai/community-post-assets/af6ccf2e0dd1275e058c2fb44d1928e2/thumbnail/0.webp',videoSrc:'https://cdn.openart.ai/community-post-assets/af6ccf2e0dd1275e058c2fb44d1928e2/output/0.mp4',headline:'A moment\nworth sharing.',description:'A vertical lifestyle spot from OpenArt’s Marketing and Advertising feed, framed for a quick, memorable social story.',scenes:['A striking first frame.','A moment takes shape.','Worth sharing.']}
 ,{id:'openart-emily-brand-film',theme:'tech',category:'Marketing & Advertising',title:'A Story in Every Frame.',product:'Brand film · Social campaign',thumbnailUrl:'https://cdn.openart.ai/community-post-assets/4003bd18a426466e57995a27fe6e6415/thumbnail/0.webp',videoSrc:'https://cdn.openart.ai/community-post-assets/4003bd18a426466e57995a27fe6e6415/output/0.mp4',headline:'Make the\nimage linger.',description:'A cinematic brand story from the OpenArt advertising collection, using a widescreen format to build atmosphere.',scenes:['Set the scene.','Let the image unfold.','Make it linger.']}
 ,{id:'openart-headphone-promo',theme:'tech',category:'Marketing & Advertising',title:'Premium Headphone Promo.',product:'Audio · Product advertisement',thumbnailUrl:'https://cdn.openart.ai/community-post-assets/7a9e7f3902440e5c02b15faa3aeb7bc6/thumbnail/0.webp',videoSrc:'https://cdn.openart.ai/community-post-assets/7a9e7f3902440e5c02b15faa3aeb7bc6/output/0.mp4',headline:'Hear every\ndetail.',description:'A 40-second, 720p headphone commercial from the source listing, presented as a premium audio product story.',scenes:['A closer listen.','Focus on the details.','Hear every detail.']}
 ,{id:'openart-calm-in-ear',theme:'lifestyle',category:'Marketing & Advertising',title:'Calm In Ear.',product:'Audio · Lifestyle campaign',thumbnailUrl:'https://cdn.openart.ai/community-post-assets/31267cbca0f164a8c70255d3ae1344cf/thumbnail/0.webp',videoSrc:'https://cdn.openart.ai/community-post-assets/31267cbca0f164a8c70255d3ae1344cf/output/0.mp4',headline:'Find your\nquiet.',description:'An in-ear audio concept from OpenArt’s advertising feed, shaped around a calm and focused listening experience.',scenes:['Step away from the noise.','Settle into the sound.','Find your quiet.']}
 ,{id:'openart-maheen-product-story',theme:'lifestyle',category:'Marketing & Advertising',title:'A Product with a Story.',product:'Lifestyle · Brand story',thumbnailUrl:'https://cdn.openart.ai/community-post-assets/3100cd89f21d566094173e378908c544/thumbnail/0.webp',videoSrc:'https://cdn.openart.ai/community-post-assets/3100cd89f21d566094173e378908c544/output/0.mp4',headline:'Every product\nhas a story.',description:'A compact brand story from the source collection, pairing a product focus with a clear campaign-style narrative.',scenes:['Set up the story.','Bring the product forward.','Tell it your way.']}
 ,{id:'openart-maheen-brand-story',theme:'beauty',category:'Marketing & Advertising',title:'Color, Character, Campaign.',product:'Brand · Social campaign',thumbnailUrl:'https://cdn.openart.ai/community-post-assets/414fe5abd43658a990eb7405c1e15300/thumbnail/0.webp',videoSrc:'https://cdn.openart.ai/community-post-assets/414fe5abd43658a990eb7405c1e15300/output/0.mp4',headline:'Give your\nbrand a look.',description:'A vivid visual concept from OpenArt’s marketing collection, designed to give a campaign a distinct color and character.',scenes:['Choose a visual mood.','Make it unmistakable.','Give your brand a look.']}
 ,{id:'openart-ayesha-product',theme:'lifestyle',category:'Marketing & Advertising',title:'A Little More Life.',product:'Lifestyle · Product campaign',thumbnailUrl:'https://cdn.openart.ai/community-post-assets/c76e27142d155ac48da528238af71cc2/thumbnail/0.webp',videoSrc:'https://cdn.openart.ai/community-post-assets/c76e27142d155ac48da528238af71cc2/output/0.mp4',headline:'Make room\nfor more.',description:'A lifestyle-led campaign from the advertising feed, with a short-form visual built around a product moment.',scenes:['Open on the moment.','Let the idea move.','Make room for more.']}
 ,{id:'openart-maheen-social',theme:'tech',category:'Marketing & Advertising',title:'Made for the Scroll.',product:'Social content · Brand campaign',thumbnailUrl:'https://cdn.openart.ai/community-post-assets/282bed80bec45fcf9f7f688462c80ccb/thumbnail/0.webp',videoSrc:'https://cdn.openart.ai/community-post-assets/282bed80bec45fcf9f7f688462c80ccb/output/0.mp4',headline:'Catch the eye.\nKeep the story.',description:'A social-first marketing concept from OpenArt’s public advertising feed, edited to make the visual idea land quickly.',scenes:['Catch the eye.','Keep the story moving.','Make it stick.']}
 ,{id:'openart-maheen-campaign',theme:'beauty',category:'Marketing & Advertising',title:'A Fresh Campaign Idea.',product:'Product · Marketing film',thumbnailUrl:'https://cdn.openart.ai/community-post-assets/947ce191f1445b3ab2629618ec0da96d/thumbnail/0.webp',videoSrc:'https://cdn.openart.ai/community-post-assets/947ce191f1445b3ab2629618ec0da96d/output/0.mp4',headline:'Start with\na spark.',description:'A short campaign visual sourced from OpenArt’s Marketing and Advertising inspiration feed.',scenes:['Start with a spark.','Build the visual.','Bring the idea to life.']}
];
/* Ship display posters locally; preserve original full-quality videos for explicit playback. */
concepts.forEach(concept=>{concept.originalThumbnailUrl=concept.thumbnailUrl;concept.thumbnailUrl=`assets/posters/${concept.id}.webp`;});
const grid = $('#showcase-grid');
const heroCardGrid=$('#hero-showcase-grid');
const reducedCarouselMotion=matchMedia('(prefers-reduced-motion: reduce)');
function startPageContentReveal(){
 if(reducedCarouselMotion.matches||!('IntersectionObserver'in window))return;
 const targets=$$('.section-top, .section-heading, .details-layout, .how .step, .challenge-heading, .challenge-faq-item, .challenge-steps, .faq > div, .faq-list details, .final-cta > *:not(img):not(.creative-cta-art), .openart-footer-column, .footer-bottom');
 if(!targets.length)return;
 const groupIndexes=new Map();
 targets.forEach(target=>{const group=target.closest('section,footer')||target.parentElement,index=groupIndexes.get(group)||0;target.classList.add('content-reveal-target');target.style.setProperty('--content-reveal-delay',`${index*90}ms`);groupIndexes.set(group,index+1);});
 document.documentElement.classList.add('has-content-reveal');
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting)return;entry.target.classList.add('is-content-revealed');observer.unobserve(entry.target);}),{threshold:.08,rootMargin:'0px 0px -7% 0px'});
 targets.forEach(target=>observer.observe(target));
}
startPageContentReveal();
function conceptCardMarkup(c,index,total,featured=false) {
 const theme=c.theme||'tech',poster=c.thumbnailUrl||`assets/${c.art}`;
 const actionLabel=featured?(c.videoSrc?`Show ${c.title} in the hero video`:`${c.title}; no video is available`):`Preview ${c.title}`;
 const featuredState=featured&&!c.videoSrc?'aria-disabled="true" tabindex="-1"':'';
 return `<article class="work-card" aria-roledescription="slide" aria-label="${index+1} of ${total}"><div class="work-disc ${theme}" aria-hidden="true"><div class="disc-art"><img loading="lazy" decoding="async" class="${c.thumbnailUrl?'work-disc-poster':''}" src="${poster}" alt="" width="680" height="680" draggable="false"></div><span class="disc-hub"></span></div><button type="button" class="work-open" data-preview="${c.id}" data-category="${theme}" data-video-src="${c.videoSrc||''}" data-preview-video-src="${c.videoSrc?`assets/card-previews/${c.id}.mp4`:''}" ${featured?'data-featured-card':''} aria-label="${actionLabel}" ${featuredState} draggable="false"><div class="work-visual ${theme}"><div class="work-cover"><video class="work-hover-video" muted playsinline loop preload="none" aria-hidden="true"></video><img loading="${featured?'eager':'lazy'}" decoding="async" fetchpriority="${featured?'auto':'low'}" class="work-product ${c.thumbnailUrl?'work-poster':''}" src="${poster}" alt="${c.product}" width="680" height="680" draggable="false"><img class="cover-wordmark" src="assets/openart-logo.svg" alt="" width="403" height="69" draggable="false"><span class="work-caption">${c.headline.replace('\n','<br>')}</span></div></div><div class="work-meta"><h3>${c.title}</h3><p>${c.product}</p></div></button></article>`;
}
function startHeroCopyEntrance(){
 if(!heroSection||heroMotion.matches)return;
 heroSection.classList.add('is-copy-entering');
}
function startHeroCardEntrance(cards,rail){
 if(heroMotion.matches||!cards.length||!rail)return;
 const center=Math.floor(cards.length/2);
 cards.forEach((card,index)=>{const distance=Math.abs(index-center),order=distance===0?0:distance*2-(index<center?1:0);card.style.setProperty('--hero-entry-delay',`${order*95}ms`);});
 setTimeout(()=>rail.classList.add('is-entering'),420);
 setTimeout(()=>rail.classList.remove('is-entering'),420+((cards.length-1)*95)+720);
}
grid.innerHTML=concepts.map((c,index)=>conceptCardMarkup(c,index,concepts.length)).join('');
if(heroCardGrid){
 heroCardGrid.innerHTML=concepts.slice(0,5).map((c,index)=>conceptCardMarkup(c,index,5,true)).join('');
 window.DreamCarouselInput?.bind(heroCardGrid);
 const nativeFeatured=matchMedia('(max-width:900px), (hover:none), (pointer:coarse)');
 const rail=heroCardGrid.parentElement,featuredCards=$$('.work-card',heroCardGrid),heroConcepts=concepts.slice(0,5),heroPlaylist=heroConcepts.map(concept=>new URL(`assets/hero-streams/${concept.id}.mp4`,document.baseURI).href);
 rail.classList.add('is-visible');
 startHeroCopyEntrance();startHeroCardEntrance(featuredCards,rail);
 let heroVideoIndex=0,gesture=null,suppressUntil=0,progressFrame=0,videoFrameToken=0,lastFallbackProgress=0;
 const centerFeaturedCard=(card,behavior='instant')=>{if(!card)return;const left=card.offsetLeft+card.offsetWidth/2-heroCardGrid.clientWidth/2;heroCardGrid.scrollTo({left,behavior});};
 const applyFeaturedDepth=(cards,center=Math.floor(cards.length/2))=>{cards.forEach((card,index)=>{const offset=Math.abs(index-center);card.dataset.carouselDistance=String(Math.min(offset,cards.length-offset));card.setAttribute('aria-label',`${index+1} of ${cards.length}`);});};
 const rotateFeaturedCardToCenter=(card,animate=true)=>{const current=[...heroCardGrid.children],index=current.indexOf(card);if(index<0)return;/* Native swipes own scrollLeft; playback must not move the rail under a finger. */if(nativeFeatured.matches){applyFeaturedDepth(current,index);return;}const center=Math.floor(current.length/2),start=(index-center+current.length)%current.length,ordered=[...current.slice(start),...current.slice(0,start)],before=new Map(current.map(item=>[item,item.getBoundingClientRect()])),changed=ordered.some((item,slot)=>item!==current[slot]);if(changed){const fragment=document.createDocumentFragment();ordered.forEach(item=>fragment.append(item));heroCardGrid.append(fragment);}centerFeaturedCard(card,'instant');if(!animate){applyFeaturedDepth(ordered);return;}heroCardGrid.classList.add('is-reordering');ordered.forEach(item=>{const previous=before.get(item),next=item.getBoundingClientRect();item.style.setProperty('--flip-x',`${previous.left-next.left}px`);});void heroCardGrid.offsetWidth;heroCardGrid.classList.remove('is-reordering');requestAnimationFrame(()=>{applyFeaturedDepth(ordered);ordered.forEach(item=>item.style.setProperty('--flip-x','0px'));if(document.documentElement.classList.contains('showcase-gpu-active')){const started=performance.now();const refresh=now=>{ordered.forEach(item=>item.dispatchEvent(new CustomEvent('dream:card-progress',{bubbles:true})));if(now-started<820)requestAnimationFrame(refresh);};requestAnimationFrame(refresh);}});};
 const updateFeaturedProgress=(card,media)=>{if(!card)return;const duration=Number.isFinite(media.duration)&&media.duration>0?media.duration:0,progress=duration?Math.max(0,Math.min(1,media.currentTime/duration)):0;card.dataset.playbackProgress=String(progress);card.style.setProperty('--playback-progress',`${(progress*100).toFixed(2)}%`);card.classList.toggle('has-playback-progress',progress>0);};
 const stopProgressTracking=()=>{if(progressFrame){cancelAnimationFrame(progressFrame);progressFrame=0;}if(videoFrameToken&&heroVideo?.cancelVideoFrameCallback){heroVideo.cancelVideoFrameCallback(videoFrameToken);videoFrameToken=0;}};
 const trackProgress=(now=performance.now())=>{progressFrame=0;videoFrameToken=0;if(!heroVideo||heroVideo.paused||document.hidden)return;if(heroVideo.requestVideoFrameCallback||now-lastFallbackProgress>=1000/30){lastFallbackProgress=now;const card=featuredCards[heroVideoIndex];updateFeaturedProgress(card,heroVideo);if(card&&document.documentElement.classList.contains('showcase-gpu-active'))card.dispatchEvent(new CustomEvent('dream:card-progress',{bubbles:true}));}if(heroVideo.requestVideoFrameCallback)videoFrameToken=heroVideo.requestVideoFrameCallback((time)=>trackProgress(time));else progressFrame=requestAnimationFrame(trackProgress);};
 const startProgressTracking=()=>{if(heroVideo?.requestVideoFrameCallback){if(!videoFrameToken)videoFrameToken=heroVideo.requestVideoFrameCallback((time)=>trackProgress(time));}else if(!progressFrame)progressFrame=requestAnimationFrame(trackProgress);};
 const setActiveFeatured=index=>featuredCards.forEach((card,cardIndex)=>{const active=cardIndex===index;card.classList.toggle('is-hero-active',active);card.classList.remove('has-playback-progress');card.dataset.playbackProgress='0';card.style.setProperty('--playback-progress','0%');});
 const selectHeroVideo=(index,restart=true,animateCenter=true)=>{if(!heroVideo||!heroPlaylist.length)return;heroVideoIndex=(index+heroPlaylist.length)%heroPlaylist.length;const concept=heroConcepts[heroVideoIndex],source=heroPlaylist[heroVideoIndex];heroVideo.muted=true;heroVideo.loop=false;setActiveFeatured(heroVideoIndex);rotateFeaturedCardToCenter(featuredCards[heroVideoIndex],animateCenter);if(heroVideo.dataset.playlistSrc!==source){heroVideo.pause();heroCanPlay=false;heroVideo.classList.add('is-switching');if(heroVideoPoster&&concept.thumbnailUrl){
   // Keep the last ready poster visible until the next image is actually available.
   heroVideoPoster.classList.add('is-visible');
   const request=++heroPosterRequest,pendingPoster=new Image();
   const reveal=()=>{if(request!==heroPosterRequest||!heroVideo.classList.contains('is-switching'))return;heroVideoPoster.src=pendingPoster.src;heroVideoPoster.classList.add('is-visible');};
   pendingPoster.onload=reveal;pendingPoster.src=concept.thumbnailUrl;
   if(pendingPoster.complete&&pendingPoster.naturalWidth)reveal();
  }if(concept.thumbnailUrl)heroVideo.poster=concept.thumbnailUrl;heroVideo.dataset.playlistSrc=source;heroVideo.src=source;heroVideo.load();}else if(restart){try{heroVideo.currentTime=0;}catch{}}syncHeroVideo();};
 const heroAheadVideo=document.createElement('video');heroAheadVideo.muted=true;heroAheadVideo.playsInline=true;heroAheadVideo.preload='metadata';let heroAheadTimer=0;
 const preloadNextHeroVideo=()=>{const connection=navigator.connection||navigator.mozConnection||navigator.webkitConnection;if(connection?.saveData||['slow-2g','2g'].includes(connection?.effectiveType))return;clearTimeout(heroAheadTimer);heroAheadTimer=setTimeout(()=>{if(!heroVisible||document.hidden)return;const next=heroPlaylist[(heroVideoIndex+1)%heroPlaylist.length];if(!next||heroAheadVideo.dataset.preloadedSource===next)return;heroAheadVideo.dataset.preloadedSource=next;heroAheadVideo.src=next;heroAheadVideo.load();},3000);};
 heroVideo?.addEventListener('canplay',()=>{heroCanPlay=true;heroStartupReady=true;syncHeroVideo();});
 const revealHeroVideoFrame=source=>{const reveal=()=>{if(heroVideo.dataset.playlistSrc!==source||heroVideo.currentSrc!==source||heroVideo.paused||heroVideo.readyState<2)return;++heroPosterRequest;heroVideo.classList.remove('is-switching');heroVideoPoster?.classList.remove('is-visible');preloadNextHeroVideo();};if(heroVideo.requestVideoFrameCallback)heroVideo.requestVideoFrameCallback(reveal);else requestAnimationFrame(()=>requestAnimationFrame(reveal));};
 heroVideo?.addEventListener('playing',()=>{const source=heroVideo.dataset.playlistSrc;if(!source||heroVideo.currentSrc!==source)return;revealHeroVideoFrame(source);});
 heroVideo?.addEventListener('play',startProgressTracking);
 heroVideo?.addEventListener('pause',stopProgressTracking);
 heroVideo?.addEventListener('ended',()=>{stopProgressTracking();selectHeroVideo(heroVideoIndex+1);});
 /* Keep the selected poster and expose Retry rather than looping failed URLs. */
 heroVideo?.addEventListener('error',()=>{stopProgressTracking();heroVideo.classList.add('is-switching');heroVideoPoster?.classList.add('is-visible');});
 heroVideo?.addEventListener('loadedmetadata',()=>updateFeaturedProgress(featuredCards[heroVideoIndex],heroVideo));
 heroCardGrid.addEventListener('click',event=>{const button=event.target.closest('[data-featured-card]');if(!button)return;event.preventDefault();const card=button.closest('.work-card'),index=featuredCards.indexOf(card);if(index<0)return;selectHeroVideo(index);});
 heroCardGrid.addEventListener('wheel',event=>{if(event.ctrlKey||Math.abs(event.deltaX)<=Math.abs(event.deltaY))return;event.preventDefault();event.stopPropagation();const unit=event.deltaMode===1?16:event.deltaMode===2?heroCardGrid.clientWidth:1;heroCardGrid.scrollBy({left:event.deltaX*unit,behavior:'instant'});},{passive:false});
 heroCardGrid.addEventListener('pointerdown',event=>{if(event.pointerType!=='mouse'||event.button!==0)return;gesture={id:event.pointerId,x:event.clientX,y:event.clientY,left:heroCardGrid.scrollLeft,active:false};});
 heroCardGrid.addEventListener('pointermove',event=>{if(!gesture||event.pointerId!==gesture.id)return;const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;if(!gesture.active){if(Math.abs(dy)>8&&Math.abs(dy)>Math.abs(dx)){gesture=null;return;}if(Math.abs(dx)<7)return;gesture.active=true;heroCardGrid.setPointerCapture(event.pointerId);heroCardGrid.classList.add('is-dragging');}event.preventDefault();heroCardGrid.scrollTo({left:gesture.left-dx,behavior:'instant'});});
 const finish=event=>{if(!gesture||event.pointerId!==gesture.id)return;const dragged=gesture.active;gesture=null;heroCardGrid.classList.remove('is-dragging');if(dragged){suppressUntil=performance.now()+250;if(heroCardGrid.hasPointerCapture(event.pointerId))heroCardGrid.releasePointerCapture(event.pointerId);}};
 heroCardGrid.addEventListener('pointerup',finish);heroCardGrid.addEventListener('pointercancel',finish);heroCardGrid.addEventListener('lostpointercapture',()=>{gesture=null;heroCardGrid.classList.remove('is-dragging');});
 heroCardGrid.addEventListener('click',event=>{if(performance.now()<suppressUntil){event.preventDefault();event.stopImmediatePropagation();}},true);
 heroCardGrid.addEventListener('keydown',event=>{if(!['ArrowRight','ArrowLeft','Home','End'].includes(event.key))return;event.preventDefault();const cards=featuredCards,step=cards[1].offsetLeft-cards[0].offsetLeft;const left=event.key==='Home'?0:event.key==='End'?heroCardGrid.scrollWidth:heroCardGrid.scrollLeft+(event.key==='ArrowRight'?step:-step);heroCardGrid.scrollTo({left,behavior:reducedCarouselMotion.matches?'instant':'smooth'});});
 selectHeroVideo(0,true,false);syncHeroVideo();
 document.dispatchEvent(new CustomEvent('dream:hero-ready'));
}
const conceptRails=[grid];
window.DreamCarouselInput?.bind(grid);
const hoverPreviewInput=matchMedia('(hover:hover) and (pointer:fine)');
const carouselCards=$$('.work-card',grid),carouselCounter=$('.carousel-counter');
carouselCards.forEach(card=>card.setAttribute('aria-roledescription','card'));
// Gallery videos are requested only on hover/focus or explicit playback.
if(!reducedCarouselMotion.matches&&'IntersectionObserver'in window){
 grid.classList.add('has-row-reveal');
 const rowRevealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
  if(!entry.isIntersecting)return;
  const rowTop=entry.target.offsetTop,row=carouselCards.filter(card=>Math.abs(card.offsetTop-rowTop)<2);
  row.forEach((card,index)=>{card.style.setProperty('--row-card-index',String(index));card.classList.add('is-row-revealed');rowRevealObserver.unobserve(card);});
 }),{threshold:.12,rootMargin:'0px 0px -6% 0px'});
 carouselCards.forEach(card=>rowRevealObserver.observe(card));
}
let carouselStep=0,carouselLimit=0,lastCarouselIndex=-1,carouselPinY=Infinity,showcaseDock=null;
let showcaseView='grid',viewAnimations=[],railReentry=false;
const viewButtons=$$('[data-showcase-toggle]');
grid.dataset.view='grid';
function activeCarouselCards(){return showcaseView==='grid'?carouselCards:carouselCards.slice(0,5);}
function updateCarousel(){
 const cards=activeCarouselCards(),left=grid.scrollLeft,index=Math.min(cards.length-1,Math.round(left/(carouselStep||1)));
 if(index!==lastCarouselIndex){carouselCounter.textContent=String(index+1).padStart(2,'0')+' / '+String(cards.length).padStart(2,'0');lastCarouselIndex=index;}
}
function measureCarousel(){
 const cards=activeCarouselCards(),first=cards[0],last=cards[cards.length-1];
 const gutter=parseFloat(getComputedStyle(grid).paddingRight)||0;
 // FLIP transforms affect bounding rectangles and scrollWidth, but not layout offsets.
 carouselStep=(cards[1]?.offsetLeft??first.offsetLeft+first.offsetWidth)-first.offsetLeft;
 carouselLimit=showcaseView==='grid'?0:Math.max(0,last.offsetLeft+last.offsetWidth+gutter-grid.clientWidth);
 const rail=grid.getBoundingClientRect(),header=$('.header').getBoundingClientRect();
 carouselPinY=Math.max(0,rail.top+scrollY+first.offsetTop+first.offsetHeight*.5-(innerHeight+header.height)*.5);
 updateCarousel();
}
// The same engine and damping model as shader.se; one clock drives both axes.
const pageScroll=new Lenis({autoRaf:false,lerp:.1,smoothWheel:true,syncTouch:false,anchors:{onStart:()=>{showcaseDock=null;resumeScrollClock();}},stopInertiaOnNavigate:true,prevent:element=>element.tagName==='DIALOG'||element.tagName==='TEXTAREA'||element.isContentEditable});
// A single capture listener routes wheel input; the nested Lenis must not consume it again.
const railScroll=new Lenis({wrapper:grid,content:grid,autoRaf:false,orientation:'horizontal',gestureOrientation:'horizontal',lerp:.12,smoothWheel:true,syncTouch:false,overscroll:true,virtualScroll:({event})=>showcaseView!=='grid'&&!event.type.includes('wheel')});
const scrollFrameSubscribers=new Set();
window.DreamScroll={onFrame(callback){scrollFrameSubscribers.add(callback);return()=>scrollFrameSubscribers.delete(callback);},requestFrame:resumeScrollClock,position(){return{x:railScroll.animatedScroll,y:pageScroll.animatedScroll};},scrollTo(y){showcaseDock=null;pageScroll.scrollTo(y);resumeScrollClock();}};
let scrollFrame=0;
function tickScroll(time){
 pageScroll.raf(time);
 railScroll.raf(time);let visualActive=false;for(const callback of scrollFrameSubscribers)visualActive=callback(time)||visualActive;
 scrollFrame=visualActive||pageScroll.isScrolling==='smooth'||railScroll.isScrolling==='smooth'?requestAnimationFrame(tickScroll):0;
}
function resumeScrollClock(){if(!scrollFrame){pageScroll.time=railScroll.time=0;scrollFrame=requestAnimationFrame(tickScroll);}}
addEventListener('wheel',resumeScrollClock,{passive:true});
addEventListener('keydown',event=>{if(!event.defaultPrevented&&['PageUp','PageDown','Home','End','ArrowUp','ArrowDown',' '].includes(event.key)&&!event.target.closest('input,textarea,select,button,[contenteditable]')){showcaseDock=null;pageScroll.scrollTo(scrollY,{immediate:true});}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(scrollFrame);scrollFrame=0;}else resumeScrollClock();});
function scrollCarouselTo(value,immediate=false){railScroll.scrollTo(Math.max(0,Math.min(carouselLimit,value)),{programmatic:false,lerp:.12,immediate:immediate||reducedCarouselMotion.matches});resumeScrollClock();}
function beginShowcaseDock(direction,pending=0){const phase={direction,pending};showcaseDock=phase;const distance=Math.abs(carouselPinY-pageScroll.animatedScroll),speed=Math.max(500,Math.abs(pageScroll.velocity)*60),duration=Math.max(.28,Math.min(.6,3*distance/speed));pageScroll.scrollTo(carouselPinY,{duration,easing:t=>1-(1-t)**3,onComplete:()=>{if(showcaseDock!==phase)return;showcaseDock=null;if(phase.pending)scrollCarouselTo(railScroll.targetScroll+phase.pending);}});resumeScrollClock();}
// FLIP keeps the visible sleeves in place while the remaining grid rows unfold below.
function setShowcaseView(view){
 if(!['cards','grid'].includes(view)||view===showcaseView)return;
 viewAnimations.forEach(animation=>animation.cancel());viewAnimations=[];
 const fromView=showcaseView;
 // A grid has a stable origin. Reset the rail before measuring so a switch from
 // the middle/end of the carousel does not send cards flying across the page.
 if(view==='grid')railScroll.scrollTo(0,{immediate:true});
 const before=carouselCards.map(card=>card.getBoundingClientRect());
 showcaseDock=null;pageScroll.scrollTo(pageScroll.animatedScroll,{immediate:true});
 if(drag&&grid.hasPointerCapture(drag.id))grid.releasePointerCapture(drag.id);
 drag=null;grid.classList.remove('is-dragging');
 if(view!=='grid')railScroll.scrollTo(0,{immediate:true});showcaseView=view;grid.dataset.view=view;railReentry=view==='cards';
 grid.setAttribute('aria-label',view==='grid'?'Concept gallery, grid view':'Concept gallery, horizontal card view');
 viewButtons.forEach(button=>{
  const buttonView=button.dataset.showcaseView;
  button.setAttribute('aria-pressed',String(buttonView?buttonView===view:view==='grid'));
  if(buttonView)button.setAttribute('aria-label',buttonView==='grid'?'Show all concepts':'Show featured concepts');
  else button.setAttribute('aria-label',view==='grid'?'Show featured concepts':'Show all concepts');
  button.parentElement.dataset.view=view;button.parentElement.dataset.interacted='true';
 });
 carouselCards.forEach(card=>card.setAttribute('aria-roledescription',view==='grid'?'card':'slide'));
 railScroll.resize();pageScroll.resize();measureCarousel();
 if(!reducedCarouselMotion.matches&&typeof carouselCards[0]?.animate==='function'){
  viewAnimations=carouselCards.map((card,index)=>{
   const from=before[index],to=card.getBoundingClientRect();
   const isVisible=to.width>0&&to.height>0;
    if(!isVisible)return null;
   if(fromView==='cards'&&view==='grid'){
    if(index>=5){
     const templateColumns=getComputedStyle(grid).gridTemplateColumns||'';
     const columns=Math.max(1,templateColumns.split(/\s+/).filter(Boolean).length||5);
     const row=Math.floor(index/columns),column=index%columns,delay=280+row*24+column*8;
     return card.animate([
      {opacity:0,transform:'translateY(-28px) scale(.72)',transformOrigin:'center center'},
      {opacity:1,transform:'translateY(5px) scale(1.035)',transformOrigin:'center center',offset:.78},
      {opacity:1,transform:'translateY(0) scale(1)',transformOrigin:'center center'}
     ],{duration:480,delay,easing:'cubic-bezier(.18,.72,.24,1)',fill:'both'});
    }
    const dx=from.left+from.width/2-(to.left+to.width/2),dy=from.top+from.height/2-(to.top+to.height/2);
    return card.animate([
     {transform:`translate(${dx}px,${dy}px) scale(${from.width/to.width},${from.height/to.height})`,transformOrigin:'center center',offset:0},
     {transform:`translate(${dx*.5}px,${dy*.5}px) scale(.82)`,transformOrigin:'center center',offset:.38},
     {transform:'translate(0,0) scale(.96)',transformOrigin:'center center',offset:.78},
     {transform:'translate(0,0) scale(1.02)',transformOrigin:'center center',offset:.91},
     {transform:'translate(0,0) scale(1)',transformOrigin:'center center',offset:1}
    ],{duration:820,easing:'cubic-bezier(.2,.72,.24,1)',fill:'none'});
   }
   if(index>=5)return null;
   return card.animate([
    {transform:`translate(${from.left-to.left}px,${from.top-to.top}px) scale(${from.width/to.width},${from.height/to.height})`,offset:0},
    {transform:'translate(0,0) scale(.78)',offset:.55},
    {transform:'translate(0,0) scale(1.045)',offset:.8},
    {transform:'translate(0,0) scale(1)',offset:1}
   ],{duration:760,easing:'cubic-bezier(.22,.7,.26,1)',fill:'none'});
  }).filter(Boolean);
  const batch=viewAnimations;let remaining=batch.length;
  batch.forEach(animation=>{animation.onfinish=()=>{
   if(viewAnimations!==batch||--remaining!==0)return;
   batch.forEach(item=>item.cancel());
   viewAnimations=[];railScroll.resize();pageScroll.resize();measureCarousel();resumeScrollClock();
  };});
 }
 resumeScrollClock();
}
viewButtons.forEach(button=>button.addEventListener('click',()=>setShowcaseView(button.dataset.showcaseView||(showcaseView==='grid'?'cards':'grid'))));
// Enter the horizontal sequence only when the cards reach the viewport's center.
addEventListener('wheel',event=>{
 if(showcaseView==='grid'||event.ctrlKey||!carouselLimit||document.body.classList.contains('modal-open'))return;
 const unit=event.deltaMode===1?100/6:event.deltaMode===2?innerHeight:1,deltaX=event.deltaX*unit,deltaY=event.deltaY*unit,delta=Math.abs(deltaX)>Math.abs(deltaY)?deltaX:deltaY;if(delta===0)return;
 const horizontal=Math.abs(deltaX)>Math.abs(deltaY),y=pageScroll.animatedScroll,centered=Math.abs(y-carouselPinY)<=.75;
 if(showcaseDock){event.preventDefault();event.stopImmediatePropagation();if(!horizontal&&deltaY*showcaseDock.direction<0){showcaseDock=null;pageScroll.scrollTo(y+deltaY,{programmatic:false,lerp:.1});resumeScrollClock();}else showcaseDock.pending+=delta;return;}
 if(centered)railReentry=false;
 if(!centered){const x=railScroll.targetScroll,canMove=deltaY>0?x<carouselLimit-1:x>1;if(railReentry&&!horizontal&&grid.contains(event.target)&&canMove){event.preventDefault();event.stopImmediatePropagation();railReentry=false;beginShowcaseDock(Math.sign(deltaY),deltaY*1.25);return;}if(horizontal&&grid.contains(event.target)){event.preventDefault();event.stopImmediatePropagation();scrollCarouselTo(railScroll.targetScroll+deltaX);}else if(!horizontal){const target=pageScroll.targetScroll+deltaY,x=railScroll.targetScroll;if((deltaY>0&&y<carouselPinY&&target>=carouselPinY&&x<carouselLimit-1)||(deltaY<0&&y>carouselPinY&&target<=carouselPinY&&x>1)){event.preventDefault();event.stopImmediatePropagation();beginShowcaseDock(Math.sign(deltaY),(target-carouselPinY)*1.25);}}return;}
 const position=railScroll.targetScroll,atStart=position<=1,atEnd=carouselLimit-position<=1;if((delta<0&&atStart)||(delta>0&&atEnd)){if(horizontal){event.preventDefault();event.stopImmediatePropagation();pageScroll.scrollTo(pageScroll.targetScroll+deltaX,{programmatic:false,lerp:.1});resumeScrollClock();}return;}
 event.preventDefault();event.stopImmediatePropagation();if(pageScroll.isScrolling)beginShowcaseDock(Math.sign(delta),delta);else scrollCarouselTo(position+delta);
},{capture:true,passive:false});
function moveCarousel(direction){scrollCarouselTo(railScroll.targetScroll+direction*carouselStep);}
railScroll.on('scroll',updateCarousel);
grid.addEventListener('keydown',event=>{
 if(showcaseView==='grid')return;
 if(event.key==='ArrowRight'){event.preventDefault();moveCarousel(1);}
 else if(event.key==='ArrowLeft'){event.preventDefault();moveCarousel(-1);}
 else if(event.key==='Home'){event.preventDefault();scrollCarouselTo(0);}
 else if(event.key==='End'){event.preventDefault();scrollCarouselTo(carouselLimit);}
});
// Keep a float target in Lenis rather than reading rounded DOM scrollLeft back.
let drag=null,suppressClickUntil=0;
grid.addEventListener('pointerdown',event=>{
 if(showcaseView==='grid'||event.pointerType!=='mouse'||event.button!==0)return;
 railScroll.scrollTo(grid.scrollLeft,{immediate:true});
 drag={id:event.pointerId,x:event.clientX,y:event.clientY,left:grid.scrollLeft,lastX:event.clientX,lastTime:event.timeStamp,velocity:0,active:false};
});
grid.addEventListener('pointermove',event=>{
 if(!drag||event.pointerId!==drag.id)return;
 const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
 if(!drag.active){if(Math.abs(dy)>8&&Math.abs(dy)>Math.abs(dx)){drag=null;return;}if(Math.abs(dx)<7)return;drag.active=true;grid.classList.add('is-dragging');grid.setPointerCapture(event.pointerId);}
 const elapsed=event.timeStamp-drag.lastTime;
 if(elapsed>0)drag.velocity=drag.velocity*.65+(drag.lastX-event.clientX)/elapsed*.35;
 drag.lastX=event.clientX;drag.lastTime=event.timeStamp;
 event.preventDefault();scrollCarouselTo(drag.left-dx,true);
});
function finishCarouselDrag(event){
 if(!drag||event.pointerId!==drag.id)return;
 const gesture=drag;drag=null;grid.classList.remove('is-dragging');
 if(gesture.active){
  suppressClickUntil=performance.now()+250;
  if(grid.hasPointerCapture(gesture.id))grid.releasePointerCapture(gesture.id);
  if(event.type==='pointerup'&&event.timeStamp-gesture.lastTime<90&&!reducedCarouselMotion.matches)scrollCarouselTo(grid.scrollLeft+Math.max(-carouselStep*.65,Math.min(carouselStep*.65,gesture.velocity*160)));
 }
}
grid.addEventListener('pointerup',finishCarouselDrag);grid.addEventListener('pointercancel',finishCarouselDrag);
grid.addEventListener('lostpointercapture',()=>{drag=null;grid.classList.remove('is-dragging');});
grid.addEventListener('click',event=>{if(performance.now()<suppressClickUntil){event.preventDefault();event.stopImmediatePropagation();}},true);
grid.addEventListener('focusin',event=>{
 if(showcaseView==='grid')return;
 const card=event.target.closest('.work-card');if(!card||!event.target.matches(':focus-visible'))return;
 const cardRect=card.getBoundingClientRect(),viewport=grid.getBoundingClientRect(),gutter=parseFloat(getComputedStyle(grid).paddingLeft);
 if(cardRect.left<viewport.left+gutter||cardRect.right>viewport.right-gutter)scrollCarouselTo(grid.scrollLeft+cardRect.left-viewport.left-gutter);
});
new ResizeObserver(measureCarousel).observe(grid);measureCarousel();
addEventListener('dream:layout',()=>{pageScroll.resize();railScroll.resize();measureCarousel();});
new MutationObserver(()=>{const blocked=document.body.classList.contains('modal-open');if(blocked){pageScroll.stop();railScroll.stop();}else{pageScroll.start();railScroll.start();}}).observe(document.body,{attributes:true,attributeFilter:['class']});
const menuButton = $('.menu-toggle');
const mobileNav = $('#mobile-nav');
function closeMenu(){menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Open menu');mobileNav.hidden=true;}
menuButton.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')!=='true';menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Close menu':'Open menu');mobileNav.hidden=!open;});
$$('a',mobileNav).forEach(link=>link.addEventListener('click',closeMenu));
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu();});
window.addEventListener('resize',()=>{if(window.innerWidth>1050)closeMenu();});
let toastTimer;
function toast(message){$('.toast').textContent=message;$('.toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('.toast').classList.remove('show'),3500);}
const challengeItems=$$('.challenge-faq-item');
challengeItems.forEach(item=>$('.challenge-question',item).addEventListener('click',()=>{
 const trigger=$('.challenge-question',item),opening=trigger.getAttribute('aria-expanded')!=='true';
 challengeItems.forEach(other=>{const button=$('.challenge-question',other),answer=$('.challenge-answer',other),open=other===item&&opening;other.classList.toggle('is-open',open);button.setAttribute('aria-expanded',String(open));answer.setAttribute('aria-hidden',String(!open));answer.inert=!open;});
}));
const challengeStepCards=$$('.challenge-step-card'),challengeStepVideos=challengeStepCards.map(card=>$('video',card)),challengeProgress=$$('.challenge-progress-outline');
let challengeSteps=$('.challenge-steps-grid'),challengeStepObserver;
const boundChallengeMedia=new WeakSet();
let activeChallengeStep=-1,challengeSequenceStarted=false,challengeInView=false,challengeProgressFrame=0;
const challengeProgressMetrics=new WeakMap();
let challengeProgressObserver;
function drawChallengeProgress(canvas,progress){
 const metrics=challengeProgressMetrics.get(canvas);if(!metrics)return;
 const {width,height,ratio}=metrics,ctx=canvas.getContext('2d');ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,width,height);if(progress<=0)return;
 const x=1,y=1,w=width-2,h=height-2,r=Math.min(23,w/2,h/2),perimeter=2*(w+h-4*r)+2*Math.PI*r;
 ctx.beginPath();ctx.moveTo(width/2,y);ctx.lineTo(x+w-r,y);ctx.arcTo(x+w,y,x+w,y+r,r);ctx.lineTo(x+w,y+h-r);ctx.arcTo(x+w,y+h,x+w-r,y+h,r);ctx.lineTo(x+r,y+h);ctx.arcTo(x,y+h,x,y+h-r,r);ctx.lineTo(x,y+r);ctx.arcTo(x,y,x+r,y,r);ctx.lineTo(width/2,y);
 ctx.strokeStyle=getComputedStyle(canvas).color;ctx.lineWidth=1.25;ctx.lineCap='round';ctx.setLineDash([perimeter*progress/100,perimeter]);ctx.stroke();
}
function updateChallengeProgress(index,value){const segment=challengeProgress[index];if(!segment)return;const progress=Math.max(0,Math.min(100,value));segment.dataset.progress=String(progress);segment.setAttribute('aria-valuenow',String(Math.round(progress)));drawChallengeProgress(segment,progress);}
function measureChallengeProgress(){challengeProgress.forEach(canvas=>{const bounds=canvas.getBoundingClientRect(),ratio=Math.min(2,devicePixelRatio||1);canvas.width=Math.ceil(bounds.width*ratio);canvas.height=Math.ceil(bounds.height*ratio);challengeProgressMetrics.set(canvas,{width:bounds.width,height:bounds.height,ratio});drawChallengeProgress(canvas,Number(canvas.dataset.progress)||0);});}
if('ResizeObserver'in window){challengeProgressObserver=new ResizeObserver(measureChallengeProgress);challengeProgress.forEach(canvas=>challengeProgressObserver.observe(canvas));}else addEventListener('resize',measureChallengeProgress,{passive:true});
measureChallengeProgress();

function stopChallengeProgress(){cancelAnimationFrame(challengeProgressFrame);challengeProgressFrame=0;}
function trackChallengeProgress(){stopChallengeProgress();const tick=()=>{const video=challengeStepVideos[activeChallengeStep];if(!video||video.paused||video.ended)return;if(video.duration)updateChallengeProgress(activeChallengeStep,video.currentTime/video.duration*100);challengeProgressFrame=requestAnimationFrame(tick);};challengeProgressFrame=requestAnimationFrame(tick);}
function playChallengeStep(index){
 if(index<0||index>=challengeStepVideos.length)return;
 stopChallengeProgress();challengeSequenceStarted=true;activeChallengeStep=index;
 challengeStepVideos.forEach((video,i)=>{video.pause();if(i!==index)video.currentTime=0;});
 challengeStepCards.forEach((card,i)=>{card.classList.toggle('is-active',i===index);if(i===index)card.setAttribute('aria-current','step');else card.removeAttribute('aria-current');updateChallengeProgress(i,0);});
 const video=challengeStepVideos[index];video.currentTime=0;video.play().catch(error=>video.dispatchEvent(new CustomEvent('dream:play-rejected',{detail:{name:error.name}})));
}
function bindChallengeMedia(){challengeStepVideos.forEach((video,index)=>{
 if(boundChallengeMedia.has(video))return;boundChallengeMedia.add(video);
 video.addEventListener('playing',()=>{if(index===activeChallengeStep)trackChallengeProgress();});
 video.addEventListener('pause',()=>{if(index===activeChallengeStep)stopChallengeProgress();});
 video.addEventListener('ended',()=>{if(index!==activeChallengeStep)return;updateChallengeProgress(index,100);playChallengeStep((index+1)%challengeStepVideos.length);});
 video.addEventListener('error',()=>{if(index===activeChallengeStep){stopChallengeProgress();updateChallengeProgress(index,0);}});
});}
bindChallengeMedia();
document.addEventListener('click',event=>{const button=event.target.closest('.challenge-step-button');if(!button)return;refreshChallengeMedia();const index=challengeStepCards.indexOf(button.closest('.challenge-step-card'));if(index<0)return;challengeInView=true;playChallengeStep(index);});
function syncChallengePlayback(){const video=challengeStepVideos[activeChallengeStep];if(!video)return;if(challengeInView&&!document.hidden&&video.dataset.feedbackState!=='error')video.play().catch(error=>video.dispatchEvent(new CustomEvent('dream:play-rejected',{detail:{name:error.name}})));else video.pause();}
if(challengeSteps&&'IntersectionObserver'in window){
 challengeStepObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{challengeInView=entry.isIntersecting;if(challengeInView&&!challengeSequenceStarted&&!matchMedia('(prefers-reduced-motion: reduce)').matches)playChallengeStep(0);else syncChallengePlayback();}),{threshold:.08});
 challengeStepObserver.observe(challengeSteps);
}
function refreshChallengeMedia(){
 const liveCards=$$('.challenge-step-card'),liveVideos=liveCards.map(card=>$('video',card));
 if(!liveCards.length||liveVideos.some(video=>!video))return;
 const replaced=liveVideos.length!==challengeStepVideos.length||liveVideos.some((video,i)=>video!==challengeStepVideos[i])||challengeProgress.some(canvas=>!canvas.isConnected);
 if(replaced){
  stopChallengeProgress();challengeStepVideos.forEach(video=>{if(!video.isConnected)video.pause();});
  challengeStepCards.splice(0,challengeStepCards.length,...liveCards);challengeStepVideos.splice(0,challengeStepVideos.length,...liveVideos);
  challengeProgress.splice(0,challengeProgress.length,...$$('.challenge-progress-outline'));
  challengeProgressObserver?.disconnect();challengeProgress.forEach(canvas=>challengeProgressObserver?.observe(canvas));bindChallengeMedia();measureChallengeProgress();
 }
 const liveGrid=$('.challenge-steps-grid');
 if(liveGrid!==challengeSteps){challengeStepObserver?.disconnect();challengeSteps=liveGrid;if(liveGrid)challengeStepObserver?.observe(liveGrid);}
 if(challengeSteps){const rect=challengeSteps.getBoundingClientRect();challengeInView=rect.bottom>0&&rect.top<innerHeight;}
 if(challengeInView&&!challengeSequenceStarted&&!reducedCarouselMotion.matches)playChallengeStep(0);
 else{syncChallengePlayback();if(challengeInView&&activeChallengeStep>=0)trackChallengeProgress();}
}
document.addEventListener('dream:translation-layout',refreshChallengeMedia);
document.addEventListener('visibilitychange',syncChallengePlayback);
const entryDialog=$('#entry-dialog');
const form=$('#entry-form');
const storageKey='dreamAdsDraft.v1';
const draftDatabase='dream-ads-local-drafts';
function saveDraftWithVideo(draft,video){return new Promise((resolve,reject)=>{if(!window.indexedDB){reject(new Error('This browser does not support local video storage.'));return;}const request=window.indexedDB.open(draftDatabase,1);request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains('drafts'))db.createObjectStore('drafts');};request.onerror=()=>reject(request.error||new Error('Could not open local draft storage.'));request.onsuccess=()=>{const db=request.result;let transaction;try{transaction=db.transaction('drafts','readwrite');transaction.objectStore('drafts').put({draft,video},storageKey);}catch(error){db.close();reject(error);return;}transaction.oncomplete=()=>{db.close();resolve();};transaction.onerror=()=>{const error=transaction.error;db.close();reject(error||new Error('Could not save the attached video.'));};transaction.onabort=()=>{const error=transaction.error;db.close();reject(error||new Error('Saving the attached video was cancelled.'));};};});}
function loadSavedDraftVideo(){return new Promise((resolve,reject)=>{if(!window.indexedDB){resolve(null);return;}const request=window.indexedDB.open(draftDatabase,1);request.onerror=()=>reject(request.error||new Error('Could not open local draft storage.'));request.onsuccess=()=>{const db=request.result;if(!db.objectStoreNames.contains('drafts')){db.close();resolve(null);return;}const transaction=db.transaction('drafts','readonly'),get=transaction.objectStore('drafts').get(storageKey);get.onsuccess=()=>{const video=get.result?.video||null;db.close();resolve(video);};get.onerror=()=>{const error=get.error;db.close();reject(error||new Error('Could not read the saved video.'));};};});}

let savedDraft=null;
try{const draft=JSON.parse(localStorage.getItem(storageKey)||'null');if(draft&&typeof draft.name==='string'&&typeof draft.email==='string'&&typeof draft.concept==='string'&&typeof draft.category==='string')savedDraft=draft;}catch{/* Storage may be unavailable in private mode. */}
function wordCount(){const text=$('#creator-concept').value.trim();return text?text.split(/\s+/).length:0;}
function updateWordCount(){const count=wordCount();$('#word-count').textContent=`${count} / 100 words`;$('#word-count').classList.toggle('over',count>100);$('#creator-concept').setCustomValidity(count>100?'Please keep your concept to 100 words or fewer.':'');}
$('#creator-concept').addEventListener('input',updateWordCount);
$('#creator-video').addEventListener('change',event=>{const file=event.currentTarget.files?.[0];$('#video-file-name').textContent=file?`${file.name} · ${(file.size/1024/1024).toFixed(1)} MB`:'No video selected';event.currentTarget.setCustomValidity('');});
function openEntry(){closeMenu();form.hidden=false;$('.entry-success').hidden=true;$('#form-error').textContent='';$('#creator-video').setCustomValidity('');if(savedDraft){$('#creator-name').value=savedDraft.name;$('#creator-email').value=savedDraft.email;$('#creator-category').value=savedDraft.category;$('#creator-concept').value=savedDraft.concept;$('#video-file-name').textContent=savedDraft.video?.name?`Saved in this browser: ${savedDraft.video.name}`:'No video selected';}else $('#video-file-name').textContent='No video selected';updateWordCount();entryDialog.showModal();document.body.classList.add('modal-open');}
$$('[data-join]').forEach(button=>button.addEventListener('click',openEntry));
form.addEventListener('submit',async event=>{
 event.preventDefault();
 if(form.dataset.saving)return;
 if(!form.reportValidity())return;
 let videoFile=$('#creator-video').files?.[0];
 if(!videoFile&&savedDraft?.video){try{videoFile=await loadSavedDraftVideo();}catch(error){$('#form-error').textContent='Your saved video could not be reopened. Please attach it again.';$('#creator-video').focus();return;}}
 if(!videoFile){$('#creator-video').setCustomValidity('Please attach your campaign video.');form.reportValidity();return;}
 const draft={name:$('#creator-name').value.trim(),email:$('#creator-email').value.trim(),category:$('#creator-category').value,concept:$('#creator-concept').value.trim(),video:{name:videoFile.name,type:videoFile.type,size:videoFile.size,lastModified:videoFile.lastModified},savedAt:new Date().toISOString(),status:'local-demo-only'};
 if(!draft.name){$('#form-error').textContent='Please enter your creator name.';$('#creator-name').focus();return;}
 if(form.dataset.saving)return;
 form.dataset.saving='true';const submitButton=form.querySelector('[type=submit]');submitButton.disabled=true;submitButton.textContent='Saving draft…';form.setAttribute('aria-busy','true');
 try{
  await saveDraftWithVideo(draft,videoFile);
  try{localStorage.setItem(storageKey,JSON.stringify(draft));}catch{/* The video and draft were saved in IndexedDB. */}
  savedDraft=draft;form.hidden=true;$('.entry-success').hidden=false;$('#success-done').focus();
 }catch(error){$('#form-error').textContent='Your browser could not save the video attachment. Try a smaller video or another browser.';$('#creator-video').focus();}finally{delete form.dataset.saving;submitButton.disabled=false;submitButton.textContent='Save my challenge draft';form.removeAttribute('aria-busy');}
});
$('#edit-draft').addEventListener('click',()=>{form.hidden=false;$('.entry-success').hidden=true;$('#creator-concept').focus();});
$('#success-done').addEventListener('click',()=>entryDialog.close());
const previewDialog=$('#preview-dialog');
let playbackInterval=null,elapsed=0,playing=false,lastTick=0,currentConcept=null,previewMedia=null,hoverCard=null,seeking=false,resumeAfterSeek=false;
const previewVideo=$('#preview-video'),previewArt=$('#preview-art'),previewStatus=$('#preview-status'),previewVolume=$('#preview-volume'),volumeControl=$('.player-volume-control');
let lastNonZeroVolume=58,previewReturnCard=null;
const formatTime=value=>{const seconds=Math.max(0,Math.floor(value||0));return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;};
function updateSeekFill(){const seek=$('#preview-seek');seek.style.setProperty('--range-progress',`${Number(seek.value)/Number(seek.max)*100}%`);}
function updateVolumeIcon(volume,muted){const icon=$('.volume-icon'),percent=Math.max(0,Math.min(100,Math.round(volume))),isMuted=muted||percent===0;icon.dataset.level=isMuted?'muted':percent<34?'low':percent<67?'medium':'high';icon.dataset.muted=String(isMuted);volumeControl.dataset.muted=String(isMuted);previewVolume.value=String(percent);previewVolume.setAttribute('aria-valuetext',`${percent} percent`);previewVolume.style.setProperty('--range-progress',`${percent}%`);$('#preview-mute').setAttribute('aria-pressed',String(isMuted));$('#preview-mute').setAttribute('aria-label',isMuted?'Unmute preview':'Mute preview');$('#preview-mute').setAttribute('aria-expanded',String(!isMuted&&(volumeControl.matches(':hover')||volumeControl.matches(':focus-within'))));}
function updatePlayback(){const duration=previewMedia?.duration&&Number.isFinite(previewMedia.duration)?previewMedia.duration:15,position=previewMedia?previewMedia.currentTime:elapsed;$('#preview-time').textContent=`${formatTime(position)} / ${formatTime(duration)}`;if(!seeking)$('#preview-seek').value=String(Math.round(Math.max(0,Math.min(1000,position/duration*1000))));updateSeekFill();$('#preview-scene').textContent=currentConcept.scenes[Math.min(2,Math.floor(position/Math.max(1,duration/3)))];}
function setPlaying(value){playing=value;if(previewMedia){if(value)previewMedia.play().catch(error=>{if(error.name==='AbortError')return;previewVideo.dispatchEvent(new CustomEvent('dream:play-rejected',{detail:{name:error.name}}));showMediaError();});else previewMedia.pause();}const button=$('#preview-play'),state=value?'playing':previewMedia?.ended?'ended':'paused';button.dataset.state=state;button.setAttribute('aria-pressed',String(value));button.setAttribute('aria-label',value?'Pause preview':state==='ended'?'Replay preview':'Play preview');$('.preview-stage').classList.toggle('paused',!value);lastTick=performance.now();}
function showMediaError(){previewMedia=null;previewVideo.hidden=true;previewArt.hidden=false;playing=false;updateVolumeIcon(Number(previewVolume.value),true);previewStatus.textContent='Video could not load. Check your connection and select Try again.';$('.preview-stage').classList.add('has-load-error');setPlaying(false);}
function stopHoverPreviews(except=null){conceptRails.flatMap(rail=>$$('.work-card.is-previewing',rail)).forEach(card=>{if(card===except)return;card.classList.remove('is-previewing');card.querySelector('.work-hover-video')?.pause();});}
conceptRails.forEach(grid=>{
grid.addEventListener('dream:rail-interaction',()=>{stopHoverPreviews();hoverCard=null;});
grid.addEventListener('pointerover',event=>{if(event.pointerType==='touch'||event.pointerType==='pen'||!hoverPreviewInput.matches||grid.classList.contains('is-interacting'))return;const thumb=event.target.closest('.work-visual');if(!thumb||thumb.contains(event.relatedTarget))return;const card=thumb.closest('.work-card');if(!card||card===hoverCard)return;stopHoverPreviews(card);hoverCard=card;card.classList.add('is-previewing');const media=card.querySelector('.work-hover-video'),button=card.querySelector('[data-preview]'),source=button?.dataset.previewVideoSrc||button?.dataset.videoSrc;card.classList.remove('preview-load-error','has-video-source');if(source&&media){card.classList.add('has-video-source');if(media.dataset.loadedSource!==source){media.src=source;media.dataset.loadedSource=source;}media.muted=true;media.play().catch(error=>{if(error.name==='AbortError')return;card.classList.add('preview-load-error');media.dispatchEvent(new CustomEvent('dream:play-rejected',{detail:{name:error.name}}));});}});
grid.addEventListener('pointerout',event=>{const thumb=event.target.closest('.work-visual');if(!thumb||thumb.contains(event.relatedTarget))return;const card=thumb.closest('.work-card');if(!card)return;card.classList.remove('is-previewing');card.querySelector('.work-hover-video')?.pause();if(hoverCard===card)hoverCard=null;});
grid.addEventListener('focusin',event=>{if(!event.target.matches(':focus-visible'))return;const card=event.target.closest('.work-card');if(!card)return;stopHoverPreviews(card);hoverCard=card;card.classList.add('is-previewing');});
grid.addEventListener('focusout',event=>{const card=event.target.closest('.work-card');if(card&&!card.contains(event.relatedTarget)){card.classList.remove('is-previewing');if(hoverCard===card)hoverCard=null;}});
grid.addEventListener('error',event=>{const media=event.target,card=media.closest('.work-card');if(!card||!media.matches('.work-hover-video'))return;delete media.dataset.loadedSource;card.classList.remove('has-video-source');if(card.classList.contains('is-previewing'))card.classList.add('preview-load-error');media.pause();media.removeAttribute('src');media.load();},true);
});
function openPreview(id){
 const concept=concepts.find(c=>c.id===id);if(!concept)return;
 seeking=false;resumeAfterSeek=false;
 previewReturnCard=grid.querySelector(`[data-preview="${id}"]`)?.closest('.work-card')||null;
 stopHoverPreviews();hoverCard=null;
 const theme=concept.theme||'tech';
 currentConcept=concept;$('#preview-title').textContent=concept.title;$('#preview-description').textContent=concept.description;$('#preview-category').textContent=concept.category;
 previewArt.src=concept.thumbnailUrl||`assets/${concept.art}`;previewArt.alt=concept.product;$('.preview-stage').dataset.category=theme;$('.preview-stage').classList.remove('has-load-error');
 previewMedia=null;previewVideo.pause();previewVideo.removeAttribute('src');previewVideo.hidden=true;previewArt.hidden=false;elapsed=0;updateVolumeIcon(lastNonZeroVolume,false);
 const source=concept.videoSrc;
 if(source){
  previewMedia=previewVideo;previewVideo.src=source;previewVideo.hidden=false;previewArt.hidden=true;previewVideo.volume=Math.max(1,lastNonZeroVolume)/100;previewVideo.muted=false;
  previewStatus.textContent='Loading video…';
  previewVideo.onerror=showMediaError;previewVideo.onloadedmetadata=()=>{updatePlayback();};previewVideo.onended=()=>setPlaying(false);
 }else{
  previewVideo.hidden=true;
  previewStatus.textContent='No video file attached. Playing the silent animated storyboard; no audio track is available.';
 }
 updatePlayback();previewDialog.showModal();document.body.classList.add('modal-open');setPlaying(true);clearInterval(playbackInterval);
 playbackInterval=setInterval(()=>{
  if(previewMedia){const duration=previewMedia.duration||15,seconds=previewMedia.currentTime;$('#preview-time').textContent=`${formatTime(seconds)} / ${formatTime(duration)}`;if(!seeking){$('#preview-seek').value=String(Math.round(seconds/duration*1000));updateSeekFill();}$('#preview-scene').textContent=currentConcept.scenes[Math.min(2,Math.floor(seconds/Math.max(1,duration/3)))];return;}
  const now=performance.now();if(playing&&!document.hidden){elapsed=Math.min(15,elapsed+(now-lastTick)/1000);updatePlayback();if(elapsed>=15)setPlaying(false);}lastTick=now;
 },100);
}
document.addEventListener('dream:retry-preview',()=>{if(currentConcept)openPreview(currentConcept.id);});
previewVideo.addEventListener('playing',()=>{previewStatus.textContent=previewVideo.muted?'Playing · muted':'Playing · sound on';});
grid.addEventListener('click',event=>{const button=event.target.closest('[data-preview]');if(button)openPreview(button.dataset.preview);});
$('#preview-play').addEventListener('click',()=>{if(!previewMedia&&currentConcept?.videoSrc){openPreview(currentConcept.id);return;}if(previewMedia?.ended)previewMedia.currentTime=0;else if(!previewMedia&&elapsed>=15){elapsed=0;updatePlayback();previewArt.style.animation='none';void previewArt.offsetWidth;previewArt.style.animation='';}setPlaying(!playing);});
const previewSeek=$('#preview-seek');
const beginSeek=()=>{if(seeking)return;seeking=true;resumeAfterSeek=previewMedia?!previewMedia.paused:playing;};
const finishSeek=()=>{if(!seeking)return;const resume=resumeAfterSeek;seeking=false;resumeAfterSeek=false;if(resume)setPlaying(true);updatePlayback();};
previewSeek.addEventListener('pointerdown',beginSeek);
document.addEventListener('pointerup',finishSeek,true);
document.addEventListener('pointercancel',finishSeek,true);
previewSeek.addEventListener('change',finishSeek);
previewSeek.addEventListener('input',event=>{const duration=previewMedia?.duration&&Number.isFinite(previewMedia.duration)?previewMedia.duration:15;const position=duration*Number(event.target.value)/1000;if(previewMedia)previewMedia.currentTime=position;else elapsed=position;updatePlayback();});
$('#preview-mute').addEventListener('click',()=>{const muted=$('.volume-icon').dataset.muted!=='true';let volume=Number(previewVolume.value);if(muted){if(volume>0)lastNonZeroVolume=volume;if(previewMedia)previewMedia.muted=true;}else{if(volume===0)volume=lastNonZeroVolume;if(previewMedia){previewMedia.volume=volume/100;previewMedia.muted=false;}}updateVolumeIcon(volume,muted);if(!previewMedia)previewStatus.textContent='This storyboard has no audio track; sound remains silent.';});
previewVolume.addEventListener('input',event=>{const volume=Number(event.currentTarget.value),muted=volume===0;if(volume>0)lastNonZeroVolume=volume;if(previewMedia){previewMedia.volume=volume/100;previewMedia.muted=muted;}updateVolumeIcon(volume,muted);if(!previewMedia)previewStatus.textContent=`Volume set to ${volume}%. This storyboard has no audio track, so it remains silent.`;});
volumeControl.addEventListener('pointerenter',()=>$('#preview-mute').setAttribute('aria-expanded',String(volumeControl.dataset.muted!=='true')));
volumeControl.addEventListener('pointerleave',()=>{if(!volumeControl.matches(':focus-within'))$('#preview-mute').setAttribute('aria-expanded','false');});
volumeControl.addEventListener('focusin',()=>$('#preview-mute').setAttribute('aria-expanded',String(volumeControl.dataset.muted!=='true')));
volumeControl.addEventListener('focusout',event=>{if(!volumeControl.contains(event.relatedTarget))$('#preview-mute').setAttribute('aria-expanded','false');});
$('#preview-fullscreen').addEventListener('click',()=>{const stage=$('.preview-stage');if(document.fullscreenElement)document.exitFullscreen?.();else stage.requestFullscreen?.().catch(()=>{previewStatus.textContent='This browser could not enter full-screen mode.';});});
$$('dialog').forEach(dialog=>{$('.dialog-close',dialog).addEventListener('click',()=>dialog.close());dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});dialog.addEventListener('close',()=>{if(!document.querySelector('dialog[open]'))document.body.classList.remove('modal-open');if(dialog===previewDialog){seeking=false;resumeAfterSeek=false;clearInterval(playbackInterval);previewVideo.pause();setPlaying(false);previewMedia=null;const returningCard=previewReturnCard;previewReturnCard=null;stopHoverPreviews();hoverCard=null;if(returningCard){returningCard.classList.add('suppress-hover-effects');returningCard.querySelector('.work-open')?.focus({preventScroll:true});const clearSuppression=()=>{returningCard.classList.remove('suppress-hover-effects');document.removeEventListener('pointermove',clearSuppression,true);document.removeEventListener('pointerdown',clearSuppression,true);document.removeEventListener('keydown',clearSuppression,true);};document.addEventListener('pointermove',clearSuppression,true);document.addEventListener('pointerdown',clearSuppression,true);document.addEventListener('keydown',clearSuppression,true);}}});});
const sectionObserver=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){$$('.desktop-nav a').forEach(link=>link.classList.toggle('active',link.hash===`#${entry.target.id}`));}});},{rootMargin:'-20% 0px -55% 0px'});
$$('#home,#showcase,#how-it-works').forEach(section=>sectionObserver.observe(section));
