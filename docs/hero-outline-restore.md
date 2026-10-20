# Hero thumbnail outlines, without CD sleeves

Featured hero cards no longer generate disc markup. A CSS guard also hides any older disc node, and the GPU activation predicate rejects every hero disc while preserving gallery CD behavior.

The detached hover/playback outline was being clipped to the thumbnail-sized hero card and then clipped again to a texture with no horizontal/bottom margin. Gallery padding happened to conceal that defect. Outlines now paint after the card clipping scope, with fixed 8 px texture margins on the left/right/bottom (existing top CD clearance stays fixed). Texture dimensions remain stable through hover and progress updates. The stroke follows the thumbnail radius and starts playback growth at the top center. Native purple hover and growing progress outlines remain in place.

Validation checks absence of hero disc markup, unchanged gallery disc markup, explicit GPU hero exclusion, fixed outline margins, real video-driven progress changes, and native/GPU hover behavior.
