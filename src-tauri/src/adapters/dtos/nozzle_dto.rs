use crate::domain::entities::nozzle_entity::NozzleEntity;
use serde::{Deserialize, Serialize};
#[cfg(not(any(target_os = "android", target_os = "ios")))]
use ts_rs::TS;

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub struct NozzleDTO {
    pub id: Option<String>,
    pub address: u8,
    pub dispenser_id: String,
    pub tank_id: String,
    pub fueling_order_id: Option<String>,
}

impl NozzleDTO {
    pub fn into_entity(self, device_id: String) -> NozzleEntity {
        NozzleEntity {
            id: self.id,
            device_id,
            dispenser_id: self.dispenser_id,
            address: self.address,
            tank_id: self.tank_id,
            tank: None,
            fueling_order_id: self.fueling_order_id,
            created_at: String::new(),
            updated_at: String::new(),
            deleted_at: None,
            version: 0,
        }
    }
}
