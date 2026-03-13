use crate::Result;
use crate::domain::entities::device_config_entity::DeviceConfigEntity;
use crate::domain::repositories::DeviceConfigRepository;
use crate::infrastructure::database::model_store::DataStore;
use chrono::Utc;
use entity::device_config::{ActiveModel, Entity, Model};
use sea_orm::{ActiveModelTrait, ActiveValue::Set, EntityTrait};
use std::sync::Arc;

impl From<Model> for DeviceConfigEntity {
    fn from(model: Model) -> Self {
        DeviceConfigEntity {
            id: model.id,
            device_uuid: model.device_uuid,
            device_id: model.device_id,
            device_name: model.device_name,
            device_token: model.device_token,
            server_url: model.server_url,
            company_name: model.company_name,
            company_tax_code: model.company_tax_code,
            company_address: model.company_address,
            company_phone: model.company_phone,
            company_email: model.company_email,
            company_website: model.company_website,
            station_name: model.station_name,
            shop_name: model.shop_name,
            receipt_footer: model.receipt_footer,
            receipt_template_58mm: model.receipt_template58mm,
            receipt_template_80mm: model.receipt_template80mm,
            label_template: model.label_template,
            qr_code_url: model.qr_code_url,
            logo_path: model.logo_path,
            last_sync_at: model.last_sync_at,
            is_registered: model.is_registered,
        }
    }
}

impl DeviceConfigRepository {
    /// Get the singleton device config
    pub async fn get(db: Arc<DataStore>) -> Result<DeviceConfigEntity> {
        let db_conn = db.get_db()?;

        // Try to get existing config
        let config = Entity::find_by_id("singleton").one(db_conn).await?;

        match config {
            Some(model) => Ok(model.into()),
            None => {
                // Create default config if none exists
                let default_config = DeviceConfigEntity::default();
                Self::save(db, &default_config).await
            }
        }
    }

    /// Save or update the device config
    pub async fn save(
        db: Arc<DataStore>,
        entity: &DeviceConfigEntity,
    ) -> Result<DeviceConfigEntity> {
        let db_conn = db.get_db()?;

        // Check if config already exists
        let existing = Entity::find_by_id("singleton").one(db_conn).await?;

        let now = Utc::now().to_rfc3339();
        let created_at = if let Some(ref ex) = existing {
            ex.created_at.clone()
        } else {
            now.clone()
        };

        let active_model = ActiveModel {
            id: Set(entity.id.clone()),
            device_uuid: Set(entity.device_uuid.clone()),
            device_id: Set(entity.device_id.clone()),
            device_name: Set(entity.device_name.clone()),
            device_token: Set(entity.device_token.clone()),
            server_url: Set(entity.server_url.clone()),
            company_name: Set(entity.company_name.clone()),
            company_tax_code: Set(entity.company_tax_code.clone()),
            company_address: Set(entity.company_address.clone()),
            company_phone: Set(entity.company_phone.clone()),
            company_email: Set(entity.company_email.clone()),
            company_website: Set(entity.company_website.clone()),
            station_name: Set(entity.station_name.clone()),
            shop_name: Set(entity.shop_name.clone()),
            receipt_footer: Set(entity.receipt_footer.clone()),
            receipt_template58mm: Set(entity.receipt_template_58mm.clone()),
            receipt_template80mm: Set(entity.receipt_template_80mm.clone()),
            label_template: Set(entity.label_template.clone()),
            qr_code_url: Set(entity.qr_code_url.clone()),
            logo_path: Set(entity.logo_path.clone()),
            last_sync_at: Set(entity.last_sync_at.clone()),
            is_registered: Set(entity.is_registered),
            created_at: Set(created_at),
            updated_at: Set(now.clone()),
        };

        let result = if existing.is_some() {
            active_model.update(db_conn).await?
        } else {
            active_model.insert(db_conn).await?
        };

        Ok(result.into())
    }

    /// Update specific fields of the device config
    pub async fn update(
        db: Arc<DataStore>,
        updates: DeviceConfigEntity,
    ) -> Result<DeviceConfigEntity> {
        Self::save(db, &updates).await
    }

    /// Register device with server
    pub async fn register(
        db: Arc<DataStore>,
        device_name: String,
        server_url: String,
        company_name: String,
    ) -> Result<DeviceConfigEntity> {
        let mut config = Self::get(db.clone()).await?;
        config.device_name = device_name;
        config.server_url = Some(server_url);
        config.company_name = Some(company_name);
        config.is_registered = true;

        Self::save(db, &config).await
    }
}
