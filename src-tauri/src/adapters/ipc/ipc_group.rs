use tauri::{AppHandle, Wry, command};

use crate::{
    adapters::{
        dtos::{GroupDTO, IdDTO},
        response::IpcResponse,
    },
    domain::{entities::group_entity::GroupEntity, usecases::group_usecases::*},
    shared::{
        ctx::{Authorisation, Ctx},
        types::RoleType,
    },
};

#[command]
pub async fn save_group(app: AppHandle<Wry>, params: GroupDTO) -> IpcResponse<GroupEntity> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        println!("Save group {:?}", params);
        save_group_usecase(&ctx, params).await
    })
}

#[command]
pub async fn get_groups(app: AppHandle<Wry>) -> IpcResponse<Vec<GroupEntity>> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.is_logged_in()?;
        get_groups_usecase(&ctx).await
    })
}

#[command]
pub async fn get_all_groups(app: AppHandle<Wry>) -> IpcResponse<Vec<GroupEntity>> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_role(RoleType::Administrator)?;
        get_all_groups_usecase(&ctx).await
    })
}

#[command]
pub async fn delete_group(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<u64> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        delete_group_usecase(&ctx, params.id).await
    })
}

#[command]
pub async fn delete_group_permanent(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<u64> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_role(RoleType::Administrator)?;
        delete_group_permanent_usecase(&ctx, params.id).await
    })
}

#[command]
pub async fn restore_group(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<GroupEntity> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        restore_group_usecase(&ctx, params.id).await
    })
}
