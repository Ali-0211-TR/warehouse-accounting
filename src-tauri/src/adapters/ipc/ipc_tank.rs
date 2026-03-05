use tauri::{AppHandle, Wry, command};

use crate::{
    adapters::{
        dtos::{IdDTO, TankDTO},
        response::IpcResponse,
    },
    domain::{entities::tank_entity::TankEntity, usecases::tank_usecases::*},
    shared::{
        ctx::{Authorisation, Ctx},
        types::RoleType,
    },
};

#[command]
pub async fn save_tank(app: AppHandle<Wry>, params: TankDTO) -> IpcResponse<TankEntity> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        save_tank_usecase(&ctx, params).await
    })
}

#[command]
pub async fn get_tanks(app: AppHandle<Wry>) -> IpcResponse<Vec<TankEntity>> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.is_logged_in()?;
        get_tanks_usecase(&ctx).await
    })
}

#[command]
pub async fn get_all_tanks(app: AppHandle<Wry>) -> IpcResponse<Vec<TankEntity>> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_role(RoleType::Administrator)?;
        get_all_tanks_usecase(&ctx).await
    })
}

#[command]
pub async fn delete_tank(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<u64> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        delete_tank_usecase(&ctx, params.id).await
    })
}

#[command]
pub async fn delete_tank_permanent(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<u64> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_role(RoleType::Administrator)?;
        delete_tank_permanent_usecase(&ctx, params.id).await
    })
}

#[command]
pub async fn restore_tank(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<TankEntity> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        restore_tank_usecase(&ctx, params.id).await
    })
}
