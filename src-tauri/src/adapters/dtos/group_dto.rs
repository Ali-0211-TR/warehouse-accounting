use crate::domain::entities::group_entity::GroupEntity;
use crate::shared::types::GroupType;
use serde::Deserialize;
#[cfg(not(any(target_os = "android", target_os = "ios")))]
use ts_rs::TS;

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub struct GroupDTO {
    pub id: Option<String>,
    pub group_type: GroupType,
    pub mark_id: Option<String>,
    pub name: String,
    pub parent_id: Option<String>,
    pub discount_ids: Vec<String>,
}

impl GroupDTO {
    pub fn into_entity(self, device_id: String) -> GroupEntity {
        GroupEntity {
            id: self.id,
            group_type: self.group_type,
            mark: None, // Will be populated by repository
            name: self.name,
            parent_id: self.parent_id,
            device_id,
            discounts: Vec::new(), // Will be populated by repository
            created_at: String::new(),
            updated_at: String::new(),
            deleted_at: None,
            version: 0,
        }
    }
}
