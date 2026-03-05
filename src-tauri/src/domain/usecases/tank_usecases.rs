use crate::Result;
use crate::adapters::dtos::TankDTO;
use crate::domain::entities::tank_entity::TankEntity;
use crate::domain::repositories::TankRepository;
use crate::shared::ctx::Ctx;

pub async fn get_tanks_usecase(ctx: &Ctx) -> Result<Vec<TankEntity>> {
    let data = TankRepository::get(ctx.get_db()).await?;
    Ok(data)
}

pub async fn get_all_tanks_usecase(ctx: &Ctx) -> Result<Vec<TankEntity>> {
    let data = TankRepository::get_all(ctx.get_db()).await?;
    Ok(data)
}

pub async fn save_tank_usecase(ctx: &Ctx, input_dto: TankDTO) -> Result<TankEntity> {
    // Get device_id from context
    let device_id = ctx.get_device_id().await?;

    // Convert to entity with device_id (repository will set timestamps and version)
    let entity = input_dto.into_entity(device_id);

    // Repository handles all metadata
    TankRepository::save(ctx.get_db(), entity).await
}

pub async fn delete_tank_usecase(ctx: &Ctx, tank_id: String) -> Result<u64> {
    let data = TankRepository::delete(ctx.get_db(), tank_id).await?;
    Ok(data)
}

pub async fn delete_tank_permanent_usecase(ctx: &Ctx, tank_id: String) -> Result<u64> {
    let data = TankRepository::delete_permanent(ctx.get_db(), tank_id).await?;
    Ok(data)
}

pub async fn restore_tank_usecase(ctx: &Ctx, tank_id: String) -> Result<TankEntity> {
    let data = TankRepository::restore(ctx.get_db(), tank_id).await?;
    Ok(data)
}
