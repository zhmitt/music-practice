# Proposal: Student Practice Journeys

## Why

The student app now has a real shell, onboarding, guided sessions, Tone Lab, Rhythm, Progress, and Settings. What it still lacks is a canonical learner-journey contract that explains:

- what question each view answers for the student
- when the app is being configured versus when practice has actually started
- which actions mean "start", "continue", "skip", or "finish"
- how microphone, signal, and pitch feedback should be explained in learner-friendly language

Recent smoke testing exposed that the current UI can work technically while still feeling under-defined. In particular, the student flow still has ambiguity around onboarding microphone validation, session exit versus completion, and the difference between page-level start controls and exercise-level start controls.

## What Changes

- retroactively document the student-facing user stories for Onboarding, Dashboard, Guided Session, Tone Lab, Rhythm, Progress, and Settings
- define a consistent interaction model for setup, ready, running, and review states
- define terminology rules for student-facing labels and feedback
- capture the main UX gaps between the implemented UI and the intended student journeys

## Impact

- gives the active product changes a clearer product contract before more UI iteration lands
- keeps the app focused on the student version before teacher workflows expand again
- helps separate true bugs from unclear interaction design or unclear wording
