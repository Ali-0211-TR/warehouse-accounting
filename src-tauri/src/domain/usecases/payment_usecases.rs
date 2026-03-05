use crate::Result;
use crate::domain::entities::payment_entity::PaymentEntity;
use crate::domain::repositories::{OrderRepository, PaymentRepository};
use crate::infrastructure::repositories::order_repository::OrderManaging;
use crate::shared::ctx::Ctx;

pub async fn add_payment_to_order_usecase(
    ctx: &Ctx,
    order_id: String,
    payment: PaymentEntity,
) -> Result<PaymentEntity> {
    let db = ctx.get_db();

    // Add payment to order
    let updated_order =
        OrderRepository::add_payment_to_order(db, order_id.clone(), payment.clone()).await?;

    // Find and return the newly created payment (use iter() instead of into_iter())
    let created_payment = updated_order
        .payments
        .iter()
        .find(|p| p.summ == payment.summ && p.payment_type == payment.payment_type)
        .cloned()
        .ok_or_else(|| crate::shared::error::Error::Dispenser("payment_not_created".into()))?;

    // Update active orders in context
    let mut active_orders = ctx.active_orders.lock().unwrap();
    if let Some(order) = active_orders
        .iter_mut()
        .find(|o| o.id.as_ref() == Some(&order_id))
    {
        *order = updated_order;
    }

    Ok(created_payment)
}

pub async fn remove_payment_from_order_usecase(
    ctx: &Ctx,
    order_id: String,
    payment_id: String,
) -> Result<()> {
    let db = ctx.get_db();

    // Remove payment from order
    let updated_order =
        OrderRepository::remove_payment_from_order(db, order_id.clone(), payment_id).await?;

    // Update active orders in context
    let mut active_orders = ctx.active_orders.lock().unwrap();
    if let Some(order) = active_orders
        .iter_mut()
        .find(|o| o.id.as_ref() == Some(&order_id))
    {
        *order = updated_order;
    }

    Ok(())
}

pub async fn delete_payment_usecase(ctx: &Ctx, payment_id: String) -> Result<u64> {
    let data = PaymentRepository::delete(ctx.get_db(), payment_id).await?;
    Ok(data)
}
