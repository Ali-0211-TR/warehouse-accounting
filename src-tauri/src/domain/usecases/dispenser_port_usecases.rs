use crate::Result;
use crate::adapters::dtos::DispenserPortDTO;
use crate::domain::entities::dispenser_port_entity::DispenserPortEntity;
use crate::domain::repositories::DispenserPortRepository;
use crate::shared::ctx::Ctx;

pub async fn get_dispenser_ports_usecase(ctx: &Ctx) -> Result<Vec<DispenserPortEntity>> {
    let data = DispenserPortRepository::get(ctx.get_db()).await?;
    Ok(data)
}

pub async fn get_all_dispenser_ports_usecase(ctx: &Ctx) -> Result<Vec<DispenserPortEntity>> {
    let data = DispenserPortRepository::get_all(ctx.get_db()).await?;
    Ok(data)
}

pub async fn save_dispenser_port_usecase(
    ctx: &Ctx,
    input_dto: DispenserPortDTO,
) -> Result<DispenserPortEntity> {
    // Get device_id from context
    let device_id = ctx.get_device_id().await?;

    // Convert to entity with device_id (repository will set timestamps and version)
    let entity = input_dto.into_entity(device_id);

    // Repository handles all metadata
    DispenserPortRepository::save(ctx.get_db(), entity).await
}

pub async fn delete_dispenser_port_usecase(ctx: &Ctx, dispenserport_id: String) -> Result<u64> {
    let data = DispenserPortRepository::delete(ctx.get_db(), dispenserport_id).await?;
    Ok(data)
}

pub async fn delete_permanent_dispenser_port_usecase(
    ctx: &Ctx,
    dispenserport_id: String,
) -> Result<u64> {
    let data = DispenserPortRepository::delete_permanent(ctx.get_db(), dispenserport_id).await?;
    Ok(data)
}

pub async fn restore_dispenser_port_usecase(
    ctx: &Ctx,
    dispenserport_id: String,
) -> Result<DispenserPortEntity> {
    let data = DispenserPortRepository::restore(ctx.get_db(), dispenserport_id).await?;
    Ok(data)
}
