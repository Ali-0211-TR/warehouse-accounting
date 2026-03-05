use crate::Result;
use crate::adapters::dtos::{
    CloseOrderDTO, LazyTableStateDTO, MetaPaginatorDTO, OrderMovementSummaryMeta, PaginatorDTO,
};
use crate::domain::entities::order_entity::{OrderColumn, OrderEntity, OrderFilter};
use crate::domain::entities::payment_entity::PaymentEntity;
use crate::domain::entities::product_entity::ProductEntity;
use crate::domain::repositories::{ClientRepository, OrderRepository, ProductRepository};
use crate::infrastructure::repositories::order_repository::{OrderFetching, OrderManaging};
use crate::shared::ctx::dispenser_ops::DispenserOps;
use crate::shared::ctx::{Authorisation, Ctx};
use crate::shared::error::Error;
use crate::shared::event::HubEvent;
use crate::shared::types::{OrderType, ProductType, RoleType};
use rust_decimal::Decimal;

pub async fn close_fueling_usecase(ctx: &Ctx, order_id: String) -> Result<OrderEntity> {
    let order = ctx
        .active_orders
        .lock()
        .unwrap()
        .iter()
        .find(|o| o.id.as_ref() == Some(&order_id))
        .cloned()
        .ok_or(Error::Dispenser("order_not_found".to_owned()))?;

    if let Some(nozzle_id) = order.get_fueling_nozzle_id() {
        if let Some(dispenser) = ctx.get_dispesner_by_nozzle_id(nozzle_id) {
            if dispenser.fueling_state.start {
                println!("Dispenser fueling state:  {}", dispenser.fueling_state);
                return Err(Error::Dispenser("dispenser_is_fueling".to_owned()));
            }
        } else {
            return Err(Error::Dispenser("dispenser_not_found".to_owned()));
        }
    }

    // OrderRepository::close_order(ctx.get_db().clone(), order_id).await

    let updated_order = OrderRepository::stop_fueling(ctx.get_db().clone(), order).await?;

    // Remove closed order from active orders directly
    // ctx.active_orders
    //     .lock()
    //     .unwrap()
    //     .retain(|o| o.id != Some(order_id));
    let mut active_orders = ctx.active_orders.lock().unwrap();
    if let Some(order) = active_orders
        .iter_mut()
        .find(|order| order.id.as_ref() == Some(&order_id))
    {
        *order = updated_order.clone();
    }

    // Clear fueling_order_id if set on a matching nozzle
    if let Some(nozzle_id) = updated_order.get_fueling_nozzle_id() {
        if let Some(mut dispenser) = ctx.get_dispesner_by_nozzle_id(nozzle_id.clone()) {
            if let Some(nozzle) = dispenser
                .nozzles
                .iter_mut()
                .find(|n| n.id.as_ref() == Some(&nozzle_id))
            {
                nozzle.fueling_order_id = None;
            }
            ctx.emit_hub_event(HubEvent::Dispenser(Box::new((*dispenser).clone())));
        }
    }

    Ok(updated_order)
}

pub async fn close_order_usecase(ctx: &Ctx, params: CloseOrderDTO) -> Result<OrderEntity> {
    let order = ctx
        .active_orders
        .lock()
        .unwrap()
        .iter()
        .find(|o| o.id.as_ref() == Some(&params.order_id))
        .cloned()
        .ok_or(Error::Dispenser("order_not_found".to_owned()))?;

    let db = ctx.get_db();

    // If payments are provided in the DTO, validate and create them first
    if !params.payments.is_empty() {
        // Validate payments sum equals order total
        let payments_sum: Decimal = params.payments.iter().map(|p| p.summ).sum();

        if (payments_sum - order.summ).abs() > Decimal::new(1, 2) {
            // Allow 0.01 difference for rounding
            return Err(Error::Validation(format!(
                "Payments sum ({}) must equal order total ({})",
                payments_sum, order.summ
            )));
        }

        // Clear any existing payments for this order (in case of retry after failure)
        use crate::infrastructure::repositories::order_repository::OrderManaging;
        use entity::payments;
        use sea_orm::{ColumnTrait, EntityTrait, QueryFilter};

        let db_conn = db.get_db()?;
        payments::Entity::delete_many()
            .filter(payments::Column::OrderId.eq(params.order_id.clone()))
            .exec(db_conn)
            .await?;

        // Create payments BEFORE closing
        for payment_dto in params.payments {
            let payment_entity = PaymentEntity {
                id: Some(uuid::Uuid::new_v4().to_string()),
                order: None,
                payment_type: payment_dto.payment_type,
                summ: payment_dto.summ,
                delivery: payment_dto.delivery,
                transaction: payment_dto.transaction,
                ticket: payment_dto.ticket,
                discard: None,
                data: payment_dto.data,
                card: None, // TODO: Handle card_id to CardEntity conversion if needed
                created_at: chrono::Utc::now().to_rfc3339(),
                updated_at: chrono::Utc::now().to_rfc3339(),
                deleted_at: None,
                version: 1,
            };

            OrderRepository::add_payment_to_order(
                db.clone(),
                params.order_id.clone(),
                payment_entity,
            )
            .await?;
        }
    }

    // Check fueling state
    if let Some(nozzle_id) = order.get_fueling_nozzle_id() {
        if let Some(dispenser) = ctx.get_dispesner_by_nozzle_id(nozzle_id) {
            if dispenser.fueling_state.start {
                return Err(Error::Dispenser("dispenser_is_fueling".to_owned()));
            }
        } else {
            return Err(Error::Dispenser("dispenser_not_found".to_owned()));
        }
    }

    if order.has_active_fueling_item() {
        return Err(Error::Dispenser("order_has_active_fueling".to_owned()));
    }

    // Now close the order (will validate payments exist and sum matches)
    let updated_order = OrderRepository::close_order(db.clone(), params.order_id.clone()).await?;

    // Remove from active orders
    let mut active_orders = ctx.active_orders.lock().unwrap();
    active_orders.retain(|o| o.id.as_ref() != Some(&params.order_id));

    // Reset dispenser preset to 0 if this order had a fueling component
    if let Some(nozzle_id) = order.get_fueling_nozzle_id() {
        if let Some(dispenser) = ctx.get_dispesner_by_nozzle_id(nozzle_id.clone()) {
            // Find the nozzle to get its address and price
            if let Some(nozzle) = dispenser
                .nozzles
                .iter()
                .find(|n| n.id.as_ref() == Some(&nozzle_id))
            {
                let address = nozzle.address;
                // Get price from the tank's product, default to 0 if not available
                let price = nozzle
                    .tank
                    .as_ref()
                    .and_then(|tank| tank.product.as_ref())
                    .map(|product| product.sale_price)
                    .unwrap_or(rust_decimal::Decimal::ZERO);

                // Convert Decimal to i32 for the command (assuming price is in minor units)
                // let price_i32 = price.to_string().parse::<f64>().unwrap_or(0.0) as i32;

                // Send reset preset command to dispenser
                // let cmd = CommRequest::Cmd(address, RequestCmd::PresetVolume(0, price_i32 as u32));
                // ctx.send_cmd_to_disp(cmd);

                println!(
                    "Reset dispenser preset: nozzle_id={}, address={}, price={}",
                    nozzle_id, address, price
                );
            }
        }
    }

    Ok(updated_order)
}

pub async fn get_history_orders_usecase(
    ctx: &Ctx,
    dispenser_id: String,
    limit: Option<u64>,
) -> Result<Vec<OrderEntity>> {
    let data =
        OrderRepository::get_history(ctx.get_db(), dispenser_id, limit.unwrap_or(20)).await?;
    Ok(data)
}

pub async fn add_order_usecase(
    ctx: &Ctx,
    client_id: Option<String>,
    order_type: OrderType,
) -> Result<String> {
    let db = ctx.get_db();
    let client = match client_id {
        Some(id) => {
            let client = ClientRepository::get_by_id(db.clone(), id, false).await?;
            Some(client)
        }
        None => None,
    };

    // Get device_id from context
    let device_id = ctx.get_device_id().await?;

    let order = OrderRepository::new_order(db, client, order_type, device_id).await?;
    let new_order_id = order
        .id
        .as_ref()
        .ok_or_else(|| Error::Dispenser("order_id_not_generated".to_owned()))?
        .clone();
    let mut active_orders = ctx.active_orders.lock().unwrap();
    active_orders.insert(0, order);
    Ok(new_order_id)
}

pub async fn add_item_to_order_usecase(
    ctx: &Ctx,
    order_id: String,
    product_id: String,
    count: Decimal,
) -> Result<(OrderEntity, ProductEntity)> {
    let db = ctx.get_db().clone();
    let product = ProductRepository::get_by_id(db.clone(), product_id.clone()).await?;
    let order_to_pass = OrderRepository::get_by_id(db.clone(), order_id.clone()).await?;
    if order_to_pass.d_move.is_some() {
        return Err(Error::Dispenser("order_already_moved".to_owned()));
    }

    // Check if user has permission to add fuel products to Income/Outcome orders
    // Only Administrator and Manager roles can manually add fuel products
    if (order_to_pass.order_type == OrderType::Income
        || order_to_pass.order_type == OrderType::Outcome)
        && (product.product_type == ProductType::FuelLiquid
            || product.product_type == ProductType::FuelGaseous)
    {
        // Fuel products in Income/Outcome orders require Admin or Manager role
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
    }

    OrderRepository::add_item_to_order(db.clone(), product, count, order_to_pass).await?;

    let updated_order = OrderRepository::get_by_id(db.clone(), order_id.clone()).await?;

    let updated_product = ProductRepository::get_by_id(db.clone(), product_id).await?;

    let mut active_orders = ctx.active_orders.lock().unwrap();
    if let Some(order) = active_orders
        .iter_mut()
        .find(|order| order.id.as_ref() == Some(&order_id))
    {
        *order = updated_order.clone();
    }

    Ok((updated_order, updated_product))
}

pub async fn remove_order_item_usecase(
    ctx: &Ctx,
    order_id: String,
    order_item_id: String,
) -> Result<OrderEntity> {
    let db = ctx.get_db().clone();
    let order = OrderRepository::get_by_id(db.clone(), order_id.clone()).await?;
    if order.d_move.is_some() {
        return Err(Error::Dispenser("order_already_moved".to_owned()));
    }

    let updated_order =
        OrderRepository::remove_order_item(db.clone(), order_id.clone(), order_item_id).await?;

    let mut active_orders = ctx.active_orders.lock().unwrap();
    if let Some(order) = active_orders
        .iter_mut()
        .find(|order| order.id.as_ref() == Some(&order_id))
    {
        *order = updated_order.clone();
    }

    Ok(updated_order)
}

pub async fn get_orders_usecase(
    ctx: &Ctx,
    filter: LazyTableStateDTO<OrderFilter, OrderColumn>,
) -> Result<PaginatorDTO<OrderEntity>> {
    let data = OrderRepository::get(ctx.get_db(), filter).await?;
    Ok(data)
}

pub async fn get_movement_report_usecase(
    ctx: &Ctx,
    filter: LazyTableStateDTO<OrderFilter, OrderColumn>,
) -> Result<MetaPaginatorDTO<OrderEntity, OrderMovementSummaryMeta>> {
    let data = OrderRepository::get_movement_report(ctx.get_db(), filter).await?;
    Ok(data)
}

pub async fn delete_order_usecase(ctx: &Ctx, order_id: String) -> Result<u64> {
    let order = OrderRepository::get_by_id(ctx.get_db().clone(), order_id).await?;
    let data = OrderRepository::delete(ctx.get_db(), order)
        .await
        .map_err(|err| {
            println!("delete order usecase: {}", err);
            err
        })?;
    Ok(data)
}

// pub async fn return_order_usecase(ctx: &Ctx, order_id: String) -> Result<OrderEntity> {
//     let db = ctx.get_db().clone();
//     let returned_order = OrderRepository::new_order(db.clone(), order_id.clone()).await?;

//     let mut active_orders = ctx.active_orders.lock().unwrap();
//     active_orders.insert(0, returned_order.clone());

//     Ok(returned_order)
// }
