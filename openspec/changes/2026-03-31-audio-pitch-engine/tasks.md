# Tasks: Audio Capture & Pitch Detection Engine

## Status: proposed

## Tasks

### 1. Add dependencies to Cargo.toml
- [ ] Add cpal and ringbuf to Cargo.toml
- [ ] Verify compilation with cargo check

### 2. Implement types module (audio/types.rs)
- [ ] Define PitchResult struct
- [ ] Define AudioLevel struct
- [ ] Define OnsetEvent struct
- [ ] Define AudioError enum
- [ ] Define AudioDeviceInfo struct
- [ ] Define StabilityMeasurement struct

### 3. Implement instrument profiles (audio/instrument.rs)
- [ ] Define InstrumentProfile struct
- [ ] Implement HornBb profile
- [ ] Implement HornF profile
- [ ] Implement Default profile (no instrument)
- [ ] Note mapping with 12-TET equal temperament

### 4. Implement audio capture (audio/capture.rs)
- [ ] CPAL device enumeration
- [ ] Mono input stream at 44100/48000 Hz
- [ ] Ring buffer for lock-free audio thread communication
- [ ] Error handling for permission denied, no device, disconnect

### 5. Implement pitch detection (audio/pitch.rs)
- [ ] YIN algorithm core (autocorrelation, cumulative mean normalized difference)
- [ ] Frequency to note name + octave mapping
- [ ] Cent deviation calculation with configurable reference
- [ ] Instrument profile frequency range filtering
- [ ] Confidence threshold gating

### 6. Implement level monitoring (audio/level.rs)
- [ ] RMS calculation per buffer
- [ ] Peak detection
- [ ] Clipping flag

### 7. Implement onset detection (audio/onset.rs)
- [ ] Energy-based onset detection
- [ ] Debounce with minimum inter-onset interval
- [ ] Timestamp calculation from sample position

### 8. Implement stability measurement (audio/stability.rs)
- [ ] Rolling frequency buffer
- [ ] Standard deviation computation
- [ ] Minimum duration threshold (500ms)

### 9. Implement AudioEngine (audio/mod.rs)
- [ ] AudioEngine struct managing all components
- [ ] Start/stop lifecycle
- [ ] Processing loop reading from ring buffer
- [ ] State management for latest results

### 10. Wire Tauri commands (lib.rs)
- [ ] start_audio command
- [ ] stop_audio command
- [ ] get_devices command
- [ ] select_device command
- [ ] get_pitch command
- [ ] get_audio_level command
- [ ] set_reference_tuning command
- [ ] set_instrument_profile command
- [ ] Register commands in Tauri builder

### 11. Verification
- [ ] cargo check passes
- [ ] cargo tauri dev launches without audio errors
- [ ] Microphone permission requested on first launch
- [ ] Audio level responds to sound input
- [ ] Pitch detection returns correct notes for known tones
