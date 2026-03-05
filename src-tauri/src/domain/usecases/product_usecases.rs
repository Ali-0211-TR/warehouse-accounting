use crate::Result;
use crate::adapters::dtos::{
    LazyTableStateDTO, PaginatorDTO, ProductColumn, ProductFilter, ProductInputDTO,
    ProductMovementFilter, ProductMovementReport,
};
use crate::domain::entities::product_entity::ProductEntity;
use crate::domain::repositories::ProductRepository;
use crate::shared::ctx::Ctx;
use sea_orm::TransactionTrait;

pub async fn get_products_usecase(ctx: &Ctx) -> Result<Vec<ProductEntity>> {
    let data = ProductRepository::get(ctx.get_db()).await?;
    Ok(data)
}

pub async fn get_products_paginated_usecase(
    ctx: &Ctx,
    filter: LazyTableStateDTO<ProductFilter, ProductColumn>,
) -> Result<PaginatorDTO<ProductEntity>> {
    ProductRepository::get_paginated(ctx.get_db(), filter).await
}

pub async fn get_all_products_usecase(ctx: &Ctx) -> Result<Vec<ProductEntity>> {
    let data = ProductRepository::get_all(ctx.get_db()).await?;
    Ok(data)
}

pub async fn delete_product_usecase(ctx: &Ctx, product_id: String) -> Result<u64> {
    let data = ProductRepository::delete(ctx.get_db(), product_id).await?;
    Ok(data)
}

pub async fn delete_product_permanent_usecase(ctx: &Ctx, product_id: String) -> Result<u64> {
    let data = ProductRepository::delete_permanent(ctx.get_db(), product_id).await?;
    Ok(data)
}

pub async fn restore_product_usecase(ctx: &Ctx, product_id: String) -> Result<ProductEntity> {
    let data = ProductRepository::restore(ctx.get_db(), product_id).await?;
    Ok(data)
}

pub async fn get_product_by_id_usecase(ctx: &Ctx, product_id: String) -> Result<ProductEntity> {
    let data = ProductRepository::get_by_id(ctx.get_db(), product_id).await?;
    Ok(data)
}

pub async fn calc_all_product_balance_usecase(ctx: &Ctx) -> Result<u64> {
    let db_ctx = ctx.get_db();
    let db = db_ctx.get_db()?;

    let txn = db.begin().await?;
    let res = ProductRepository::calc_all_products_balance(&txn).await?;
    txn.commit().await?;
    Ok(res.1)
}

pub async fn save_product_usecase(ctx: &Ctx, input_dto: ProductInputDTO) -> Result<ProductEntity> {
    // Get device_id from context
    let device_id = ctx.get_device_id().await?;

    // Store the IDs we need before converting
    let unit_id = input_dto.unit_id();
    let group_id = input_dto.group_id();
    let discount_ids = input_dto.discount_ids().to_vec();
    let tax_ids = input_dto.tax_ids().to_vec();

    // Convert input DTO to entity with device_id (repository will set timestamps and version)
    let entity = input_dto.into_entity(device_id);

    let db = ctx.get_db();
    let result = ProductRepository::save_with_relations(
        db,
        entity,
        unit_id,
        group_id,
        &discount_ids,
        &tax_ids,
    )
    .await?;

    Ok(result)
}

pub async fn get_product_movement_report_usecase(
    ctx: &Ctx,
    filter: ProductMovementFilter,
) -> Result<ProductMovementReport> {
    let data = ProductRepository::get_product_movement_report(ctx.get_db(), filter).await?;
    Ok(data)
}
