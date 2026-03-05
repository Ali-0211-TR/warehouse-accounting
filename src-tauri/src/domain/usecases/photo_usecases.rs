use crate::Result;
use crate::domain::entities::photo_entity::PhotoEntity;
use crate::domain::repositories::PhotoRepository;
use crate::shared::ctx::Ctx;

pub async fn get_photos_usecase(ctx: &Ctx) -> Result<Vec<PhotoEntity>> {
    let data = PhotoRepository::get(ctx.get_db()).await?;
    Ok(data)
}

pub async fn save_photo_usecase(ctx: &Ctx, photo_entity: PhotoEntity) -> Result<PhotoEntity> {
    let data = PhotoRepository::save(ctx.get_db(), photo_entity).await?;
    Ok(data)
}

pub async fn delete_photo_usecase(ctx: &Ctx, photo_id: String) -> Result<u64> {
    let data = PhotoRepository::delete(ctx.get_db(), photo_id).await?;
    Ok(data)
}
