# Showcase stability fix

## Confirmed causes

- The public site was still serving the older build during the GitHub Pages incident. That build placed card loading feedback in normal document flow. A message increased one card's height, CSS Grid stretched its row, and the GPU copy omitted the message: the added height looked like blank space.
- In light mode, theme selectors repainted the original DOM card surfaces while the curved GPU copy was also visible. The cover background also competed with later theme rules, creating doubled white edges.
- The hover poster loop scaled below its frame and rotated over a light fallback surface. The canvas also stretched media instead of applying the browser's centered cover crop.
- Hovering the disc changed the texture bounds every animation frame (the regression fixture changed from height 220 to 252). This resized the canvas and recreated its GPU texture. Repeated play events could also start multiple uncancelled video-frame callback chains.
- The 3D row reveal changed the projection while card contents were measured with a scale-only inverse. Its opacity/position animation was not guaranteed to have a render clock once scrolling stopped.

## Changes

The lower gallery uses intrinsic card heights and top alignment. Feedback is absolutely positioned and painted into the GPU copy. GPU mode suppresses every original surface in both themes. Poster motion only enlarges inside the clipped cover; video appears after playback readiness. Media uses centered cover cropping. Texture bounds reserve disc space once, and video-frame subscriptions are cancelled and generation-guarded. Row entry uses a short upward reveal with an explicit bounded rendering clock. Theme color changes repaint through the transition.

The desktop curved renderer and the native mobile layout remain enabled under their existing device rules.

## Validation

65 checks pass, including regressions for stable hover texture bounds, cover cropping, and one video-frame subscription after repeated resumes. Local browser checks covered the light and dark desktop gallery at 1280px and the native gallery at 390px. At 1280px the sampled first-row card heights changed from 214px to 199px and remained unchanged during preview playback; mobile had no horizontal document overflow. Browser pointer drags triggered real hover playback and the original cover background was confirmed transparent in GPU mode.

These observations establish the reproduced layout and rendering fixes; they are not a device-wide performance benchmark.
