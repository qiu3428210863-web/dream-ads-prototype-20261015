# Möbius video loading indicator

All visible media surfaces use a centered, noninteractive SVG Möbius loop: hero, gallery hover previews, preview dialog and workflow clips. The moving white stroke follows the loop over a dim track; a translucent backplate keeps it legible on light footage. Posters remain visible behind it.

The shared media state shows the indicator on play/load/waiting, hides it on playing, intentional pause, emptied and failure, and retains the existing 15-second recovery timeout. Deferred videos do not display loaders until requested. Retry restores the loading state. Translation rescans do not duplicate indicators.

Desktop gallery cards paint the same vector into their GPU texture. Animation only repaints visible buffering cards and stops when none remain; mobile uses CSS. Reduced-motion mode shows a static complete mark.

Validation: native and GPU browser previews; automated loading/play/pause/error/emptied lifecycle checks for all four player types; full regression suite. `mobius-review.*` is ignored QA-only material and is not published.
