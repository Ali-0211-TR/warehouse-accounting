use tauri::{AppHandle, Wry, command};

use crate::{
    adapters::{
        dtos::{
            IdDTO, LazyTableStateDTO, PaginatorDTO, ProductColumn, ProductFilter, ProductInputDTO,
            ProductMovementFilter, ProductMovementReport,
        },
        response::IpcResponse,
    },
    domain::{entities::product_entity::ProductEntity, usecases::product_usecases::*},
    shared::{
        ctx::{Authorisation, Ctx},
        types::RoleType,
    },
};

#[command]
pub async fn save_product(
    app: AppHandle<Wry>,
    params: ProductInputDTO, // Changed to ProductInputDTO - no device_id required from frontend
) -> IpcResponse<ProductEntity> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        save_product_usecase(&ctx, params).await
    })
}

#[command]
pub async fn get_products(app: AppHandle<Wry>) -> IpcResponse<Vec<ProductEntity>> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.is_logged_in()?;
        let rst = get_products_usecase(&ctx).await;
        rst
    })
}

#[command]
pub async fn get_all_products(app: AppHandle<Wry>) -> IpcResponse<Vec<ProductEntity>> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_role(RoleType::Administrator)?;
        get_all_products_usecase(&ctx).await
    })
}

#[command]
pub async fn get_products_paginated(
    app: AppHandle<Wry>,
    params: LazyTableStateDTO<ProductFilter, ProductColumn>,
) -> IpcResponse<PaginatorDTO<ProductEntity>> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.is_logged_in()?;
        get_products_paginated_usecase(&ctx, params).await
    })
}

#[command]
pub async fn delete_product(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<u64> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        delete_product_usecase(&ctx, params.id).await
    })
}

#[command]
pub async fn delete_product_permanent(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<u64> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_role(RoleType::Administrator)?;
        delete_product_permanent_usecase(&ctx, params.id).await
    })
}

#[command]
pub async fn restore_product(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<ProductEntity> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        restore_product_usecase(&ctx, params.id).await
    })
}

#[command]
pub async fn get_product_by_id(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<ProductEntity> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        get_product_by_id_usecase(&ctx, params.id).await
    })
}

#[command]
pub async fn calc_all_product_balance(app: AppHandle<Wry>) -> IpcResponse<u64> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        calc_all_product_balance_usecase(&ctx).await
    })
}

#[command]
pub async fn get_product_movement_report(
    app: AppHandle<Wry>,
    params: ProductMovementFilter,
) -> IpcResponse<ProductMovementReport> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.is_logged_in()?;
        get_product_movement_report_usecase(&ctx, params).await
    })
}
