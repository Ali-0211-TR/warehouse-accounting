pub mod order_fetching;
pub mod order_manage;
pub mod shared;

use crate::Result;
use crate::adapters::dtos::{
    LazyTableStateDTO, MetaPaginatorDTO, OrderMovementSummaryMeta, PaginatorDTO,
};
use crate::domain::entities::order_entity::{OrderColumn, OrderEntity, OrderFilter};
use crate::domain::entities::order_item_entity::OrderItemEntity;
use crate::domain::entities::payment_entity::PaymentEntity;
use crate::domain::entities::{
    client_entity::ClientEntity, nozzle_entity::NozzleEntity, product_entity::ProductEntity,
};
use crate::domain::repositories::{FuelingOrderRepository, OrderItemRepository, OrderRepository};
use crate::infrastructure::database::model_store::DataStore;
use crate::shared::error::Error;
use crate::shared::types::{OrderType, PresetType};
use entity::orders as ord;
use rust_decimal::Decimal;
use sea_orm::{ActiveModelTrait, ActiveValue, DatabaseTransaction, EntityTrait, TryIntoModel};
use std::sync::Arc;

// Traits for clear separation of concerns
pub trait OrderFetching {
    async fn get_history(
        db: Arc<DataStore>,
        dispenser_id: String,
        limit: u64,
    ) -> Result<Vec<OrderEntity>>;

    async fn get(
        db: Arc<DataStore>,
        filter: LazyTableStateDTO<OrderFilter, OrderColumn>,
    ) -> Result<PaginatorDTO<OrderEntity>>;

    async fn get_movement_report(
        db: Arc<DataStore>,
        filter: LazyTableStateDTO<OrderFilter, OrderColumn>,
    ) -> Result<MetaPaginatorDTO<OrderEntity, OrderMovementSummaryMeta>>;

    async fn get_by_id(db: Arc<DataStore>, order_id: String) -> Result<OrderEntity>;

    async fn fetch_active_orders(db: Arc<DataStore>) -> Result<Vec<OrderEntity>>;
}

pub trait OrderManaging {
    async fn new_order(
        db: Arc<DataStore>,
        client: Option<ClientEntity>,
        order_type: OrderType,
        device_id: String,
    ) -> Result<OrderEntity>;

    async fn close_order(db: Arc<DataStore>, id: String) -> Result<OrderEntity>;

    async fn add_item_to_order(
        db: Arc<DataStore>,
        product: ProductEntity,
        count: Decimal,
        order: OrderEntity,
    ) -> Result<()>;

    async fn remove_order_item(
        db: Arc<DataStore>,
        order_id: String,
        order_item_id: String,
    ) -> Result<OrderEntity>;

    async fn add_payment_to_order(
        db: Arc<DataStore>,
        order_id: String,
        payment: PaymentEntity,
    ) -> Result<OrderEntity>;

    async fn remove_payment_from_order(
        db: Arc<DataStore>,
        order_id: String,
        payment_id: String,
    ) -> Result<OrderEntity>;

    async fn add_dispenser_order(
        db: Arc<DataStore>,
        nozzle: &NozzleEntity,
        preset_type: PresetType,
        preset: Decimal,
        device_id: String,
    ) -> Result<OrderEntity>;

    async fn stop_fueling(db: Arc<DataStore>, order: OrderEntity) -> Result<OrderEntity>;

    async fn delete(db: Arc<DataStore>, order: OrderEntity) -> Result<u64>;
}

// Re-export shared utilities

impl OrderRepository {
    // === Core Transaction Helpers ===

    async fn save_order_with_totals(
        txn: &DatabaseTransaction,
        order: OrderEntity,
    ) -> Result<ord::Model> {
        let mut active_model: ord::ActiveModel = order.into();
        shared::set_order_sum_and_tax(txn, &mut active_model).await?;

        // Use insert() for new records with pre-generated IDs, save() for updates
        // Check if this is a new record by seeing if id is NotSet (no ID) or Set/Unchanged (has ID)
        let is_new = matches!(active_model.id, ActiveValue::NotSet);

        if is_new {
            // For new records without ID, use save() which will auto-generate
            Ok(active_model.save(txn).await?.try_into_model()?)
        } else {
            // For new records with pre-generated UUID, use insert()
            Ok(active_model.insert(txn).await?)
        }
    }

    async fn get_order_active_model(
        txn: &DatabaseTransaction,
        order_id: String,
    ) -> Result<ord::ActiveModel> {
        let model = ord::Entity::find_by_id(order_id)
            .one(txn)
            .await?
            .ok_or(Error::Dispenser("order_not_found".into()))?;
        Ok(model.into())
    }

    // === Validation Helpers ===

    fn validate_product_and_order(
        product: &ProductEntity,
        order: &OrderEntity,
    ) -> Result<(String, String)> {
        let product_id = product
            .id
            .clone()
            .ok_or(Error::Database("product_id_not_found".into()))?;
        let order_id = order
            .id
            .clone()
            .ok_or(Error::Dispenser("order_id_not_found".into()))?;
        Ok((product_id, order_id))
    }

    fn extract_product_from_nozzle(nozzle: &NozzleEntity) -> Result<ProductEntity> {
        nozzle
            .tank
            .as_ref()
            .and_then(|tank| tank.product.as_ref().cloned())
            .ok_or_else(|| Error::Dispenser("Tank or product unavailable".to_owned()))
    }

    // === Order Item Management ===

    fn create_or_update_order_item(
        order: &OrderEntity,
        product: &ProductEntity,
        count: Decimal,
    ) -> Result<OrderItemEntity> {
        match Self::find_existing_order_item(order, product) {
            Some(existing_item) => {
                Self::update_existing_order_item(existing_item, count, &order.order_type)
            }
            None => OrderItemEntity::from_product(
                product.clone(),
                None,
                count,
                order.id.clone().unwrap(),
                order.order_type.clone(),
            ),
        }
    }

    fn find_existing_order_item<'a>(
        order: &'a OrderEntity,
        product: &ProductEntity,
    ) -> Option<&'a OrderItemEntity> {
        order
            .items
            .iter()
            .find(|item| item.product.as_ref().and_then(|p| p.id.as_ref()) == product.id.as_ref())
    }

    fn update_existing_order_item(
        existing_item: &OrderItemEntity,
        additional_count: Decimal,
        order_type: &OrderType,
    ) -> Result<OrderItemEntity> {
        let mut updated_item = existing_item.clone();
        let new_count = existing_item.count + additional_count;

        // Use the new update_quantity method that handles detailed calculations
        updated_item.update_quantity(new_count, order_type)?;

        Ok(updated_item)
    }

    // === Dispenser Order Helpers ===

    async fn create_dispenser_order_item(
        txn: &DatabaseTransaction,
        db: Arc<DataStore>,
        product: &ProductEntity,
        order_id: String,
        nozzle: &NozzleEntity,
        preset_type: PresetType,
        preset: Decimal,
    ) -> Result<OrderItemEntity> {
        let order_item_entity = OrderItemEntity::from_product(
            product.clone(),
            None,
            Decimal::ZERO,
            order_id,
            OrderType::SaleDispenser,
        )?;

        let order_item = OrderItemRepository::save_transaction(txn, db.clone(), order_item_entity)
            .await
            .map_err(|e| Error::Dispenser(format!("Error on save order item: {}", e)))?;

        let fueling_order = FuelingOrderRepository::create_from_order_item(
            txn,
            &order_item,
            nozzle.id.clone().unwrap(),
            preset_type,
            preset,
        )
        .await?;

        Ok(OrderItemEntity {
            fueling_order: Some(fueling_order),
            ..order_item
        })
    }

    // === Business Logic Helpers ===

    // fn get_price_for_order_type(product: &ProductEntity, order_type: &OrderType) -> Decimal {
    //     match order_type {
    //         OrderType::Sale | OrderType::SaleDispenser | OrderType::Returns => product.sale_price,
    //         OrderType::Income => product.income_price,
    //         OrderType::Outcome => product.outcome_price,
    //     }
    // }

    // async fn update_product_balances_for_order(
    //     txn: &DatabaseTransaction,
    //     db: Arc<DataStore>,
    //     order_id: String,
    // ) -> Result<()> {
    //     let order = OrderRepository::get_by_id(db, order_id).await?;
    //     for item in order.items {
    //         if let Some(product_id) = item.product.and_then(|p| p.id) {
    //             ProductRepository::calc_product_balance(txn, product_id).await?;
    //         }
    //     }
    //     Ok(())
    // }
}
