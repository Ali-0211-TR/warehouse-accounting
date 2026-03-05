use crate::shared::types::{
    DiscountBoundType, DiscountType, DiscountUnitType, OrderType, ProductType,
};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
#[cfg(not(any(target_os = "android", target_os = "ios")))]
use ts_rs::TS;

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub struct DiscountEntity {
    pub id: Option<String>,
    pub name: String,
    pub discount_type: DiscountType,
    pub discount_bound_type: DiscountBoundType,
    pub discount_unit_type: DiscountUnitType,
    pub product_type: Option<ProductType>,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number")
    )]
    pub bound: Decimal,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number")
    )]
    pub value: Decimal,
    pub order_type: OrderType,
    pub device_id: String,
    // Sync metadata
    pub created_at: String,
    pub updated_at: String,
    pub deleted_at: Option<String>,
    pub version: i64,
}

impl DiscountEntity {
    pub fn is_applicable_for_order_type(&self, order_type: &OrderType) -> bool {
        // Add logic to determine if discount applies to this order type
        match order_type {
            OrderType::Sale | OrderType::SaleDispenser => true,
            OrderType::Returns => false, // Maybe no discounts on returns
            OrderType::Income | OrderType::Outcome => false,
        }
    }

    pub fn calculate_amount(&self, base_price: Decimal, quantity: Decimal) -> Decimal {
        match self.discount_type {
            DiscountType::Price => (base_price * quantity * self.value) / Decimal::from(100),
            DiscountType::Card => self.value * quantity,
            // Add other discount types as needed
        }
    }
}
