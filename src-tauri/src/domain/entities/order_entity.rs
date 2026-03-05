use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize, Serializer};
#[cfg(not(any(target_os = "android", target_os = "ios")))]
use ts_rs::TS;

use crate::domain::entities::payment_entity::PaymentEntity;
use crate::shared::types::OrderType;

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
    client_entity::ClientEntity, contract_car_entity::ContractCarEntity,
    contract_entity::ContractEntity, order_item_entity::OrderItemEntity,
    picture_entity::PictureEntity,
};

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub enum OrderColumn {
    Id,
    OrderType,
    DCreated,
    DMove,
    Summ,
    Tax,
    Discard,
    ClientId,
    ContractId,
    ContractCarId,
}

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub struct OrderFilter {
    pub id: Option<String>,
    pub client_id: Option<String>,
    pub company: Option<String>,
    pub order_type: Option<OrderType>,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "[string, string]|null")
    )]
    pub d_move: Option<(DateTime<Utc>, DateTime<Utc>)>,
}

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub struct OrderEntity {
    pub id: Option<String>,
    pub order_type: OrderType,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "string")
    )]
    pub d_created: DateTime<Utc>,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "string")
    )]
    pub d_move: Option<DateTime<Utc>>,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number")
    )]
    #[serde(serialize_with = "serialize_decimal_as_f64")]
    pub summ: Decimal,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number")
    )]
    #[serde(serialize_with = "serialize_decimal_as_f64")]
    pub tax: Decimal,
    pub discard: Option<String>,
    pub client: Option<ClientEntity>,
    pub contract: Option<ContractEntity>,
    pub contract_car: Option<ContractCarEntity>,
    pub items: Vec<OrderItemEntity>,
    pub fueling_order_item_id: Option<String>,
    pub payments: Vec<PaymentEntity>,
    pub pictures: Vec<PictureEntity>,
    pub device_id: String,
    // Sync metadata
    pub created_at: String,
    pub updated_at: String,
    pub deleted_at: Option<String>,
    pub version: i64,
}

impl OrderEntity {
    pub fn new_order(
        client: Option<ClientEntity>,
        order_type: OrderType,
        contract_car: Option<ContractCarEntity>,
    ) -> OrderEntity {
        OrderEntity {
            id: Some(uuid::Uuid::new_v4().to_string()), // Generate UUID for new orders
            order_type,
            d_created: Utc::now(),
            d_move: None,
            summ: Decimal::new(0, 0),
            tax: Decimal::new(0, 0),
            discard: None,
            client,
            items: [].to_vec(),
            fueling_order_item_id: None,
            pictures: [].to_vec(),
            payments: [].to_vec(),
            contract: None,
            contract_car,
            device_id: "singleton".to_string(),
            created_at: "CURRENT_TIMESTAMP".to_string(),
            updated_at: "CURRENT_TIMESTAMP".to_string(),
            deleted_at: None,
            version: 1,
        }
    }

    pub fn get_fueling_item(&mut self) -> Option<&mut OrderItemEntity> {
        self.items
            .iter_mut()
            .find(|i| i.id == self.fueling_order_item_id)
    }
    pub fn has_active_fueling_item(&self) -> bool {
        self.items.iter().any(|i| {
            i.fueling_order.is_some() && i.fueling_order.as_ref().unwrap().d_move.is_none()
        })
    }

    pub fn get_fueling_nozzle_id(&self) -> Option<String> {
        self.items
            .iter()
            .find(|i| i.fueling_order.is_some())
            .and_then(|i| i.fueling_order.as_ref().map(|f| f.nozzle_id.clone()))
    }
}
