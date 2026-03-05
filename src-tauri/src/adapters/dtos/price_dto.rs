use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
#[cfg(not(any(target_os = "android", target_os = "ios")))]
use ts_rs::TS;

use crate::domain::entities::price_entity::PriceEntity;
use crate::shared::types::PriceType;

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub struct PriceDTO {
    pub id: Option<String>,
    pub product_id: String,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "string")
    )]
    pub start_time: DateTime<Utc>,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number")
    )]
    pub value: Decimal,
    pub price_type: PriceType,
}

impl PriceDTO {
    pub fn into_entity(self, device_id: String) -> PriceEntity {
        PriceEntity {
            id: self.id,
            device_id,
            product_id: self.product_id,
            start_time: self.start_time,
            value: self.value,
            price_type: self.price_type,
            created_at: String::new(),
            updated_at: String::new(),
            deleted_at: None,
            version: 0,
        }
    }
}
