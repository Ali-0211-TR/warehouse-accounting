use crate::Result;
use crate::domain::entities::nozzle_entity::NozzleEntity;
use crate::domain::repositories::{NozzleRepository, TankRepository};
use crate::infrastructure::database::model_store::DataStore;
use crate::shared::error::Error;
use chrono::Utc;
use entity::nozzles::{ActiveModel, Column, Entity, Model};
use sea_orm::{ActiveModelTrait, EntityTrait, QueryFilter};
use sea_orm::{ActiveValue, ColumnTrait};
use std::future::Future;
use std::pin::Pin;
use std::sync::Arc;
use uuid::Uuid;

pub fn into_entity(
    db: Arc<DataStore>,
    model: Model,
) -> Pin<Box<dyn Future<Output = Result<NozzleEntity>> + Send + 'static>> {
    Box::pin(async move {
        let tank = TankRepository::get_by_id(db.clone(), model.tank_id.clone())
            .await
            .ok();

        let res = NozzleEntity {
            id: Some(model.id),
            device_id: model.device_id,
            dispenser_id: model.dispenser_id,
            address: model.address.try_into().unwrap_or_default(),
            tank_id: model.tank_id,
            tank,
            fueling_order_id: None,
            created_at: model.created_at,
            updated_at: model.updated_at,
            deleted_at: model.deleted_at,
            version: model.version,
        };
        Ok(res)
    })
}

impl NozzleRepository {
    /// Get non-deleted nozzles for a dispenser (for normal operations)
    pub async fn dispeser_nozzles(
        db: Arc<DataStore>,
        dispenser_id: String,
    ) -> Result<Vec<NozzleEntity>> {
        let db_raw = db.get_db()?;
        let nozzles_list = Entity::find()
            .filter(Column::DispenserId.eq(dispenser_id))
            .filter(Column::DeletedAt.is_null())
            .all(db_raw)
            .await?;
        let mut result: Vec<NozzleEntity> = Vec::new();
        for n in nozzles_list {
            let d = into_entity(db.clone(), n).await?;
            result.push(d);
        }
        Ok(result)
    }

    /// Get all nozzles including deleted ones (for admin/sync)
    pub async fn get_all(db: Arc<DataStore>) -> Result<Vec<NozzleEntity>> {
        let db_raw = db.get_db()?;
        let nozzles_list = Entity::find().all(db_raw).await?;
        let mut result: Vec<NozzleEntity> = Vec::new();
        for n in nozzles_list {
            let d = into_entity(db.clone(), n).await?;
            result.push(d);
        }
        println!("Found {} nozzles (including deleted)", result.len());
        Ok(result)
    }

    /// Get nozzle by ID (only if not deleted)
    pub async fn _get_by_id(db: Arc<DataStore>, id: String) -> Result<NozzleEntity> {
        let db_raw = db.get_db()?;
        let data = Entity::find()
            .filter(Column::Id.eq(id))
            .filter(Column::DeletedAt.is_null())
            .one(db_raw)
            .await?;

        let res = data.ok_or(Self::nozzle_not_found_error())?;
        let res = into_entity(db.clone(), res).await?;
        Ok(res)
    }

    pub async fn save(db: Arc<DataStore>, entity: NozzleEntity) -> Result<NozzleEntity> {
        let db_conn = db.get_db()?;
        let now = Utc::now().to_rfc3339();

        let is_new = entity.id.is_none();
        let id = entity
            .id
            .clone()
            .unwrap_or_else(|| Uuid::new_v4().to_string());

        let mut deleted_nozzle = Entity::find()
            .filter(Column::DeletedAt.is_not_null())
            .filter(Column::Address.eq(entity.address as i32))
            .one(db_conn)
            .await?;

        if let Some(deleted) = deleted_nozzle.take() {
            // Restore deleted nozzle instead of creating new
            let active_model = ActiveModel {
                id: ActiveValue::Unchanged(deleted.id),
                device_id: ActiveValue::Set(entity.device_id),
                dispenser_id: ActiveValue::Set(entity.dispenser_id),
                address: ActiveValue::Set(entity.address.into()),
                tank_id: ActiveValue::Set(entity.tank_id),
                created_at: ActiveValue::Unchanged(deleted.created_at),
                updated_at: ActiveValue::Set(now.clone()),
                deleted_at: ActiveValue::Set(None),
                version: ActiveValue::Set(deleted.version + 1),
            };

            let res = active_model.update(db_conn).await?;
            let res = into_entity(db.clone(), res).await?;
            return Ok(res);
        }

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
            dispenser_id: ActiveValue::Set(entity.dispenser_id),
            address: ActiveValue::Set(entity.address.into()),
            tank_id: ActiveValue::Set(entity.tank_id),
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

        let res = into_entity(db.clone(), res).await?;
        Ok(res)
    }

    /// Soft delete - marks nozzle as deleted (for normal operations)
    pub async fn delete(db: Arc<DataStore>, nozzle_id: String) -> Result<u64> {
        let db_conn = db.get_db()?;
        let now = Utc::now().to_rfc3339();

        let existing = Entity::find()
            .filter(Column::Id.eq(&nozzle_id))
            .filter(Column::DeletedAt.is_null())
            .one(db_conn)
            .await?
            .ok_or(Self::nozzle_not_found_error())?;

        let active_model = ActiveModel {
            id: ActiveValue::Unchanged(existing.id),
            device_id: ActiveValue::Unchanged(existing.device_id),
            dispenser_id: ActiveValue::Unchanged(existing.dispenser_id),
            address: ActiveValue::Unchanged(existing.address),
            tank_id: ActiveValue::Unchanged(existing.tank_id),
            created_at: ActiveValue::Unchanged(existing.created_at),
            updated_at: ActiveValue::Set(now.clone()),
            deleted_at: ActiveValue::Set(Some(now)),
            version: ActiveValue::Set(existing.version + 1),
        };

        active_model.update(db_conn).await?;
        Ok(1)
    }

    /// Permanent delete - completely removes nozzle from database (for sync/cleanup)
    pub async fn delete_permanent(db: Arc<DataStore>, nozzle_id: String) -> Result<u64> {
        let db = db.get_db()?;
        let res = Entity::delete_many()
            .filter(Column::Id.eq(nozzle_id))
            .exec(db)
            .await?;
        Ok(res.rows_affected)
    }

    /// Restore a soft-deleted nozzle
    pub async fn restore(db: Arc<DataStore>, nozzle_id: String) -> Result<NozzleEntity> {
        let db_conn = db.get_db()?;
        let now = Utc::now().to_rfc3339();

        let existing = Entity::find()
            .filter(Column::Id.eq(&nozzle_id))
            .one(db_conn)
            .await?
            .ok_or(Self::nozzle_not_found_error())?;

        let active_model = ActiveModel {
            id: ActiveValue::Unchanged(existing.id),
            device_id: ActiveValue::Unchanged(existing.device_id),
            dispenser_id: ActiveValue::Unchanged(existing.dispenser_id),
            address: ActiveValue::Unchanged(existing.address),
            tank_id: ActiveValue::Unchanged(existing.tank_id),
            created_at: ActiveValue::Unchanged(existing.created_at),
            updated_at: ActiveValue::Set(now),
            deleted_at: ActiveValue::Set(None),
            version: ActiveValue::Set(existing.version + 1),
        };

        let res = active_model.update(db_conn).await?;
        into_entity(db, res).await
    }

    fn nozzle_not_found_error() -> Error {
        Error::DBDataNotFound("nozzle_not_found".to_string())
    }
}
