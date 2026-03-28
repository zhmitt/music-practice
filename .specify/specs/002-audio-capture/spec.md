# Feature Specification: Audio Capture & Onset Detection

**Feature Branch**: `002-audio-capture`
**Created**: 2026-03-28
**Status**: Draft
**Input**: User description: "Microphone access, audio stream management, and onset detection (detecting when a new note begins). Runs in Rust via CPAL."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Capture Audio from Default Microphone (Priority: P0)

A user opens ToneTrainer for the first time. The app requests microphone permission, the user grants it, and audio capture begins immediately from the default microphone. The app streams audio at the configured sample rate and confirms to the UI that the microphone is active and receiving input. From this point forward every feature in the app that depends on audio — pitch detection, onset detection, level monitoring — has a live audio feed to work with.

**Why this priority**: Every single feature in the application depends on audio input. Without a working audio capture pipeline, nothing else can function. This is the lowest-level foundation the entire app builds on.

**Independent Test**: Can be tested by launching the app, granting microphone permission, and confirming that the audio level indicator shows a live RMS value that changes when the user makes noise. The system has clear value on its own: the user knows their microphone is working.

**Acceptance Scenarios**:

1. **Given** the app is launched for the first time with no saved microphone permission, **When** the app initializes the audio subsystem, **Then** the OS microphone permission dialog is shown to the user before any audio capture begins.
2. **Given** the user has granted microphone permission, **When** audio capture starts, **Then** CPAL opens a mono input stream at 44100 Hz or 48000 Hz (whichever the device supports) and audio samples begin flowing to the processing pipeline within 500ms.
3. **Given** audio capture is active, **When** the user makes a sound, **Then** the raw audio buffer contains non-zero sample data and the audio level indicator in the UI reflects the change within 50ms.
4. **Given** audio capture is active, **When** no permission dialog has been shown (permission was previously granted), **Then** audio capture starts automatically on app launch without any user interaction.

---

### User Story 2 - Detect Note Onsets (Priority: P0)

A user is playing their horn or clapping/tapping during a rhythm exercise. The app must reliably detect the exact moment a new note or clap begins so that it can score timing accuracy, segment notes for pitch analysis, and drive rhythm feedback. The onset detector reports each detected onset with a timestamp accurate to within 10ms.

**Why this priority**: Onset detection is required for rhythm exercises (Phase 2 core feature) and for note segmentation in pitch analysis. Without it, the app cannot tell when the user starts playing a note and rhythm scoring is impossible. This is a foundational signal that the entire exercise feedback loop depends on.

**Independent Test**: Can be tested standalone using a test harness that feeds pre-recorded audio of a horn playing a sequence of notes or hand claps at known timestamps, then verifies that detected onset timestamps are within 10ms of the ground truth. Delivers clear value: the system correctly identifies note beginnings.

**Acceptance Scenarios**:

1. **Given** the onset detector receives audio of a horn note starting abruptly, **When** the energy-based detector runs, **Then** an OnsetEvent is emitted with `onset_type: Energy` and a timestamp within 10ms of the actual note start.
2. **Given** the onset detector receives audio of a horn note that begins softly (no sharp energy spike), **When** the spectral flux detector runs, **Then** an OnsetEvent is emitted with `onset_type: SpectralFlux` and a timestamp within 10ms of the actual note start.
3. **Given** the onset detector receives audio of a single hand clap, **When** either detector runs, **Then** an OnsetEvent is emitted. The app must work for rhythm exercises that use clapping as input, not just horn playing.
4. **Given** sustained audio with no new note starts (e.g., a long held tone), **When** the onset detector runs continuously, **Then** no spurious OnsetEvents are emitted during the sustained portion.
5. **Given** two notes played in rapid succession (e.g., 200ms apart), **When** the onset detector runs, **Then** two distinct OnsetEvents are emitted, each with the correct timestamp, and no onset is missed.

---

### User Story 3 - Microphone Permission Error Handling (Priority: P0)

A user has previously denied microphone permission, or denies it when asked during onboarding. The app must detect this state clearly, show an actionable error message explaining what happened and how to fix it, and not crash or get stuck in a broken state. If the user fixes the permission in OS settings and returns to the app, the app should recover gracefully.

**Why this priority**: If the app silently fails when microphone access is denied, the user has no feedback and the experience is broken. Clear error handling here is required for the onboarding flow (product spec section 4e) to work correctly.

**Independent Test**: Can be tested by denying microphone permission at the OS level and launching the app. The app should show a clear error state that explains microphone permission is required and how to enable it. No crash, no spinner that never resolves.

**Acceptance Scenarios**:

1. **Given** the user denies the microphone permission request, **When** the audio subsystem attempts to open a stream, **Then** capture does not start and the UI receives a `MicrophonePermissionDenied` error event within 1 second.
2. **Given** a `MicrophonePermissionDenied` error has been emitted, **When** the UI receives it, **Then** the onboarding or settings screen displays a message explaining that microphone access was denied, with instructions to open OS system settings to grant the permission.
3. **Given** the user has denied permission, fixed it in OS settings, and returns to the app, **When** the user retries microphone setup (e.g., via Settings > Audio > Test), **Then** audio capture starts successfully without requiring an app restart.
4. **Given** no microphone hardware is connected to the device, **When** audio capture initialization runs, **Then** the UI receives a `NoMicrophoneAvailable` error distinct from a permission error, with appropriate messaging.

---

### User Story 4 - Microphone Device Selection (Priority: P1)

A user has multiple audio input devices (e.g., a built-in microphone and a USB or Bluetooth microphone). They want to choose which device ToneTrainer uses. The settings screen shows a list of available input devices. The user selects one, and subsequent audio capture uses that device. The selection is persisted across app restarts.

**Why this priority**: Most desktop users will have multiple audio inputs. Without device selection, the app may default to a low-quality built-in microphone when a better external one is available. This is a usability requirement listed explicitly in the product spec (Settings > Audio: "Mikrofon-Auswahl + Test").

**Independent Test**: Can be tested by connecting two microphones and verifying the settings screen lists both, selecting the non-default one, restarting the app, and confirming audio capture uses the previously selected device.

**Acceptance Scenarios**:

1. **Given** the system has multiple audio input devices, **When** the settings screen is opened, **Then** a list of all available input device names is displayed, with the currently active device clearly indicated.
2. **Given** the user selects a different audio input device in settings, **When** the selection is confirmed, **Then** the audio stream restarts on the newly selected device within 1 second, without requiring an app restart.
3. **Given** a previously selected device is no longer available (e.g., USB mic unplugged) when the app starts, **When** audio capture initializes, **Then** the app falls back to the system default device and emits a notification that the saved device was not found.
4. **Given** the user selects a device and closes settings, **When** the app is restarted, **Then** audio capture initializes on the previously selected device, not the system default.

---

### User Story 5 - Audio Level Indicator (Priority: P1)

A user is setting up or in a practice session. They need to know whether their microphone input is appropriate: too quiet (microphone too far away, or muted) or too loud (clipping, microphone too close). The UI shows a live level meter that indicates the current RMS level and marks the "too quiet" and "too loud" zones, so the user can adjust their position or volume before or during practice.

**Why this priority**: If input level is miscalibrated, pitch and onset detection will perform poorly. The user needs feedback on audio input quality. This is directly listed in the product spec under P1 requirements.

**Independent Test**: Can be tested by observing the level indicator while making no sound (should show "too quiet"), speaking at normal volume (should show "good"), and making a loud noise very close to the microphone (should show "too loud" or clipping). Delivers immediate user value by guiding microphone placement.

**Acceptance Scenarios**:

1. **Given** audio capture is active and the input signal is below the noise gate threshold, **When** the level monitor runs, **Then** the UI receives an `AudioLevel` event with an RMS value below the "too quiet" threshold and a corresponding `LevelStatus::TooQuiet` state.
2. **Given** audio capture is active and the user plays at a normal volume, **When** the level monitor runs, **Then** the UI receives an `AudioLevel` event with `LevelStatus::Good`.
3. **Given** the input signal exceeds the clipping threshold, **When** the level monitor runs, **Then** `AudioLevel.is_clipping` is set to `true` and the UI can display a visual clipping warning.
4. **Given** audio capture is active, **When** the level changes, **Then** the UI receives updated `AudioLevel` events at a rate sufficient for smooth meter animation (at minimum 10 updates per second).

---

### User Story 6 - Microphone Test Mode (Priority: P1)

A user in Settings wants to verify that their microphone setup is working correctly before starting a session. They tap "Test Microphone". The app enters a test mode where it listens for a few seconds and confirms whether it detected a valid audio signal and at least one onset event, giving the user confidence the system is ready.

**Why this priority**: This is explicitly listed in the product spec (Settings > Audio: "Mikrofon-Auswahl + Test") and is important for the onboarding Aha moment (spec section 4e: "Spiel einen beliebigen Ton → sofort Feedback → 'Perfekt, alles funktioniert!'"). Without a test mode, users have no way to validate setup outside of starting a full session.

**Independent Test**: Can be tested by entering the test mode in settings, playing a single note into the microphone, and verifying that the test result shows "Microphone detected — onset found" with a displayed energy level.

**Acceptance Scenarios**:

1. **Given** the user activates microphone test mode, **When** test mode starts, **Then** audio capture is active and the level indicator is visible, prompting the user to play a tone.
2. **Given** test mode is active and the user plays a single note, **When** an onset is detected, **Then** the test UI shows a success state with the detected level and onset count.
3. **Given** test mode is active and the user plays nothing for 5 seconds, **When** the timeout elapses, **Then** the test UI shows a warning that no sound was detected, with suggestions to check microphone connection and OS input settings.
4. **Given** test mode is active, **When** the user taps "Stop Test" or navigates away, **Then** test mode exits cleanly and audio capture state returns to its previous configuration.

---

### User Story 7 - Noise Gate (Priority: P2)

A user practices in a noisy environment (air conditioning, street noise, background conversation). The noise gate suppresses audio events below a configurable threshold so that background noise does not generate false onset detections or corrupt pitch analysis. The threshold is configurable in settings.

**Why this priority**: This is a P2 nice-to-have that improves reliability in non-ideal acoustic environments. It is not required for the MVP but will meaningfully improve the experience for users who cannot practice in silence.

**Independent Test**: Can be tested by setting the noise gate threshold above the ambient noise level in a noisy room and verifying that no onset events are generated from background noise alone, while a horn note above the threshold still produces a correct onset.

**Acceptance Scenarios**:

1. **Given** a noise gate threshold is configured (e.g., -40 dBFS), **When** audio input is consistently below that threshold, **Then** no OnsetEvents are emitted and the signal is treated as silence for processing purposes.
2. **Given** a noise gate is active, **When** audio input crosses above the threshold, **Then** onset detection resumes immediately and events are emitted as normal.
3. **Given** the noise gate threshold is set to zero (disabled), **When** audio arrives, **Then** all audio is passed through to detectors unchanged — the noise gate is a no-op.
4. **Given** the user adjusts the noise gate threshold in settings, **When** the new value is saved, **Then** the running audio pipeline applies the updated threshold without requiring an app restart.

---

### Edge Cases

- What happens when no microphone is available on the device? The audio subsystem must return a `NoMicrophoneAvailable` error, not a generic panic or hang. The UI must surface this error clearly.
- How does the system handle permission denied? A `MicrophonePermissionDenied` error is returned immediately; capture is not attempted. The error is surfaced to the user with OS-specific instructions for granting access.
- What happens when the microphone is disconnected mid-session? The audio stream emits a `StreamInterrupted` or `DeviceDisconnected` error. The UI pauses the current exercise and shows a reconnection prompt. The session is not lost.
- How does the system handle very high background noise that obscures the signal? Without a configured noise gate, onset detection may fire false positives. The system provides a noise gate (P2) and audio level indicator (P1) to allow the user to diagnose and address this.
- What happens when the user switches audio devices while a session is active? The audio stream is torn down and restarted on the new device. There may be a brief gap in audio (< 2 seconds). The current session resumes after the new stream is established.
- How does the system handle Bluetooth microphone latency? Bluetooth audio devices may introduce 100–200ms of latency. The onset timestamps are based on the audio sample timestamps from CPAL, which reflect when the audio was captured, not when it was delivered to the app. Users should be warned in settings that Bluetooth devices may have higher latency, which can affect rhythm scoring accuracy.
- What happens when the sample rate requested (44100 Hz or 48000 Hz) is not supported by the selected device? The audio subsystem should try both rates and select the one the device supports. If neither is supported, a `UnsupportedSampleRate` error is returned and the user is notified.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST request microphone permission via the Tauri permission API before any audio capture begins. It MUST NOT access the microphone without an explicit permission grant.
- **FR-002**: The system MUST open a mono (single-channel) CPAL input stream at 44100 Hz or 48000 Hz, selecting the rate supported by the active device.
- **FR-003**: The system MUST buffer incoming audio samples for real-time downstream processing (pitch detection, onset detection, level monitoring) with a buffer size appropriate for low-latency operation.
- **FR-004**: The system MUST implement energy-based onset detection that fires an `OnsetEvent` when the signal energy crosses a rising threshold, indicating a new note or transient has begun.
- **FR-005**: The system MUST implement spectral flux onset detection that fires an `OnsetEvent` when spectral content changes significantly between consecutive analysis frames.
- **FR-006**: OnsetEvent timestamps MUST be accurate to within 10ms, derived from CPAL sample-accurate timestamps rather than wall-clock time.
- **FR-007**: Both onset detection methods MUST work correctly for horn tones AND for percussive transients such as hand claps and table taps (for rhythm exercises).
- **FR-008**: The system MUST enumerate available audio input devices and expose the list to the UI layer via a Tauri command.
- **FR-009**: The system MUST allow the user to select a specific audio input device. The selection MUST be persisted in app settings and applied on subsequent app launches.
- **FR-010**: The system MUST continuously compute and emit `AudioLevel` events containing RMS, peak, and a clipping flag, at a rate sufficient for smooth UI metering (minimum 10 Hz).
- **FR-011**: The system MUST provide a microphone test mode that listens for a configurable duration (default 5 seconds) and reports whether audio and at least one onset were detected.
- **FR-012**: The system MUST handle the case where the previously selected device is unavailable at startup by falling back to the system default device and emitting a notification event.
- **FR-013**: The system MUST expose a noise gate mechanism (P2) that suppresses processing of audio samples below a configurable RMS threshold. When the threshold is set to zero or disabled, the noise gate MUST be a no-op.
- **FR-014**: The system MUST emit a recoverable error event (not a panic) when the audio stream is interrupted mid-session (device disconnect, OS stream termination), providing the UI with enough information to prompt the user for recovery.
- **FR-015**: The system MUST support stream restart on device change without requiring an app restart. The restart MUST complete within 2 seconds.

### Key Entities

- **AudioStream**: Represents an active CPAL input stream. Attributes: `sample_rate` (u32, e.g., 44100 or 48000), `channels` (u8, always 1 for mono), `buffer_size` (usize, number of samples per callback), `device_name` (String, name of the active input device).
- **OnsetEvent**: Represents a detected note or transient onset. Attributes: `timestamp_ms` (u64, sample-accurate milliseconds since stream start), `energy` (f32, signal energy at onset time in normalized dBFS), `onset_type` (enum: `Energy` | `SpectralFlux`).
- **AudioLevel**: Represents current input signal level for UI metering. Attributes: `rms` (f32, root mean square of recent samples, normalized 0.0–1.0), `peak` (f32, peak absolute sample value in the current buffer, normalized 0.0–1.0), `is_clipping` (bool, true when peak exceeds 0.99).
- **AudioError**: Represents a recoverable audio subsystem error. Variants: `MicrophonePermissionDenied`, `NoMicrophoneAvailable`, `UnsupportedSampleRate`, `DeviceDisconnected { device_name: String }`, `StreamInterrupted`.
- **AudioDeviceInfo**: Represents one enumerated input device. Attributes: `device_id` (String, stable device identifier), `display_name` (String, human-readable name), `is_default` (bool), `supported_sample_rates` (Vec\<u32\>).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Onset detection latency is below 10ms as measured against a ground-truth test corpus of 50 horn note onsets and 50 clap onsets, with at least 95% of events within the tolerance window.
- **SC-002**: False onset rate on sustained audio (no new notes) is below 1 false positive per 60 seconds at typical practice room noise levels.
- **SC-003**: Audio stream initializes and the first `AudioLevel` event is delivered to the UI within 500ms of permission grant.
- **SC-004**: Microphone device switching completes and the new stream is active within 2 seconds of the user confirming the selection in settings.
- **SC-005**: The audio pipeline operates at the required sample rates (44100 Hz or 48000 Hz) with no xrun errors (buffer underruns/overruns) during a 30-minute continuous capture session on reference hardware.
- **SC-006**: All audio error conditions (permission denied, no device, device disconnect, unsupported sample rate) are surfaced to the UI as typed error events — none result in a panic or an unresponsive application state.
- **SC-007**: The noise gate (P2), when enabled at -40 dBFS, reduces false onset rate in a noisy environment test by at least 80% compared to the disabled state.
- **SC-008**: 100% of audio capture and onset detection logic runs in Rust via CPAL. No audio processing occurs in JavaScript/TypeScript or the Tauri frontend.
