use crate::Result;
use crate::adapters::dtos::GroupDTO;
use crate::domain::entities::group_entity::GroupEntity;
use crate::domain::repositories::GroupRepository;
use crate::shared::ctx::Ctx;

pub async fn get_groups_usecase(ctx: &Ctx) -> Result<Vec<GroupEntity>> {
    let data = GroupRepository::get(ctx.get_db()).await?;
    Ok(data)
}

pub async fn get_all_groups_usecase(ctx: &Ctx) -> Result<Vec<GroupEntity>> {
    let data = GroupRepository::get_all(ctx.get_db()).await?;
    Ok(data)
}

pub async fn save_group_usecase(ctx: &Ctx, input_dto: GroupDTO) -> Result<GroupEntity> {
    let device_id = ctx.get_device_id().await?;
    let mark_id = input_dto.mark_id.clone();
    let discount_ids = input_dto.discount_ids.clone();
    let group_entity = input_dto.into_entity(device_id);
    let data = GroupRepository::save(ctx.get_db(), group_entity, mark_id, discount_ids).await?;
    Ok(data)
}

pub async fn delete_group_usecase(ctx: &Ctx, group_id: String) -> Result<u64> {
    let data = GroupRepository::delete(ctx.get_db(), group_id).await?;
    Ok(data)
}

pub async fn delete_group_permanent_usecase(ctx: &Ctx, group_id: String) -> Result<u64> {
    let data = GroupRepository::delete_permanent(ctx.get_db(), group_id).await?;
    Ok(data)
}

pub async fn restore_group_usecase(ctx: &Ctx, group_id: String) -> Result<GroupEntity> {
    let data = GroupRepository::restore(ctx.get_db(), group_id).await?;
    Ok(data)
}
