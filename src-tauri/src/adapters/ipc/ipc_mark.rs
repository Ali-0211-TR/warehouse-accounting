use tauri::{AppHandle, Wry, command};

use crate::{
    adapters::{
        dtos::{IdDTO, MarkDTO},
        response::IpcResponse,
    },
    domain::{entities::mark_entity::MarkEntity, usecases::mark_usecases::*},
    shared::{
        ctx::{Authorisation, Ctx},
        types::RoleType,
    },
};

#[command]
pub async fn save_mark(app: AppHandle<Wry>, params: MarkDTO) -> IpcResponse<MarkEntity> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        save_mark_usecase(&ctx, params).await
    })
}

#[command]
pub async fn get_marks(app: AppHandle<Wry>) -> IpcResponse<Vec<MarkEntity>> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.is_logged_in()?;
        get_marks_usecase(&ctx).await
    })
}

#[command]
pub async fn get_all_marks(app: AppHandle<Wry>) -> IpcResponse<Vec<MarkEntity>> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_role(RoleType::Administrator)?;
        get_all_marks_usecase(&ctx).await
    })
}

#[command]
pub async fn delete_mark(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<u64> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        delete_mark_usecase(&ctx, params.id).await
    })
}

#[command]
pub async fn delete_mark_permanent(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<u64> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_role(RoleType::Administrator)?;
        delete_mark_permanent_usecase(&ctx, params.id).await
    })
}

#[command]
pub async fn restore_mark(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<MarkEntity> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        restore_mark_usecase(&ctx, params.id).await
    })
}
