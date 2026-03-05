#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
fn main() {
    // Load .env file first thing in main
    let _ = dotenvy::dotenv();

    tokio::runtime::Runtime::new()
        .unwrap()
        .block_on(sklad_uchot_lib::run());
}
