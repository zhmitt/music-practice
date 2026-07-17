# Design: Student Practice Journeys

## Context

The current runtime already exposes the main student-facing surfaces:

- onboarding
- dashboard
- guided session overlay
- Tone Lab
- Rhythm
- Progress
- Settings

Smoke testing and code review show that the main risk is no longer "missing screens." The risk is that the student has to infer too much about what state the app is in:

- setup versus actual practice
- microphone signal versus confident pitch detection
- page-level transport versus exercise-level start buttons
- early exit versus successful completion

## Decisions

### Decision 1: Treat the student version as the canonical product surface

The default app variant stays student-first until the student practice loop is coherent end to end. Teacher-only routes, creation flows, and vocabulary are secondary and must not shape the default navigation or CTA model.

### Decision 2: Define each view by one learner question

Each student view needs one primary job:

| View | Learner question | Primary responsibility |
|---|---|---|
| Onboarding | "Can this app hear me and tailor practice to me?" | Collect profile, confirm microphone setup, and launch the first safe practice step |
| Dashboard | "What should I do today?" | Present one primary next action and supporting context |
| Guided Session | "What do I play now, and how do I know I am done?" | Show the current target, success condition, and next action |
| Tone Lab | "Am I exploring freely or doing a focused pitch drill?" | Separate live monitoring from optional structured challenges |
| Rhythm | "Am I setting pulse, following playback, or being scored?" | Make tool mode versus exercise mode explicit |
| Progress | "What changed, and what should I practice next?" | Turn history into direction, not just reporting |
| Settings | "Can I change my setup without losing context?" | Adjust the practice context safely and transparently |

### Decision 3: Use a shared state model across student practice flows

The student app should expose four human-meaningful states:

- `Setup`: choosing instrument, microphone, tempo, or mode options
- `Ready`: prerequisites are satisfied and the next action is clear
- `Running`: listening, playback, or scoring is actively happening
- `Review`: the app explains what happened and offers the next deliberate choice

The UI should not skip directly from setup into running without making that transition legible.

### Decision 4: Keep action verbs semantically distinct

Student-facing actions should stay consistent:

- `Start` means a timed, recorded, or analyzed activity begins now
- `Continue` or `Next` means advance within an already running or already completed flow
- `Pause` and `Resume` control an active flow without discarding it
- `Skip` means move past the current target without claiming success
- `Finish` should be reserved for a successfully completed flow
- early exit should be labeled explicitly as `End session`, `Stop training`, or `Cancel`, not hidden behind a generic success verb

### Decision 5: Separate signal feedback from pitch feedback

Learners should not have to infer the audio pipeline from a moving meter alone. Student-facing audio states must distinguish:

- microphone access granted or denied
- device selected but no usable signal
- signal present but no stable pitch yet
- pitch detected but not yet stable or not yet matching the target
- stable target detected

This is especially important in onboarding and all pitch-led exercises.

### Decision 6: Make parent-child start relationships explicit

Some surfaces legitimately have two start boundaries:

- Tone Lab can start live listening at the page level, then start a specific challenge inside that live context
- Rhythm can expose a continuous metronome transport while pattern and subdivision modes own their own exercise starts

That model is acceptable only if the page explains the relationship. The UI must not make the student guess why they had to press two different start controls.

### Decision 7: Student audio flows need product-visible diagnostics

When live audio fails, the learner and the team need more than a moving level meter. The student app should expose an in-app audio debug inspector that can show:

- the active microphone
- whether capture is running
- whether enough samples are buffered for pitch analysis
- whether the detector is currently at `buffering`, `no_signal`, `low_confidence`, `out_of_range`, or `detected`
- the tentative pitch versus the final filtered pitch

This debug surface belongs in Settings so real Tauri smoke tests can be diagnosed without relying only on terminal logs.

### Decision 8: Separate pitch naming from visual note representation

The existing display-mode decision (`notated` versus `concert`) answers "what note name should the learner read?" That is different from "how should the note be rendered?"

Student-facing note targets should therefore support a second, independent representation preference:

- note name only
- staff notation only
- hybrid note name plus notation

That representation should be shared across onboarding, guided sessions, Tone Lab targets, interval prompts, and similar note-target surfaces.

## Current UX Findings

### Dashboard

- The primary daily action exists, but the same card also houses assignments and imports. That weakens the "what should I do today?" focus.
- `Anpassen` is too vague as the only secondary action beside `Start session`.

### Onboarding

- The microphone step currently mixes permission, device selection, signal detection, and pitch validation in one surface.
- The copy says "play any note," but the success state depends on stable, confident pitch detection.
- The current experience can show input level movement without explaining why no note appears yet.

### Guided Session

- The session starts immediately from Dashboard and from onboarding, so the student never gets a clear ready state before the first target.
- The control row overloads generic verbs. `Fertig` currently functions as an exit control even when the flow is not finished.
- `Weiter` is used in multiple places with different meanings.

### Tone Lab

- `Starten` at the top begins live listening, but `Training starten` inside target and interval starts the actual drill.
- That two-step model is valid, but the relation is not explicit enough yet for new users.

### Rhythm

- Metronome, pattern trainer, and subdivision trainer mix different interaction models inside one route.
- Tabs plus a transport button are fine for metronome, but exercise modes need their own clearer setup-to-start transition.

### Progress

- The view reports sessions, minutes, accuracy, streak, tendencies, and diary.
- It still under-answers the product question "what should I practice next?" beyond showing weak spots.

### Settings

- The app previously had no product-visible audio diagnostics beyond permission state and a level meter.
- Target-note surfaces across the app still assumed text-first note rendering instead of letting the learner choose between names, notation, or both.

## Product Consequences

This change does not implement UI fixes by itself. It establishes the contract for the next UX pass. The first pass should prioritize:

1. onboarding audio-state clarity and pitch-state messaging
2. session control semantics for start, next, skip, finish, and early exit
3. explicit framing of page-level versus exercise-level start actions in Tone Lab and Rhythm
4. in-app audio diagnostics for live smoke tests
5. shared note rendering preferences for target-note surfaces
