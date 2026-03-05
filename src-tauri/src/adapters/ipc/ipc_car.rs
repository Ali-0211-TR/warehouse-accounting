use tauri::{AppHandle, Wry, command};

use crate::{
    adapters::{
        dtos::{ContractCarDTO, IdDTO},
        response::IpcResponse,
    },
    domain::{entities::contract_car_entity::ContractCarEntity, usecases::contrac_car_usecases::*},
    shared::{
        ctx::{Authorisation, Ctx},
        types::RoleType,
    },
};

#[command]
pub async fn save_car(
    app: AppHandle<Wry>,
    params: ContractCarDTO,
) -> IpcResponse<ContractCarEntity> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        save_car_usecase(&ctx, params).await
    })
}

#[command]
pub async fn get_cars(app: AppHandle<Wry>) -> IpcResponse<Vec<ContractCarEntity>> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.is_logged_in()?;
        get_cars_usecase(&ctx).await
    })
}

#[command]
pub async fn delete_car(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<u64> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        delete_car_usecase(&ctx, params.id).await
    })
}
