use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize, Serializer};
#[cfg(not(any(target_os = "android", target_os = "ios")))]
use ts_rs::TS;

use crate::shared::types::PriceType;

// Custom serializer for Decimal as f64
fn serialize_decimal_as_f64<S>(
    decimal: &Decimal,
    serializer: S,
) -> std::result::Result<S::Ok, S::Error>
where
    S: Serializer,
{
    let f64_value = decimal.to_string().parse::<f64>().unwrap_or(0.0);
    serializer.serialize_f64(f64_value)
}

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub struct PriceEntity {
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
    #[serde(serialize_with = "serialize_decimal_as_f64")]
    pub value: Decimal,
    pub price_type: PriceType,
    pub device_id: String,
    // Sync metadata
    pub created_at: String,
    pub updated_at: String,
    pub deleted_at: Option<String>,
    pub version: i64,
}
