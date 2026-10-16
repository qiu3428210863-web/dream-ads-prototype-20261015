/* CRT lens: Shader's centered radial UV model, translated to DOM displacement. */
(() => {
  'use strict';
  const root = document.documentElement;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const svgNS = 'http://www.w3.org/2000/svg';
  // Verified against shader.se: lensDistortion=.16, border mode=0, factor=1.
  const lensDistortion = .16;
  const zoomCompensation = .3655;
  const surface = document.createElement('div');
  surface.className = 'crt-surface';
  surface.id = 'crt-surface';
  const main = document.querySelector('main');
  main.before(surface);
  [main, document.querySelector('.footer')].forEach(node => surface.append(node));

  const defs = document.createElementNS(svgNS, 'svg');
  defs.classList.add('crt-filter-defs');
  defs.setAttribute('aria-hidden', 'true');
  defs.innerHTML = `<defs>
    <filter id="crt-lens" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feImage href="assets/crt-displacement.png" preserveAspectRatio="none" result="radial-map-raw"/>
      <feGaussianBlur in="radial-map-raw" stdDeviation=".6" result="radial-map"/>
      <feDisplacementMap in="SourceGraphic" in2="radial-map" xChannelSelector="R" yChannelSelector="G" result="curved"/>
      <feOffset in="curved" dx="0" dy="-.42" result="red-position"/>
      <feColorMatrix in="red-position" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red"/>
      <feColorMatrix in="curved" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="green"/>
      <feOffset in="curved" dx="0" dy=".42" result="blue-position"/>
      <feColorMatrix in="blue-position" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue"/>
      <feComposite in="red" in2="green" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="red-green"/>
      <feComposite in="red-green" in2="blue" operator="arithmetic" k1="0" k2="1" k3="1" k4="0"/>
    </filter>
  </defs>`;
  document.body.append(defs);
  const glass = document.createElement('div');
  glass.className = 'crt-glass';
  glass.setAttribute('aria-hidden', 'true');
  document.body.append(glass);
  const filter = defs.querySelector('filter');
  const map = defs.querySelector('feImage');
  const warp = defs.querySelector('feDisplacementMap');
  let frame = 0;
  let lastWidth = 0;
  let lastHeight = 0;

  function buildDisplacementMap(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = 1024;
    const context = canvas.getContext('2d');
    if (!context) return false;
    const pixels = context.createImageData(canvas.width, canvas.height);
    // Source shader: p=uv-.5; r=length(p); sample=.5+p*(1+k*r^3)*(1-.3655*k).
    // Encode pixel displacement separately on X/Y to preserve aspect ratio.
    const scale = Math.max(width, height) * .06;
    const zoom = 1 - zoomCompensation * lensDistortion;
    for (let y = 0; y < canvas.height; y++) {
      // Central half is the viewport; the remainder supplies compositor overscan.
      const v = y / (canvas.height - 1) * 2 - .5;
      const py = Math.max(0, Math.min(1, v)) - .5;
      for (let x = 0; x < canvas.width; x++) {
        const px = x / (canvas.width - 1) - .5;
        const radius = Math.hypot(px, py);
        const factor = zoom * (1 + lensDistortion * radius ** 3);
        const dx = px * (factor - 1) * width;
        const dy = py * (factor - 1) * height;
        const i = (y * canvas.width + x) * 4;
        pixels.data[i] = Math.round(255 * (.5 + dx / scale));
        pixels.data[i + 1] = Math.round(255 * (.5 + dy / scale));
        pixels.data[i + 2] = 128;
        pixels.data[i + 3] = 255;
      }
    }
    context.putImageData(pixels, 0, 0);
    map.setAttribute('href', canvas.toDataURL('image/png'));
    warp.setAttribute('scale', String(scale));
    surface.dataset.crtCurvature = String(lensDistortion);
    return true;
  }

  function alignLens() {
    const width = root.clientWidth;
    const height = innerHeight;
    const padding = height * .5;
    const surfaceTop = surface.getBoundingClientRect().top + scrollY;
    [filter, map].forEach(node => {
      node.setAttribute('x', '0');
      node.setAttribute('y', String(scrollY - surfaceTop - padding));
      node.setAttribute('width', String(width));
      node.setAttribute('height', String(height * 2));
    });
    if (width !== lastWidth || height !== lastHeight) {
      if (!buildDisplacementMap(width, height)) root.classList.remove('crt-enabled');
      lastWidth = width;
      lastHeight = height;
    }
  }
  function scheduleAlignment() {
    if (frame || document.hidden) return;
    frame = requestAnimationFrame(() => { frame = 0; alignLens(); });
  }
  function updatePreference() {
    root.classList.toggle('crt-enabled', !reducedMotion.matches);
    scheduleAlignment();
  }
  // Native scrolling only moves the lens sampling window. It changes neither
  // curvature nor vignette opacity; the content travels across a fixed lens.
  addEventListener('scroll', scheduleAlignment, {passive:true});
  addEventListener('resize', scheduleAlignment, {passive:true});
  addEventListener('pageshow', scheduleAlignment);
  document.addEventListener('visibilitychange', scheduleAlignment);
  reducedMotion.addEventListener('change', updatePreference);
  if ('ResizeObserver' in window) new ResizeObserver(scheduleAlignment).observe(surface);
  alignLens();
  updatePreference();
})();
