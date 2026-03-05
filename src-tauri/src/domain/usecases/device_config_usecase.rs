use crate::Result;
use crate::domain::entities::device_config_entity::DeviceConfigEntity;
use crate::domain::repositories::DeviceConfigRepository;
use crate::shared::ctx::Ctx;

pub struct DeviceConfigUseCase;

impl DeviceConfigUseCase {
    /// Get device configuration
    pub async fn get_device_config(ctx: &Ctx) -> Result<DeviceConfigEntity> {
        DeviceConfigRepository::get(ctx.get_db()).await
    }

    /// Update device configuration
    pub async fn update_device_config(
        ctx: &Ctx,
        config: DeviceConfigEntity,
    ) -> Result<DeviceConfigEntity> {
        DeviceConfigRepository::update(ctx.get_db(), config).await
    }

    /// Register device with server
    pub async fn register_device(
        ctx: &Ctx,
        device_name: String,
        server_url: String,
        company_name: String,
    ) -> Result<DeviceConfigEntity> {
        DeviceConfigRepository::register(ctx.get_db(), device_name, server_url, company_name).await
    }

    /// Update last sync timestamp
    pub async fn update_last_sync(ctx: &Ctx) -> Result<DeviceConfigEntity> {
        let mut config = DeviceConfigRepository::get(ctx.get_db()).await?;
        config.last_sync_at = Some(chrono::Utc::now().to_rfc3339());
        DeviceConfigRepository::save(ctx.get_db(), &config).await
    }
}
