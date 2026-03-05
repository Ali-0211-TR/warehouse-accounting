use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
#[cfg(not(any(target_os = "android", target_os = "ios")))]
use ts_rs::TS;

use crate::shared::types::PaymentType;

// #[ts(export, export_to = "../../src-ui/shared/bindings/dtos/")]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/dtos/")
)]
pub struct CloseOrderDTO {
    pub order_id: String,
    pub payments: Vec<PaymentDTO>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/dtos/")
)]
pub struct PaymentDTO {
    pub payment_type: PaymentType,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number")
    )]
    pub summ: Decimal,
    pub delivery: i32,
    pub transaction: String,
    pub ticket: String,
    pub data: String,
    pub card_id: Option<String>,
}

// use chrono::{DateTime, Utc};
// use rust_decimal::Decimal;
// use serde::{Deserialize, Serialize};
// #[cfg(not(any(target_os = "android", target_os = "ios")))]
// use ts_rs::TS;

// use crate::shared::types::OrderType;

// #[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
// #[derive(Debug, Deserialize, Serialize, Clone)]
// #[cfg_attr(not(any(target_os = "android", target_os = "ios")), ts(export, export_to = "../../src-ui/shared/bindings/"))]
// pub struct OrderDTO {
//     pub id: Option<String>,
//     pub device_id: String,
//     pub order_type: OrderType,
//     #[cfg_attr(not(any(target_os = "android", target_os = "ios")), ts(type = "string"))]
//     pub d_created: DateTime<Utc>,
//     #[cfg_attr(not(any(target_os = "android", target_os = "ios")), ts(type = "string"))]
//     pub d_move: Option<DateTime<Utc>>,
//     #[cfg_attr(not(any(target_os = "android", target_os = "ios")), ts(type = "number"))]
//     pub summ: Decimal,
//     #[cfg_attr(not(any(target_os = "android", target_os = "ios")), ts(type = "number"))]
//     pub tax: Decimal,
//     pub discard: Option<String>,
//     pub client_id: Option<String>,
//     pub contract_id: Option<String>,
//     pub contract_car_id: Option<String>,
//     pub item_ids: Vec<String>,
//     pub fueling_order_item_id: Option<String>,
//     pub picture_ids: Vec<String>,
//     pub created_at: String,
//     pub updated_at: String,
//     pub deleted_at: Option<String>,
//     pub version: i64,
// }

// #[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
// #[derive(Debug, Deserialize, Serialize, Clone)]
// #[cfg_attr(not(any(target_os = "android", target_os = "ios")), ts(export, export_to = "../../src-ui/shared/bindings/"))]
// pub struct OrderFilterDTO {
//     pub id: Option<u32>,
//     pub client_id: Option<u32>,
//     pub company: Option<String>,
//     pub order_type: Option<OrderType>,
//     #[cfg_attr(not(any(target_os = "android", target_os = "ios")), ts(type = "[string, string]|null"))]
//     pub d_move: Option<(DateTime<Utc>, DateTime<Utc>)>,
// }

// #[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
// #[derive(Debug, Deserialize, Serialize, Clone)]
// #[cfg_attr(not(any(target_os = "android", target_os = "ios")), ts(export, export_to = "../../src-ui/shared/bindings/"))]
// pub struct CreateOrderDTO {
//     pub order_type: OrderType,
//     pub client_id: Option<String>,
//     pub contract_car_id: Option<String>,
//     pub contract_id: Option<String>,
// }
