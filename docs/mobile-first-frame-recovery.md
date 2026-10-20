# Mobile hero first-frame recovery

## Confirmed code paths

The old hero gate called play only after canplay set both readiness flags. A test with readyState=2 (a decoded frame) and no canplay reproduced zero play calls, leaving the first frame/poster static. A second path handled a temporary NotAllowedError by silently pausing and waiting for a later gesture; if canplay had already fired there was no automatic retry. Independent viewport/readiness handlers also issued overlapping play requests without a shared pending guard.

## Changes

The hero is muted/defaultMuted/inline before each play request, including Safari's inline attribute, and uses native autoplay only while playback is wanted. loadeddata (readyState>=2), canplay and pageshow can start it. Mobile playback uses one source-scoped pending request, discards stale source completions and avoids play calls on already-progressing ready video.

Temporary policy denial or an unexpected pause/abort gets at most three visible-only recovery attempts at 250/750/1500 ms. Ordinary pointerdown/touchstart input can unlock playback without an extra button. Intentional viewport/document/modal/reduced-motion pauses are marked and cannot be undone by recovery. A bfcache pageshow clears stale pending state. Genuine network/decoder failures retain the error UI. OS-enforced restrictions remain subject to the browser's permission to play.

## Verification

A regression test first failed on the old readyState=2 gate, then passed after the fix. Browser QA suppresses canplay and rejects the first play request; without a click, the new video resumes and its currentTime and progress advance. The QA files are ignored and not deployed. All five delivered clips are 720p Main/3.1 and decode for their complete original duration. Viewport pause, pending-request deduplication, bounded retries and non-restarting active video are covered by tests.
