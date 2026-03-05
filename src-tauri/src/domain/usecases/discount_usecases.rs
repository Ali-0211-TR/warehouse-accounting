use crate::Result;
use crate::adapters::dtos::DiscountDTO;
use crate::domain::entities::discount_entity::DiscountEntity;
use crate::domain::repositories::DiscountRepository;
use crate::shared::ctx::Ctx;

pub async fn get_discounts_usecase(ctx: &Ctx) -> Result<Vec<DiscountEntity>> {
    let data = DiscountRepository::get(ctx.get_db()).await?;
    Ok(data)
}

pub async fn get_all_discounts_usecase(ctx: &Ctx) -> Result<Vec<DiscountEntity>> {
    let data = DiscountRepository::get_all(ctx.get_db()).await?;
    Ok(data)
}

pub async fn save_discount_usecase(ctx: &Ctx, input_dto: DiscountDTO) -> Result<DiscountEntity> {
    // Get device_id from context
    let device_id = ctx.get_device_id().await?;

    // Convert to entity with device_id (repository will set timestamps and version)
    let entity = input_dto.into_entity(device_id);

    // Repository handles all metadata
    DiscountRepository::save(ctx.get_db(), entity).await
}

pub async fn delete_discount_usecase(ctx: &Ctx, discount_id: String) -> Result<u64> {
    let data = DiscountRepository::delete(ctx.get_db(), discount_id).await?;
    Ok(data)
}

pub async fn delete_discount_permanent_usecase(ctx: &Ctx, discount_id: String) -> Result<u64> {
    let data = DiscountRepository::delete_permanent(ctx.get_db(), discount_id).await?;
    Ok(data)
}

pub async fn restore_discount_usecase(ctx: &Ctx, discount_id: String) -> Result<DiscountEntity> {
    let data = DiscountRepository::restore(ctx.get_db(), discount_id).await?;
    Ok(data)
}
