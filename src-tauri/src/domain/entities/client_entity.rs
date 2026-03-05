use serde::{Deserialize, Serialize};
#[cfg(not(any(target_os = "android", target_os = "ios")))]
use ts_rs::TS;

use crate::shared::types::ClientType;

use super::card_entity::CardEntity;

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub enum ClientColumn {
    Id,
    DeviceId,
    ClientType,
    Name,
    NameShort,
    DocumentCode,
    Address,
    TaxCode,
    Bank,
    Contact,
    Login,
    Password,
}

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub struct ClientFilter {
    pub id: Option<String>,
    pub device_id: Option<String>,
    pub name: Option<String>,
    pub name_short: Option<String>,
    pub client_type: Option<ClientType>,
    pub document_code: Option<String>,
    pub address: Option<String>,
    pub tax_code: Option<String>,
}

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub struct ClientEntity {
    pub id: Option<String>,
    pub device_id: String,
    pub cards: Option<Vec<CardEntity>>,
    pub client_type: ClientType,
    pub name: String,
    pub name_short: String,
    pub document_code: Option<String>,
    pub address: Option<String>,
    pub tax_code: Option<String>,
    pub bank: Option<String>,
    pub contact: Option<String>,
    pub login: String,
    pub password: String,
    // Sync metadata
    pub created_at: String,
    pub updated_at: String,
    pub deleted_at: Option<String>,
    pub version: i64,
}
