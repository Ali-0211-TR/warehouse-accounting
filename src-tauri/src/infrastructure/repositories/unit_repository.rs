use crate::Result;
use crate::domain::entities::unit_entity::UnitEntity;
use crate::domain::repositories::UnitRepository;
use crate::infrastructure::database::model_store::DataStore;
use crate::shared::error::Error;
use chrono::Utc;
use entity::units::{ActiveModel, Column, Entity, Model};
use sea_orm::{ActiveModelTrait, ActiveValue, ColumnTrait, EntityTrait, QueryFilter};
use std::sync::Arc;
use uuid::Uuid;

impl From<Model> for UnitEntity {
    fn from(model: Model) -> Self {
        UnitEntity {
            id: Some(model.id),
            device_id: model.device_id,
            name: model.name,
            short_name: model.short_name,
            created_at: model.created_at,
            updated_at: model.updated_at,
            deleted_at: model.deleted_at,
            version: model.version,
        }
    }
}

impl UnitRepository {
    /// Get all non-deleted units (for normal operations)
    pub async fn get(db: Arc<DataStore>) -> Result<Vec<UnitEntity>> {
        let db = db.get_db()?;
        let units_list = Entity::find()
            .filter(Column::DeletedAt.is_null())
            .all(db)
            .await?;
        let units_entities: Vec<UnitEntity> =
            units_list.into_iter().map(UnitEntity::from).collect();
        Ok(units_entities)
    }
    /// Batch: получить единицы измерения по списку ID
    pub async fn get_by_ids_batch(
        db: Arc<DataStore>,
        unit_ids: &[String],
    ) -> Result<std::collections::HashMap<String, UnitEntity>> {
        use std::collections::HashMap;
        let db_raw = db.get_db()?;
        let units_list = Entity::find()
            .filter(Column::Id.is_in(unit_ids.to_vec()))
            .all(db_raw)
            .await?;

        let mut units_map: HashMap<String, UnitEntity> = HashMap::new();
        for unit in units_list {
            let entity = UnitEntity::from(unit);
            if let Some(id) = entity.id.clone() {
                units_map.insert(id, entity);
            }
        }
        Ok(units_map)
    }

    /// Get all non-deleted units (for normal operations)
    pub async fn get_selected(
        db: Arc<DataStore>,
        unit_ids: &Vec<String>,
    ) -> Result<Vec<UnitEntity>> {
        let db = db.get_db()?;
        let units_list = Entity::find()
            .filter(Column::DeletedAt.is_null())
            .filter(Column::Id.is_in(unit_ids))
            .all(db)
            .await?;
        let units_entities: Vec<UnitEntity> =
            units_list.into_iter().map(UnitEntity::from).collect();
        Ok(units_entities)
    }
    /// Get all units including deleted ones (for admin/sync)
    pub async fn get_all(db: Arc<DataStore>) -> Result<Vec<UnitEntity>> {
        let db = db.get_db()?;
        let units_list = Entity::find().all(db).await?;
        let units_entities: Vec<UnitEntity> =
            units_list.into_iter().map(UnitEntity::from).collect();
        println!("Found {} units (including deleted)", units_entities.len());
        Ok(units_entities)
    }

    /// Get unit by ID (only if not deleted)
    pub async fn get_by_id(db: Arc<DataStore>, id: String) -> Result<UnitEntity> {
        let db = db.get_db()?;
        let data = Entity::find()
            .filter(Column::Id.eq(id))
            .filter(Column::DeletedAt.is_null())
            .one(db)
            .await?;
        let data = data.ok_or(Self::unit_not_found_error())?;
        Ok(data.into())
    }

    pub async fn save(db: Arc<DataStore>, entity: UnitEntity) -> Result<UnitEntity> {
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
            short_name: ActiveValue::Set(entity.short_name),
            created_at: if is_new {
                ActiveValue::Set(now.clone())
            } else {
                ActiveValue::Unchanged(entity.created_at)
            },
            updated_at: ActiveValue::Set(now),
            deleted_at: ActiveValue::Set(None),
            version: ActiveValue::Set(if is_new { 1 } else { existing_version + 1 }),
            last_synced_at: ActiveValue::NotSet,
        };

        let res = if is_new {
            active_model.insert(db_conn).await?
        } else {
            active_model.update(db_conn).await?
        };

        Ok(res.into())
    }

    /// Soft delete - marks unit as deleted (for normal operations)
    pub async fn delete(db: Arc<DataStore>, unit_id: String) -> Result<u64> {
        let db_conn = db.get_db()?;
        let now = Utc::now().to_rfc3339();

        let existing = Entity::find()
            .filter(Column::Id.eq(&unit_id))
            .filter(Column::DeletedAt.is_null())
            .one(db_conn)
            .await?
            .ok_or(Self::unit_not_found_error())?;

        let active_model = ActiveModel {
            id: ActiveValue::Unchanged(existing.id),
            device_id: ActiveValue::Unchanged(existing.device_id),
            name: ActiveValue::Unchanged(existing.name),
            short_name: ActiveValue::Unchanged(existing.short_name),
            created_at: ActiveValue::Unchanged(existing.created_at),
            updated_at: ActiveValue::Set(now.clone()),
            deleted_at: ActiveValue::Set(Some(now)),
            version: ActiveValue::Set(existing.version + 1),
            last_synced_at: ActiveValue::NotSet,
        };

        active_model.update(db_conn).await?;
        Ok(1)
    }

    /// Permanent delete - completely removes unit from database (for sync/cleanup)
    pub async fn delete_permanent(db: Arc<DataStore>, unit_id: String) -> Result<u64> {
        let db = db.get_db()?;
        let res = Entity::delete_many()
            .filter(Column::Id.eq(unit_id))
            .exec(db)
            .await?;
        Ok(res.rows_affected)
    }

    /// Restore a soft-deleted unit
    pub async fn restore(db: Arc<DataStore>, unit_id: String) -> Result<UnitEntity> {
        let db_conn = db.get_db()?;
        let now = Utc::now().to_rfc3339();

        let existing = Entity::find()
            .filter(Column::Id.eq(&unit_id))
            .one(db_conn)
            .await?
            .ok_or(Self::unit_not_found_error())?;

        let active_model = ActiveModel {
            id: ActiveValue::Unchanged(existing.id),
            device_id: ActiveValue::Unchanged(existing.device_id),
            name: ActiveValue::Unchanged(existing.name),
            short_name: ActiveValue::Unchanged(existing.short_name),
            created_at: ActiveValue::Unchanged(existing.created_at),
            updated_at: ActiveValue::Set(now),
            deleted_at: ActiveValue::Set(None),
            version: ActiveValue::Set(existing.version + 1),
            last_synced_at: ActiveValue::NotSet,
        };

        let res = active_model.update(db_conn).await?;
        Ok(res.into())
    }

    fn unit_not_found_error() -> Error {
        Error::DBDataNotFound("unit_not_found".to_string())
    }
}
