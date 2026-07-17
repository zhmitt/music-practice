# Proposal: Bb Horn Practice Pedagogy

## Why

The current student implementation is functionally broad, but several exercise defaults still reflect generic pitch/rhythm tooling more than instrument-aware pedagogy.

Recent live testing surfaced three concrete risks:

- `horn_bb` notation can feel unexpectedly low, especially when practice material drifts into ledger-line-heavy written ranges.
- Tone Lab modes are available, but their musical purpose and recommended way of using them are not yet consistently framed for young learners and returning adults.
- Rhythm currently mixes a solid simple-meter workflow with compound-meter affordances that are not yet pedagogically modeled to the same standard.

This change formalizes a student-first pedagogical pass with `Bb horn` as the primary brass reference, while keeping other instrument variants available.

## What Changes

- Introduce instrument-aware pedagogical practice profiles, starting with a `horn_bb` profile tuned for a comfortable middle register.
- Use those profiles across guided sessions, Tone Lab target/drone/interval/ear exercises, and related suggestion logic.
- Clarify Tone Lab and Rhythm mode purpose in supportive learner-facing language.
- Tighten the default exercise flow so setup, exploration, and scored drills feel intentional rather than accidental.
- Record the unresolved distinction between `physical horn variant` and `written horn notation system` so future work can refine that model without silently changing behavior.

## Expected Outcome

- `Bb horn` learners see target notes and practice material in a more readable and playable register.
- Tone Lab becomes easier to use as a practice space, not just a diagnostic surface.
- Rhythm communicates whether it is acting as a support tool or a scored exercise.
- The app remains honest about what it models well today and what still needs a deeper horn-notation decision.
