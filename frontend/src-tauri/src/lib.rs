mod audio;

pub use audio::types::{AudioError as HardwareSmokeError, AudioRuntimeError};
pub use audio::{run_audio_hardware_smoke, AudioHardwareSmokeReport};

pub fn audio_runtime_error(error: &HardwareSmokeError) -> AudioRuntimeError {
    AudioRuntimeError::from(error)
}

use audio::drone::note_to_frequency;
use audio::instrument::InstrumentProfile;
use audio::types::{
    AudioDebugSnapshot, AudioDeviceInfo, AudioLevel, DisplayMode, DroneRuntimeStatus, PitchResult,
};
use audio::{SharedDrone, SharedEngine};
use tauri::State;

fn run_requested_audio_smoke(args: &[String]) {
    if !args.iter().any(|arg| arg == "--audio-smoke") {
        return;
    }
    if !args
        .iter()
        .any(|arg| arg == "--acknowledge-microphone-access")
    {
        eprintln!("Refusing microphone access without --acknowledge-microphone-access");
        std::process::exit(2);
    }
    let duration_ms = args
        .windows(2)
        .find(|pair| pair[0] == "--duration-ms")
        .and_then(|pair| pair[1].parse::<u64>().ok())
        .unwrap_or(3000);
    match run_audio_hardware_smoke(std::time::Duration::from_millis(duration_ms)) {
        Ok(report) => println!(
            "TONETRAINER_AUDIO_SMOKE={}",
            serde_json::to_string(&report).expect("smoke report must serialize")
        ),
        Err(error) => {
            let report = serde_json::json!({
                "success": false,
                "error": audio_runtime_error(&error),
            });
            eprintln!("TONETRAINER_AUDIO_SMOKE={report}");
            std::process::exit(3);
        }
    }
    std::process::exit(0);
}

fn runtime_smoke_mode_from_args(args: impl IntoIterator<Item = String>) -> Option<String> {
    args.into_iter()
        .any(|arg| arg == "--sqlite-smoke")
        .then(|| "sqlite".to_string())
}

fn normalize_runtime_smoke_result(result: &str) -> String {
    match serde_json::from_str::<serde_json::Value>(result) {
        Ok(value) => serde_json::to_string(&value).expect("JSON value must serialize"),
        Err(_) => serde_json::to_string(result).expect("string must serialize"),
    }
}

// ── Tauri Commands ──────────────────────────────────────────────

#[tauri::command]
fn start_audio(engine: State<SharedEngine>, device_name: Option<String>) -> Result<(), String> {
    let mut eng = engine.lock().map_err(|e| e.to_string())?;
    eng.start(device_name.as_deref()).map_err(|e| e.to_string())
}

#[tauri::command]
fn stop_audio(engine: State<SharedEngine>) -> Result<(), String> {
    let mut eng = engine.lock().map_err(|e| e.to_string())?;
    eng.stop();
    Ok(())
}

#[tauri::command]
fn get_devices(engine: State<SharedEngine>) -> Result<Vec<AudioDeviceInfo>, String> {
    let eng = engine.lock().map_err(|e| e.to_string())?;
    eng.list_devices().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_pitch(engine: State<SharedEngine>) -> Result<Option<PitchResult>, String> {
    let eng = engine.lock().map_err(|e| e.to_string())?;
    Ok(eng.latest_pitch())
}

#[tauri::command]
fn get_audio_level(engine: State<SharedEngine>) -> Result<AudioLevel, String> {
    let eng = engine.lock().map_err(|e| e.to_string())?;
    Ok(eng.latest_level())
}

#[tauri::command]
fn get_audio_debug(engine: State<SharedEngine>) -> Result<AudioDebugSnapshot, String> {
    let eng = engine.lock().map_err(|e| e.to_string())?;
    Ok(eng.latest_debug())
}

#[tauri::command]
fn set_reference_tuning(engine: State<SharedEngine>, hz: f64) -> Result<(), String> {
    let mut eng = engine.lock().map_err(|e| e.to_string())?;
    eng.set_reference_tuning(hz);
    Ok(())
}

#[tauri::command]
fn set_instrument_profile(engine: State<SharedEngine>, profile_name: String) -> Result<(), String> {
    let mut eng = engine.lock().map_err(|e| e.to_string())?;
    let profile = match profile_name.as_str() {
        "horn_bb" => InstrumentProfile::horn_bb(),
        "horn_f" => InstrumentProfile::horn_f(),
        "double_horn" => InstrumentProfile::double_horn(),
        "trumpet_bb" => InstrumentProfile::trumpet_bb(),
        "clarinet_bb" => InstrumentProfile::clarinet_bb(),
        "flute" => InstrumentProfile::flute(),
        "oboe" => InstrumentProfile::oboe(),
        "trombone" => InstrumentProfile::trombone(),
        _ => InstrumentProfile::default_profile(),
    };
    eng.set_instrument_profile(profile);
    Ok(())
}

#[tauri::command]
fn set_display_mode(engine: State<SharedEngine>, mode: String) -> Result<(), String> {
    let mut eng = engine.lock().map_err(|e| e.to_string())?;
    let display_mode = match mode.as_str() {
        "concert" => DisplayMode::Concert,
        _ => DisplayMode::Notated,
    };
    eng.set_display_mode(display_mode);
    Ok(())
}

#[tauri::command]
fn is_audio_running(engine: State<SharedEngine>) -> Result<bool, String> {
    let eng = engine.lock().map_err(|e| e.to_string())?;
    Ok(eng.is_running())
}

// ── Drone Commands ──────────────────────────────────────────────

#[tauri::command]
fn start_drone(
    drone: State<SharedDrone>,
    note: String,
    octave: i8,
    reference_a4: f64,
) -> Result<(), String> {
    let freq = note_to_frequency(&note, octave, reference_a4)
        .ok_or_else(|| format!("Unknown note: {}", note))?;
    let mut d = drone.lock().map_err(|e| e.to_string())?;
    d.start(freq)
}

#[tauri::command]
fn stop_drone(drone: State<SharedDrone>) -> Result<(), String> {
    let mut d = drone.lock().map_err(|e| e.to_string())?;
    d.stop();
    Ok(())
}

#[tauri::command]
fn set_drone_note(
    drone: State<SharedDrone>,
    note: String,
    octave: i8,
    reference_a4: f64,
) -> Result<(), String> {
    let freq = note_to_frequency(&note, octave, reference_a4)
        .ok_or_else(|| format!("Unknown note: {}", note))?;
    let d = drone.lock().map_err(|e| e.to_string())?;
    d.set_frequency(freq);
    Ok(())
}

#[tauri::command]
fn is_drone_playing(drone: State<SharedDrone>) -> Result<bool, String> {
    let d = drone.lock().map_err(|e| e.to_string())?;
    Ok(d.is_playing())
}

#[tauri::command]
fn get_drone_runtime_status(drone: State<SharedDrone>) -> Result<DroneRuntimeStatus, String> {
    let d = drone.lock().map_err(|e| e.to_string())?;
    Ok(d.runtime_status())
}

#[tauri::command]
fn get_runtime_smoke_mode() -> Result<Option<String>, String> {
    Ok(runtime_smoke_mode_from_args(std::env::args()))
}

#[tauri::command]
fn complete_runtime_smoke(result_json: String, success: bool) -> Result<(), String> {
    use std::io::Write;

    println!(
        "TONETRAINER_RUNTIME_SMOKE={}",
        normalize_runtime_smoke_result(&result_json)
    );
    let _ = std::io::stdout().flush();
    std::process::exit(if success { 0 } else { 1 });
}

// ── App Entry Point ─────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let args: Vec<String> = std::env::args().collect();
    run_requested_audio_smoke(&args);
    let engine = audio::create_engine();
    let engine_for_loop = engine.clone();
    let drone = audio::create_drone();
    let processing_loop = audio::start_processing_loop(engine_for_loop);

    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::new().build())
        .manage(engine)
        .manage(drone)
        .manage(processing_loop)
        .invoke_handler(tauri::generate_handler![
            start_audio,
            stop_audio,
            get_devices,
            get_pitch,
            get_audio_level,
            get_audio_debug,
            set_reference_tuning,
            set_instrument_profile,
            set_display_mode,
            is_audio_running,
            start_drone,
            stop_drone,
            set_drone_note,
            is_drone_playing,
            get_drone_runtime_status,
            get_runtime_smoke_mode,
            complete_runtime_smoke,
        ])
        .setup(move |app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod runtime_smoke_tests {
    use super::*;

    #[test]
    fn smoke_mode_requires_exact_opt_in_flag() {
        assert_eq!(
            runtime_smoke_mode_from_args(["app".into(), "--sqlite-smoke".into()]),
            Some("sqlite".into())
        );
        assert_eq!(
            runtime_smoke_mode_from_args(["app".into(), "--sqlite-smoke=true".into()]),
            None
        );
    }

    #[test]
    fn smoke_result_is_always_one_compact_json_value() {
        assert_eq!(
            normalize_runtime_smoke_result("{\n  \"ok\": true\n}"),
            r#"{"ok":true}"#
        );
        assert_eq!(normalize_runtime_smoke_result("not json"), r#""not json""#);
    }
}
