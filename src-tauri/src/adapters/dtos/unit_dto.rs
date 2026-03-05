use serde::Deserialize;
#[cfg(not(any(target_os = "android", target_os = "ios")))]
use ts_rs::TS;

use crate::domain::entities::unit_entity::UnitEntity;

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub struct UnitDTO {
    pub id: Option<String>,
    pub name: String,
    pub short_name: String,
}

impl UnitDTO {
    pub fn into_entity(self, device_id: String) -> UnitEntity {
        UnitEntity {
            id: self.id,
            name: self.name,
            short_name: self.short_name,
            device_id,
            created_at: String::new(),
            updated_at: String::new(),
            deleted_at: None,
            version: 0,
        }
    }
}
