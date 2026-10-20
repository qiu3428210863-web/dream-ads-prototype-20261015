# Full-screen hero quality restoration

The previous hero assets were 960x540 for activewear and 854x480 for the other clips. Four were generated from already-compressed card previews, and another CRF 31 encode capped at 900 kbps further removed detail. Full-screen cover scaling exposed this loss.

All five clips are now encoded directly from their original public sources, preserving the original native dimensions and frame rates (four 1280x720 at 24 fps; fox 1920x1080 at 30 fps). No artificial upscaling. H.264 CRF 20, a 6 Mbps rate ceiling with 12 Mbps buffer, yuv420p, no audio and fast-start MP4 provide a moderate delivery copy. Hero URLs include a new version so cached low-resolution files cannot persist. Posters, progressive loading and deferred lower-page media remain in place. Card previews remain lightweight.

The activewear comparison against the same original at 720p measured SSIM 0.965453 for the previous 540p delivery scaled with Lanczos, and 0.989654 for the new delivery. SSIM is an objective similarity check, not a claim that perceived quality is a percentage. Complete logs are in hero-hd-ssim.json.

| Clip | Delivered resolution | Frame rate | Average video rate | File size |
|---|---|---|---|---|
| openart-activewear | 1280 x 720 | 24/1 | 2.58 Mbps | 7.41 MiB |
| openart-orange-soda | 1280 x 720 | 24/1 | 3.07 Mbps | 8.79 MiB |
| openart-energy-drink | 1280 x 720 | 24/1 | 4.87 Mbps | 11.64 MiB |
| openart-pink-fashion | 1280 x 720 | 24/1 | 2.81 Mbps | 10.07 MiB |
| openart-fox-film | 1920 x 1080 | 30/1 | 6.29 Mbps | 11.25 MiB |

Validation checks H.264 sample dimensions, progressive moov ordering, a 25 MB per-file budget, original input encoding rather than preview recompression, full decode and source/output duration agreement. Source downloads are cached only in ignored .tools/hero-source; published files contain only the delivery copies. The legacy startup tool also preserves the HD settings and refuses to fall back to preview inputs.
