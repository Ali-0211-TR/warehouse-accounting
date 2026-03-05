use crate::Result;
use crate::domain::entities::dispenser_port_entity::DispenserPortEntity;
use crate::domain::repositories::DispenserPortRepository;
use crate::infrastructure::database::model_store::DataStore;
use crate::shared::error::Error;
use crate::shared::types::DispenserProtocolType;
use entity::dispenser_ports::{ActiveModel, Column, Entity, Model};
use sea_orm::{ActiveModelTrait, ActiveValue, ColumnTrait, EntityTrait, QueryFilter};
use std::str::FromStr;
use std::sync::Arc;
use uuid::Uuid;

impl From<Model> for DispenserPortEntity {
    fn from(model: Model) -> Self {
        DispenserPortEntity {
            id: Some(model.id),
            device_id: model.device_id,
            protocol: DispenserProtocolType::from_str(&model.protocol).unwrap_or_default(),
            port_name: model.port_name,
            port_speed: model.port_speed,
            created_at: model.created_at,
            updated_at: model.updated_at,
            deleted_at: model.deleted_at,
            version: model.version,
        }
    }
}

impl DispenserPortRepository {
    pub async fn get(db: Arc<DataStore>) -> Result<Vec<DispenserPortEntity>> {
        let db = db.get_db()?;
        // Return only non-deleted dispenser ports (soft-delete support)
        let dispenserports_list = Entity::find()
            .filter(Column::DeletedAt.is_null())
            .all(db)
            .await?;

        let dispenserports_entities = dispenserports_list
            .into_iter()
            .map(DispenserPortEntity::from)
            .collect();

        Ok(dispenserports_entities)
    }

    /// Get all dispenser ports including soft-deleted ones (for admin/sync)
    pub async fn get_all(db: Arc<DataStore>) -> Result<Vec<DispenserPortEntity>> {
        let db = db.get_db()?;
        let dispenserports_list = Entity::find().all(db).await?;
        let dispenserports_entities = dispenserports_list
            .into_iter()
            .map(DispenserPortEntity::from)
            .collect();
        Ok(dispenserports_entities)
    }

    pub async fn get_by_id(db: Arc<DataStore>, id: String) -> Result<DispenserPortEntity> {
        let db = db.get_db()?;
        let data = Entity::find().filter(Column::Id.eq(id)).one(db).await?;
        let data = data.ok_or(Self::dispenser_port_not_found_error())?;
        Ok(data.into())
    }

    pub async fn save(
        db: Arc<DataStore>,
        entity: DispenserPortEntity,
    ) -> Result<DispenserPortEntity> {
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
            protocol: ActiveValue::Set(entity.protocol.to_string()),
            port_name: ActiveValue::Set(entity.port_name),
            port_speed: ActiveValue::Set(entity.port_speed),
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
        };

        let res = if is_new {
            active_model.insert(db_conn).await?
        } else {
            active_model.update(db_conn).await?
        };

        Ok(res.into())
    }

    pub async fn delete(db: Arc<DataStore>, dispenserport_id: String) -> Result<u64> {
        let db_conn = db.get_db()?;
        let now = chrono::Utc::now().to_rfc3339();

        // Soft delete: set deleted_at timestamp
        let update_result = Entity::update_many()
            .col_expr(Column::DeletedAt, sea_orm::sea_query::Expr::value(now))
            .filter(Column::Id.eq(dispenserport_id))
            .exec(db_conn)
            .await?;

        Ok(update_result.rows_affected)
    }

    /// Permanent delete - completely removes dispenser port from database (for sync/cleanup)
    pub async fn delete_permanent(db: Arc<DataStore>, dispenserport_id: String) -> Result<u64> {
        let db = db.get_db()?;
        let res = Entity::delete_many()
            .filter(Column::Id.eq(dispenserport_id))
            .exec(db)
            .await?;
        Ok(res.rows_affected)
    }

    /// Restore a soft-deleted dispenser port
    pub async fn restore(
        db: Arc<DataStore>,
        dispenserport_id: String,
    ) -> Result<DispenserPortEntity> {
        let db_conn = db.get_db()?;
        let now = chrono::Utc::now().to_rfc3339();

        let existing = Entity::find()
            .filter(Column::Id.eq(&dispenserport_id))
            .one(db_conn)
            .await?
            .ok_or(Self::dispenser_port_not_found_error())?;

        let active_model = ActiveModel {
            id: ActiveValue::Unchanged(existing.id),
            device_id: ActiveValue::Unchanged(existing.device_id),
            protocol: ActiveValue::Unchanged(existing.protocol),
            port_name: ActiveValue::Unchanged(existing.port_name),
            port_speed: ActiveValue::Unchanged(existing.port_speed),
            created_at: ActiveValue::Unchanged(existing.created_at),
            updated_at: ActiveValue::Set(now),
            deleted_at: ActiveValue::Set(None),
            version: ActiveValue::Set(existing.version + 1),
        };

        let res = active_model.update(db_conn).await?;
        Ok(res.into())
    }

    fn dispenser_port_not_found_error() -> Error {
        Error::DBDataNotFound("dispenser_port_not_found".to_string())
    }
}
