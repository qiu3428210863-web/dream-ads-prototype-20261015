# Showcase video preview

Hovering the thumbnail starts a muted preview in that same 16:9 thumbnail frame. The card shell and metadata use a dark palette for contrast on the black page; there is no floating picture-in-picture window. Only the active thumbnail can play. The CD still slides up from behind the card on hover.

The curved showcase renders its source scene at 1.75× display density by default, then samples it through mipmaps. High-density screens scale the source with display density; low-memory devices, maximum texture size, and a 12–16 MP scene budget cap the workload. Anisotropic filtering is enabled when the browser exposes the WebGL extension. Canvas image smoothing and geometric-precision text rendering are enabled for the raster scene.

This workspace currently contains SVG concept artwork but no finished ad clips or audio tracks. Until a clip is assigned, the card plays a small animated storyboard preview and the dialog provides seek and play/pause controls; audio controls stay disabled and the status message explains why.

To attach a real clip later, add a relative `videoSrc` property to the matching concept in `dist/app.js`, for example `videoSrc: 'assets/videos/beauty.mp4'`, and place that file at the corresponding path. The hover player will load it muted, while the dialog enables seeking, mute, volume, and full-screen controls. A failed request displays an unavailable label on the card and a readable fallback message in the dialog. Keep media paths relative so the same page works when opened locally and when hosted from a GitHub Pages subpath.
