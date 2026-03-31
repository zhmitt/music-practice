# Design: Audio Capture & Pitch Detection Engine

## Architecture

```
┌─────────────────────────────────────────────────┐
│ SvelteKit Frontend                              │
│  Tauri IPC Commands / Events                    │
├─────────────────────────────────────────────────┤
│ Tauri Command Layer (lib.rs)                    │
│  start_audio, stop_audio, get_devices,          │
│  get_pitch, get_audio_level                     │
├─────────────────────────────────────────────────┤
│ Audio Engine (audio/)                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ Capture  │→ │ Pitch    │→ │ Stability    │  │
│  │ (CPAL)   │  │ (YIN)    │  │ Measurement  │  │
│  │          │→ │ Onset    │  └──────────────┘  │
│  │          │→ │ Level    │                     │
│  └──────────┘  └──────────┘                     │
└─────────────────────────────────────────────────┘
```

## Module Structure

```
src-tauri/src/
  main.rs                  -- entry point
  lib.rs                   -- Tauri commands + plugin registration
  audio/
    mod.rs                 -- public API, AudioEngine struct
    capture.rs             -- CPAL stream setup, device enumeration
    pitch.rs               -- YIN algorithm, note mapping, cent calculation
    onset.rs               -- Energy-based onset detection
    level.rs               -- RMS/peak level monitoring
    types.rs               -- PitchResult, AudioLevel, OnsetEvent, etc.
    instrument.rs          -- InstrumentProfile definitions (HornBb, HornF)
    stability.rs           -- StabilityMeasurement computation
```

## Key Design Decisions

### Audio Thread Model
- CPAL callback runs on a dedicated audio thread (OS-managed)
- Callback writes samples into a lock-free ring buffer (crossbeam or triple buffer)
- Processing thread reads from ring buffer, runs YIN + onset + level
- Results stored in Arc<Mutex<>> state, polled by Tauri commands
- No audio processing on the main/UI thread

### YIN Algorithm Parameters
- Window size: 2048 samples at 44100 Hz (~46ms, covers lowest horn note F2 ~87 Hz)
- Hop size: 1024 samples (~23ms) for overlapping analysis
- Threshold: 0.15 (standard YIN confidence threshold)
- Frequency range filtered by active InstrumentProfile

### Instrument Profiles
- HornBb: transposition +2 semitones, range 87-1397 Hz (F2-F6 concert)
- HornF: transposition +7 semitones, range 58-1397 Hz (Bb1-F6 concert)
- Default (no instrument): range 65-2093 Hz (C2-C7)

### Reference Tuning
- Default: 442 Hz
- Range: 430-450 Hz
- Stored in SQLite user_settings
- Cent deviation: 1200 * log2(detected_hz / nearest_reference_hz)

### Note Mapping
- 12-TET equal temperament
- Note names: C, C#, D, Eb, E, F, F#, G, Ab, A, Bb, B
- German naming convention for flats (Eb not D#, Bb not A#) matching horn tradition

### Level Monitoring
- RMS computed per buffer (1024 samples)
- Peak = max absolute sample in buffer
- Clipping flag when peak > 0.99
- Emitted at ~43 Hz (every hop)

### Onset Detection (P0 scope)
- Energy-based: compare RMS of current frame to previous, threshold crossing
- Spectral flux: deferred to later change (P1)
- Minimum inter-onset interval: 100ms (debounce)

## Dependencies

```toml
cpal = "0.15"          # Cross-platform audio
ringbuf = "0.4"        # Lock-free ring buffer for audio thread
```

## Tauri Commands

| Command | Direction | Description |
|---|---|---|
| `start_audio` | Frontend → Rust | Start CPAL capture stream |
| `stop_audio` | Frontend → Rust | Stop capture |
| `get_devices` | Frontend → Rust | List available input devices |
| `select_device` | Frontend → Rust | Switch to specific device |
| `get_pitch` | Frontend → Rust | Poll latest PitchResult |
| `get_audio_level` | Frontend → Rust | Poll latest AudioLevel |
| `set_reference_tuning` | Frontend → Rust | Set A4 reference Hz |
| `set_instrument_profile` | Frontend → Rust | Switch instrument |

Events (Rust → Frontend via Tauri event system) may be added later for push-based updates. For Phase 1, polling from requestAnimationFrame is sufficient and simpler.
