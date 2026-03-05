use tauri::{AppHandle, Wry, command};

use crate::{
    adapters::{
        dtos::{IdDTO, UnitDTO},
        response::IpcResponse,
    },
    domain::{entities::unit_entity::UnitEntity, usecases::unit_usecases::*},
    shared::{
        ctx::{Authorisation, Ctx},
        types::RoleType,
    },
};

#[command]
pub async fn save_unit(app: AppHandle<Wry>, params: UnitDTO) -> IpcResponse<UnitEntity> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        save_unit_usecase(&ctx, params).await
    })
}

#[command]
pub async fn get_units(app: AppHandle<Wry>) -> IpcResponse<Vec<UnitEntity>> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.is_logged_in()?;
        get_units_usecase(&ctx).await
    })
}

#[command]
pub async fn get_all_units(app: AppHandle<Wry>) -> IpcResponse<Vec<UnitEntity>> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_role(RoleType::Administrator)?;
        get_all_units_usecase(&ctx).await
    })
}

#[command]
pub async fn delete_unit(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<u64> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        delete_unit_usecase(&ctx, params.id).await
    })
}

#[command]
pub async fn delete_unit_permanent(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<u64> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_role(RoleType::Administrator)?;
        delete_unit_permanent_usecase(&ctx, params.id).await
    })
}

#[command]
pub async fn restore_unit(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<UnitEntity> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        restore_unit_usecase(&ctx, params.id).await
    })
}
