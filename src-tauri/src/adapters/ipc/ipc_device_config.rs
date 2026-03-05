use crate::Result;
use crate::domain::entities::device_config_entity::DeviceConfigEntity;
use crate::domain::usecases::device_config_usecase::DeviceConfigUseCase;
use crate::shared::ctx::{Authorisation, Ctx};
use crate::shared::types::RoleType;
use tauri::{AppHandle, Wry};

#[tauri::command]
pub async fn get_device_config(app: AppHandle<Wry>) -> Result<DeviceConfigEntity> {
    let ctx = Ctx::from_app(app)?;
    ctx.is_logged_in()?;
    DeviceConfigUseCase::get_device_config(&ctx).await
}

#[tauri::command]
pub async fn get_default_receipt_templates() -> Result<(String, String)> {
    let template_58mm = include_str!("../../../assets/templates/receipt_58mm.txt").to_string();
    let template_80mm = include_str!("../../../assets/templates/receipt_80mm.txt").to_string();
    Ok((template_58mm, template_80mm))
}

#[tauri::command]
pub async fn get_default_label_template() -> Result<String> {
    Ok(include_str!("../../../assets/templates/label.txt").to_string())
}

#[tauri::command]
pub async fn update_device_config(
    app: AppHandle<Wry>,
    config: DeviceConfigEntity,
) -> Result<DeviceConfigEntity> {
    let ctx = Ctx::from_app(app)?;
    ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
    let updated = DeviceConfigUseCase::update_device_config(&ctx, config).await?;

    // Invalidate cache after update
    ctx.invalidate_device_config_cache();

    Ok(updated)
}

#[tauri::command]
pub async fn register_device(
    app: AppHandle<Wry>,
    device_name: String,
    server_url: String,
    company_name: String,
) -> Result<DeviceConfigEntity> {
    let ctx = Ctx::from_app(app)?;
    ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
    let registered =
        DeviceConfigUseCase::register_device(&ctx, device_name, server_url, company_name).await?;

    // Invalidate cache after registration
    ctx.invalidate_device_config_cache();

    Ok(registered)
}

#[tauri::command]
pub async fn update_last_sync(app: AppHandle<Wry>) -> Result<DeviceConfigEntity> {
    let ctx = Ctx::from_app(app)?;
    ctx.is_logged_in()?;
    let updated = DeviceConfigUseCase::update_last_sync(&ctx).await?;

    // Invalidate cache after sync update
    ctx.invalidate_device_config_cache();

    Ok(updated)
}
