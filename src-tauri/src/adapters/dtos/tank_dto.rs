use crate::domain::entities::tank_entity::TankEntity;
use crate::shared::types::TankProtocolType;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
#[cfg(not(any(target_os = "android", target_os = "ios")))]
use ts_rs::TS;

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub struct TankDTO {
    pub id: Option<String>,
    pub name: String,
    pub protocol: Option<TankProtocolType>,
    pub address: Option<u8>,
    pub server_address: Option<String>,
    pub server_port: Option<u16>,
    pub port_name: Option<String>,
    pub port_speed: Option<u32>,
    pub product_id: String,
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
}

impl TankDTO {
    pub fn into_entity(self, device_id: String) -> TankEntity {
        TankEntity {
            id: self.id,
            device_id,
            name: self.name,
            protocol: self.protocol,
            address: self.address,
            server_address: self.server_address,
            server_port: self.server_port,
            port_name: self.port_name,
            port_speed: self.port_speed,
            product_id: self.product_id,
            balance: self.balance,
            volume_max: self.volume_max,
            product: None,
            created_at: String::new(),
            updated_at: String::new(),
            deleted_at: None,
            version: 0,
        }
    }
}
