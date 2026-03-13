use crate::Result;
use crate::domain::entities::client_entity::ClientEntity;
use crate::domain::entities::order_entity::{OrderColumn, OrderEntity};
use crate::domain::entities::order_item_entity::OrderItemEntity;
use crate::domain::entities::payment_entity::PaymentEntity;
use crate::domain::repositories::ClientRepository;
use crate::infrastructure::database::model_store::DataStore;
use crate::shared::types::{OrderType, PaymentType};
use entity::{order_items as OrderItem, orders as ord};
use rust_decimal::Decimal;
use sea_orm::{
    ActiveValue, ColumnTrait, DatabaseTransaction, EntityTrait, QueryFilter, QuerySelect,
};
use std::collections::HashMap;
use std::str::FromStr;
use std::sync::Arc;

pub async fn into_entity(
    db: Arc<DataStore>,
    model: ord::Model,
    items: Vec<OrderItemEntity>,
) -> Result<OrderEntity> {
    use entity::payments;

    let client = match model.client_id {
        Some(client_id) => ClientRepository::get_by_id(db.clone(), client_id)
            .await
            .ok(),
        None => None,
    };

    // Fetch payments for this order
    let db_conn = db.get_db()?;
    let payment_models = payments::Entity::find()
        .filter(payments::Column::OrderId.eq(model.id.clone()))
        .all(db_conn)
        .await?;

    // Convert payment models to entities
    let payments_vec = payment_models
        .into_iter()
        .map(|p| PaymentEntity {
            id: Some(p.id),
            order: None, // Don't create circular reference
            payment_type: PaymentType::from_str(&p.payment_type).unwrap_or_default(),
            summ: p.summ,
            delivery: p.delivery,
            transaction: p.transaction,
            ticket: p.ticket,
            discard: p.discard,
            data: p.data,
            created_at: p.created_at,
            updated_at: p.updated_at,
            deleted_at: p.deleted_at,
            version: p.version,
        })
        .collect();

    Ok(OrderEntity {
        id: Some(model.id),
        device_id: model.device_id,
        order_type: OrderType::from_str(&model.order_type).unwrap_or_default(),
        d_created: model.d_created,
        d_move: model.d_move,
        summ: model.summ,
        tax: model.tax,
        discard: model.discard,
        client,
        items,
        payments: payments_vec,
        pictures: vec![],
        created_at: model.created_at,
        updated_at: model.updated_at,
        deleted_at: model.deleted_at,
        version: model.version,
    })
}

/// Build OrderEntity from pre-loaded clients and payments maps (no DB call per order).
/// Used in batch operations to avoid N+1 queries.
pub fn into_entity_with_preloaded(
    model: ord::Model,
    items: Vec<OrderItemEntity>,
    clients_map: &HashMap<String, ClientEntity>,
    payments_map: &HashMap<String, Vec<PaymentEntity>>,
) -> OrderEntity {
    let client = model
        .client_id
        .as_ref()
        .and_then(|cid| clients_map.get(cid).cloned());

    let payments_vec = payments_map
        .get(&model.id)
        .cloned()
        .unwrap_or_default();

    OrderEntity {
        id: Some(model.id),
        device_id: model.device_id,
        order_type: OrderType::from_str(&model.order_type).unwrap_or_default(),
        d_created: model.d_created,
        d_move: model.d_move,
        summ: model.summ,
        tax: model.tax,
        discard: model.discard,
        client,
        items,
        payments: payments_vec,
        pictures: vec![],
        created_at: model.created_at,
        updated_at: model.updated_at,
        deleted_at: model.deleted_at,
        version: model.version,
    }
}

pub async fn calculate_order_totals(
    transaction: &DatabaseTransaction,
    order_id: &str,
) -> Result<(Decimal, Decimal)> {
    let res: (Option<Decimal>, Option<Decimal>) = OrderItem::Entity::find()
        .select_only()
        .filter(OrderItem::Column::OrderId.eq(order_id))
        .column_as(OrderItem::Column::Cost.sum(), "sum_of_cost")
        .column_as(OrderItem::Column::Tax.sum(), "sum_of_tax")
        .into_tuple()
        .one(transaction)
        .await?
        .unwrap_or((None, None));

    let sum = res.0.unwrap_or(Decimal::ZERO);
    let tax = res.1.unwrap_or(Decimal::ZERO);

    Ok((sum, tax))
}

pub async fn set_order_sum_and_tax(
    transaction: &DatabaseTransaction,
    data: &mut ord::ActiveModel,
) -> Result<()> {
    let id: String = match &data.id {
        ActiveValue::Set(val) | ActiveValue::Unchanged(val) => val.clone(),
        ActiveValue::NotSet => return Ok(()),
    };

    let (sum, tax) = calculate_order_totals(transaction, &id).await?;

    data.summ = ActiveValue::Set(sum);
    data.tax = ActiveValue::Set(tax);

    Ok(())
}

// Implement conversion traits
impl From<OrderEntity> for ord::ActiveModel {
    fn from(entity: OrderEntity) -> Self {
        ord::ActiveModel {
            // Use Set for id when it exists (for insert with UUID), NotSet when None
            id: entity.id.map_or(ActiveValue::NotSet, ActiveValue::Set),
            device_id: ActiveValue::Set(entity.device_id),
            order_type: ActiveValue::Set(entity.order_type.to_string()),
            d_created: ActiveValue::Set(entity.d_created),
            d_move: ActiveValue::Set(entity.d_move),
            summ: ActiveValue::Set(entity.summ),
            tax: ActiveValue::Set(entity.tax),
            discard: ActiveValue::Set(entity.discard),
            client_id: ActiveValue::Set(entity.client.and_then(|c| c.id)),
            contract_id: ActiveValue::Set(None),
            contract_car_id: ActiveValue::Set(None),
            created_at: ActiveValue::Set(entity.created_at),
            updated_at: ActiveValue::Set(entity.updated_at),
            deleted_at: ActiveValue::Set(entity.deleted_at),
            version: ActiveValue::Set(entity.version),
        }
    }
}

impl From<OrderColumn> for entity::orders::Column {
    fn from(order_column: OrderColumn) -> Self {
        match order_column {
            OrderColumn::Id => entity::orders::Column::Id,
            OrderColumn::OrderType => entity::orders::Column::OrderType,
            OrderColumn::DCreated => entity::orders::Column::DCreated,
            OrderColumn::DMove => entity::orders::Column::DMove,
            OrderColumn::Summ => entity::orders::Column::Summ,
            OrderColumn::Tax => entity::orders::Column::Tax,
            OrderColumn::Discard => entity::orders::Column::Discard,
            OrderColumn::ClientId => entity::orders::Column::ClientId,
        }
    }
}
