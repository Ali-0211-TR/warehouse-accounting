use tauri::{AppHandle, Wry, command};

use crate::{
    adapters::{
        dtos::{
            LazyTableStateDTO, MetaPaginatorDTO, OrderItemMovementSummaryMeta,
        },
        response::IpcResponse,
    },
    domain::{
        entities::{
            order_item_entity::{OrderItemColumn, OrderItemEntity, OrderItemFilter},
        },
        usecases::order_item_usecases::*,
    },
    shared::ctx::{Authorisation, Ctx},
};

#[command]
pub async fn get_order_items(
    app: AppHandle<Wry>,
    params: LazyTableStateDTO<OrderItemFilter, OrderItemColumn>,
) -> IpcResponse<MetaPaginatorDTO<OrderItemEntity, OrderItemMovementSummaryMeta>> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.is_logged_in()?;
        get_order_items_usecase(&ctx, params).await
    })
}
