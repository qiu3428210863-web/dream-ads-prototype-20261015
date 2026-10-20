# Showcase disc return and example label

Only the uploaded fashion-elevator-example concept is explicitly marked example. The gallery renderer emits its badge only for that concept; featured hero cards do not get a badge.

Root cause: native CSS and GPU painting used focus-within to expose a disc. After the preview dialog restored focus to its opening button, that focus persisted even after the pointer left. The old return suppression was cleared by any pointer movement, including movement within the same card, and GPU painting ignored suppression altogether.

Disc activation now uses a fine-pointer hover or visible keyboard focus on the play button. Both renderers respect return suppression; GPU also skips discs during an open dialog and rail interaction. Opening a preview suppresses the originating disc immediately. Closing restores focus for accessibility while keeping its disc tucked in until the pointer leaves or a fresh keyboard/pointer action occurs. The suppression cannot be cleared by minor pointer motion within the same card.

Verification: card markup tests for the single example, GPU state tests for hover, keyboard focus, pointer focus, suppression, modal and touch states, plus browser open/close/move-out checks and the full regression suite.
