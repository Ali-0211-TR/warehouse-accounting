use crate::shared::types::{
    DiscountBoundType, DiscountType, DiscountUnitType, OrderType, ProductType,
};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
#[cfg(not(any(target_os = "android", target_os = "ios")))]
use ts_rs::TS;

use crate::domain::entities::discount_entity::DiscountEntity;

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub struct DiscountDTO {
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
}

impl DiscountDTO {
    pub fn into_entity(self, device_id: String) -> DiscountEntity {
        DiscountEntity {
            id: self.id,
            device_id,
            name: self.name,
            discount_type: self.discount_type,
            discount_bound_type: self.discount_bound_type,
            discount_unit_type: self.discount_unit_type,
            product_type: self.product_type,
            bound: self.bound,
            value: self.value,
            order_type: self.order_type,
            created_at: String::new(),
            updated_at: String::new(),
            deleted_at: None,
            version: 0,
        }
    }
}
