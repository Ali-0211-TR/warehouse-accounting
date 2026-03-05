use tauri::{AppHandle, Wry, command};

use crate::{
    adapters::{
        dtos::{ClientIdWithIncludeDTO, IdDTO, IdWithIncludeDTO},
        response::IpcResponse,
    },
    domain::{entities::card_entity::CardEntity, usecases::card_usecases::*},
    shared::{
        ctx::{Authorisation, Ctx},
        types::RoleType,
    },
};

#[command]
pub async fn save_card(app: AppHandle<Wry>, params: CardEntity) -> IpcResponse<CardEntity> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        save_card_usecase(&ctx, params).await
    })
}

#[command]
pub async fn get_cards(app: AppHandle<Wry>) -> IpcResponse<Vec<CardEntity>> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.is_logged_in()?;
        get_cards_usecase(&ctx).await
    })
}

#[command]
pub async fn get_card_by_id(
    app: AppHandle<Wry>,
    params: IdWithIncludeDTO,
) -> IpcResponse<CardEntity> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.is_logged_in()?;
        get_card_by_id_usecase(&ctx, params.id, params.include_nested).await
    })
}

#[command]
pub async fn get_cards_by_client_id(
    app: AppHandle<Wry>,
    params: ClientIdWithIncludeDTO,
) -> IpcResponse<Vec<CardEntity>> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.is_logged_in()?;
        get_cards_by_client_id_usecase(&ctx, params.client_id, params.include_limits).await
    })
}

#[command]
pub async fn delete_card(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<u64> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        delete_card_usecase(&ctx, params.id).await
    })
}
