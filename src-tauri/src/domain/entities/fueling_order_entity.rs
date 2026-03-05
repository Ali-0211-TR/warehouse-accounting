use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize, Serializer};
#[cfg(not(any(target_os = "android", target_os = "ios")))]
use ts_rs::TS;

use crate::shared::types::{FuelingType, PresetType};

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
pub struct FuelingOrderEntity {
    pub id: Option<String>,
    pub title: String,
    pub order_item_id: String,
    pub nozzle_id: String,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "string")
    )]
    pub d_created: DateTime<Utc>,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "string|null")
    )]
    pub d_move: Option<DateTime<Utc>>,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number")
    )]
    #[serde(serialize_with = "serialize_decimal_as_f64")]
    pub volume: Decimal,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number")
    )]
    #[serde(serialize_with = "serialize_decimal_as_f64")]
    pub amount: Decimal,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number")
    )]
    #[serde(serialize_with = "serialize_decimal_as_f64")]
    pub preset_volume: Decimal,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number")
    )]
    #[serde(serialize_with = "serialize_decimal_as_f64")]
    pub preset_amount: Decimal,
    pub preset_type: PresetType,
    pub fueling_type: FuelingType,
}

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub enum FuelingOrderColumn {
    Id,
    OrderItemId,
    NozzleId,
    DCreated,
    DMove,
    Volume,
    Amount,
    PresetVolume,
    PresetAmount,
    PresetType,
    FuelingType,
    Title,
}

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub struct FuelingOrderFilter {
    pub id: Option<String>,
    pub order_item_id: Option<String>,
    pub nozzle_id: Option<String>,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "[string, string]|null")
    )]
    pub d_created: Option<(DateTime<Utc>, DateTime<Utc>)>,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "[string, string]|null")
    )]
    pub d_move: Option<(DateTime<Utc>, DateTime<Utc>)>,
    pub fueling_type: Option<FuelingType>,
    pub preset_type: Option<PresetType>,
    pub title: Option<String>,
}
