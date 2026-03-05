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
pub struct ContractProductDTO {
    pub id: Option<String>,
    pub device_id: String,
    pub contract_id: String,
    pub product_id: Option<String>,
    pub article: i32,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number")
    )]
    pub count: Decimal,
    pub discount_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub deleted_at: Option<String>,
    pub version: i64,
}

// #[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
// #[derive(Debug, Deserialize, Serialize, Clone)]
// #[cfg_attr(not(any(target_os = "android", target_os = "ios")), ts(export, export_to = "../../src-ui/shared/bindings/"))]
// pub struct ContractProductOrderItemDTO {
//     pub id: String,
//     pub order_id: String,
//     #[cfg_attr(not(any(target_os = "android", target_os = "ios")), ts(type = "number"))]
//     pub count: Decimal,
//     #[cfg_attr(not(any(target_os = "android", target_os = "ios")), ts(type = "number"))]
//     pub price: Decimal,
//     #[cfg_attr(not(any(target_os = "android", target_os = "ios")), ts(type = "number"))]
//     pub discount: Decimal,
//     #[cfg_attr(not(any(target_os = "android", target_os = "ios")), ts(type = "number"))]
//     pub cost: Decimal,
//     #[cfg_attr(not(any(target_os = "android", target_os = "ios")), ts(type = "number"))]
//     pub tax: Decimal,
// }
