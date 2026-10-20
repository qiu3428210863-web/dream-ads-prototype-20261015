# 720p full-screen hero delivery

All five hero clips are now 1280x720, encoded directly from their original sources. H.264 Main profile level 3.1, yuv420p, CRF 21, a 3 Mbps rate target ceiling with 6 Mbps buffer, no audio and fast-start MP4 keep normal 720p detail while reducing mobile decoder/bandwidth pressure. Native 24/30 fps and original duration are retained. The previous 1080p fox delivery is now downsampled to 720p. Thumbnails, cards and explicitly opened original-source videos are unchanged.

| Clip | Delivered resolution | Frame rate | Average video rate | File size |
|---|---|---|---|---|
| openart-activewear | 1280 x 720 | 24/1 | 2.31 Mbps | 6.64 MiB |
| openart-orange-soda | 1280 x 720 | 24/1 | 2.70 Mbps | 7.75 MiB |
| openart-energy-drink | 1280 x 720 | 24/1 | 2.94 Mbps | 7.03 MiB |
| openart-pink-fashion | 1280 x 720 | 24/1 | 2.35 Mbps | 8.42 MiB |
| openart-fox-film | 1280 x 720 | 30/1 | 3.06 Mbps | 5.48 MiB |

The older SSIM comparison in hero-hd-ssim.json records the prior CRF 20 HD revision; it is not a measurement of this revision. Current media parameters are in hero-hd-media.json. Each published file has passed complete error-free decoding, duration agreement, Main/3.1 header checks, 720p bounds and moov-before-mdat verification. Original downloads remain only in ignored .tools/hero-source.
