// use rust_decimal::Decimal;
// use serde::{Deserialize, Serialize};
// #[cfg(not(any(target_os = "android", target_os = "ios")))]
// use ts_rs::TS;

// #[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
// #[derive(Debug, Deserialize, Serialize, Clone)]
// #[cfg_attr(not(any(target_os = "android", target_os = "ios")), ts(export, export_to = "../../src-ui/shared/bindings/"))]
// pub struct OrderItemDTO {
//     pub id: Option<String>,
//     pub order_id: String,
//     pub product_id: Option<String>,
//     pub contract_product_id: Option<String>,
//     pub fueling_order_id: Option<String>,
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

// #[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
// #[derive(Debug, Deserialize, Serialize, Clone)]
// #[cfg_attr(not(any(target_os = "android", target_os = "ios")), ts(export, export_to = "../../src-ui/shared/bindings/"))]
// pub struct CreateOrderItemDTO {
//     pub order_id: String,
//     pub product_id: String,
//     pub fueling_order_id: Option<String>,
//     #[cfg_attr(not(any(target_os = "android", target_os = "ios")), ts(type = "number"))]
//     pub count: Decimal,
// }
