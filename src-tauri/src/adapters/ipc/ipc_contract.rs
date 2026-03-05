use tauri::{AppHandle, Wry, command};

use crate::{
    adapters::{
        dtos::{ContractDTO, IdDTO, LazyTableStateDTO, PaginatorDTO},
        response::IpcResponse,
    },
    domain::{
        entities::contract_entity::{ContractColumn, ContractEntity, ContractFilter},
        usecases::contract_usecases::*,
    },
    shared::{
        ctx::{Authorisation, Ctx},
        types::RoleType,
    },
};

#[command]
pub async fn save_contract(
    app: AppHandle<Wry>,
    params: ContractDTO,
) -> IpcResponse<ContractEntity> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        println!("Saving contract: {:?}", params);
        save_contract_usecase(&ctx, params).await
    })
}

#[command]
pub async fn get_contracts(
    app: AppHandle<Wry>,
    params: LazyTableStateDTO<ContractFilter, ContractColumn>,
) -> IpcResponse<PaginatorDTO<ContractEntity>> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.is_logged_in()?;
        get_contracts_usecase(&ctx, params).await
    })
}

#[command]
pub async fn get_all_contracts(app: AppHandle<Wry>) -> IpcResponse<Vec<ContractEntity>> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_role(RoleType::Administrator)?;
        get_all_contracts_usecase(&ctx).await
    })
}

#[command]
pub async fn delete_contract(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<u64> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        delete_contract_usecase(&ctx, params.id).await
    })
}

#[command]
pub async fn delete_contract_permanent(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<u64> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_role(RoleType::Administrator)?;
        delete_contract_permanent_usecase(&ctx, params.id).await
    })
}

#[command]
pub async fn restore_contract(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<ContractEntity> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        restore_contract_usecase(&ctx, params.id).await
    })
}

#[command]
pub async fn get_contract_by_id(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<ContractEntity> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.is_logged_in()?;
        get_contract_by_id_usecase(&ctx, params.id).await
    })
}
