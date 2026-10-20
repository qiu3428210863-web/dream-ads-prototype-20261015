# First-visit loading and media optimization

## Root cause

The hero deliberately hid its only ready image while loading a thumbnail from `cdn.openart.ai`, and its video playlist also depended on that remote origin. A stalled thumbnail/video therefore left an empty black media layer. At the same time both 3.62 MB studio PNG layers were eager, every card image was eager, nearby gallery video metadata was prefetched and the next hero clip was requested at full preload priority. These were avoidable competitors for first-screen bandwidth.

## Behavior now

- The initial document contains a visible, high-priority local 1280×720 WebP poster, with an image preload hint. It is usable even without JavaScript. The empty video starts hidden, and copy remains visible during its entrance motion.
- A detached image loads each replacement poster. The last ready poster stays visible until the candidate is available. Existing source/request guards still prevent an old poster or decoded frame from reappearing. A fatal video error also restores the poster; an initial stalled hero load offers retry rather than leaving the loading message forever.
- All 21 card posters and five background videos use same-origin assets. Original full-quality videos remain available in explicitly opened detail previews. Hero MP4s retain full duration, use muted H.264 at 24 fps and have their moov atom before media frames for progressive startup.
- Upcoming hero metadata is delayed three seconds and respects save-data/slow-connection settings. Gallery video downloads wait for user intent; workflow videos use `preload=none`. Non-featured card images and both studio layers use lazy loading. Studio alpha remains present (`yuva420p`, 1672×941).
- Loading/retry feedback sits above the featured rail rather than behind its thumbnails. Changed stylesheet/script URLs are versioned.

## Measured file sizes

| Asset | Previous input | Current delivered asset | Difference |
|---|---:|---:|---:|
| First background clip | 3,898,773 B | 1,382,188 B | −64.5% |
| Studio background + alpha foreground | 3,621,139 B | 420,512 B | −88.4%, also deferred |
| Three workflow posters | 286,754 B | 160,634 B | −44.0% |
| First hero poster | — | 27,780 B, 1280×720 | preloaded local still |
| All 21 posters | remote dependency | 256,540 B total | lower cards load lazily |

The clip comparison uses the existing local high-resolution input, not an invented byte count for the external original. First five optimized background clips total 7,337,946 B and are not downloaded together. Original source assets remain as inputs; repository disk size is not the page's startup download budget. See `startup-asset-sizes.json` for per-file figures.

## Verification

62 checks pass, including visible HTML fallback, no eager lower-page video request, local asset paths/size budgets, MP4 fast-start ordering, stale-image/frame races, pending poster failure, fatal media failure and initial-load timeout.

A local browser fixture sampled initial resource requests: zero external CDN requests, zero studio-image requests, zero gallery-video requests and only the first hero stream. Another fixture disabled all scripts and still displayed the hero poster/copy. A failure fixture returned unavailable hero video and replacement poster URLs; the ready image and title stayed fully visible and a retry action appeared. The lazy WebP studio layers were also checked after navigating to that section. Fixtures are ignored by Git and not deployed.

This verifies request order and fallback behavior; it is not a claimed cold-cache speed score or a physical mobile network benchmark.

## Rebuild and publish

`python tools/optimize-startup-assets.py` creates missing derived assets with FFmpeg (using already-present sources or original poster URLs). `--refresh-video` regenerates hero streams. Commit intended changes, then run `./tools/publish-pages.ps1`; it reruns checks, pushes source and Pages, waits for the exact build and verifies public HTML.

## Subsequent hero quality update

The size table above records the earlier low-bandwidth optimization. Full-screen clips have since been replaced with original-source HD encodes; see [hero-quality.md](hero-quality.md) and hero-hd-media.json for the current dimensions, frame rates and sizes. The local poster, fast-start MP4 and deferred download strategy remain in place.
