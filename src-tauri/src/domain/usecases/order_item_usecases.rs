use crate::Result;
use crate::adapters::dtos::{
    FuelingSumaryMeta, LazyTableStateDTO, MetaPaginatorDTO, OrderItemMovementSummaryMeta,
};
use crate::domain::entities::fueling_order_entity::{FuelingOrderColumn, FuelingOrderFilter};
use crate::domain::entities::order_item_entity::{
    OrderItemColumn, OrderItemEntity, OrderItemFilter,
};
use crate::domain::repositories::OrderItemRepository;
use crate::infrastructure::repositories::order_item_repository::NozzleSummaryData;
use crate::shared::ctx::Ctx;
use chrono::{DateTime, Utc};
use std::collections::HashMap;

pub async fn get_order_items_usecase(
    ctx: &Ctx,
    filter: LazyTableStateDTO<OrderItemFilter, OrderItemColumn>,
) -> Result<MetaPaginatorDTO<OrderItemEntity, OrderItemMovementSummaryMeta>> {
    OrderItemRepository::get(ctx.get_db(), filter).await
}
pub async fn get_fueling_order_items_usecase(
    ctx: &Ctx,
    filter: LazyTableStateDTO<FuelingOrderFilter, FuelingOrderColumn>,
) -> Result<MetaPaginatorDTO<OrderItemEntity, FuelingSumaryMeta>> {
    OrderItemRepository::get_fueling_order_items(ctx.get_db(), filter).await
}

pub async fn get_summary_totals_by_nozzle_usecase(
    ctx: &Ctx,
    start_date: Option<DateTime<Utc>>,
    end_date: Option<DateTime<Utc>>,
) -> Result<HashMap<String, NozzleSummaryData>> {
    OrderItemRepository::get_summary_totals_by_nozzle(ctx.get_db(), start_date, end_date).await
}
