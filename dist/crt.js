/* Keep the glass lighting separate from the native, full-resolution document. */
(()=>{
 'use strict';
 const root=document.documentElement;
 const surface=document.createElement('div');
 surface.className='crt-surface';surface.id='crt-surface';
 const main=document.querySelector('main');main.before(surface);
 [main,document.querySelector('.footer')].forEach(node=>surface.append(node));
 const glass=document.createElement('div');glass.className='crt-glass';glass.setAttribute('aria-hidden','true');document.body.append(glass);
 function sizeViewport(){root.style.setProperty('--viewport-width',root.clientWidth+'px');}
 sizeViewport();addEventListener('resize',sizeViewport,{passive:true});
 if('ResizeObserver' in window)new ResizeObserver(sizeViewport).observe(root);
})();
