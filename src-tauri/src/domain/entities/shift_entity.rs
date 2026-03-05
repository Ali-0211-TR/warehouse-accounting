use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
#[cfg(not(any(target_os = "android", target_os = "ios")))]
use ts_rs::TS;

use super::user_entity::UserEntity;

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub enum ShiftColumn {
    Id,
    DOpen,
    DClose,
    UserOpenId,
    UserCloseId,
}

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub struct ShiftFilter {
    pub id: Option<String>,
    pub user_open_id: Option<String>,
    pub user_close_id: Option<String>,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "[string, string]|null")
    )]
    pub d_open: Option<(DateTime<Utc>, DateTime<Utc>)>,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "[string, string]|null")
    )]
    pub d_close: Option<(DateTime<Utc>, DateTime<Utc>)>,
}

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub struct ShiftEntity {
    pub id: Option<String>,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "string")
    )]
    pub d_open: DateTime<Utc>,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "string | null")
    )]
    pub d_close: Option<DateTime<Utc>>,
    pub user_open: UserEntity,
    pub user_close: Option<UserEntity>,
    pub data_open: Vec<ShiftData>,
    pub data_close: Option<Vec<ShiftData>>,
    pub device_id: String,
    // Sync metadata
    pub created_at: String,
    pub updated_at: String,
    pub deleted_at: Option<String>,
    pub version: i64,
}

impl Default for ShiftEntity {
    fn default() -> Self {
        Self {
            id: None,
            d_open: Utc::now(),
            d_close: None,
            user_open: UserEntity::default(),
            user_close: None,
            data_open: vec![],
            data_close: None,
            device_id: "singleton".to_string(),
            created_at: "CURRENT_TIMESTAMP".to_string(),
            updated_at: "CURRENT_TIMESTAMP".to_string(),
            deleted_at: None,
            version: 1,
        }
    }
}

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub struct ShiftData {
    pub number: i32,
    pub gas: String,
    pub temperature: f64,
    pub density: f64,
    pub level_current: f64,
    pub volume_current: f64,
    pub level_water: f64,
    pub volume_water: f64,
    pub level_measure: f64,
    pub level_water_measure: f64,
    pub volume_gas_calc: f64,
    pub volume_gas_measure: f64,
    pub volume_gas_corr: f64,
    pub dispensers_data: Option<Vec<ShiftDispenserData>>,
}

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub struct ShiftDispenserData {
    pub dispenser_name: String,
    pub nozzle_addres: String,
    pub shift_volume: f64,
    pub shift_amount: f64,
    pub total_volume: f64,
    pub total_amount: f64,
    pub calc_volume: f64,
    pub calc_amount: f64,
}
