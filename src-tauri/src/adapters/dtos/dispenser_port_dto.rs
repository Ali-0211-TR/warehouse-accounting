use crate::shared::types::DispenserProtocolType;
use serde::{Deserialize, Serialize};
#[cfg(not(any(target_os = "android", target_os = "ios")))]
use ts_rs::TS;

/// Input DTO from frontend - no metadata required
#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub struct DispenserPortDTO {
    pub id: Option<String>,
    pub protocol: DispenserProtocolType,
    pub port_name: String,
    pub port_speed: i32,
}

impl DispenserPortDTO {
    /// Convert to DispenserPortEntity with device_id only
    /// Timestamps and version will be set by repository layer
    pub fn into_entity(
        self,
        device_id: String,
    ) -> crate::domain::entities::dispenser_port_entity::DispenserPortEntity {
        use crate::domain::entities::dispenser_port_entity::DispenserPortEntity;

        DispenserPortEntity {
            id: self.id,
            device_id,
            protocol: self.protocol,
            port_name: self.port_name,
            port_speed: self.port_speed,
            // Metadata will be set by repository
            created_at: String::new(),
            updated_at: String::new(),
            deleted_at: None,
            version: 0,
        }
    }
}
