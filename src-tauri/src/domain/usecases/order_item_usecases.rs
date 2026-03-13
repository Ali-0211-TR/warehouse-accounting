use crate::Result;
use crate::adapters::dtos::{
    LazyTableStateDTO, MetaPaginatorDTO, OrderItemMovementSummaryMeta,
};
use crate::domain::entities::order_item_entity::{
    OrderItemColumn, OrderItemEntity, OrderItemFilter,
};
use crate::domain::repositories::OrderItemRepository;
use crate::shared::ctx::Ctx;

pub async fn get_order_items_usecase(
    ctx: &Ctx,
    filter: LazyTableStateDTO<OrderItemFilter, OrderItemColumn>,
) -> Result<MetaPaginatorDTO<OrderItemEntity, OrderItemMovementSummaryMeta>> {
    OrderItemRepository::get(ctx.get_db(), filter).await
}
