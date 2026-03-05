use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
#[cfg(not(any(target_os = "android", target_os = "ios")))]
use ts_rs::TS;

use crate::shared::types::TankProtocolType;

use super::product_entity::ProductEntity;

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub struct TankEntity {
    pub id: Option<String>,
    pub name: String,
    pub protocol: Option<TankProtocolType>,
    pub address: Option<u8>,
    pub server_address: Option<String>,
    pub server_port: Option<u16>,
    pub port_name: Option<String>,
    pub port_speed: Option<u32>,
    pub product_id: String,
    pub product: Option<ProductEntity>,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number")
    )]
    pub balance: Decimal,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number")
    )]
    pub volume_max: Decimal,
    pub device_id: String,
    // Sync metadata
    pub created_at: String,
    pub updated_at: String,
    pub deleted_at: Option<String>,
    pub version: i64,
}
