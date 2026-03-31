# Proposal: Audio Capture & Pitch Detection Engine

## Why

The app shell is live but has zero audio capability. Every feature in ToneTrainer -- tuner feedback, Long Tones, Scale exercises, Tone Lab, rhythm -- depends on a working audio pipeline. Without microphone capture and pitch detection, the app is an empty shell.

## What

Implement the full Rust-side audio engine covering specs 002 (Audio Capture) and 001 (Pitch Detection):

1. **Audio Capture** (CPAL): Mono input stream at 44100/48000 Hz, microphone permission handling, device enumeration, RMS/peak level monitoring, energy-based onset detection.

2. **Pitch Detection** (YIN): Real-time fundamental frequency estimation, note name/octave mapping, cent deviation from configurable reference (430-450 Hz), instrument profile support (HornBb, HornF), stability measurement for long tones.

3. **Tauri IPC Bridge**: Expose audio commands to the SvelteKit frontend -- start/stop capture, get pitch results, list devices, select device, audio level events.

Scope: P0 requirements from both specs. P1 (device selection persistence, reference tuning config) included where trivial. P2 (noise gate, tendency tracking) deferred.

## Impact

- Enables all subsequent exercise implementations (007-Long Tones, 008-Scales, 009-ToneLab, 010-Rhythm)
- Enables onboarding "first tone" verification (004)
- No breaking changes to existing shell code
- Adds CPAL dependency to Cargo.toml
