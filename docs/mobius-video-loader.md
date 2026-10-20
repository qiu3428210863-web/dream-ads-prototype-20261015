# Möbius video loading indicator

All visible media surfaces use a centered, noninteractive SVG Möbius loop: hero, gallery hover previews, preview dialog and workflow clips. The white stroke grows along the open woven silhouette without an underlying track; a translucent scrim keeps it legible on light footage. Posters remain visible behind it.

The shared media state shows the indicator on play/load/waiting, hides it on playing, intentional pause, emptied and failure, and retains the existing 15-second recovery timeout. Deferred videos do not display loaders until requested. Retry restores the loading state. Translation rescans do not duplicate indicators.

Desktop gallery cards paint the same vector into their GPU texture. Animation only repaints visible buffering cards and stops when none remain; mobile uses CSS. Reduced-motion mode shows a static complete mark.

Validation: native and GPU browser previews; automated loading/play/pause/error/emptied lifecycle checks for all four player types; full regression suite. `mobius-review.*` is ignored QA-only material and is not published.

## Frame overlay refinement

Failure now stays inside the video picture with a violet glass scrim, an interrupted-playback symbol, a primary title, an actionable reason and a pill retry button. Compact thumbnails reduce decoration to keep the message and retry fully visible. Modal feedback is a child of the stage; card feedback is a sibling of the play button positioned to the exact thumbnail bounds, avoiding nested interactive controls. The desktop GPU paints the visual while the transparent DOM retains accessibility and button hit testing.

The ring grows from empty to complete over 65% of a 2.4-second cycle, then drains from the tail. Below it, Loading video has three staggered dots (160 ms apart) fading upward and returning downward. The GPU renderer follows the same growth model and dot phases. Reduced motion displays a static logo and dots. Source cleanup cannot erase an existing failure.

## Woven mark correction

The supplied OpenArt mark is an open stroked silhouette: the descending strand ends on either side of the rising diagonal. Those geometric endpoints leave a transparent gap beneath the crossing. It is not a closed figure-eight and does not need an opaque patch, so the overlap remains correct over every poster and video. The new normalized path follows the supplied mark's triangular left loop, round right loop and rounded stroke ends. Both renderers use this identical open path at 7.5 units stroke width. The gray track has been removed entirely from SVG and GPU painting; only the growing white stroke is visible. Loading text, dots and recovery behavior remain unchanged.
