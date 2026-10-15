'use strict';
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const concepts = [
 {id:'beauty', category:'Beauty & fragrance',title:'A scent beyond the ordinary.',product:'REVERIE · Fragrance',art:'perfume.svg',headline:'Bottle a\ndaydream.',description:'A sculptural fragrance floats through a world of soft pink light. An everyday ritual becomes a moment of escape.',scenes:['An everyday ritual.','A little imagination.','Bottle a daydream.']},
 {id:'lifestyle',category:'Food & lifestyle',title:'A fresh perspective.',product:'DAYBREAK · Sparkling refreshment',art:'can.svg',headline:'A little\nmore zest.',description:'A citrus-inspired sparkling drink takes center stage. Bright colors and a playful shift in scale make a simple refreshment extraordinary.',scenes:['Meet the everyday.','Add a little possibility.','A little more zest.']},
 {id:'tech',category:'Tech & innovation',title:'Tune into another world.',product:'FORM · Wireless audio',art:'headphones.svg',headline:'Feel\neverything.',description:'Silver headphones drift through a quiet, sculptural soundscape. The product becomes a portal to a world of your own.',scenes:['Turn down the noise.','Turn up your world.','Feel everything.']}
];
const grid = $('#showcase-grid');
function renderConcepts(filter = 'all') {
 grid.innerHTML = concepts.filter(c => filter === 'all' || c.id === filter).map(c => `<article class="work-card"><button class="work-visual ${c.id}" data-preview="${c.id}" aria-label="Preview ${c.title}"><span class="work-caption">${c.headline.replace('\n','<br>')}</span><img src="assets/${c.art}" alt="${c.product} concept illustration" width="680" height="680"><span class="work-length">00:15</span><span class="work-play"><span aria-hidden="true">▶</span> Play concept</span></button><div class="work-meta"><div><h3>${c.title}</h3><p>${c.product}</p></div><span aria-hidden="true">↗</span></div></article>`).join('');
}
renderConcepts();
const categoryButtons = $$('.category');
function selectCategory(button) {
 categoryButtons.forEach(b => {const selected = b === button;b.classList.toggle('active',selected);b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;});
 grid.setAttribute('aria-labelledby',button.id); renderConcepts(button.dataset.filter);
}
categoryButtons.forEach((button,index) => {button.addEventListener('click',()=>selectCategory(button));button.addEventListener('keydown',event=>{let next=index;if(event.key==='ArrowRight')next=(index+1)%categoryButtons.length;else if(event.key==='ArrowLeft')next=(index+categoryButtons.length-1)%categoryButtons.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=categoryButtons.length-1;else return;event.preventDefault();categoryButtons[next].focus();selectCategory(categoryButtons[next]);categoryButtons[next].scrollIntoView({block:'nearest',inline:'nearest'});});});
const menuButton = $('.menu-toggle');
const mobileNav = $('#mobile-nav');
function closeMenu(){menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Open menu');mobileNav.hidden=true;}
menuButton.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')!=='true';menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Close menu':'Open menu');mobileNav.hidden=!open;});
$$('a',mobileNav).forEach(link=>link.addEventListener('click',closeMenu));
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu();});
window.addEventListener('resize',()=>{if(window.innerWidth>1050)closeMenu();});
let toastTimer;
function toast(message){$('.toast').textContent=message;$('.toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('.toast').classList.remove('show'),3500);}
function downloadFile(name,content,type='text/plain;charset=utf-8'){const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('#download-button').addEventListener('click',()=>{downloadFile('dream-ads-creative-brief.txt',`DREAM ADS — CREATIVE BRIEF\n\nFictional campaign / Design exercise\n\nMake Your Dream Ad.\nPick a real or imaginary product. Imagine its next campaign. Bring it to life with OpenArt.\n\nWho: Designers, AI artists, content creators, and anyone with a big advertising idea.\nDeliverable: One original video ad of around 15 seconds made with OpenArt, plus an English creative concept of up to 100 words.\nDuration: 14 days from the opening of submissions. Exact dates will be announced.\nRewards: Three winners each receive $100 in OpenArt creative credits and a feature in the official community.\nJudging: Creative concept 40%; Product communication 30%; Visual quality 30%.\n\nAll activity details and rewards above are fictional. This demo does not submit entries to OpenArt.\n`);toast('Creative brief downloaded. Make it yours.');});
$('#share-button').addEventListener('click',async()=>{const url=new URL(window.location.href);url.hash='showcase';try{if(navigator.share){await navigator.share({title:'Dream Ads — Make Your Dream Ad.',url:url.href});}else{await navigator.clipboard.writeText(url.href);toast('Challenge link copied.');}}catch(error){if(error.name!=='AbortError')toast('Copy the page URL from your address bar to share this challenge.');}});
$('#judging-toggle').addEventListener('click',()=>{const button=$('#judging-toggle');const open=button.getAttribute('aria-expanded')!=='true';button.setAttribute('aria-expanded',String(open));$('#judging-notes').hidden=!open;});
const entryDialog=$('#entry-dialog');
const form=$('#entry-form');
const storageKey='dreamAdsDraft.v1';
let savedDraft=null;
try{const draft=JSON.parse(localStorage.getItem(storageKey)||'null');if(draft&&typeof draft.name==='string'&&typeof draft.email==='string'&&typeof draft.concept==='string'&&typeof draft.category==='string')savedDraft=draft;}catch{/* Storage may be unavailable in private mode. */}
function wordCount(){const text=$('#creator-concept').value.trim();return text?text.split(/\s+/).length:0;}
function updateWordCount(){const count=wordCount();$('#word-count').textContent=`${count} / 100 words`;$('#word-count').classList.toggle('over',count>100);$('#creator-concept').setCustomValidity(count>100?'Please keep your concept to 100 words or fewer.':'');}
$('#creator-concept').addEventListener('input',updateWordCount);
function openEntry(){closeMenu();form.hidden=false;$('.entry-success').hidden=true;$('#form-error').textContent='';if(savedDraft){$('#creator-name').value=savedDraft.name;$('#creator-email').value=savedDraft.email;$('#creator-category').value=savedDraft.category;$('#creator-concept').value=savedDraft.concept;}updateWordCount();entryDialog.showModal();document.body.classList.add('modal-open');}
$$('[data-join]').forEach(button=>button.addEventListener('click',openEntry));
form.addEventListener('submit',event=>{event.preventDefault();if(!form.reportValidity())return;const draft={name:$('#creator-name').value.trim(),email:$('#creator-email').value.trim(),category:$('#creator-category').value,concept:$('#creator-concept').value.trim(),savedAt:new Date().toISOString(),status:'local-demo-only'};if(!draft.name){$('#form-error').textContent='Please enter your creator name.';$('#creator-name').focus();return;}try{localStorage.setItem(storageKey,JSON.stringify(draft));savedDraft=draft;form.hidden=true;$('.entry-success').hidden=false;$('#export-draft').focus();}catch{$('#form-error').textContent='Your browser could not save this draft. Please allow local storage and try again.';}});
$('#edit-draft').addEventListener('click',()=>{form.hidden=false;$('.entry-success').hidden=true;$('#creator-concept').focus();});
$('#export-draft').addEventListener('click',()=>{if(savedDraft)downloadFile('dream-ads-my-draft.json',JSON.stringify(savedDraft,null,2),'application/json');});
const previewDialog=$('#preview-dialog');
let playbackInterval=null,elapsed=0,playing=false,lastTick=0,currentConcept=null;
function updatePlayback(){const seconds=Math.min(15,Math.floor(elapsed));$('#preview-time').textContent=`00:${String(seconds).padStart(2,'0')} / 00:15`;$('.preview-progress>span').style.width=`${Math.min(100,elapsed/15*100)}%`;$('.preview-progress').setAttribute('aria-valuenow',String(seconds));$('#preview-scene').textContent=currentConcept.scenes[Math.min(2,Math.floor(elapsed/5))];}
function setPlaying(value){playing=value;$('#preview-play').textContent=value?'Ⅱ':elapsed>=15?'↺':'▶';$('#preview-play').setAttribute('aria-label',value?'Pause storyboard':elapsed>=15?'Replay storyboard':'Play storyboard');$('.preview-stage').classList.toggle('paused',!value);lastTick=performance.now();}
function openPreview(id){const concept=concepts.find(c=>c.id===id);if(!concept)return;currentConcept=concept;$('#preview-title').textContent=concept.title;$('#preview-description').textContent=concept.description;$('#preview-category').textContent=concept.category;$('#preview-art').src=`assets/${concept.art}`;$('#preview-art').alt=concept.product;$('.preview-stage').dataset.category=concept.id;elapsed=0;updatePlayback();previewDialog.showModal();document.body.classList.add('modal-open');setPlaying(true);clearInterval(playbackInterval);playbackInterval=setInterval(()=>{const now=performance.now();if(playing&&!document.hidden){elapsed=Math.min(15,elapsed+(now-lastTick)/1000);updatePlayback();if(elapsed>=15)setPlaying(false);}lastTick=now;},100);}
grid.addEventListener('click',event=>{const button=event.target.closest('[data-preview]');if(button)openPreview(button.dataset.preview);});
$('#preview-play').addEventListener('click',()=>{if(elapsed>=15){elapsed=0;updatePlayback();const art=$('#preview-art');art.style.animation='none';void art.offsetWidth;art.style.animation='';}setPlaying(!playing);});
$$('dialog').forEach(dialog=>{$('.dialog-close',dialog).addEventListener('click',()=>dialog.close());dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});dialog.addEventListener('close',()=>{if(!document.querySelector('dialog[open]'))document.body.classList.remove('modal-open');if(dialog===previewDialog){clearInterval(playbackInterval);setPlaying(false);}});});
const sectionObserver=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){$$('.desktop-nav a').forEach(link=>link.classList.toggle('active',link.hash===`#${entry.target.id}`));}});},{rootMargin:'-20% 0px -55% 0px'});
$$('#home,#showcase,#details,#how-it-works').forEach(section=>sectionObserver.observe(section));
