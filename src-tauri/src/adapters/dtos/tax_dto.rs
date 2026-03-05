use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::Deserialize;
#[cfg(not(any(target_os = "android", target_os = "ios")))]
use ts_rs::TS;

use crate::{domain::entities::tax_entity::TaxEntity, shared::types::OrderType};

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub struct TaxDTO {
    pub id: Option<String>,
    pub name: String,
    pub short_name: String,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number")
    )]
    pub rate: Decimal,
    pub is_inclusive: bool,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "string")
    )]
    pub d_begin: DateTime<Utc>,
    pub order_type: OrderType,
}

impl TaxDTO {
    pub fn into_entity(self, device_id: String) -> TaxEntity {
        TaxEntity {
            id: self.id,
            name: self.name,
            short_name: self.short_name,
            rate: self.rate,
            is_inclusive: self.is_inclusive,
            d_begin: self.d_begin,
            order_type: self.order_type,
            device_id,
            created_at: String::new(),
            updated_at: String::new(),
            deleted_at: None,
            version: 0,
        }
    }
}
