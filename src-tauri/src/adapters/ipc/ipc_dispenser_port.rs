use tauri::{AppHandle, Wry, command};

use crate::{
    adapters::{
        dtos::{DispenserPortDTO, IdDTO},
        response::IpcResponse,
    },
    domain::{
        entities::dispenser_port_entity::DispenserPortEntity, usecases::dispenser_port_usecases::*,
    },
    shared::{
        ctx::{Authorisation, Ctx},
        types::RoleType,
    },
};

#[command]
pub async fn save_dispenser_port(
    app: AppHandle<Wry>,
    params: DispenserPortDTO,
) -> IpcResponse<DispenserPortEntity> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        save_dispenser_port_usecase(&ctx, params).await
    })
}

#[command]
pub async fn get_dispenser_ports(app: AppHandle<Wry>) -> IpcResponse<Vec<DispenserPortEntity>> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.is_logged_in()?;
        get_dispenser_ports_usecase(&ctx).await
    })
}

#[command]
pub async fn delete_dispenser_port(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<u64> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        delete_dispenser_port_usecase(&ctx, params.id).await
    })
}
