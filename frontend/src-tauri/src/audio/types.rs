use serde::{Deserialize, Serialize};

/// Result of a single pitch detection frame.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PitchResult {
    /// Detected fundamental frequency in Hz.
    pub frequency_hz: f64,
    /// Note name (e.g. "Bb", "C#", "F").
    pub note_name: String,
    /// Octave number (scientific pitch notation).
    pub octave: i8,
    /// Cents deviation from nearest note in current tuning. Negative = flat, positive = sharp.
    pub cent_deviation: f64,
    /// Confidence of detection (0.0 to 1.0). Higher = more certain.
    pub confidence: f64,
    /// Timestamp in milliseconds since audio stream start.
    pub timestamp_ms: u64,
}

/// Live snapshot of the audio pipeline for in-app debugging.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioDebugSnapshot {
    /// Whether the CPAL input stream is currently active.
    pub is_running: bool,
    /// Active input sample rate.
    pub sample_rate: u32,
    /// Currently active input device name, if known.
    pub active_device_name: Option<String>,
    /// Last typed capture lifecycle failure, if any.
    pub runtime_error: Option<AudioRuntimeError>,
    /// Current detector state (`idle`, `buffering`, `no_signal`, `low_confidence`, etc.).
    pub detector_status: String,
    /// Latest meter snapshot.
    pub audio_level: AudioLevel,
    /// Buffered sample count available for the rolling pitch analysis.
    pub analysis_buffer_len: usize,
    /// Window size used for pitch analysis.
    pub window_size: usize,
    /// Raw frequency estimate before confidence / range filtering.
    pub raw_frequency_hz: Option<f64>,
    /// Raw confidence estimate before final filtering.
    pub raw_confidence: Option<f64>,
    /// Tentative pitch mapping for the raw estimate, even when final detection fails.
    pub tentative_pitch: Option<PitchResult>,
    /// Final filtered pitch result, if any.
    pub latest_pitch: Option<PitchResult>,
    /// Current reference tuning for A4 in Hz.
    pub reference_a4: f64,
    /// Current instrument profile name.
    pub instrument_name: String,
    /// Current display mode (`notated` or `concert`).
    pub display_mode: String,
}

/// Current audio input level for UI metering.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioLevel {
    /// Root mean square of recent samples, normalized 0.0–1.0.
    pub rms: f32,
    /// Peak absolute sample value in the current buffer, normalized 0.0–1.0.
    pub peak: f32,
    /// True when peak exceeds 0.99 (clipping).
    pub is_clipping: bool,
}

impl Default for AudioLevel {
    fn default() -> Self {
        Self {
            rms: 0.0,
            peak: 0.0,
            is_clipping: false,
        }
    }
}

impl Default for AudioDebugSnapshot {
    fn default() -> Self {
        Self {
            is_running: false,
            sample_rate: 0,
            active_device_name: None,
            runtime_error: None,
            detector_status: "idle".to_string(),
            audio_level: AudioLevel::default(),
            analysis_buffer_len: 0,
            window_size: 0,
            raw_frequency_hz: None,
            raw_confidence: None,
            tentative_pitch: None,
            latest_pitch: None,
            reference_a4: 442.0,
            instrument_name: "Horn in Bb".to_string(),
            display_mode: "notated".to_string(),
        }
    }
}

/// A detected note or transient onset event.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OnsetEvent {
    /// Timestamp in milliseconds since stream start.
    pub timestamp_ms: u64,
    /// Signal energy at onset time (normalized dBFS).
    pub energy: f32,
    /// Type of detection that triggered this onset.
    pub onset_type: OnsetType,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum OnsetType {
    Energy,
    SpectralFlux,
}

/// Recoverable audio subsystem error.
#[allow(dead_code)]
#[derive(Debug, Clone)]
pub enum AudioError {
    MicrophonePermissionDenied,
    NoMicrophoneAvailable,
    NoAudioOutputAvailable,
    UnsupportedSampleRate,
    DeviceDisconnected { device_name: String },
    StreamInterrupted,
    AudioSubsystemUnavailable,
    Unknown(String),
}

impl std::fmt::Display for AudioError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::MicrophonePermissionDenied => write!(f, "Microphone permission denied"),
            Self::NoMicrophoneAvailable => write!(f, "No microphone available"),
            Self::NoAudioOutputAvailable => write!(f, "No audio output available"),
            Self::UnsupportedSampleRate => write!(f, "Unsupported sample rate"),
            Self::DeviceDisconnected { device_name } => {
                write!(f, "Device disconnected: {}", device_name)
            }
            Self::StreamInterrupted => write!(f, "Audio stream interrupted"),
            Self::AudioSubsystemUnavailable => write!(f, "Audio subsystem unavailable"),
            Self::Unknown(msg) => write!(f, "Audio error: {}", msg),
        }
    }
}

impl std::error::Error for AudioError {}

/// Stable IPC representation for runtime failures.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct AudioRuntimeError {
    pub kind: String,
    pub message: String,
    pub device_name: Option<String>,
}

impl From<&AudioError> for AudioRuntimeError {
    fn from(error: &AudioError) -> Self {
        let (kind, device_name) = match error {
            AudioError::MicrophonePermissionDenied => ("microphone_permission_denied", None),
            AudioError::NoMicrophoneAvailable => ("no_microphone_available", None),
            AudioError::NoAudioOutputAvailable => ("no_audio_output_available", None),
            AudioError::UnsupportedSampleRate => ("unsupported_sample_rate", None),
            AudioError::DeviceDisconnected { device_name } => {
                ("device_disconnected", Some(device_name.clone()))
            }
            AudioError::StreamInterrupted => ("stream_interrupted", None),
            AudioError::AudioSubsystemUnavailable => ("audio_subsystem_unavailable", None),
            AudioError::Unknown(_) => ("unknown", None),
        };
        Self {
            kind: kind.to_string(),
            message: error.to_string(),
            device_name,
        }
    }
}

/// Typed lifecycle state for the independently managed drone output.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DroneRuntimeStatus {
    pub is_playing: bool,
    pub runtime_error: Option<AudioRuntimeError>,
}

#[cfg(test)]
mod runtime_status_tests {
    use super::*;

    #[test]
    fn capture_debug_serializes_typed_runtime_error() {
        let snapshot = AudioDebugSnapshot {
            runtime_error: Some(AudioRuntimeError::from(&AudioError::StreamInterrupted)),
            ..AudioDebugSnapshot::default()
        };
        let value = serde_json::to_value(snapshot).unwrap();
        assert_eq!(value["runtime_error"]["kind"], "stream_interrupted");
        assert_eq!(
            value["runtime_error"]["message"],
            "Audio stream interrupted"
        );
        assert!(value["runtime_error"]["device_name"].is_null());
    }

    #[test]
    fn drone_status_serializes_typed_runtime_error() {
        let status = DroneRuntimeStatus {
            is_playing: false,
            runtime_error: Some(AudioRuntimeError::from(&AudioError::NoAudioOutputAvailable)),
        };
        let value = serde_json::to_value(status).unwrap();
        assert_eq!(value["is_playing"], false);
        assert_eq!(value["runtime_error"]["kind"], "no_audio_output_available");
        assert_eq!(
            value["runtime_error"]["message"],
            "No audio output available"
        );
        assert!(value["runtime_error"]["device_name"].is_null());
    }

    #[test]
    fn payload_error_has_stable_tagged_shape() {
        let error = AudioRuntimeError::from(&AudioError::DeviceDisconnected {
            device_name: "USB Mic".to_string(),
        });
        let value = serde_json::to_value(error).unwrap();
        assert_eq!(value["kind"], "device_disconnected");
        assert_eq!(value["message"], "Device disconnected: USB Mic");
        assert_eq!(value["device_name"], "USB Mic");
    }
}

/// Information about an available audio input device.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioDeviceInfo {
    /// Device name as reported by the OS.
    pub device_name: String,
    /// Whether this is the system default input device.
    pub is_default: bool,
}

/// Pitch stability measurement over a sustained note.
/// Used by StabilityTracker — not yet exposed via Tauri commands.
#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StabilityMeasurement {
    /// Mean frequency over the measurement window.
    pub mean_frequency: f64,
    /// Population standard deviation of frequency samples.
    pub std_deviation: f64,
    /// Duration of the sustained note in milliseconds.
    pub duration_ms: u64,
    /// Detected note name at the mean frequency.
    pub note_name: String,
    /// Octave at the mean frequency.
    pub octave: i8,
}

/// Display mode for note names.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
pub enum DisplayMode {
    /// Show note names as written for the transposing instrument.
    #[default]
    Notated,
    /// Show concert pitch note names.
    Concert,
}
