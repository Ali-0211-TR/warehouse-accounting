use serde::{Deserialize, Serialize};
#[cfg(not(any(target_os = "android", target_os = "ios")))]
use ts_rs::TS;

use crate::shared::types::DispenserProtocolType;

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Serialize, Clone, PartialEq, Eq, Hash)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub struct DispenserPortEntity {
    pub id: Option<String>,
    pub protocol: DispenserProtocolType,
    pub port_name: String,
    pub port_speed: i32,
    pub device_id: String,
    // Sync metadata
    pub created_at: String,
    pub updated_at: String,
    pub deleted_at: Option<String>,
    pub version: i64,
}
