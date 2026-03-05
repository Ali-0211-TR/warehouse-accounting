use tauri::{AppHandle, Wry, command};

use crate::{
    adapters::{
        dtos::{IdDTO, LimitDTO},
        response::IpcResponse,
    },
    domain::{entities::limit_entity::LimitEntity, usecases::limit_usecases::*},
    shared::{
        ctx::{Authorisation, Ctx},
        types::RoleType,
    },
};

#[command]
pub async fn save_limit(app: AppHandle<Wry>, params: LimitDTO) -> IpcResponse<LimitEntity> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        save_limit_usecase(&ctx, params).await
    })
}

#[command]
pub async fn get_limits_by_card_id(
    app: AppHandle<Wry>,
    params: IdDTO,
) -> IpcResponse<Vec<LimitEntity>> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.is_logged_in()?;
        get_limits_by_card_id_usecase(&ctx, params.id).await
    })
}

#[command]
pub async fn get_limit_by_id(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<LimitEntity> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.is_logged_in()?;
        get_limit_by_id_usecase(&ctx, params.id).await
    })
}

#[command]
pub async fn delete_limit(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<u64> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        delete_limit_usecase(&ctx, params.id).await
    })
}
