# Tasks: Audio Capture & Pitch Detection Engine

## Status: proposed

## Tasks

### 1. Add dependencies to Cargo.toml
- [x] Add cpal and ringbuf to Cargo.toml
- [x] Verify compilation with cargo check

### 2. Implement types module (audio/types.rs)
- [x] Define PitchResult struct
- [x] Define AudioLevel struct
- [x] Define OnsetEvent struct
- [x] Define AudioError enum
- [x] Define AudioDeviceInfo struct
- [x] Define StabilityMeasurement struct

### 3. Implement instrument profiles (audio/instrument.rs)
- [x] Define InstrumentProfile struct
- [x] Implement HornBb profile
- [x] Implement HornF profile
- [x] Implement Default profile (no instrument)
- [x] Note mapping with 12-TET equal temperament

### 4. Implement audio capture (audio/capture.rs)
- [x] CPAL device enumeration
- [x] Mono input stream at 44100/48000 Hz
- [x] Ring buffer for lock-free audio thread communication
- [ ] Error handling for permission denied, no device, disconnect

### 5. Implement pitch detection (audio/pitch.rs)
- [x] YIN algorithm core (autocorrelation, cumulative mean normalized difference)
- [x] Frequency to note name + octave mapping
- [x] Cent deviation calculation with configurable reference
- [x] Instrument profile frequency range filtering
- [x] Confidence threshold gating

### 6. Implement level monitoring (audio/level.rs)
- [x] RMS calculation per buffer
- [x] Peak detection
- [x] Clipping flag

### 7. Implement onset detection (audio/onset.rs)
- [x] Energy-based onset detection
- [x] Debounce with minimum inter-onset interval
- [x] Timestamp calculation from sample position

### 8. Implement stability measurement (audio/stability.rs)
- [x] Rolling frequency buffer
- [x] Standard deviation computation
- [x] Minimum duration threshold (500ms)

### 9. Implement AudioEngine (audio/mod.rs)
- [x] AudioEngine struct managing all components
- [x] Start/stop lifecycle
- [x] Processing loop reading from ring buffer
- [x] State management for latest results

### 10. Wire Tauri commands (lib.rs)
- [x] start_audio command
- [x] stop_audio command
- [x] get_devices command
- [ ] select_device command
- [x] get_pitch command
- [x] get_audio_level command
- [x] set_reference_tuning command
- [x] set_instrument_profile command
- [x] Register commands in Tauri builder

### 11. Verification
- [x] cargo check passes
- [ ] cargo tauri dev launches without audio errors
- [ ] Microphone permission requested on first launch
- [ ] Audio level responds to sound input
- [x] Pitch detection returns correct notes for known tones
