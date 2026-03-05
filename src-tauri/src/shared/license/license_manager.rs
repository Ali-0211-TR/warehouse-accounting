// use crate::shared::license::LicenseStorage;
// use serde_json::json;

// /// License feature constants
// pub mod features {
//     pub const BASIC_DISPENSERS: &str = "basic_dispensers";
//     pub const ADVANCED_DISPENSERS: &str = "advanced_dispensers";
//     pub const FUEL_MANAGEMENT: &str = "fuel_management";
//     pub const INVENTORY_MANAGEMENT: &str = "inventory_management";
//     pub const REPORTING: &str = "reporting";
//     pub const ADVANCED_REPORTING: &str = "advanced_reporting";
//     pub const USER_MANAGEMENT: &str = "user_management";
//     pub const MULTI_STATION: &str = "multi_station";
//     pub const CAMERA_INTEGRATION: &str = "camera_integration";
//     pub const CARD_PAYMENT: &str = "card_payment";
//     pub const LOYALTY_PROGRAM: &str = "loyalty_program";
//     pub const API_ACCESS: &str = "api_access";
//     pub const BACKUP_RESTORE: &str = "backup_restore";
//     pub const ADVANCED_SECURITY: &str = "advanced_security";
//     pub const CUSTOM_INTEGRATIONS: &str = "custom_integrations";
// }

// /// License manager for controlling feature access
// pub struct LicenseManager;

// impl LicenseManager {
//     /// Check if a specific feature is available
//     pub fn has_feature(feature: &str) -> bool {
//         LicenseStorage::has_feature(feature)
//     }

//     /// Check if user has valid license
//     pub fn has_valid_license() -> bool {
//         LicenseStorage::has_valid_license()
//     }

//     /// Get all available features
//     pub fn get_available_features() -> Vec<String> {
//         LicenseStorage::get_license_features()
//     }

//     /// Check multiple features at once
//     pub fn has_features(features: &[&str]) -> bool {
//         features.iter().all(|&feature| Self::has_feature(feature))
//     }

//     /// Check if any of the features is available
//     pub fn has_any_feature(features: &[&str]) -> bool {
//         features.iter().any(|&feature| Self::has_feature(feature))
//     }

//     /// Get license status for UI
//     pub fn get_license_status() -> serde_json::Value {
//         match LicenseStorage::get_license_info() {
//             Ok(info) => info,
//             Err(_) => json!({
//                 "hasValidLicense": false,
//                 "features": [],
//                 "error": "Failed to load license information"
//             })
//         }
//     }

//     /// Feature-specific access checks
//     pub fn can_use_dispensers() -> bool {
//         Self::has_any_feature(&[features::BASIC_DISPENSERS, features::ADVANCED_DISPENSERS])
//     }

//     pub fn can_use_advanced_dispensers() -> bool {
//         Self::has_feature(features::ADVANCED_DISPENSERS)
//     }

//     pub fn can_manage_fuel() -> bool {
//         Self::has_feature(features::FUEL_MANAGEMENT)
//     }

//     pub fn can_manage_inventory() -> bool {
//         Self::has_feature(features::INVENTORY_MANAGEMENT)
//     }

//     pub fn can_access_reports() -> bool {
//         Self::has_any_feature(&[features::REPORTING, features::ADVANCED_REPORTING])
//     }

//     pub fn can_access_advanced_reports() -> bool {
//         Self::has_feature(features::ADVANCED_REPORTING)
//     }

//     pub fn can_manage_users() -> bool {
//         Self::has_feature(features::USER_MANAGEMENT)
//     }

//     pub fn can_use_multi_station() -> bool {
//         Self::has_feature(features::MULTI_STATION)
//     }

//     pub fn can_use_cameras() -> bool {
//         Self::has_feature(features::CAMERA_INTEGRATION)
//     }

//     pub fn can_process_card_payments() -> bool {
//         Self::has_feature(features::CARD_PAYMENT)
//     }

//     pub fn can_use_loyalty_program() -> bool {
//         Self::has_feature(features::LOYALTY_PROGRAM)
//     }

//     pub fn can_access_api() -> bool {
//         Self::has_feature(features::API_ACCESS)
//     }

//     pub fn can_backup_restore() -> bool {
//         Self::has_feature(features::BACKUP_RESTORE)
//     }

//     pub fn can_use_advanced_security() -> bool {
//         Self::has_feature(features::ADVANCED_SECURITY)
//     }

//     pub fn can_use_custom_integrations() -> bool {
//         Self::has_feature(features::CUSTOM_INTEGRATIONS)
//     }

//     /// Get maximum allowed dispensers based on license
//     pub fn get_max_dispensers() -> u32 {
//         if Self::has_feature(features::ADVANCED_DISPENSERS) {
//             100 // Enterprise level
//         } else if Self::has_feature(features::BASIC_DISPENSERS) {
//             10 // Standard level
//         } else {
//             0 // No license
//         }
//     }

//     /// Get maximum allowed users based on license
//     pub fn get_max_users() -> u32 {
//         if Self::has_feature(features::USER_MANAGEMENT) {
//             if Self::has_feature(features::ADVANCED_SECURITY) {
//                 50 // Enterprise
//             } else {
//                 10 // Standard
//             }
//         } else {
//             1 // Only admin user
//         }
//     }

//     /// Get maximum allowed stations based on license
//     pub fn get_max_stations() -> u32 {
//         if Self::has_feature(features::MULTI_STATION) {
//             10
//         } else {
//             1
//         }
//     }

//     /// Check if feature access should be denied and return error message
//     pub fn check_feature_access(feature: &str) -> Result<(), String> {
//         if !Self::has_valid_license() {
//             return Err("No valid license found. Please activate your license.".to_string());
//         }

//         if !Self::has_feature(feature) {
//             return Err(format!("This feature ({}) is not available in your current license plan.", feature));
//         }

//         Ok(())
//     }

//     /// Get feature limitations as JSON for UI
//     pub fn get_feature_limitations() -> serde_json::Value {
//         json!({
//             "maxDispensers": Self::get_max_dispensers(),
//             "maxUsers": Self::get_max_users(),
//             "maxStations": Self::get_max_stations(),
//             "features": {
//                 "dispensers": Self::can_use_dispensers(),
//                 "advancedDispensers": Self::can_use_advanced_dispensers(),
//                 "fuelManagement": Self::can_manage_fuel(),
//                 "inventoryManagement": Self::can_manage_inventory(),
//                 "reporting": Self::can_access_reports(),
//                 "advancedReporting": Self::can_access_advanced_reports(),
//                 "userManagement": Self::can_manage_users(),
//                 "multiStation": Self::can_use_multi_station(),
//                 "cameras": Self::can_use_cameras(),
//                 "cardPayments": Self::can_process_card_payments(),
//                 "loyaltyProgram": Self::can_use_loyalty_program(),
//                 "apiAccess": Self::can_access_api(),
//                 "backupRestore": Self::can_backup_restore(),
//                 "advancedSecurity": Self::can_use_advanced_security(),
//                 "customIntegrations": Self::can_use_custom_integrations(),
//             }
//         })
//     }
// }

// /// Tauri command handlers for license management
// #[tauri::command]
// pub async fn get_license_status() -> serde_json::Value {
//     LicenseManager::get_license_status()
// }

// #[tauri::command]
// pub async fn get_feature_limitations() -> serde_json::Value {
//     LicenseManager::get_feature_limitations()
// }

// #[tauri::command]
// pub async fn check_feature_access(feature: String) -> Result<(), String> {
//     LicenseManager::check_feature_access(&feature)
// }

// #[tauri::command]
// pub async fn has_feature(feature: String) -> bool {
//     LicenseManager::has_feature(&feature)
// }
