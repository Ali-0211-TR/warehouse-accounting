use crate::Result;
use crate::adapters::dtos::DispenserDTO;
use crate::domain::entities::dispenser_entity::DispenserEntity;
use crate::domain::repositories::DispenserRepository;
use crate::shared::ctx::Ctx;
use crate::shared::ctx::dispenser_ops::DispenserOps;

pub fn get_dispensers_usecase(ctx: &Ctx) -> Result<Vec<DispenserEntity>> {
    let data = ctx.get_dispensers();
    Ok(data)
}

pub async fn get_all_dispensers_usecase(ctx: &Ctx) -> Result<Vec<DispenserEntity>> {
    let data = DispenserRepository::get_all(ctx.get_db()).await?;
    Ok(data)
}

pub async fn save_dispenser_usecase(ctx: &Ctx, input_dto: DispenserDTO) -> Result<DispenserEntity> {
    println!("Saving dispenser: {:?}", input_dto);

    // Get device_id from context
    let device_id = ctx.get_device_id().await?;

    // Convert to entity with device_id (repository will set timestamps and version)
    let entity = input_dto.into_entity(device_id);

    // Repository handles all metadata
    let data = DispenserRepository::save(ctx.get_db(), entity).await?;
    ctx.update_dispenser(data.clone());
    Ok(data)
}

pub async fn delete_dispenser_usecase(ctx: &Ctx, dispenser_id: String) -> Result<u64> {
    let data = DispenserRepository::delete(ctx.get_db(), dispenser_id.clone()).await?;
    ctx.delete_dispenser(dispenser_id);
    Ok(data)
}

pub async fn delete_dispenser_permanent_usecase(ctx: &Ctx, dispenser_id: String) -> Result<u64> {
    let data = DispenserRepository::delete_permanent(ctx.get_db(), dispenser_id.clone()).await?;
    ctx.delete_dispenser(dispenser_id);
    Ok(data)
}

pub async fn restore_dispenser_usecase(ctx: &Ctx, dispenser_id: String) -> Result<DispenserEntity> {
    let data = DispenserRepository::restore(ctx.get_db(), dispenser_id).await?;
    ctx.update_dispenser(data.clone());
    Ok(data)
}
