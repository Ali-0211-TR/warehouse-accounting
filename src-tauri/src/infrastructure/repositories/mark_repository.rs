use crate::Result;
use crate::domain::entities::mark_entity::MarkEntity;
use crate::domain::repositories::MarkRepository;
use crate::infrastructure::database::model_store::DataStore;
use crate::shared::error::Error;
use chrono::Utc;
use entity::marks::{ActiveModel, Column, Entity, Model};
use sea_orm::{ActiveModelTrait, ActiveValue, ColumnTrait, EntityTrait, QueryFilter};
use std::sync::Arc;
use uuid::Uuid;

impl From<Model> for MarkEntity {
    fn from(model: Model) -> Self {
        MarkEntity {
            id: Some(model.id),
            device_id: model.device_id,
            name: model.name,
            created_at: model.created_at,
            updated_at: model.updated_at,
            deleted_at: model.deleted_at,
            version: model.version,
        }
    }
}

impl MarkRepository {
    /// Get all non-deleted marks (for normal operations)
    pub async fn get(db: Arc<DataStore>) -> Result<Vec<MarkEntity>> {
        let db = db.get_db()?;
        let marks_list = Entity::find()
            .filter(Column::DeletedAt.is_null())
            .all(db)
            .await?;
        let marks_entities = marks_list.into_iter().map(MarkEntity::from).collect();
        Ok(marks_entities)
    }

    /// Get all marks including deleted ones (for admin/sync)
    pub async fn get_all(db: Arc<DataStore>) -> Result<Vec<MarkEntity>> {
        let db = db.get_db()?;
        let marks_list = Entity::find().all(db).await?;
        let marks_entities = marks_list.into_iter().map(MarkEntity::from).collect();
        Ok(marks_entities)
    }

    /// Get mark by ID (only if not deleted)
    pub async fn get_by_id(db: Arc<DataStore>, id: String) -> Result<MarkEntity> {
        let db = db.get_db()?;
        let data = Entity::find()
            .filter(Column::Id.eq(id))
            .filter(Column::DeletedAt.is_null())
            .one(db)
            .await?;
        let data = data.ok_or(Self::mark_not_found_error())?;
        Ok(data.into())
    }

    pub async fn save(db: Arc<DataStore>, entity: MarkEntity) -> Result<MarkEntity> {
        let db_conn = db.get_db()?;
        let now = Utc::now().to_rfc3339();

        let is_new = entity.id.is_none();
        let id = entity
            .id
            .clone()
            .unwrap_or_else(|| Uuid::new_v4().to_string());

        let existing_version = if !is_new {
            Entity::find()
                .filter(Column::Id.eq(&id))
                .one(db_conn)
                .await?
                .map(|m| m.version)
                .unwrap_or(0)
        } else {
            0
        };

        let active_model = ActiveModel {
            id: ActiveValue::Set(id),
            device_id: ActiveValue::Set(entity.device_id),
            name: ActiveValue::Set(entity.name),
            created_at: if is_new {
                ActiveValue::Set(now.clone())
            } else {
                ActiveValue::Unchanged(entity.created_at)
            },
            updated_at: ActiveValue::Set(now),
            deleted_at: ActiveValue::Set(None),
            version: ActiveValue::Set(if is_new { 1 } else { existing_version + 1 }),
        };

        let res = if is_new {
            active_model.insert(db_conn).await?
        } else {
            active_model.update(db_conn).await?
        };

        Ok(res.into())
    }

    /// Soft delete - marks record as deleted (for normal operations)
    pub async fn delete(db: Arc<DataStore>, mark_id: String) -> Result<u64> {
        let db_conn = db.get_db()?;
        let now = Utc::now().to_rfc3339();

        let existing = Entity::find()
            .filter(Column::Id.eq(&mark_id))
            .filter(Column::DeletedAt.is_null())
            .one(db_conn)
            .await?
            .ok_or(Self::mark_not_found_error())?;

        let active_model = ActiveModel {
            id: ActiveValue::Unchanged(existing.id),
            device_id: ActiveValue::Unchanged(existing.device_id),
            name: ActiveValue::Unchanged(existing.name),
            created_at: ActiveValue::Unchanged(existing.created_at),
            updated_at: ActiveValue::Set(now.clone()),
            deleted_at: ActiveValue::Set(Some(now)),
            version: ActiveValue::Set(existing.version + 1),
        };

        active_model.update(db_conn).await?;
        Ok(1)
    }

    /// Permanent delete - completely removes record from database (for sync/cleanup)
    pub async fn delete_permanent(db: Arc<DataStore>, mark_id: String) -> Result<u64> {
        let db_conn = db.get_db()?;
        let res = Entity::delete_many()
            .filter(Column::Id.eq(mark_id))
            .exec(db_conn)
            .await?;
        Ok(res.rows_affected)
    }

    /// Restore a soft-deleted mark
    pub async fn restore(db: Arc<DataStore>, mark_id: String) -> Result<MarkEntity> {
        let db_conn = db.get_db()?;
        let now = Utc::now().to_rfc3339();

        let existing = Entity::find()
            .filter(Column::Id.eq(&mark_id))
            .one(db_conn)
            .await?
            .ok_or(Self::mark_not_found_error())?;

        let active_model = ActiveModel {
            id: ActiveValue::Unchanged(existing.id),
            device_id: ActiveValue::Unchanged(existing.device_id),
            name: ActiveValue::Unchanged(existing.name),
            created_at: ActiveValue::Unchanged(existing.created_at),
            updated_at: ActiveValue::Set(now),
            deleted_at: ActiveValue::Set(None),
            version: ActiveValue::Set(existing.version + 1),
        };

        let res = active_model.update(db_conn).await?;
        Ok(res.into())
    }

    fn mark_not_found_error() -> Error {
        Error::DBDataNotFound("mark_not_found".to_string())
    }
}
