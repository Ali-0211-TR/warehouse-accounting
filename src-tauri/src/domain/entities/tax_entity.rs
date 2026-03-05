use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
#[cfg(not(any(target_os = "android", target_os = "ios")))]
use ts_rs::TS;

use crate::shared::types::OrderType;

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub struct TaxEntity {
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
    pub device_id: String,
    // Sync metadata
    pub created_at: String,
    pub updated_at: String,
    pub deleted_at: Option<String>,
    pub version: i64,
}

impl TaxEntity {
    pub fn is_applicable_for_order_type(&self, order_type: &OrderType) -> bool {
        // Add logic to determine if tax applies to this order type
        match order_type {
            OrderType::Sale | OrderType::SaleDispenser | OrderType::Returns => true,
            OrderType::Income | OrderType::Outcome => false, // Maybe no tax on internal transfers
        }
    }
}
