use tauri::{AppHandle, Wry, command};

use crate::{
    adapters::{
        dtos::{IdDTO, LazyTableStateDTO, PaginatorDTO, ShiftDTO},
        response::IpcResponse,
    },
    domain::{
        entities::shift_entity::{ShiftColumn, ShiftEntity, ShiftFilter},
        usecases::shift_usecases::*,
    },
    shared::{
        ctx::{Authorisation, Ctx},
        types::RoleType,
    },
};

#[command]
pub async fn close_shift(app: AppHandle<Wry>, params: ShiftDTO) -> IpcResponse<ShiftEntity> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.is_logged_in()?;
        close_shift_usecase(&ctx, params.data).await
    })
}

#[command]
pub async fn open_shift(app: AppHandle<Wry>, params: ShiftDTO) -> IpcResponse<ShiftEntity> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.is_logged_in()?;
        open_shift_usecase(&ctx, params.data).await
    })
}

#[command]
pub async fn get_shifts(
    app: AppHandle<Wry>,
    params: LazyTableStateDTO<ShiftFilter, ShiftColumn>,
) -> IpcResponse<PaginatorDTO<ShiftEntity>> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.is_logged_in()?;
        get_shifts_usecase(&ctx, params).await
    })
}

#[command]
pub async fn delete_shift(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<u64> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        delete_shift_usecase(&ctx, params.id).await
    })
}

#[command]
pub fn get_current_shift(app: AppHandle<Wry>) -> IpcResponse<Option<ShiftEntity>> {
    crate::ipc_handler!({
        let ctx = Ctx::from_app(app)?;
        ctx.is_logged_in()?;
        let res: Option<ShiftEntity> = ctx.active_shift.lock().unwrap().clone();
        Ok(res)
    })
}
