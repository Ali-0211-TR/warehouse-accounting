use super::*;
use crate::domain::entities::payment_entity::PaymentEntity;
use crate::domain::repositories::{OrderItemRepository, OrderRepository, ProductRepository};
use crate::shared::error::Error;
use entity::order_items as OrderItem;
use entity::order_items::{self, Column as OrdItemColumn};
use entity::orders as ord;
use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, EntityTrait, QueryFilter, TransactionTrait,
};

impl OrderManaging for OrderRepository {
    async fn new_order(
        db: Arc<DataStore>,
        client: Option<ClientEntity>,
        order_type: OrderType,
        device_id: String,
    ) -> Result<OrderEntity> {
        let db_conn = db.get_db()?;
        let txn = db_conn.begin().await?;

        // Create order with proper device_id
        let mut order_entity = OrderEntity::new_order(client, order_type);
        order_entity.device_id = device_id; // Set the actual device_id from context
        let order_model = Self::save_order_with_totals(&txn, order_entity).await?;

        txn.commit().await?;
        super::shared::into_entity(db, order_model, vec![]).await
    }

    async fn close_order(db: Arc<DataStore>, id: String) -> Result<OrderEntity> {
        let db_conn = db.get_db()?;
        let txn = db_conn.begin().await?;

        // Update order close time
        let mut active_order = Self::get_order_active_model(&txn, id.clone()).await?;
        active_order.d_move = ActiveValue::Set(Some(chrono::Utc::now()));

        // Save with updated totals
        super::shared::set_order_sum_and_tax(&txn, &mut active_order).await?;
        let saved_order = active_order.save(&txn).await?;
        let order_model = saved_order.try_into_model()?;

        // Validate payments: load only payments (lightweight) instead of full get_by_id
        let payments_list = entity::payments::Entity::find()
            .filter(entity::payments::Column::OrderId.eq(id.clone()))
            .all(&txn)
            .await?;

        let total_payments: rust_decimal::Decimal = payments_list
            .iter()
            .map(|p| p.summ)
            .sum();

        if total_payments != order_model.summ {
            return Err(Error::Validation(format!(
                "Payment total ({}) does not match order total ({})",
                total_payments, order_model.summ
            )));
        }

        // Ensure at least one payment exists (unless order total is 0)
        if payments_list.is_empty()
            && order_model.summ != rust_decimal::Decimal::ZERO
        {
            return Err(Error::Validation(
                "Cannot close order without any payments".to_string(),
            ));
        }

        txn.commit().await?;

        // Single final fetch to return fully-assembled order
        OrderRepository::get_by_id(db, id).await
    }

    async fn add_item_to_order(
        db: Arc<DataStore>,
        product: ProductEntity,
        count: Decimal,
        order: OrderEntity,
    ) -> Result<()> {
        let (product_id, order_id) = Self::validate_product_and_order(&product, &order)?;
        let db_conn = db.get_db()?;
        let txn = db_conn.begin().await?;

        // Create or update order item
        let order_item = Self::create_or_update_order_item(&order, &product, count)?;
        if order_item.count > Decimal::ZERO {
            OrderItemRepository::save_transaction(&txn, db.clone(), order_item).await?;
        } else if let Some(id) = order_item.id {
            order_items::Entity::delete_many()
                .filter(OrdItemColumn::Id.eq(id))
                .exec(&txn)
                .await?;
        }

        // Recalculate order totals by summing order items
        let (sum, tax) = shared::calculate_order_totals(&txn, &order_id).await?;

        // Update the order directly using UpdateMany to bypass version check issues
        let now = chrono::Utc::now().to_rfc3339();
        ord::Entity::update_many()
            .col_expr(ord::Column::Summ, sea_orm::sea_query::Expr::value(sum))
            .col_expr(ord::Column::Tax, sea_orm::sea_query::Expr::value(tax))
            .col_expr(
                ord::Column::UpdatedAt,
                sea_orm::sea_query::Expr::value(now.clone()),
            )
            .col_expr(
                ord::Column::Version,
                sea_orm::sea_query::Expr::col(ord::Column::Version).add(1),
            )
            .filter(ord::Column::Id.eq(order_id.clone()))
            .exec(&txn)
            .await?;

        ProductRepository::calc_product_balance(&txn, product_id).await?;
        txn.commit().await?;
        Ok(())
    }
    async fn remove_order_item(
        db: Arc<DataStore>,
        order_id: String,
        order_item_id: String,
    ) -> Result<OrderEntity> {
        let db_conn = db.get_db()?;
        let txn = db_conn.begin().await?;

        // Get the order item to extract product_id before deletion
        let order_item = OrderItem::Entity::find()
            .filter(OrdItemColumn::Id.eq(order_item_id.clone()))
            .one(&txn)
            .await?
            .ok_or(Error::General("order_item_not_found".into()))?;

        // Verify that the order item belongs to the specified order
        if order_item.order_id != order_id {
            return Err(Error::General("order_item_mismatch".into()));
        }

        let product_id = order_item.product_id;

        // Delete the order item
        order_items::Entity::delete_many()
            .filter(OrdItemColumn::Id.eq(order_item_id))
            .exec(&txn)
            .await?;

        // Update order totals
        let mut active_order = Self::get_order_active_model(&txn, order_id.clone()).await?;
        shared::set_order_sum_and_tax(&txn, &mut active_order).await?;
        active_order.save(&txn).await?;

        // Recalculate product balance
        ProductRepository::calc_product_balance(&txn, product_id).await?;

        txn.commit().await?;

        // Return the updated order
        OrderRepository::get_by_id(db, order_id).await
    }

    async fn delete(db: Arc<DataStore>, order: OrderEntity) -> Result<u64> {
        let order_id = order
            .id
            .ok_or(Error::General("order_id_not_found".into()))?;

        let db_conn = db.get_db()?;
        let txn = db_conn.begin().await?;

        // Get all product IDs from order items before deletion
        let product_ids: Vec<String> = order
            .items
            .iter()
            .filter_map(|item| item.product.as_ref().and_then(|p| p.id.clone()))
            .collect();

        // Get all order_item IDs for cascade deletion
        let order_item_ids: Vec<String> = order
            .items
            .iter()
            .filter_map(|item| item.id.clone())
            .collect();

        // ====================================
        // Delete in correct order (FK constraints)
        // ====================================

        // 1. Delete photos linked to this order
        entity::photos::Entity::delete_many()
            .filter(entity::photos::Column::OrderId.eq(order_id.clone()))
            .exec(&txn)
            .await?;

        // 2. Delete payments linked to this order
        entity::payments::Entity::delete_many()
            .filter(entity::payments::Column::OrderId.eq(order_id.clone()))
            .exec(&txn)
            .await?;

        if !order_item_ids.is_empty() {
            // 3. Delete order_item_discounts linked to order_items
            entity::order_item_discounts::Entity::delete_many()
                .filter(
                    entity::order_item_discounts::Column::OrderItemId.is_in(order_item_ids.clone()),
                )
                .exec(&txn)
                .await?;

            // 4. Delete order_item_taxes linked to order_items
            entity::order_item_taxes::Entity::delete_many()
                .filter(entity::order_item_taxes::Column::OrderItemId.is_in(order_item_ids.clone()))
                .exec(&txn)
                .await?;
        }

        // 6. Delete order_items
        OrderItem::Entity::delete_many()
            .filter(OrderItem::Column::OrderId.eq(order_id.clone()))
            .exec(&txn)
            .await?;

        // 7. Delete the order itself
        let delete_result = ord::Entity::delete_many()
            .filter(ord::Column::Id.eq(order_id))
            .exec(&txn)
            .await?;

        // Recalculate product balance for each affected product
        for product_id in product_ids {
            ProductRepository::calc_product_balance(&txn, product_id).await?;
        }

        txn.commit().await?;

        Ok(delete_result.rows_affected)
    }

    async fn add_payment_to_order(
        db: Arc<DataStore>,
        order_id: String,
        payment: PaymentEntity,
    ) -> Result<OrderEntity> {
        use entity::payments;

        let db_conn = db.get_db()?;
        let txn = db_conn.begin().await?;

        // Create payment with order_id
        let payment_model = payments::ActiveModel {
            id: ActiveValue::Set(
                payment
                    .id
                    .clone()
                    .unwrap_or_else(|| uuid::Uuid::new_v4().to_string()),
            ),
            order_id: ActiveValue::Set(order_id.clone()),
            payment_type: ActiveValue::Set(format!("{:?}", payment.payment_type)), // Convert enum to String
            summ: ActiveValue::Set(payment.summ),
            delivery: ActiveValue::Set(payment.delivery),
            transaction: ActiveValue::Set(payment.transaction),
            ticket: ActiveValue::Set(payment.ticket),
            discard: ActiveValue::Set(payment.discard),
            data: ActiveValue::Set(payment.data),
            card_id: ActiveValue::Set(None), // TODO: Handle card relationship
            created_at: ActiveValue::Set(payment.created_at),
            updated_at: ActiveValue::Set(chrono::Utc::now().to_rfc3339()),
            deleted_at: ActiveValue::Set(payment.deleted_at),
            version: ActiveValue::Set(payment.version),
        };

        payment_model.insert(&txn).await?;

        txn.commit().await?;

        // Get updated order with payments
        OrderRepository::get_by_id(db, order_id).await
    }

    async fn remove_payment_from_order(
        db: Arc<DataStore>,
        order_id: String,
        payment_id: String,
    ) -> Result<OrderEntity> {
        use entity::payments;
        use sea_orm::{ColumnTrait, EntityTrait, QueryFilter};

        let db_conn = db.get_db()?;
        let txn = db_conn.begin().await?;

        // Verify payment belongs to this order
        let payment = payments::Entity::find()
            .filter(payments::Column::Id.eq(payment_id.clone()))
            .one(&txn)
            .await?
            .ok_or(Error::General("payment_not_found".into()))?;

        if payment.order_id != order_id {
            return Err(Error::General("payment_order_mismatch".into()));
        }

        // Delete the payment
        payments::Entity::delete_by_id(payment_id)
            .exec(&txn)
            .await?;

        txn.commit().await?;

        // Return updated order
        OrderRepository::get_by_id(db, order_id).await
    }
}
