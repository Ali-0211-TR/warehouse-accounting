use serde::Deserialize;
#[cfg(not(any(target_os = "android", target_os = "ios")))]
use ts_rs::TS;

use crate::domain::entities::mark_entity::MarkEntity;

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub struct MarkDTO {
    pub id: Option<String>,
    pub name: String,
}

impl MarkDTO {
    pub fn into_entity(self, device_id: String) -> MarkEntity {
        MarkEntity {
            id: self.id,
            name: self.name,
            device_id,
            created_at: String::new(),
            updated_at: String::new(),
            deleted_at: None,
            version: 0,
        }
    }
}
