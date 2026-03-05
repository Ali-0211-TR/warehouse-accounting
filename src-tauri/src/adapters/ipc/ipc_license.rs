use crate::adapters::response::*;
use crate::shared::license::{LicenseChecker, LicenseStorage};
use serde::{Deserialize, Serialize};
use tauri::command;

#[derive(Debug, Serialize, Deserialize)]
pub struct LicenseInfo {
    pub machine_id: String,
    pub offline_run_count: Option<u32>,
    pub max_offline_runs: Option<u32>,
    /// Days remaining until license expiry. None for perpetual/unknown.
    pub days_remaining: Option<i64>,
    /// License type name (e.g. "Demo", "Standard", "Professional")
    pub license_type: Option<String>,
    /// License expiry date as ISO 8601 string
    pub expiry_date: Option<String>,
    /// Whom the license is issued to
    pub issued_to: Option<String>,
}

#[command]
pub fn get_license_info() -> IpcResponse<LicenseInfo> {
    crate::ipc_handler!({
        let machine_id = LicenseStorage::get_machine_id();
        let cache = LicenseStorage::load_cache().ok();
        let offline_run_count = cache.as_ref().and_then(|c| c.offline_run_count().ok());
        let max_offline_runs = cache.as_ref().and_then(|c| c.max_offline_runs().ok());

        Ok(LicenseInfo {
            machine_id,
            offline_run_count,
            max_offline_runs,
            days_remaining: LicenseStorage::get_days_remaining(),
            license_type: LicenseStorage::get_license_type_name(),
            expiry_date: LicenseStorage::get_expiry_date(),
            issued_to: LicenseStorage::get_issued_to(),
        })
    })
}

#[command]
pub async fn check_license_status(app_handle: tauri::AppHandle) -> IpcResponse<bool> {
    crate::ipc_handler_async!({
        LicenseChecker::check_license(&app_handle)
            .await
            .map_err(|e| crate::Error::General(e.to_string()))
    })
}

#[command]
pub fn get_machine_id() -> IpcResponse<String> {
    crate::ipc_handler!(Ok(LicenseStorage::get_machine_id()))
}

// #[tauri::command]
// pub async fn install_license(app_handle: tauri::AppHandle, license_key: String) -> Result<(), String> {
//     LicenseChecker::install_license(&app_handle, &license_key)
//         .await
//         .map_err(|e| e.to_string())
// }
