use std::time::Instant;

use tauri::{AppHandle, Wry, command};

use crate::{
    adapters::{
        dtos::{
            AddProductDTO, CloseOrderDTO, DispenserHistoryParams, IdDTO, LazyTableStateDTO,
            MetaPaginatorDTO, OptionIdDTO, OrderMovementSummaryMeta, PaginatorDTO,
            RemoveOrderItemDTO,
        },
        response::IpcResponse,
    },
    domain::{
        entities::{
            order_entity::{OrderColumn, OrderEntity, OrderFilter},
            product_entity::ProductEntity,
        },
        usecases::order_usecases::*,
    },
    shared::{
        ctx::{Authorisation, Ctx},
        error::Error,
        types::{OrderType, RoleType},
    },
};

#[command]
pub async fn get_active_orders(app: AppHandle<Wry>) -> IpcResponse<Vec<OrderEntity>> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        let orders = ctx.active_orders.lock().map_err(|_| Error::CtxFail)?;
        Ok(orders.clone())
    })
}
#[command]
pub async fn get_history_orders(
    app: AppHandle<Wry>,
    params: DispenserHistoryParams,
) -> IpcResponse<Vec<OrderEntity>> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        get_history_orders_usecase(&ctx, params.dispenser_id, params.limit).await
    })
}

#[command]
pub async fn close_active_order(
    app: AppHandle<Wry>,
    params: CloseOrderDTO,
) -> IpcResponse<OrderEntity> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.is_logged_in()?;
        close_order_usecase(&ctx, params).await
    })
}
#[command]
pub async fn close_fueling(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<OrderEntity> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.is_logged_in()?;
        close_fueling_usecase(&ctx, params.id).await
    })
}

#[command]
pub async fn add_income_order(
    app: AppHandle<Wry>,
    params: IdDTO,
) -> IpcResponse<String> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        add_order_usecase(&ctx, Some(params.id), OrderType::Income).await
    })
}

#[command]
pub async fn add_sale_order(
    app: AppHandle<Wry>,
    params: OptionIdDTO,
) -> IpcResponse<String> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.is_logged_in()?;
        add_order_usecase(&ctx, params.id, OrderType::Sale).await
    })
}

#[command]
pub async fn add_return_order(
    app: AppHandle<Wry>,
    params: OptionIdDTO,
) -> IpcResponse<String> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.is_logged_in()?;
        add_order_usecase(&ctx, params.id, OrderType::Returns).await
    })
}

#[command]
pub async fn add_outcome_order(
    app: AppHandle<Wry>,
    params: OptionIdDTO,
) -> IpcResponse<String> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.is_logged_in()?;
        add_order_usecase(&ctx, params.id, OrderType::Outcome).await
    })
}

#[command]
pub async fn add_item_to_order(
    app: AppHandle<Wry>,
    params: AddProductDTO,
) -> IpcResponse<(OrderEntity, ProductEntity)> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.is_logged_in()?;
        add_item_to_order_usecase(&ctx, params.order_id, params.product_id, params.count).await
    })
}

#[command]
pub async fn remove_order_item(
    app: AppHandle<Wry>,
    params: RemoveOrderItemDTO,
) -> IpcResponse<OrderEntity> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.is_logged_in()?;
        remove_order_item_usecase(&ctx, params.order_id, params.order_item_id).await
    })
}

#[command]
pub async fn get_orders(
    app: AppHandle<Wry>,
    params: LazyTableStateDTO<OrderFilter, OrderColumn>,
) -> IpcResponse<PaginatorDTO<OrderEntity>> {
    crate::ipc_handler_async!({
        let total_start = Instant::now();

        let ctx = Ctx::from_app(app)?;
        ctx.is_logged_in()?;
        let result = get_orders_usecase(&ctx, params).await;
        tracing::info!("get_orders total time: {:?}", total_start.elapsed());
        result
    })
}

#[command]
pub async fn get_movement_report(
    app: AppHandle<Wry>,
    params: LazyTableStateDTO<OrderFilter, OrderColumn>,
) -> IpcResponse<MetaPaginatorDTO<OrderEntity, OrderMovementSummaryMeta>> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.is_logged_in()?;
        get_movement_report_usecase(&ctx, params).await
    })
}

#[command]
pub async fn delete_order(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<u64> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator])?;
        delete_order_usecase(&ctx, params.id).await
    })
}
