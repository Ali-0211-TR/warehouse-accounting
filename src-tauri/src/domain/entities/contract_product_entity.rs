use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
#[cfg(not(any(target_os = "android", target_os = "ios")))]
use ts_rs::TS;

use super::{discount_entity::DiscountEntity, product_entity::ProductEntity};

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub struct ContractProductEntity {
    pub id: Option<String>,
    pub contract_id: String,
    pub product: Option<ProductEntity>,
    pub order_items: Vec<ContractProductOrderItem>,
    pub article: i32,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number")
    )]
    pub count: Decimal,
    pub discount: Option<DiscountEntity>,
}

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub struct ContractProductOrderItem {
    pub id: String,
    pub order_id: String,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number")
    )]
    pub count: Decimal,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number")
    )]
    pub price: Decimal,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number")
    )]
    pub discount: Decimal,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number")
    )]
    pub cost: Decimal,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number")
    )]
    pub tax: Decimal,
}

// // Moving the DTO here from params.rs
// #[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
// #[derive(Deserialize, Serialize)]
// #[cfg_attr(not(any(target_os = "android", target_os = "ios")), ts(export, export_to = "../../src-ui/shared/bindings/"))]
// pub struct ContractProductParams {
//     pub id: String,
//     pub contract_id: String,
//     pub product_id: String,
//     pub product_name: String,
//     pub product_type: String,
//     #[cfg_attr(not(any(target_os = "android", target_os = "ios")), ts(type = "number"))]
//     pub price: Decimal,
// }

impl ContractProductEntity {
    pub fn reduce_count(&mut self, amount: rust_decimal::Decimal) -> Result<(), String> {
        // Check that available count is sufficient
        if self.count < amount {
            return Err("Insufficient contract product count".into());
        }
        self.count -= amount;
        Ok(())
    }
}
