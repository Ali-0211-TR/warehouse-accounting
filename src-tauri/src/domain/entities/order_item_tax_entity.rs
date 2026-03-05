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

// Custom serializer for Option<Decimal> as Option<f64>
fn serialize_option_decimal_as_f64<S>(
    decimal: &Option<Decimal>,
    serializer: S,
) -> std::result::Result<S::Ok, S::Error>
where
    S: Serializer,
{
    match decimal {
        Some(d) => {
            let f64_value = d.to_string().parse::<f64>().unwrap_or(0.0);
            serializer.serialize_some(&f64_value)
        }
        None => serializer.serialize_none(),
    }
}

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub struct OrderItemTaxEntity {
    pub id: Option<String>,
    pub order_item_id: String,
    pub name: String,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number")
    )]
    #[serde(serialize_with = "serialize_decimal_as_f64")]
    pub value: Decimal,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number")
    )]
    #[serde(serialize_with = "serialize_option_decimal_as_f64")]
    pub rate: Option<Decimal>,
}
