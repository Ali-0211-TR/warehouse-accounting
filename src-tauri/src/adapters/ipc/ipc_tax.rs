use tauri::{AppHandle, Wry, command};

use crate::{
    adapters::{
        dtos::{IdDTO, TaxDTO},
        response::IpcResponse,
    },
    domain::{entities::tax_entity::TaxEntity, usecases::tax_usecases::*},
    shared::{
        ctx::{Authorisation, Ctx},
        types::RoleType,
    },
};

#[command]
pub async fn save_tax(app: AppHandle<Wry>, params: TaxDTO) -> IpcResponse<TaxEntity> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        save_tax_usecase(&ctx, params).await
    })
}

#[command]
pub async fn get_taxes(app: AppHandle<Wry>) -> IpcResponse<Vec<TaxEntity>> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.is_logged_in()?;
        get_taxes_usecase(&ctx).await
    })
}

#[command]
pub async fn get_all_taxes(app: AppHandle<Wry>) -> IpcResponse<Vec<TaxEntity>> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_role(RoleType::Administrator)?;
        get_all_taxes_usecase(&ctx).await
    })
}

#[command]
pub async fn delete_tax(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<u64> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        delete_tax_usecase(&ctx, params.id).await
    })
}

#[command]
pub async fn delete_tax_permanent(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<u64> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_role(RoleType::Administrator)?;
        delete_tax_permanent_usecase(&ctx, params.id).await
    })
}

#[command]
pub async fn restore_tax(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<TaxEntity> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        restore_tax_usecase(&ctx, params.id).await
    })
}
