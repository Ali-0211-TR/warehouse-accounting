use crate::Result;
use crate::adapters::dtos::LimitDTO;
use crate::domain::entities::limit_entity::LimitEntity;
use crate::domain::repositories::LimitRepository;
use crate::shared::ctx::Ctx;

pub async fn get_limit_by_id_usecase(ctx: &Ctx, id: String) -> Result<LimitEntity> {
    let data = LimitRepository::get_by_id(ctx.get_db(), id).await?;
    Ok(data)
}

pub async fn save_limit_usecase(ctx: &Ctx, data: LimitDTO) -> Result<LimitEntity> {
    let data = LimitRepository::save(ctx.get_db(), data).await?;
    Ok(data)
}

pub async fn delete_limit_usecase(ctx: &Ctx, limit_id: String) -> Result<u64> {
    let data = LimitRepository::delete(ctx.get_db(), limit_id).await?;
    Ok(data)
}
