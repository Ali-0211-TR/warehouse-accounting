use tauri::{AppHandle, Wry, command};

use crate::{
    adapters::{
        dtos::{ClientDTO, IdDTO, IdWithIncludeDTO, LazyTableStateDTO, PaginatorDTO},
        response::IpcResponse,
    },
    domain::{
        entities::client_entity::{ClientColumn, ClientEntity, ClientFilter},
        usecases::client_usecases::*,
    },
    shared::{
        ctx::{Authorisation, Ctx},
        types::RoleType,
    },
};

#[command]
pub async fn save_client(app: AppHandle<Wry>, params: ClientDTO) -> IpcResponse<ClientEntity> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        save_client_usecase(&ctx, params).await
    })
}

#[command]
pub async fn get_clients(
    app: AppHandle<Wry>,
    params: LazyTableStateDTO<ClientFilter, ClientColumn>,
) -> IpcResponse<PaginatorDTO<ClientEntity>> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.is_logged_in()?;
        println!("Fetching clients with params: {:?}", params);
        get_clients_usecase(&ctx, params).await
    })
}

#[command]
pub async fn get_all_clients(app: AppHandle<Wry>) -> IpcResponse<Vec<ClientEntity>> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_role(RoleType::Administrator)?;
        get_all_clients_usecase(&ctx).await
    })
}

#[command]
pub async fn get_client_by_id(
    app: AppHandle<Wry>,
    params: IdWithIncludeDTO,
) -> IpcResponse<ClientEntity> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.is_logged_in()?;
        get_client_by_id_usecase(&ctx, params.id, params.include_nested).await
    })
}

#[command]
pub async fn delete_client(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<u64> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        delete_client_usecase(&ctx, params.id).await
    })
}

#[command]
pub async fn delete_client_permanent(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<u64> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_role(RoleType::Administrator)?;
        delete_client_permanent_usecase(&ctx, params.id).await
    })
}

#[command]
pub async fn restore_client(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<ClientEntity> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        restore_client_usecase(&ctx, params.id).await
    })
}
