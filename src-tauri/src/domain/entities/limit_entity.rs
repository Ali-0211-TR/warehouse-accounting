use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
#[cfg(not(any(target_os = "android", target_os = "ios")))]
use ts_rs::TS;

use crate::shared::types::LimitType;

use super::{discount_entity::DiscountEntity, product_entity::ProductEntity};

// #[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
// #[derive(Debug, Deserialize, Serialize, Clone)]
// #[cfg_attr(not(any(target_os = "android", target_os = "ios")), ts(export, export_to = "../../src-ui/shared/bindings/"))]
// pub enum LimitColumn {
//     Id,
//     CardId,
//     LimitType,
//     ProductId,
//     DBegin,
//     DEnd,
//     IncludeHolidays,
//     LimitValue,
//     DiscountId,
//     Comment,
// }

// #[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
// #[derive(Debug, Deserialize, Serialize, Clone)]
// #[cfg_attr(not(any(target_os = "android", target_os = "ios")), ts(export, export_to = "../../src-ui/shared/bindings/"))]
// pub struct LimitFilter {
//     pub id: Option<u32>,
//     pub card_id: Option<u32>,
//     pub limit_type: Option<LimitType>,
//     pub product_id: Option<u32>,
//     pub include_holidays: Option<bool>,
// }

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub struct LimitEntity {
    pub id: Option<String>,
    pub limit_type: LimitType,
    pub product: Option<ProductEntity>,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "string")
    )]
    pub d_begin: DateTime<Utc>,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "string")
    )]
    pub d_end: DateTime<Utc>,
    pub include_holidays: bool,
    pub limit_value: f64,
    pub discount: Option<DiscountEntity>,
    pub comment: String,
}
