/// Returns the application version as defined by Cargo.toml / build.
#[tauri::command]
pub fn get_version() -> String {
    // Prefer an explicitly injected build-time env var if present, otherwise fall back
    // to Cargo package version. This allows CI to override if necessary.
    std::option_env!("APP_VERSION")
        .map(|s| s.to_string())
        .unwrap_or_else(|| env!("CARGO_PKG_VERSION").to_string())
}

/// Returns the application name.
#[tauri::command]
pub fn get_name() -> String {
    std::option_env!("APP_NAME")
        .map(|s| s.to_string())
        .unwrap_or_else(|| env!("CARGO_PKG_NAME").to_string())
}

/// Set the current window title from the Rust side. The `window` argument is
/// provided automatically by Tauri when invoked from the renderer.
#[cfg(not(any(target_os = "android", target_os = "ios")))]
#[tauri::command]
pub fn set_title(window: tauri::Window, title: String) -> Result<(), String> {
    window
        .set_title(&title)
        .map_err(|e| format!("Failed to set title: {}", e))
}

#[cfg(any(target_os = "android", target_os = "ios"))]
#[tauri::command]
pub fn set_title(_window: tauri::WebviewWindow, _title: String) -> Result<(), String> {
    // Mobile apps don't have window titles
    Ok(())
}
