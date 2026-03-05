use rust_decimal::Decimal;
use serde::{Deserialize, Serialize, Serializer};
#[cfg(not(any(target_os = "android", target_os = "ios")))]
use ts_rs::TS;

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

/// Filter for product movement report
#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/dtos/")
)]
pub struct ProductMovementFilter {
    /// Start of the period (ISO 8601 string)
    pub date_from: String,
    /// End of the period (ISO 8601 string)
    pub date_to: String,
    /// Optional: filter by specific product ID
    pub product_id: Option<String>,
}

/// Movement data per product for the specified period
#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/dtos/")
)]
pub struct ProductMovementItem {
    pub product_id: String,
    pub product_name: String,
    pub product_short_name: Option<String>,
    pub unit_name: Option<String>,

    /// Balance before the period started
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number")
    )]
    #[serde(serialize_with = "serialize_decimal_as_f64")]
    pub start_balance: Decimal,

    /// Quantity purchased (Income orders) during the period
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number")
    )]
    #[serde(serialize_with = "serialize_decimal_as_f64")]
    pub income_qty: Decimal,

    /// Quantity sold (Sale + SaleDispenser orders) during the period
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number")
    )]
    #[serde(serialize_with = "serialize_decimal_as_f64")]
    pub sale_qty: Decimal,

    /// Quantity returned by customers (Returns orders) during the period
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number")
    )]
    #[serde(serialize_with = "serialize_decimal_as_f64")]
    pub returns_qty: Decimal,

    /// Quantity returned to provider (Outcome orders) during the period
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number")
    )]
    #[serde(serialize_with = "serialize_decimal_as_f64")]
    pub outcome_qty: Decimal,

    /// Calculated end balance = start_balance + income_qty + returns_qty - sale_qty - outcome_qty
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number")
    )]
    #[serde(serialize_with = "serialize_decimal_as_f64")]
    pub end_balance: Decimal,

    /// Difference (end_balance - start_balance)
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number")
    )]
    #[serde(serialize_with = "serialize_decimal_as_f64")]
    pub diff: Decimal,
}

/// Full product movement report response
#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/dtos/")
)]
pub struct ProductMovementReport {
    pub items: Vec<ProductMovementItem>,
    pub date_from: String,
    pub date_to: String,
}
