use crate::Result;
use crate::adapters::dtos::NozzleDTO;
use crate::domain::entities::nozzle_entity::NozzleEntity;
use crate::domain::repositories::NozzleRepository;
use crate::shared::ctx::Ctx;
use crate::shared::ctx::dispenser_ops::DispenserOps;

pub async fn get_dispenser_nozzles(ctx: &Ctx, dispenser_id: String) -> Result<Vec<NozzleEntity>> {
    let data = NozzleRepository::dispeser_nozzles(ctx.get_db(), dispenser_id).await?;
    Ok(data)
}

pub async fn get_all_nozzles_usecase(ctx: &Ctx) -> Result<Vec<NozzleEntity>> {
    let data = NozzleRepository::get_all(ctx.get_db()).await?;
    Ok(data)
}

pub async fn save_nozzle_usecase(ctx: &Ctx, input_dto: NozzleDTO) -> Result<NozzleEntity> {
    // Get device_id from context
    let device_id = ctx.get_device_id().await?;

    // Convert to entity with device_id (repository will set timestamps and version)
    let entity = input_dto.into_entity(device_id);

    // Repository handles all metadata
    let data = NozzleRepository::save(ctx.get_db(), entity).await?;
    ctx.update_nozzle(data.clone());
    Ok(data)
}

pub async fn delete_nozzle_usecase(ctx: &Ctx, nozzle_id: String) -> Result<u64> {
    let data = NozzleRepository::delete(ctx.get_db(), nozzle_id.clone()).await?;
    ctx.delete_nozzle(nozzle_id);
    Ok(data)
}

pub async fn delete_nozzle_permanent_usecase(ctx: &Ctx, nozzle_id: String) -> Result<u64> {
    let data = NozzleRepository::delete_permanent(ctx.get_db(), nozzle_id.clone()).await?;
    ctx.delete_nozzle(nozzle_id);
    Ok(data)
}

pub async fn restore_nozzle_usecase(ctx: &Ctx, nozzle_id: String) -> Result<NozzleEntity> {
    let data = NozzleRepository::restore(ctx.get_db(), nozzle_id).await?;
    ctx.update_nozzle(data.clone());
    Ok(data)
}
