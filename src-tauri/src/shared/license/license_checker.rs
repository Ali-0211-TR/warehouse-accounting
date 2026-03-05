use crate::shared::encryption::{EncryptedResponse, LicenseEncryption};
use crate::shared::license::online_service::{get_app_version, get_os_info};
use crate::shared::license::{
    LicenseError, LicenseStorage, LicenseValidationResponse, NUM_COUNT, OnlineLicenseService,
    TimeValidator,
};
use serde_json::json;
use tauri::Emitter;

// const LICENSE_SERVER_URL: &str = "http://127.0.0.1:3000";
const LICENSE_SERVER_URL: &str = "https://api.texnouz.uz";
const API_KEY: &str = "lc_8b4f7a2e9d1c6850a3b7e4f2c9a5d8e1b6f3a7c0e9d2b5a8f1c4e7b0a3d6f9c2";

// Master key for decryption - should match your server's encryption key
const ENCRYPTION_MASTER_KEY: &str =
    "mk_7f2a9b8e3d6c1f5a4e8b2d9c7a5f3e1b6c9f2a8d5e7b4a1c6f9e2b8d3a7c5f1e9";

pub struct LicenseChecker;

impl LicenseChecker {
    pub async fn check_license(app_handle: &tauri::AppHandle) -> Result<bool, LicenseError> {
        let machine_id = LicenseStorage::get_machine_id();
        let now = TimeValidator::get_current_time().await.current_time;

        println!("🔐 [LICENSE] Checking license for machine: {}", machine_id);

        // First try online validation
        let service =
            OnlineLicenseService::new(LICENSE_SERVER_URL.to_string(), API_KEY.to_string());

        match service
            .register_installation(&machine_id, &get_app_version(), &get_os_info())
            .await
        {
            Ok(server_response) => {
                println!("✅ [LICENSE] Received encrypted response from server");

                // Decrypt the license data
                match Self::decrypt_license_response(&server_response).await {
                    Ok(license) => {
                        println!("🔓 [LICENSE] Successfully decrypted license data");

                        // Validate the decrypted license
                        if license.machine_id != machine_id {
                            println!("❌ [LICENSE] Machine ID mismatch");
                            let _ = app_handle.emit(
                                "license:machine-mismatch",
                                json!({
                                    "message": "License is not valid for this machine.",
                                    "status": "invalid"
                                }),
                            );
                            return Err(LicenseError::MachineIdMismatch);
                        }

                        // Check if license is expired
                        if let Some(expiry_date) = license.license_type.get_expiry_date() {
                            println!("🔍 [LICENSE] Checking expiry date: {:?}", expiry_date);
                            if now > expiry_date {
                                let _ = app_handle.emit(
                                    "license:expired",
                                    json!({
                                        "message": "Your license has expired. Please renew your license.",
                                        "status": "expired"
                                    }),
                                );
                                return Err(LicenseError::Expired);
                            }
                        }

                        // Reset offline counter on successful online validation
                        if let Err(e) = LicenseStorage::reset_offline_runs() {
                            println!("⚠️ [LICENSE] Failed to reset offline runs: {:?}", e);
                        }

                        // Save license data to cache for feature checking
                        if let Err(e) = LicenseStorage::save_license(license.clone()) {
                            println!("⚠️ [LICENSE] Failed to save license to cache: {:?}", e);
                        }

                        // Check if license is expiring soon (within 10 days)
                        if let Some(expiry_date) = license.license_type.get_expiry_date() {
                            let days_remaining = expiry_date.signed_duration_since(now).num_days();
                            if days_remaining <= 10 && days_remaining > 0 {
                                println!("⚠️ [LICENSE] License expiring in {} days", days_remaining);
                                let _ = app_handle.emit(
                                    "license:expiry-warning",
                                    json!({
                                        "message": format!("Ваша лицензия истекает через {} дней. Пожалуйста, обновите лицензию.", days_remaining),
                                        "status": "expiring_soon",
                                        "daysRemaining": days_remaining,
                                        "expiryDate": expiry_date.to_rfc3339(),
                                        "licenseType": license.license_type.get_type_name()
                                    }),
                                );
                            }
                        }

                        let _ = app_handle.emit(
                            "license:online-validated",
                            json!({
                                "message": "License validated online successfully",
                                "status": "valid",
                                "licenseType": license.license_type,
                                "issuedTo": license.issued_to,
                                "validationMode": "online",
                                "features": LicenseStorage::get_license_features()
                            }),
                        );

                        Ok(true)
                    }
                    Err(decrypt_err) => {
                        println!("❌ [LICENSE] Failed to decrypt license: {:?}", decrypt_err);
                        return Self::handle_offline_fallback(app_handle).await;
                    }
                }
            }
            Err(network_err) => {
                println!("❌ [LICENSE] Network error: {:?}", network_err);
                return Self::handle_offline_fallback(app_handle).await;
            }
        }
    }

    async fn handle_offline_fallback(app_handle: &tauri::AppHandle) -> Result<bool, LicenseError> {
        // Check if we can run offline
        let can_run_offline = LicenseStorage::can_run_offline().unwrap_or(false);

        if !can_run_offline {
            let offline_count = LicenseStorage::load_cache()
                .and_then(|cache| cache.offline_run_count())
                .unwrap_or(0);
            let max_runs = LicenseStorage::load_cache()
                .and_then(|cache| cache.max_offline_runs())
                .unwrap_or(NUM_COUNT);

            let _ = app_handle.emit(
                "license:offline-limit-reached",
                json!({
                    "message": format!("Maximum offline runs ({}) exceeded. Internet connection required for license validation.", max_runs),
                    "status": "offline_limit_exceeded",
                    "offlineCount": offline_count,
                    "maxOfflineRuns": max_runs
                }),
            );

            return Err(LicenseError::NetworkError);
        }

        // Increment offline run counter
        let offline_count = LicenseStorage::increment_offline_run().unwrap_or(0);
        let max_runs = LicenseStorage::load_cache()
            .and_then(|cache| cache.max_offline_runs())
            .unwrap_or(NUM_COUNT);
        let remaining_runs = max_runs.saturating_sub(offline_count);

        println!(
            "⚠️ [LICENSE] Running in offline mode ({}/{} runs used)",
            offline_count, max_runs
        );

        let _ = app_handle.emit(
            "license:offline-mode",
            json!({
                "message": format!(
                    "No internet connection. Running in offline mode. {} offline runs remaining.",
                    remaining_runs
                ),
                "status": "offline_mode",
                "offlineCount": offline_count,
                "maxOfflineRuns": max_runs,
                "remainingRuns": remaining_runs,
                "validationMode": "offline"
            }),
        );

        // Show warning if approaching limit
        if remaining_runs <= 2 {
            let _ = app_handle.emit(
                "license:offline-warning",
                json!({
                    "message": format!(
                        "Warning: Only {} offline runs remaining. Please connect to the internet for license validation.",
                        remaining_runs
                    ),
                    "status": "offline_warning",
                    "remainingRuns": remaining_runs
                }),
            );
        }

        // Return OfflineMode error to trigger the dialog in lib.rs
        Err(LicenseError::OfflineMode)
    }

    // Decrypt the encrypted response from the server
    async fn decrypt_license_response(
        server_response: &EncryptedResponse,
    ) -> Result<crate::shared::license::License, LicenseError> {
        // Create encryption instance
        let encryption = LicenseEncryption::new(ENCRYPTION_MASTER_KEY).map_err(|e| {
            println!("❌ [LICENSE] Failed to create encryption instance: {:?}", e);
            LicenseError::Invalid
        })?;

        // Decrypt the license data
        let license: LicenseValidationResponse = encryption
            .decrypt_license_data(server_response)
            .map_err(|e| {
            println!("❌ [LICENSE] Decryption failed: {:?}", e);
            LicenseError::Invalid
        })?;

        license.license.ok_or(LicenseError::Invalid)
    }
}
