use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
#[cfg(not(any(target_os = "android", target_os = "ios")))]
use ts_rs::TS;

use crate::shared::types::CardState;

use super::{client_entity::ClientEntity, limit_entity::LimitEntity};

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub struct CardEntity {
    pub id: Option<String>,
    pub device_id: String,
    pub client: Option<ClientEntity>,
    pub limits: Option<Vec<LimitEntity>>,
    pub name: String,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "string")
    )]
    pub d_begin: DateTime<Utc>,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "string")
    )]
    pub d_end: DateTime<Utc>,
    pub state: CardState,
    pub comment: String,
    // Sync metadata
    pub created_at: String,
    pub updated_at: String,
    pub deleted_at: Option<String>,
    pub version: i64,
}
