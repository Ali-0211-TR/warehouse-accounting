use tauri::{AppHandle, Wry, command};

use crate::{
    adapters::{
        dtos::{DispenserDTO, IdDTO, NozzleDTO},
        response::IpcResponse,
    },
    domain::{
        entities::{dispenser_entity::DispenserEntity, nozzle_entity::NozzleEntity},
        usecases::{
            dispenser_usecases::*,
            nozzle_usecases::{
                delete_nozzle_permanent_usecase, delete_nozzle_usecase, get_all_nozzles_usecase,
                get_dispenser_nozzles, restore_nozzle_usecase, save_nozzle_usecase,
            },
        },
    },
    shared::{
        ctx::{Authorisation, Ctx},
        types::RoleType,
    },
};

#[command]
pub async fn save_dispenser(
    app: AppHandle<Wry>,
    params: DispenserDTO,
) -> IpcResponse<DispenserEntity> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        save_dispenser_usecase(&ctx, params).await
    })
}

#[command]
pub fn get_dispensers(app: AppHandle<Wry>) -> IpcResponse<Vec<DispenserEntity>> {
    crate::ipc_handler!({
        println!("Command received: get_dispensers");
        let ctx = Ctx::from_app(app)?;
        ctx.is_logged_in()?;

        get_dispensers_usecase(&ctx)
    })
}

#[command]
pub async fn get_all_dispensers(app: AppHandle<Wry>) -> IpcResponse<Vec<DispenserEntity>> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_role(RoleType::Administrator)?;
        get_all_dispensers_usecase(&ctx).await
    })
}

#[command]
pub async fn delete_dispenser(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<u64> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        delete_dispenser_usecase(&ctx, params.id).await
    })
}

#[command]
pub async fn delete_dispenser_permanent(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<u64> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_role(RoleType::Administrator)?;
        delete_dispenser_permanent_usecase(&ctx, params.id).await
    })
}

#[command]
pub async fn restore_dispenser(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<DispenserEntity> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        restore_dispenser_usecase(&ctx, params.id).await
    })
}

#[command]
pub async fn save_nozzle(app: AppHandle<Wry>, params: NozzleDTO) -> IpcResponse<NozzleEntity> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        save_nozzle_usecase(&ctx, params).await
    })
}

#[command]
pub async fn get_nozzles(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<Vec<NozzleEntity>> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        get_dispenser_nozzles(&ctx, params.id).await
    })
}

#[command]
pub async fn get_all_nozzles(app: AppHandle<Wry>) -> IpcResponse<Vec<NozzleEntity>> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_role(RoleType::Administrator)?;
        get_all_nozzles_usecase(&ctx).await
    })
}

#[command]
pub async fn delete_nozzle(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<u64> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        delete_nozzle_usecase(&ctx, params.id).await
    })
}

#[command]
pub async fn delete_nozzle_permanent(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<u64> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_role(RoleType::Administrator)?;
        delete_nozzle_permanent_usecase(&ctx, params.id).await
    })
}

#[command]
pub async fn restore_nozzle(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<NozzleEntity> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        restore_nozzle_usecase(&ctx, params.id).await
    })
}
