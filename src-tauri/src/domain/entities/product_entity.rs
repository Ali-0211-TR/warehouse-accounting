use rust_decimal::Decimal;
use serde::{Deserialize, Serialize, Serializer};
#[cfg(not(any(target_os = "android", target_os = "ios")))]
use ts_rs::TS;

use crate::shared::types::ProductType;

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

use super::{
    discount_entity::DiscountEntity, group_entity::GroupEntity, price_entity::PriceEntity,
    tax_entity::TaxEntity, unit_entity::UnitEntity,
};

use crate::shared::types::PriceType;

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub struct ProductEntity {
    pub id: Option<String>,
    pub name: String,
    pub short_name: String,
    pub product_type: ProductType,
    pub unit: Option<UnitEntity>,
    pub bar_code: String, // unique
    pub article: String,  // unique
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number")
    )]
    #[serde(serialize_with = "serialize_decimal_as_f64")]
    pub balance: Decimal,
    pub group: Option<GroupEntity>,
    pub device_id: String,
    // Relations (not in DB but populated)
    pub prices: Vec<PriceEntity>,
    pub discounts: Vec<DiscountEntity>,
    pub taxes: Vec<TaxEntity>,
    // Virtual fields - computed active prices for each type
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number | null")
    )]
    #[serde(serialize_with = "serialize_decimal_as_f64")]
    pub sale_price: Decimal,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number | null")
    )]
    #[serde(serialize_with = "serialize_decimal_as_f64")]
    pub income_price: Decimal,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number | null")
    )]
    #[serde(serialize_with = "serialize_decimal_as_f64")]
    pub outcome_price: Decimal,
    // Sync metadata
    pub created_at: String,
    pub updated_at: String,
    pub deleted_at: Option<String>,
    pub version: i64,
    pub image_paths: Vec<String>,
}

impl ProductEntity {
    /// Helper method to compute the current active price by type from prices vector.
    /// Only considers prices whose start_time <= now (already active).
    /// Among those, picks the one with the latest start_time.
    pub fn compute_price_by_type(prices: &[PriceEntity], price_type: PriceType) -> Decimal {
        let now = chrono::Utc::now();
        prices
            .iter()
            .filter(|p| p.price_type == price_type && p.start_time <= now)
            .max_by_key(|p| p.start_time)
            .map(|p| p.value)
            .unwrap_or(Decimal::ZERO)
    }
}
