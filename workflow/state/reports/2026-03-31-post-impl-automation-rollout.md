# Report: post-implementation automation rollout

## Summary

- added `workflow/scripts/post-impl-prepare.sh` to scaffold canonical verification and report artifacts
- updated `workflow/scripts/post-impl-check.sh` so staged commits point to the new preparation step
- kept `workflow/scripts/session-close.sh` manual and enforced a non-trivial summary
- updated Claude, Gemini, and Codex adapters to use the new post-implementation preparation flow
- added a Claude write-hook that can touch missing post-implementation artifacts during active implementation

## Outcome

Post-implementation work is now easier to do at the right time because the canonical evidence files can be scaffolded automatically or with a single command, while session close remains an intentional handover step.
