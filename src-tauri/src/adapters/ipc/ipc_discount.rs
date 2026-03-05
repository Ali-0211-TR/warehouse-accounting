use tauri::{AppHandle, Wry, command};

use crate::{
    adapters::{
        dtos::{DiscountDTO, IdDTO},
        response::IpcResponse,
    },
    domain::{entities::discount_entity::DiscountEntity, usecases::discount_usecases::*},
    shared::{
        ctx::{Authorisation, Ctx},
        types::RoleType,
    },
};

#[command]
pub async fn save_discount(
    app: AppHandle<Wry>,
    params: DiscountDTO,
) -> IpcResponse<DiscountEntity> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        save_discount_usecase(&ctx, params).await
    })
}

#[command]
pub async fn get_discounts(app: AppHandle<Wry>) -> IpcResponse<Vec<DiscountEntity>> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.is_logged_in()?;
        get_discounts_usecase(&ctx).await
    })
}

#[command]
pub async fn get_all_discounts(app: AppHandle<Wry>) -> IpcResponse<Vec<DiscountEntity>> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_role(RoleType::Administrator)?;
        get_all_discounts_usecase(&ctx).await
    })
}

#[command]
pub async fn delete_discount(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<u64> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        delete_discount_usecase(&ctx, params.id).await
    })
}

#[command]
pub async fn delete_discount_permanent(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<u64> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_role(RoleType::Administrator)?;
        delete_discount_permanent_usecase(&ctx, params.id).await
    })
}

#[command]
pub async fn restore_discount(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<DiscountEntity> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        restore_discount_usecase(&ctx, params.id).await
    })
}
