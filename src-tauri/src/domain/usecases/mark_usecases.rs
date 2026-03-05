use crate::Result;
use crate::adapters::dtos::MarkDTO;
use crate::domain::entities::mark_entity::MarkEntity;
use crate::domain::repositories::MarkRepository;
use crate::shared::ctx::Ctx;

pub async fn get_marks_usecase(ctx: &Ctx) -> Result<Vec<MarkEntity>> {
    let data = MarkRepository::get(ctx.get_db()).await?;
    Ok(data)
}

pub async fn get_all_marks_usecase(ctx: &Ctx) -> Result<Vec<MarkEntity>> {
    let data = MarkRepository::get_all(ctx.get_db()).await?;
    Ok(data)
}

pub async fn save_mark_usecase(ctx: &Ctx, input_dto: MarkDTO) -> Result<MarkEntity> {
    let device_id = ctx.get_device_id().await?;
    let mark_entity = input_dto.into_entity(device_id);
    let data = MarkRepository::save(ctx.get_db(), mark_entity).await?;
    Ok(data)
}

pub async fn delete_mark_usecase(ctx: &Ctx, mark_id: String) -> Result<u64> {
    let data = MarkRepository::delete(ctx.get_db(), mark_id).await?;
    Ok(data)
}

pub async fn delete_mark_permanent_usecase(ctx: &Ctx, mark_id: String) -> Result<u64> {
    let data = MarkRepository::delete_permanent(ctx.get_db(), mark_id).await?;
    Ok(data)
}

pub async fn restore_mark_usecase(ctx: &Ctx, mark_id: String) -> Result<MarkEntity> {
    let data = MarkRepository::restore(ctx.get_db(), mark_id).await?;
    Ok(data)
}
