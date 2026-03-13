use crate::Result;
use crate::adapters::dtos::PriceDTO;
use crate::domain::entities::price_entity::PriceEntity;
use crate::domain::repositories::{PriceRepository, ProductRepository};
use crate::shared::ctx::Ctx;

pub async fn get_prices_usecase(ctx: &Ctx, product_id: String) -> Result<Vec<PriceEntity>> {
    let data = PriceRepository::product_prices(ctx.get_db(), product_id).await?;
    Ok(data)
}

pub async fn save_price_usecase(ctx: &Ctx, input_dto: PriceDTO) -> Result<PriceEntity> {
    let db = ctx.get_db();

    // Get device_id from context
    let device_id = ctx.get_device_id().await?;

    // Convert to entity with device_id (repository will set timestamps and version)
    let entity = input_dto.into_entity(device_id);

    // Repository handles all metadata
    let data = PriceRepository::save(db.clone(), entity).await?;
    let product = ProductRepository::get_by_id(db, data.product_id.clone()).await?;
    ctx.update_product(product);
    Ok(data)
}

pub async fn delete_price_usecase(ctx: &Ctx, price_entity: PriceEntity) -> Result<u64> {
    let db = ctx.get_db();
    let price_id = price_entity
        .id
        .ok_or_else(|| migration::DbErr::Custom("Missing price id".into()))?;
    let data = PriceRepository::delete(db.clone(), price_id).await?;
    let product = ProductRepository::get_by_id(db, price_entity.product_id).await?;
    ctx.update_product(product);
    Ok(data)
}
