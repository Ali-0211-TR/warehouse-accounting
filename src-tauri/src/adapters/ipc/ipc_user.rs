use crate::{
    adapters::{
        dtos::{ChangePasswordDTO, CreateUserDTO, IdDTO, LoginDTO, UpdateUserDTO},
        response::*,
    },
    domain::{
        entities::user_entity::UserEntity,
        usecases::user_usecases::{
            change_user_password_case, create_user_case, delete_user_permanent_usecase,
            delete_user_usecase, get_all_users_usecase, get_users_usecase, login_usecase,
            logout_usecase, restore_user_usecase, update_user_case,
        },
    },
    shared::{
        ctx::{Authorisation, Ctx},
        types::RoleType,
    },
};

use tauri::{AppHandle, Wry, command};

#[command]
pub async fn list_user(app: AppHandle<Wry>) -> IpcResponse<Vec<UserEntity>> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        get_users_usecase(&ctx).await
    })
}

#[command]
pub async fn get_all_users(app: AppHandle<Wry>) -> IpcResponse<Vec<UserEntity>> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_role(RoleType::Administrator)?;
        get_all_users_usecase(&ctx).await
    })
}

#[command]
pub async fn login(app: AppHandle<Wry>, params: LoginDTO) -> IpcResponse<UserEntity> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        println!("Login attempt for user: {}", params.username);
        login_usecase(&ctx, params.username, params.password).await
    })
}

#[command]
pub fn logout(app: AppHandle<Wry>) -> IpcResponse<()> {
    crate::ipc_handler!({
        let ctx = Ctx::from_app(app)?;
        logout_usecase(&ctx)
    })
}

#[command]
pub async fn is_login(app: AppHandle<Wry>) -> IpcResponse<Option<UserEntity>> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        Ok(ctx.get_user())
    })
}

#[command]
pub async fn create_user(app: AppHandle<Wry>, params: CreateUserDTO) -> IpcResponse<UserEntity> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_role(RoleType::Administrator)?;
        create_user_case(&ctx, params).await
    })
}

#[command]
pub async fn update_user(app: AppHandle<Wry>, params: UpdateUserDTO) -> IpcResponse<UserEntity> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_role(RoleType::Administrator)?;
        update_user_case(&ctx, params).await
    })
}

#[command]
pub async fn change_user_password(
    app: AppHandle<Wry>,
    params: ChangePasswordDTO,
) -> IpcResponse<UserEntity> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        change_user_password_case(&ctx, params).await
    })
}

#[command]
pub async fn delete_user(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<u64> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_role(RoleType::Administrator)?;
        delete_user_usecase(&ctx, params.id).await
    })
}

#[command]
pub async fn delete_user_permanent(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<u64> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_role(RoleType::Administrator)?;
        delete_user_permanent_usecase(&ctx, params.id).await
    })
}

#[command]
pub async fn restore_user(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<UserEntity> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        restore_user_usecase(&ctx, params.id).await
    })
}
