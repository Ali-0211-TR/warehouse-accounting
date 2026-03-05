use tauri::{AppHandle, Wry, command};

use crate::{
    adapters::{
        dtos::{
            FuelingSumaryMeta, LazyTableStateDTO, MetaPaginatorDTO, OrderItemMovementSummaryMeta,
        },
        response::IpcResponse,
    },
    domain::{
        entities::{
            fueling_order_entity::{FuelingOrderColumn, FuelingOrderFilter},
            order_item_entity::{OrderItemColumn, OrderItemEntity, OrderItemFilter},
        },
        usecases::order_item_usecases::*,
    },
    infrastructure::repositories::order_item_repository::NozzleSummaryData,
    shared::ctx::{Authorisation, Ctx},
};
use chrono::{DateTime, Utc};
use serde::Deserialize;
use std::collections::HashMap;

#[derive(Debug, Deserialize)]
pub struct SummaryTotalsParams {
    pub start_date: Option<DateTime<Utc>>,
    pub end_date: Option<DateTime<Utc>>,
}

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

#[command]
pub async fn get_fueling_order_items(
    app: AppHandle<Wry>,
    params: LazyTableStateDTO<FuelingOrderFilter, FuelingOrderColumn>,
) -> IpcResponse<MetaPaginatorDTO<OrderItemEntity, FuelingSumaryMeta>> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.is_logged_in()?;
        get_fueling_order_items_usecase(&ctx, params).await
    })
}

#[command]
pub async fn get_summary_totals_by_nozzle(
    app: AppHandle<Wry>,
    params: SummaryTotalsParams,
) -> IpcResponse<HashMap<String, NozzleSummaryData>> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.is_logged_in()?;
        get_summary_totals_by_nozzle_usecase(&ctx, params.start_date, params.end_date).await
    })
}
