use std::time::Duration;

fn main() {
    let args: Vec<String> = std::env::args().skip(1).collect();
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

    match tonetrainer_lib::run_audio_hardware_smoke(Duration::from_millis(duration_ms)) {
        Ok(report) => {
            println!(
                "TONETRAINER_AUDIO_SMOKE={}",
                serde_json::to_string(&report).expect("smoke report must serialize")
            );
        }
        Err(error) => {
            let report = serde_json::json!({
                "success": false,
                "error": tonetrainer_lib::audio_runtime_error(&error),
            });
            eprintln!("TONETRAINER_AUDIO_SMOKE={report}");
            std::process::exit(3);
        }
    }
}
