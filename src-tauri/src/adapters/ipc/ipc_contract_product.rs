use tauri::{AppHandle, Wry, command};

use crate::{
    adapters::{
        dtos::{ContractProductDTO, IdDTO},
        response::IpcResponse,
    },
    domain::{
        entities::contract_product_entity::ContractProductEntity,
        usecases::contract_product_usecases::*,
    },
    shared::{
        ctx::{Authorisation, Ctx},
        types::RoleType,
    },
};

#[command]
pub async fn save_contract_product(
    app: AppHandle<Wry>,
    params: ContractProductDTO,
) -> IpcResponse<ContractProductEntity> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        save_contract_product_usecase(&ctx, params).await
    })
}

#[command]
pub async fn get_contract_products(app: AppHandle<Wry>) -> IpcResponse<Vec<ContractProductEntity>> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.is_logged_in()?;
        get_contract_products_usecase(&ctx).await
    })
}

#[command]
pub async fn delete_contract_product(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<u64> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        delete_contract_product_usecase(&ctx, params.id).await
    })
}
