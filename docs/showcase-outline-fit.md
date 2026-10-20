# Detached outline geometry

The grid thumbnail radius was 12 px, while its native outline used 15 px and the GPU copy hardcoded 24 px. This displaced the corner centers and produced a different contour around the same picture.

Thumbnail radius, outline gap and stroke now have a shared CSS source. Covers inherit the thumbnail radius. The native outline uses radius + gap; GPU stroke centerlines use radius + gap - half the stroke. Both keep the thumbnail corner centers unchanged, producing a uniform offset along straight edges and curves. Progress outlines share the corrected geometry. No change to the intended gap, colors or stroke weight.

Validation: corner-center and outer-bound tests at 12/14/18 px radii with hover and progress stroke widths; browser comparison of native and GPU cards; full regression suite.
