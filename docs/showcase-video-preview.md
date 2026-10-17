# Showcase video preview

The cards now provide a muted hover preview and a dark custom player dialog. Only the currently hovered card is allowed to play. The CD hover animation remains independent of the preview state.

This workspace currently contains SVG concept artwork but no finished ad clips or audio tracks. Until a clip is assigned, the card plays a small animated storyboard preview and the dialog provides seek and play/pause controls; audio controls stay disabled and the status message explains why.

To attach a real clip later, add a relative `videoSrc` property to the matching concept in `dist/app.js`, for example `videoSrc: 'assets/videos/beauty.mp4'`, and place that file at the corresponding path. The hover player will load it muted, while the dialog enables seeking, mute, volume, and full-screen controls. A failed request displays an unavailable label on the card and a readable fallback message in the dialog. Keep media paths relative so the same page works when opened locally and when hosted from a GitHub Pages subpath.
