use tauri::{AppHandle, Wry, command};

use crate::{
    adapters::{
        dtos::{IdDTO, PriceDTO},
        response::IpcResponse,
    },
    domain::{entities::price_entity::PriceEntity, usecases::price_usecases::*},
    shared::{
        ctx::{Authorisation, Ctx},
        types::RoleType,
    },
};

#[command]
pub async fn save_price(app: AppHandle<Wry>, params: PriceDTO) -> IpcResponse<PriceEntity> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        save_price_usecase(&ctx, params).await
    })
}

#[command]
pub async fn get_prices(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<Vec<PriceEntity>> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.is_logged_in()?;
        get_prices_usecase(&ctx, params.id).await
    })
}

#[command]
pub async fn delete_price(app: AppHandle<Wry>, params: PriceEntity) -> IpcResponse<u64> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        delete_price_usecase(&ctx, params).await
    })
}
