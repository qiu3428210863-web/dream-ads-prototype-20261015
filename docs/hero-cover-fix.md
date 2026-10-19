# Hero loading-preview coverage fix

The global responsive image rule `img { max-width:100% }` constrained the hero poster, but not its sibling video. Both media layers specify left -4%, width 108% and scale 1.02. The image was clamped back to 100% before its transform, leaving approximately 3% uncovered on the right. At the inspected 1280px viewport the actual gap was 37.94 CSS pixels.

Fix: explicitly set `max-width:none; max-height:none` on the shared hero poster/video cover rule. Keep object-fit cover, overscan, opacity, frame handoff and parallax unchanged. Version the stylesheet reference so previously cached mobile changes remain intact and this correction is fetched immediately.

Verification: the new regression assertion failed before the CSS correction. All 55 checks now pass. A local loading-only fixture exposes the poster while the video remains pending; browser measurements at 1280×720 and 390×844 show all four edges covered, identical poster/video dimensions and a zero right gap. The fixture is ignored by Git and is not published.
