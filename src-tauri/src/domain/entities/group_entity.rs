use serde::{Deserialize, Serialize};
#[cfg(not(any(target_os = "android", target_os = "ios")))]
use ts_rs::TS;

use crate::shared::types::GroupType;

use super::{discount_entity::DiscountEntity, mark_entity::MarkEntity};

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub struct GroupEntity {
    pub id: Option<String>,
    pub group_type: GroupType,
    pub mark: Option<MarkEntity>,
    pub name: String,
    pub parent_id: Option<String>,
    pub device_id: String,
    // Relations (not in DB but populated)
    pub discounts: Vec<DiscountEntity>,
    // Sync metadata
    pub created_at: String,
    pub updated_at: String,
    pub deleted_at: Option<String>,
    pub version: i64,
}
