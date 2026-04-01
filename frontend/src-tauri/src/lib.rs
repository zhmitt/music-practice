mod audio;

use audio::drone::note_to_frequency;
use audio::instrument::InstrumentProfile;
use audio::types::{AudioDeviceInfo, AudioLevel, DisplayMode, PitchResult};
use audio::{SharedDrone, SharedEngine};
use tauri::State;

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

// ── App Entry Point ─────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let engine = audio::create_engine();
    let engine_for_loop = engine.clone();
    let drone = audio::create_drone();

    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::new().build())
        .manage(engine)
        .manage(drone)
        .invoke_handler(tauri::generate_handler![
            start_audio,
            stop_audio,
            get_devices,
            get_pitch,
            get_audio_level,
            set_reference_tuning,
            set_instrument_profile,
            set_display_mode,
            is_audio_running,
            start_drone,
            stop_drone,
            set_drone_note,
            is_drone_playing,
        ])
        .setup(move |app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Start the audio processing loop in background
            audio::start_processing_loop(engine_for_loop);

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
