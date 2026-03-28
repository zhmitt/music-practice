# Feature Specification: Pitch Detection Engine

**Feature Branch**: `001-pitch-detection`
**Created**: 2026-03-28
**Status**: Draft
**Input**: User description: "Core audio analysis engine — real-time pitch detection for monophonic wind instruments, implemented in Rust (Tauri backend)"

---

## User Scenarios & Testing *(mandatory)*

<!--
  User stories are ordered by priority. Each story is independently testable
  and delivers standalone value to the practice workflow.
-->

### User Story 1 — Basic Pitch Detection: Audio In, Note Out (Priority: P0)

Leo blows a note on his Bb Horn. Within 50 milliseconds the app displays the
detected note name, octave, and how many cents it deviates from the reference
pitch. He can see in real time whether he is sharp, flat, or in tune.

**Why this priority**: Without working pitch detection there is no tuner, no
Long Tone exercise, no Tone Lab, and no intonation feedback anywhere in the
app. Every other feature in ToneTrainer depends on this story being correct
and fast.

**Independent Test**: Can be fully tested by routing microphone audio through
the engine and asserting that the returned `PitchResult` contains the correct
note name, octave, and a cent deviation within ±1 cent of the true value.
Delivers a working real-time tuner with no other features required.

**Acceptance Scenarios**:

1. **Given** the engine is running and receives a sustained Bb4 sine wave at
   466.16 Hz, **When** the audio buffer is processed, **Then** `PitchResult`
   contains `note_name = "Bb"`, `octave = 4`, `frequency_hz` within ±0.5 Hz
   of 466.16, `cent_deviation` within ±1.0 cent, and `confidence >= 0.9`.

2. **Given** a sustained note at any frequency in the French Horn range
   (F2–F6), **When** the buffer is processed, **Then** end-to-end latency
   from audio input to `PitchResult` emission is less than 50 ms.

3. **Given** continuous microphone input, **When** the user changes pitch
   from one note to another, **Then** the engine detects the new pitch within
   one processing window (≤ 50 ms) and the previous result is no longer
   emitted.

4. **Given** silence or sub-threshold noise (RMS < configurable noise floor),
   **When** the buffer is processed, **Then** the engine emits no
   `PitchResult` and does not produce spurious note detections.

---

### User Story 2 — Instrument Profile Support: Horn in Bb and Horn in F (Priority: P0)

Leo plays a Bb Horn. Thomas plays an F Horn. The app is configured with the
correct instrument profile so that frequency-range filtering, partial
weighting, and transposition are all appropriate for each horn type. The
engine ignores frequencies outside the instrument's playable range and does
not misidentify a strong harmonic partial as the fundamental.

**Why this priority**: French Horn has one of the richest overtone spectra of
any instrument. Without instrument-aware processing the YIN algorithm will
regularly lock onto the second or third partial instead of the fundamental,
producing octave errors. This is a correctness requirement for P0 — incorrect
note detection is worse than no detection.

**Independent Test**: Can be fully tested by feeding synthesized waveforms
that include strong second and third harmonics (simulating horn tone), then
asserting the engine returns the correct fundamental rather than a harmonic.
Delivers instrument-aware detection with no UI required.

**Acceptance Scenarios**:

1. **Given** the active `InstrumentProfile` is `HornBb` (transposition
   +2 semitones, range F2–F6), **When** a signal at C5 concert pitch is
   received, **Then** `PitchResult.note_name` is `"D"` (notated, one tone
   up) when notated display is active, and `"C"` when concert-pitch display
   is active.

2. **Given** the active `InstrumentProfile` is `HornF` (transposition
   +7 semitones, range F2–F6), **When** a signal at F4 concert pitch is
   received, **Then** `PitchResult.note_name` is `"C"` (notated) or `"F"`
   (concert) depending on the display mode.

3. **Given** a horn waveform with a fundamental at 233 Hz (Bb3) and a strong
   second harmonic at 466 Hz (Bb4), **When** the engine processes the buffer
   using the horn instrument profile, **Then** `PitchResult.frequency_hz`
   is within ±1 Hz of 233 Hz (the fundamental, not the harmonic).

4. **Given** a signal at 6000 Hz (outside the F2–F6 range of any horn
   profile), **When** the buffer is processed, **Then** no `PitchResult` is
   emitted for that signal.

---

### User Story 3 — Stability Measurement for Long Tones (Priority: P0)

During a Long Tone exercise Leo holds a note for several seconds. The app
continuously measures pitch stability — the standard deviation of detected
frequency over the sustained window — so the exercise view can display a
live stability graph and a final stability score for the held tone.

**Why this priority**: Long Tone exercises are in every daily session as the
warm-up (Session Rule 1). Stability measurement is the primary metric for
that exercise type. Without it the Long Tone feature has no feedback value,
which breaks the core "Practice Companion" promise at the first exercise of
every session.

**Independent Test**: Can be fully tested by feeding a slightly wobbling
tone (frequency modulated ±10 cents) into the engine over a 3-second window
and asserting that `StabilityMeasurement.std_deviation` reflects the
modulation magnitude. Delivers all data needed to render a stability graph.

**Acceptance Scenarios**:

1. **Given** a perfectly stable synthesized tone held for 3 seconds,
   **When** `compute_stability(window_ms = 3000)` is called, **Then**
   `StabilityMeasurement.std_deviation` is ≤ 0.5 Hz and
   `mean_frequency` is within ±0.5 Hz of the true frequency.

2. **Given** a tone with deliberate vibrato (±15 cents at 5 Hz), **When**
   stability is computed over a 3-second window, **Then**
   `StabilityMeasurement.std_deviation` is measurably greater than the
   stable-tone baseline, and the value accurately reflects the depth of
   the modulation.

3. **Given** a Long Tone session with multiple held notes, **When** each
   note ends (silence detected or user advances), **Then** the engine
   emits a `StabilityMeasurement` covering the full duration of that note
   with correct `duration_ms`, `mean_frequency`, and `std_deviation`.

4. **Given** a note held for less than 500 ms (too short to be meaningful),
   **When** the note ends, **Then** no `StabilityMeasurement` is emitted
   (minimum duration threshold enforced).

---

### User Story 4 — Configurable Reference Tuning (Priority: P1)

Thomas practices with an ensemble that tunes to 440 Hz. Leo's teacher uses
442 Hz. In Settings the user can set the reference frequency anywhere between
430 and 450 Hz. All subsequent cent-deviation calculations use this reference
rather than a hardcoded value.

**Why this priority**: Cent deviation is only meaningful relative to the
reference. A hornist practicing with an orchestra tuned to 440 Hz who has
the app set to 442 Hz will see every note as ≈ 8 cents flat. This is a
correctness issue for serious practice. It is P1 (not P0) because a
hardcoded 442 Hz is usable for most users in the interim.

**Independent Test**: Can be fully tested by setting reference tuning to
440 Hz and checking that A4 at 440 Hz returns cent_deviation = 0, while
A4 at 440 Hz with reference = 442 Hz returns cent_deviation ≈ −7.85 cents.
No UI beyond a settings write is needed.

**Acceptance Scenarios**:

1. **Given** reference tuning is set to 442 Hz, **When** a 442 Hz signal
   is processed, **Then** `PitchResult.cent_deviation = 0.0`.

2. **Given** reference tuning is set to 440 Hz, **When** a 442 Hz signal
   is processed, **Then** `PitchResult.cent_deviation ≈ +7.85` cents
   (A4 at 442 vs reference 440).

3. **Given** reference tuning is set to 430 Hz (minimum) and then 450 Hz
   (maximum), **When** signals are processed at both extremes, **Then**
   cent deviations are calculated correctly for both settings with no
   clipping or error.

4. **Given** the user changes reference tuning mid-session, **When** the
   next audio buffer is processed, **Then** cent deviations in subsequent
   results reflect the new reference immediately without requiring a restart.

---

### User Story 5 — Transposition Display (Notated vs. Concert Pitch) (Priority: P1)

The Bb Horn is a transposing instrument: when Leo reads and plays a written C
the concert pitch is Bb. In Settings, the user can choose whether the app
displays notated pitch (as written in the part) or concert pitch. Both the
detected note name and the target note name in exercises respect this setting.

**Why this priority**: Displaying the wrong pitch name actively misleads the
student. A Bb Horn player who sees "C" on screen when they play what their
music calls "D" will be confused. This is a correctness requirement for
instrument-aware display. It is P1 because the detection math is the same —
only the label changes.

**Independent Test**: Can be fully tested by detecting a known concert-pitch
frequency with both display modes active and asserting the correct notated and
concert note names are returned. No session UI required.

**Acceptance Scenarios**:

1. **Given** instrument profile is `HornBb` (transposition offset +2 semitones)
   and display mode is `Notated`, **When** concert Bb4 (466.16 Hz) is detected,
   **Then** `PitchResult.note_name = "C"` and `octave = 5`.

2. **Given** the same profile and `display mode = Concert`, **When** the same
   466.16 Hz signal is detected, **Then** `PitchResult.note_name = "Bb"` and
   `octave = 4`.

3. **Given** instrument profile is `HornF` (transposition offset +7 semitones)
   and display mode is `Notated`, **When** concert F4 (349.23 Hz) is detected,
   **Then** `PitchResult.note_name = "C"` and `octave = 5`.

4. **Given** display mode changes from `Notated` to `Concert` while audio is
   streaming, **When** the next buffer is processed, **Then** subsequent
   `PitchResult` values immediately use the new display mode.

---

### User Story 6 — Tendency Tracking: Which Notes Are Consistently Off (Priority: P2)

After several sessions Thomas notices that his F5 is always sharp. The engine
accumulates per-note cent deviations across a session and over time, surfacing
notes that are consistently high or low. The Progress view and the Dashboard
"Problem Notes" panel consume this data.

**Why this priority**: Tendency tracking is the "Strava for Music" promise —
showing trends, not just the current moment. It is P2 because it depends on
accumulated session data (P0/P1 must exist first) and requires no new audio
processing; it is an aggregation layer on top of already-collected
`PitchResult` records.

**Independent Test**: Can be fully tested by injecting a series of
`PitchResult` records for specific notes with known cent deviations and
asserting that the tendency summary correctly reports mean deviation and
trend direction. No live audio required.

**Acceptance Scenarios**:

1. **Given** 20 `PitchResult` records for note F5 with cent deviations all
   between +12 and +18 cents, **When** tendency is computed for F5,
   **Then** the tendency record reports `mean_deviation ≈ +15 ct` and
   `direction = Sharp`.

2. **Given** F5 tendency was +15 ct in the previous week and is +10 ct
   this week, **When** trends are computed, **Then** the tendency record
   includes a `trend = Improving` flag.

3. **Given** a note has fewer than 5 pitch samples in the current session,
   **When** tendency is queried, **Then** no tendency record is returned for
   that note (insufficient data guard).

4. **Given** tendency data exists for 6 notes, **When** the top problem notes
   are requested, **Then** the response returns the 3 notes with the highest
   absolute mean deviation, sorted descending.

---

### Edge Cases

- **Background noise only**: Engine receives ambient room noise below the
  configurable noise-floor threshold — must emit nothing, not a spurious note.
- **No audio input / microphone disconnected**: CPAL stream fails or returns
  silence — engine must surface an `AudioInputError` state; no crash.
- **Multiple simultaneous harmonics (horn partials)**: Second or third partial
  is louder than the fundamental — profile-aware YIN must identify the
  fundamental, not the partial.
- **Very quiet playing**: Signal RMS is above the noise floor but below
  normal playing level — detection should still work; confidence value will
  be lower and the caller can decide whether to display or suppress the result.
- **Breath noise between notes**: Turbulent breath attack at the start of a
  note — engine should not emit a pitch for the breath transient (onset
  settling time / confidence threshold applies).
- **Pitch bending / glissando**: Frequency sweeps continuously across multiple
  semitones — engine emits a `PitchResult` for each processing window with
  the instantaneous detected pitch; no attempt to snap to the nearest
  semitone during a continuous glide.
- **Rapid note changes (tongued passages)**: Notes shorter than one processing
  window — engine may miss them or report partial results; this is acceptable
  for Phase 1 (Long Tone and Tone Lab use sustained tones).
- **Reference tuning at extreme values (430 Hz, 450 Hz)**: All cent
  calculations must remain accurate at both extremes without overflow.
- **Instrument profile not set**: Engine has no active profile — must fall
  back to a sane default range (e.g., C2–C7) rather than erroring.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The engine MUST detect pitch in real time from raw PCM audio
  samples provided by CPAL with end-to-end latency of less than 50 ms.

- **FR-002**: The engine MUST implement the YIN algorithm (or pYIN variant)
  for fundamental frequency estimation.

- **FR-003**: Pitch accuracy MUST be within ±1 cent of the true fundamental
  frequency for sustained tones in the supported frequency range.

- **FR-004**: The engine MUST emit a `PitchResult` containing `frequency_hz`,
  `note_name`, `octave`, `cent_deviation`, `confidence`, and `timestamp_ms`
  for every detected note event.

- **FR-005**: The engine MUST suppress output when the input signal RMS is
  below a configurable noise-floor threshold (default: −40 dBFS).

  Note: This noise-floor check operates at the pitch detection layer as a quality gate. The audio capture layer (spec 002) may implement an additional noise gate (P2) at the raw audio level. Both layers are independent: the audio gate prevents unnecessary processing; the pitch gate prevents false positive note detections.

- **FR-006**: The engine MUST accept an `InstrumentProfile` that specifies
  the frequency range, transposition offset in semitones, and a list of
  typical partial ratios used to weight the pitch detection algorithm.

- **FR-007**: The engine MUST provide `InstrumentProfile` definitions for
  at minimum `HornBb` (written range Bb2–Bb6, concert range Ab2–Ab6,
  transposition +2 semitones) and `HornF` (written range F2–C6, concert
  range Bb1–F5, transposition +7 semitones).

- **FR-008**: The engine MUST accept a configurable reference tuning
  frequency in the range 430–450 Hz (default 442 Hz) and use it for all
  cent-deviation calculations.

- **FR-009**: The engine MUST calculate cent deviation as
  `1200 * log2(detected_hz / reference_hz_for_nearest_note)` where the
  reference note frequency is derived from the configured tuning reference.

- **FR-010**: The engine MUST apply the active instrument profile's
  transposition offset when computing `note_name` and `octave` for
  `Notated` display mode; it MUST return concert-pitch names when
  `Concert` display mode is active.

- **FR-011**: The engine MUST compute `StabilityMeasurement` on demand
  (or per held-note event) containing `mean_frequency`, `std_deviation`,
  and `duration_ms` for any window of at least 500 ms of continuous
  note-on audio.

- **FR-012**: The stability computation MUST use population standard
  deviation of the `frequency_hz` values in the window.

- **FR-013**: The engine MUST not emit a `StabilityMeasurement` for windows
  shorter than 500 ms.

- **FR-014**: The engine MUST accumulate per-note cent-deviation samples and
  expose a tendency query that returns `mean_deviation` and `sample_count`
  per note name for the current session.

- **FR-015**: The tendency query MUST require a minimum of 5 samples per
  note before including that note in the result.

- **FR-016**: All engine logic MUST be implemented in Rust and exposed to
  the Tauri frontend via Tauri commands (IPC). No pitch detection logic
  may live in the frontend JavaScript layer.

- **FR-017**: The engine MUST handle CPAL stream errors gracefully, emitting
  an `AudioInputError` event over IPC rather than panicking.

### Key Entities

- **PitchResult**: Represents a single pitch detection event for one
  processing window. Attributes: `frequency_hz` (f64), `note_name` (String),
  `octave` (i8), `cent_deviation` (f64, negative = flat, positive = sharp),
  `confidence` (f64, 0.0–1.0), `timestamp_ms` (u64). Relates to the active
  `InstrumentProfile` for transposition and to the reference tuning for cent
  calculation.

- **InstrumentProfile**: Describes an instrument's physical and musical
  characteristics for pitch detection purposes. Attributes: `name` (String),
  `transposition_semitones` (i8, 0 for concert-pitch instruments),
  `frequency_range` (min_hz: f64, max_hz: f64), `typical_partials` (Vec<f64>,
  ratios relative to fundamental, e.g. `[1.0, 2.0, 3.0]`). No direct
  persistent storage — loaded from compiled profile definitions at startup.

- **StabilityMeasurement**: A summary of pitch stability over a sustained
  note. Attributes: `mean_frequency` (f64), `std_deviation` (f64),
  `duration_ms` (u64), `note_name` (String), `octave` (i8). Emitted once
  per completed held-note event; stored as part of the session's
  `notes_played` record.

- **NoteTendency**: Aggregated intonation tendency for a single note name
  within a scope (session or all-time). Attributes: `note_name` (String),
  `octave` (i8), `mean_deviation` (f64), `sample_count` (u32),
  `direction` (Sharp | Flat | InTune). Derived from accumulated
  `PitchResult` records; not stored independently — computed on query.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: End-to-end latency — time from audio sample capture to
  `PitchResult` available on the IPC channel — is less than 50 ms on the
  reference hardware (modern laptop, macOS/Windows/Linux) for 95% of
  processing windows.

- **SC-002**: Pitch accuracy for sustained sine-wave test tones across the
  full French Horn range (F2–F6 concert) is within ±1 cent of the true
  fundamental for 99% of frames with confidence ≥ 0.9.

- **SC-003**: Harmonic rejection — given a synthesized horn-like tone with
  second harmonic 6 dB louder than the fundamental, the engine returns the
  correct fundamental for 95% of frames.

- **SC-004**: False-positive rate in silence — given an audio stream of
  room-noise-only (no intentional playing), the engine emits fewer than
  1 `PitchResult` per 10 seconds.

- **SC-005**: Stability measurement accuracy — `std_deviation` reported for
  a computer-generated frequency-modulated tone matches the known modulation
  depth within ±0.5 Hz.

- **SC-006**: Transposition correctness — for all defined instrument profiles,
  100% of note-name and octave labels in both `Notated` and `Concert` display
  modes are correct against a reference table of 40 test notes spanning the
  full playable range.

- **SC-007**: Reference tuning coverage — cent deviations computed with
  reference frequencies of 430 Hz, 440 Hz, 442 Hz, and 450 Hz all pass a
  tolerance of ±0.1 cent against analytically computed expected values.

- **SC-008**: No crashes or panics during a 30-minute continuous audio stream
  on all three target platforms (macOS, Windows, Linux via Tauri).
