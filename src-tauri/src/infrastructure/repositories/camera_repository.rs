use crate::Result;
use crate::domain::entities::camera_entity::CameraEntity;
use crate::domain::repositories::CameraRepository;
use crate::infrastructure::database::model_store::DataStore;
use crate::shared::error::Error;
use crate::shared::types::CameraType;
use entity::cameras::{ActiveModel, Column, Entity, Model};
use sea_orm::{ActiveModelTrait, ActiveValue, ColumnTrait, EntityTrait, QueryFilter};
use std::str::FromStr;
use std::sync::Arc;
use uuid::Uuid;

impl From<Model> for CameraEntity {
    fn from(model: Model) -> Self {
        CameraEntity {
            id: Some(model.id),
            device_id: model.device_id,
            camera_type: CameraType::from_str(&model.camera_type).unwrap_or_default(),
            name: model.name,
            address: model.address,
            created_at: model.created_at,
            updated_at: model.updated_at,
            deleted_at: model.deleted_at,
            version: model.version,
        }
    }
}

impl CameraRepository {
    /// Get all non-deleted cameras (for normal operations)
    pub async fn get(db: Arc<DataStore>) -> Result<Vec<CameraEntity>> {
        let db = db.get_db()?;
        let cameras_list = Entity::find()
            .filter(Column::DeletedAt.is_null())
            .all(db)
            .await?;
        let cameras_entities: Vec<CameraEntity> =
            cameras_list.into_iter().map(CameraEntity::from).collect();
        Ok(cameras_entities)
    }

    /// Get all cameras including deleted ones (for admin/sync)
    pub async fn get_all(db: Arc<DataStore>) -> Result<Vec<CameraEntity>> {
        let db = db.get_db()?;
        let cameras_list = Entity::find().all(db).await?;
        let cameras_entities: Vec<CameraEntity> =
            cameras_list.into_iter().map(CameraEntity::from).collect();
        println!(
            "Found {} cameras (including deleted)",
            cameras_entities.len()
        );
        Ok(cameras_entities)
    }

    /// Get camera by ID (only if not deleted)
    pub async fn get_by_id(db: Arc<DataStore>, id: String) -> Result<CameraEntity> {
        let db = db.get_db()?;
        let data = Entity::find()
            .filter(Column::Id.eq(id))
            .filter(Column::DeletedAt.is_null())
            .one(db)
            .await?;
        let data = data.ok_or(Self::camera_not_found_error())?;
        Ok(data.into())
    }

    pub async fn save(db: Arc<DataStore>, entity: CameraEntity) -> Result<CameraEntity> {
        let db_conn = db.get_db()?;
        let is_new = entity.id.is_none();
        let now = chrono::Utc::now().to_rfc3339();

        let active_model = ActiveModel {
            id: if is_new {
                ActiveValue::Set(Uuid::new_v4().to_string())
            } else {
                ActiveValue::Unchanged(entity.id.unwrap())
            },
            device_id: ActiveValue::Set(entity.device_id),
            camera_type: ActiveValue::Set(entity.camera_type.to_string()),
            name: ActiveValue::Set(entity.name),
            address: ActiveValue::Set(entity.address),
            // Metadata handled by repository
            created_at: if is_new {
                ActiveValue::Set(now.clone())
            } else {
                ActiveValue::Unchanged(entity.created_at)
            },
            updated_at: ActiveValue::Set(now),
            deleted_at: ActiveValue::Set(None),
            version: if is_new {
                ActiveValue::Set(1)
            } else {
                ActiveValue::Set(entity.version + 1)
            },
            last_synced_at: ActiveValue::NotSet,
        };

        let res = if is_new {
            active_model.insert(db_conn).await?
        } else {
            active_model.update(db_conn).await?
        };

        Ok(res.into())
    }

    /// Soft delete - marks camera as deleted (for normal operations)
    pub async fn delete(db: Arc<DataStore>, camera_id: String) -> Result<u64> {
        let db_conn = db.get_db()?;
        let now = chrono::Utc::now().to_rfc3339();

        let existing = Entity::find()
            .filter(Column::Id.eq(&camera_id))
            .filter(Column::DeletedAt.is_null())
            .one(db_conn)
            .await?
            .ok_or(Self::camera_not_found_error())?;

        let active_model = ActiveModel {
            id: ActiveValue::Unchanged(existing.id),
            device_id: ActiveValue::Unchanged(existing.device_id),
            camera_type: ActiveValue::Unchanged(existing.camera_type),
            name: ActiveValue::Unchanged(existing.name),
            address: ActiveValue::Unchanged(existing.address),
            created_at: ActiveValue::Unchanged(existing.created_at),
            updated_at: ActiveValue::Set(now.clone()),
            deleted_at: ActiveValue::Set(Some(now)),
            version: ActiveValue::Set(existing.version + 1),
            last_synced_at: ActiveValue::NotSet,
        };

        active_model.update(db_conn).await?;
        Ok(1)
    }

    /// Permanent delete - completely removes camera from database (for sync/cleanup)
    pub async fn delete_permanent(db: Arc<DataStore>, camera_id: String) -> Result<u64> {
        let db = db.get_db()?;
        let res = Entity::delete_many()
            .filter(Column::Id.eq(camera_id))
            .exec(db)
            .await?;
        Ok(res.rows_affected)
    }

    /// Restore a soft-deleted camera
    pub async fn restore(db: Arc<DataStore>, camera_id: String) -> Result<CameraEntity> {
        let db_conn = db.get_db()?;
        let now = chrono::Utc::now().to_rfc3339();

        let existing = Entity::find()
            .filter(Column::Id.eq(&camera_id))
            .one(db_conn)
            .await?
            .ok_or(Self::camera_not_found_error())?;

        let active_model = ActiveModel {
            id: ActiveValue::Unchanged(existing.id),
            device_id: ActiveValue::Unchanged(existing.device_id),
            camera_type: ActiveValue::Unchanged(existing.camera_type),
            name: ActiveValue::Unchanged(existing.name),
            address: ActiveValue::Unchanged(existing.address),
            created_at: ActiveValue::Unchanged(existing.created_at),
            updated_at: ActiveValue::Set(now),
            deleted_at: ActiveValue::Set(None),
            version: ActiveValue::Set(existing.version + 1),
            last_synced_at: ActiveValue::NotSet,
        };

        let res = active_model.update(db_conn).await?;
        Ok(res.into())
    }

    fn camera_not_found_error() -> Error {
        Error::DBDataNotFound("camera_not_found".to_string())
    }
}
