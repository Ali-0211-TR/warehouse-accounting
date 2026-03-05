use serde::{Deserialize, Serialize};
#[cfg(not(any(target_os = "android", target_os = "ios")))]
use ts_rs::TS;

use crate::shared::types::RoleType;

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub struct UserEntity {
    pub id: Option<String>,
    pub full_name: String,
    pub username: String,
    pub phone_number: String,
    pub roles: Vec<RoleType>,
    pub device_id: String,
    // Sync metadata
    pub created_at: String,
    pub updated_at: String,
    pub deleted_at: Option<String>,
    pub version: i64,
}

impl Default for UserEntity {
    fn default() -> Self {
        Self {
            id: None,
            full_name: "".to_string(),
            username: "".to_string(),
            phone_number: "".to_string(),
            roles: vec![],
            device_id: "singleton".to_string(),
            created_at: "CURRENT_TIMESTAMP".to_string(),
            updated_at: "CURRENT_TIMESTAMP".to_string(),
            deleted_at: None,
            version: 1,
        }
    }
}
