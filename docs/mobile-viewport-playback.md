# Mobile viewport playback

Mobile and touch layouts now start visible media muted and inline. The gallery selects at most two mostly visible thumbnails nearest the viewport center after scroll settles, attaches their lightweight sources only then, and pauses previous previews. Workflow playback follows the currently visible step and loops it while it remains in view; desktop keeps the original three-step sequence. Hero playback pauses when mostly out of view. A modal pauses background media, and closing it restores visible previews. Reduced-motion preferences remain respected.

Autoplay policy denial is handled separately from network or decoding failure. The frame keeps its poster, clears the loader and queues a muted inline retry when ready or on the next ordinary touch/key interaction; there is no extra Play video permission overlay on mobile. Genuine failures still use the in-frame retry UI. Browsers with mandatory low-power or user autoplay restrictions can still retain a poster until playback is permitted. Preview dialogs initially play muted on mobile, with the existing unmute and pause controls available.

Only visible players can be retried after denial. Leaving the page pauses gallery playback; offscreen loading does not produce false timeout errors. No video carousel reordering or programmatic scroll is introduced.

Validation covers viewport selection, muted/inline playback, policy refusal and gesture retry, hidden/offscreen suspension, bounded gallery downloads, modal pause, real error propagation, reduced motion, desktop behavior and visible-step selection. Browser checks use the mobile layout to verify scroll transitions, modal return, actual playing states and absence of permission prompts.
