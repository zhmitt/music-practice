# Legacy Wrapper: `/post-impl`

This command maps to canonical post-implementation preparation and verification.

1. Run `workflow/scripts/post-impl-prepare.sh --summary "<what changed>"`.
2. Review and refine `verification.md` and the matching report if they need more detail.
3. Run `/opsx/verify` or `workflow/scripts/post-impl-check.sh`.
