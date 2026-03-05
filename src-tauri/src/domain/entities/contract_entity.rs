use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
#[cfg(not(any(target_os = "android", target_os = "ios")))]
use ts_rs::TS;

use super::{
    client_entity::ClientEntity, contract_car_entity::ContractCarEntity,
    contract_product_entity::ContractProductEntity,
};
#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub enum ContractColumn {
    Id,
    DeviceId,
    ClientId,
    Name,
    ContractName,
    DBegin,
    DEnd,
}

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub struct ContractFilter {
    pub id: Option<String>,
    pub device_id: Option<String>,
    pub client_id: Option<String>,
    pub name: Option<String>,
    pub contract_name: Option<String>,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "[string, string]|null")
    )]
    pub d_begin: Option<(DateTime<Utc>, DateTime<Utc>)>,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "[string, string]|null")
    )]
    pub d_end: Option<(DateTime<Utc>, DateTime<Utc>)>,
}

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub struct ContractEntity {
    pub id: Option<String>,
    pub device_id: String,
    pub client: Option<ClientEntity>,
    pub name: String,
    pub contract_name: String,
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
    pub contract_products: Vec<ContractProductEntity>,
    pub contract_cars: Vec<ContractCarEntity>,
    // Sync metadata
    pub created_at: String,
    pub updated_at: String,
    pub deleted_at: Option<String>,
    pub version: i64,
}
