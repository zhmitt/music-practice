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
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AudioError {
    MicrophonePermissionDenied,
    NoMicrophoneAvailable,
    UnsupportedSampleRate,
    DeviceDisconnected { device_name: String },
    StreamInterrupted,
    Unknown(String),
}

impl std::fmt::Display for AudioError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::MicrophonePermissionDenied => write!(f, "Microphone permission denied"),
            Self::NoMicrophoneAvailable => write!(f, "No microphone available"),
            Self::UnsupportedSampleRate => write!(f, "Unsupported sample rate"),
            Self::DeviceDisconnected { device_name } => {
                write!(f, "Device disconnected: {}", device_name)
            }
            Self::StreamInterrupted => write!(f, "Audio stream interrupted"),
            Self::Unknown(msg) => write!(f, "Audio error: {}", msg),
        }
    }
}

impl std::error::Error for AudioError {}

/// Information about an available audio input device.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioDeviceInfo {
    /// Device name as reported by the OS.
    pub device_name: String,
    /// Whether this is the system default input device.
    pub is_default: bool,
}

/// Pitch stability measurement over a sustained note.
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
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum DisplayMode {
    /// Show note names as written for the transposing instrument.
    Notated,
    /// Show concert pitch note names.
    Concert,
}

impl Default for DisplayMode {
    fn default() -> Self {
        Self::Notated
    }
}
