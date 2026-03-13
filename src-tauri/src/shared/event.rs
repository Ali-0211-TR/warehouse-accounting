use serde::Serialize;
#[cfg(not(any(target_os = "android", target_os = "ios")))]
use ts_rs::TS;

use crate::domain::entities::{
    order_entity::OrderEntity,
    product_entity::ProductEntity,
};

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Serialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub enum HubEvent {
    ActiveOrder(Box<OrderEntity>),
    ProductUpdated(Box<ProductEntity>),
}
