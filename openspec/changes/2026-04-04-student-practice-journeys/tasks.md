# Tasks: Student Practice Journeys

## Status: in_progress

## Tasks

### 1. Retroactive story mapping
- [x] Inventory the implemented student-facing views and main actions
- [x] Write retroactive user stories for onboarding, dashboard, guided session, Tone Lab, Rhythm, Progress, and Settings
- [x] Capture the main UX ambiguities against those stories

### 2. Interaction model decisions
- [x] Decide which controls belong to setup, ready, running, and review states
- [x] Decide where `Start`, `Weiter`, `Fertig`, `Stop`, and `Abbrechen` should be used consistently
- [x] Decide how microphone signal, pitch detection, and target-match states should be explained in the UI

### 3. Integrate with active product work
- [x] Link the student-journey contract from `2026-03-31-app-shell-foundation` and `2026-03-31-audio-pitch-engine`
- [x] Choose the first student-first UX implementation slice
- [ ] Run the next Tauri smoke test against the new story model instead of ad hoc expectations

### 4. Follow-up implementation focus
- [x] Implement the first UX pass for onboarding and guided session control semantics
- [x] Implement the first wording pass for student-facing copy in DE and EN
- [x] Implement in-app audio debugging for live microphone, detector, and confidence inspection
- [x] Add a global note-representation preference (`name`, `notation`, `hybrid`) across target-note surfaces
- [ ] Re-test Tone Lab and Rhythm start semantics after the first UX pass
