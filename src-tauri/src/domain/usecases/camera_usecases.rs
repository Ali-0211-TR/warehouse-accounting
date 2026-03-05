use crate::Result;
use crate::adapters::dtos::CameraDTO;
use crate::domain::entities::camera_entity::CameraEntity;
use crate::domain::repositories::CameraRepository;
use crate::shared::ctx::Ctx;

pub async fn get_cameras_usecase(ctx: &Ctx) -> Result<Vec<CameraEntity>> {
    let data = CameraRepository::get(ctx.get_db()).await?;
    Ok(data)
}

pub async fn get_all_cameras_usecase(ctx: &Ctx) -> Result<Vec<CameraEntity>> {
    let data = CameraRepository::get_all(ctx.get_db()).await?;
    Ok(data)
}

pub async fn save_camera_usecase(ctx: &Ctx, input_dto: CameraDTO) -> Result<CameraEntity> {
    // Get device_id from context
    let device_id = ctx.get_device_id().await?;

    // Convert to entity with device_id (repository will set timestamps and version)
    let entity = input_dto.into_entity(device_id);

    // Repository handles all metadata
    CameraRepository::save(ctx.get_db(), entity).await
}

pub async fn delete_camera_usecase(ctx: &Ctx, camera_id: String) -> Result<u64> {
    let data = CameraRepository::delete(ctx.get_db(), camera_id).await?;
    Ok(data)
}

pub async fn delete_camera_permanent_usecase(ctx: &Ctx, camera_id: String) -> Result<u64> {
    let data = CameraRepository::delete_permanent(ctx.get_db(), camera_id).await?;
    Ok(data)
}

pub async fn restore_camera_usecase(ctx: &Ctx, camera_id: String) -> Result<CameraEntity> {
    let data = CameraRepository::restore(ctx.get_db(), camera_id).await?;
    Ok(data)
}
