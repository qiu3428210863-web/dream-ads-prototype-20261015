# Mobile featured-card jitter: diagnosis and repair

User evidence: 5.269-second, 844×376 recording supplied on 2026-10-19. The recording was read locally and frames extracted for comparison; it was not uploaded into the public repository.

## Confirmed cause

The hero used the desktop centered carousel at every width. `selectHeroVideo` called `rotateFeaturedCardToCenter` on every selected or completed clip. That routine reordered all five live cards, wrote `scrollLeft` immediately, and ran a 760ms FLIP transform. Repeated selections or an automatic transition during browsing moved the rail independently of the user's swipe. It measured intermediate transformed bounds during another in-flight animation, producing temporarily overlapping card positions.

At 844×376, the original code visibly changed DOM order from fashion/fox/runner/soda/energy to fox/runner/soda/energy/fashion when selecting soda. Transitional neighboring x coordinates were 568 and 606 although card spacing was 222px. The recording also shows circular discs popping out: hover lift and disc transitions were still enabled at this responsive width.

## Changes and publication stages

1. Mobile/coarse/no-hover layouts preserve DOM order and never programmatically recenter on video changes. Disable mobile FLIP, entry rise, hover lift and decorative discs. Desktop fine-pointer layout retains its existing centered loop. Regression test failed on the original code, then passed with the fix. Published main commit `9e27700`, Pages commit `2c553c182c386c1c856c98a043d685bcd7e8935f`.
2. Add a passive pointer gesture guard: do not prevent native horizontal or vertical panning; distinguish taps from drags, cover pointer cancellation and momentum, suppress post-swipe synthetic clicks, and preserve keyboard activation. Touch/pen events no longer launch hover video playback. Use live DOM on mobile instead of a fixed, main-thread WebGL overlay, which cannot be composited atomically with browser-owned momentum. This is an architectural risk removed in addition to the observed reordering cause, not a claim that GPU desynchronization was proven on the user's physical phone. Fine-pointer desktop rendering remains available. Add asset version queries so cached scripts cannot mix old and new gesture code.

## Verification

- 54 automated checks: existing hero frame, viewport, translation and workflow tests; new stable-mobile-order, desktop centering, native/GPU routing, stationary tap, drag-click suppression, native vertical gesture, pointer cancellation, momentum, keyboard activation and idempotent guard binding tests.
- Browser reproduction at 844×376: a real pointer drag moves the rail from 0 to ~300.67px while the selected soda clip, card DOM order and `transform:none` remain unchanged. Clicking a visible card changes playback without moving the rail. Decorative discs stay hidden.
- Portrait 390×844 and desktop 1280×720 are checked separately during the final browser pass. Browser automation does not provide genuine OS touch injection; touch cancellation and inertia sequences are covered by event tests, rather than claimed as a physical iOS/Android device test.

## Publication policy

After each completed, verified change, commit only the intended files and run `./tools/publish-pages.ps1`. It checks tests, pushes main, generates/pushes gh-pages without force, waits for the exact Pages commit to build and compares the served HTML with the committed release. Do not claim deployment complete from a successful source push alone.
