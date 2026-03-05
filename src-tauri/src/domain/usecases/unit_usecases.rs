use crate::Result;
use crate::adapters::dtos::UnitDTO;
use crate::domain::entities::unit_entity::UnitEntity;
use crate::domain::repositories::UnitRepository;
use crate::shared::ctx::Ctx;

pub async fn get_units_usecase(ctx: &Ctx) -> Result<Vec<UnitEntity>> {
    let data = UnitRepository::get(ctx.get_db()).await?;
    Ok(data)
}

pub async fn get_all_units_usecase(ctx: &Ctx) -> Result<Vec<UnitEntity>> {
    let data = UnitRepository::get_all(ctx.get_db()).await?;
    Ok(data)
}

pub async fn save_unit_usecase(ctx: &Ctx, input_dto: UnitDTO) -> Result<UnitEntity> {
    let device_id = ctx.get_device_id().await?;
    let unit_entity = input_dto.into_entity(device_id);
    let data = UnitRepository::save(ctx.get_db(), unit_entity).await?;
    Ok(data)
}

pub async fn delete_unit_usecase(ctx: &Ctx, unit_id: String) -> Result<u64> {
    let data = UnitRepository::delete(ctx.get_db(), unit_id).await?;
    Ok(data)
}

pub async fn delete_unit_permanent_usecase(ctx: &Ctx, unit_id: String) -> Result<u64> {
    let data = UnitRepository::delete_permanent(ctx.get_db(), unit_id).await?;
    Ok(data)
}

pub async fn restore_unit_usecase(ctx: &Ctx, unit_id: String) -> Result<UnitEntity> {
    let data = UnitRepository::restore(ctx.get_db(), unit_id).await?;
    Ok(data)
}
