use crate::Result;
use crate::domain::repositories::ClientRepository;
use crate::shared::ctx::Ctx;
use crate::{
    adapters::dtos::{ClientDTO, LazyTableStateDTO, PaginatorDTO},
    domain::entities::client_entity::{ClientColumn, ClientEntity, ClientFilter},
};

pub async fn get_clients_usecase(
    ctx: &Ctx,
    filter: LazyTableStateDTO<ClientFilter, ClientColumn>,
) -> Result<PaginatorDTO<ClientEntity>> {
    let data = ClientRepository::get(ctx.get_db(), filter).await?;
    Ok(data)
}

pub async fn get_all_clients_usecase(ctx: &Ctx) -> Result<Vec<ClientEntity>> {
    let data = ClientRepository::get_all(ctx.get_db()).await?;
    Ok(data)
}

pub async fn get_client_by_id_usecase(
    ctx: &Ctx,
    id: String,
    include_cards: bool,
) -> Result<ClientEntity> {
    let data = ClientRepository::get_by_id(ctx.get_db(), id, include_cards).await?;
    Ok(data)
}

pub async fn save_client_usecase(ctx: &Ctx, input_dto: ClientDTO) -> Result<ClientEntity> {
    // Get device_id from context
    let device_id = ctx.get_device_id().await?;

    // Convert to entity with device_id (repository will set timestamps and version)
    let entity = input_dto.into_entity(device_id);

    // Repository handles all metadata
    ClientRepository::save(ctx.get_db(), entity).await
}

pub async fn delete_client_usecase(ctx: &Ctx, client_id: String) -> Result<u64> {
    let data = ClientRepository::delete(ctx.get_db(), client_id).await?;
    Ok(data)
}

pub async fn delete_client_permanent_usecase(ctx: &Ctx, client_id: String) -> Result<u64> {
    let data = ClientRepository::delete_permanent(ctx.get_db(), client_id).await?;
    Ok(data)
}

pub async fn restore_client_usecase(ctx: &Ctx, client_id: String) -> Result<ClientEntity> {
    let data = ClientRepository::restore(ctx.get_db(), client_id).await?;
    Ok(data)
}
