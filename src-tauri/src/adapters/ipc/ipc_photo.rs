use tauri::{AppHandle, Wry, command};

use crate::{
    adapters::{dtos::IdDTO, response::IpcResponse},
    domain::{entities::photo_entity::PhotoEntity, usecases::photo_usecases::*},
    shared::{
        ctx::{Authorisation, Ctx},
        types::RoleType,
    },
};

#[command]
pub async fn save_photo(app: AppHandle<Wry>, params: PhotoEntity) -> IpcResponse<PhotoEntity> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        save_photo_usecase(&ctx, params).await
    })
}

#[command]
pub async fn get_photos(app: AppHandle<Wry>) -> IpcResponse<Vec<PhotoEntity>> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.is_logged_in()?;
        get_photos_usecase(&ctx).await
    })
}

#[command]
pub async fn delete_photo(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<u64> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        delete_photo_usecase(&ctx, params.id).await
    })
}
