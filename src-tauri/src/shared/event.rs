use serde::Serialize;
#[cfg(not(any(target_os = "android", target_os = "ios")))]
use ts_rs::TS;

use crate::domain::entities::{
    dispenser_entity::DispenserEntity, order_entity::OrderEntity,
    product_entity::ProductEntity,
};

use super::types::CommResponse;

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Serialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub enum HubEvent {
    DispenserSerial(CommResponse),
    Dispenser(Box<DispenserEntity>),
    DispenserCommStatus { dispenser_id: i32, is_online: bool },
    ActiveOrder(Box<OrderEntity>),
    ProductUpdated(Box<ProductEntity>),
}
