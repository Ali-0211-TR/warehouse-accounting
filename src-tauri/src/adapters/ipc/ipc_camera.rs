use tauri::{AppHandle, Wry, command};

use crate::{
    adapters::{
        dtos::{CameraDTO, IdDTO},
        response::IpcResponse,
    },
    domain::{entities::camera_entity::CameraEntity, usecases::camera_usecases::*},
    shared::{
        ctx::{Authorisation, Ctx},
        types::RoleType,
    },
};

#[command]
pub async fn save_camera(app: AppHandle<Wry>, params: CameraDTO) -> IpcResponse<CameraEntity> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        save_camera_usecase(&ctx, params).await
    })
}

#[command]
pub async fn get_cameras(app: AppHandle<Wry>) -> IpcResponse<Vec<CameraEntity>> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.is_logged_in()?;
        get_cameras_usecase(&ctx).await
    })
}

#[command]
pub async fn get_all_cameras(app: AppHandle<Wry>) -> IpcResponse<Vec<CameraEntity>> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_role(RoleType::Administrator)?;
        get_all_cameras_usecase(&ctx).await
    })
}

#[command]
pub async fn delete_camera(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<u64> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        delete_camera_usecase(&ctx, params.id).await
    })
}

#[command]
pub async fn delete_camera_permanent(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<u64> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_role(RoleType::Administrator)?;
        delete_camera_permanent_usecase(&ctx, params.id).await
    })
}

#[command]
pub async fn restore_camera(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<CameraEntity> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        restore_camera_usecase(&ctx, params.id).await
    })
}
