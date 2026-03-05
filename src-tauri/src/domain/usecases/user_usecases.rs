use crate::{
    Result,
    adapters::dtos::{ChangePasswordDTO, CreateUserDTO, UpdateUserDTO},
    domain::{entities::user_entity::UserEntity, repositories::UserRepository},
    shared::ctx::Ctx,
};

pub async fn get_users_usecase(ctx: &Ctx) -> Result<Vec<UserEntity>> {
    let users = UserRepository::get(ctx.get_db()).await?;
    Ok(users)
}

pub async fn get_all_users_usecase(ctx: &Ctx) -> Result<Vec<UserEntity>> {
    let users = UserRepository::get_all(ctx.get_db()).await?;
    Ok(users)
}

pub async fn login_usecase(ctx: &Ctx, username: String, password: String) -> Result<UserEntity> {
    println!("Login attempt for user: {}", username);
    let user = UserRepository::login(ctx.get_db(), username, password).await?;
    let login_user = UserEntity {
        id: user.id,
        device_id: user.device_id,
        full_name: user.full_name,
        username: user.username,
        phone_number: user.phone_number,
        roles: user.roles,
        created_at: user.created_at,
        updated_at: user.updated_at,
        deleted_at: user.deleted_at,
        version: user.version,
    };
    println!("login_user: {:?}", login_user);
    ctx.set_user(Some(login_user.clone()));
    Ok(login_user)
}

pub fn logout_usecase(ctx: &Ctx) -> Result<()> {
    ctx.set_user(None);
    Ok(())
}

pub async fn create_user_case(ctx: &Ctx, data: CreateUserDTO) -> Result<UserEntity> {
    let device_id = ctx.get_device_id().await?;
    let users = UserRepository::create_user(ctx.get_db(), data, device_id).await?;
    Ok(users)
}
pub async fn update_user_case(ctx: &Ctx, data: UpdateUserDTO) -> Result<UserEntity> {
    let device_id = ctx.get_device_id().await?;
    let users = UserRepository::update_user(ctx.get_db(), data, device_id).await?;
    Ok(users)
}
pub async fn change_user_password_case(ctx: &Ctx, data: ChangePasswordDTO) -> Result<UserEntity> {
    let users = UserRepository::change_user_password(ctx.get_db(), data).await?;
    Ok(users)
}

// pub async fn save_user_roles(ctx: &Ctx, user: CreateUserDTO) -> Result<UserEntity> {
//     let users = UserRepository::save_user_roles(ctx.get_db(), user).await?;
//     Ok(users)
// }
pub async fn delete_user_usecase(ctx: &Ctx, id: String) -> Result<u64> {
    let result = UserRepository::delete(ctx.get_db(), id).await?;
    Ok(result)
}

pub async fn delete_user_permanent_usecase(ctx: &Ctx, id: String) -> Result<u64> {
    let result = UserRepository::delete_permanent(ctx.get_db(), id).await?;
    Ok(result)
}

pub async fn restore_user_usecase(ctx: &Ctx, id: String) -> Result<UserEntity> {
    let user = UserRepository::restore(ctx.get_db(), id).await?;
    Ok(user)
}
