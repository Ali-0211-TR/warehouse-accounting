use crate::Result;
use crate::domain::repositories::{ProductRepository, TankRepository};
use crate::infrastructure::database::model_store::DataStore;
use crate::shared::error::Error;
use crate::{domain::entities::tank_entity::TankEntity, shared::types::TankProtocolType};
use chrono::Utc;
use entity::tanks::{ActiveModel, Column, Entity, Model};
use sea_orm::{ActiveModelTrait, ActiveValue, ColumnTrait, EntityTrait, QueryFilter};
use std::str::FromStr;
use std::sync::Arc;
use uuid::Uuid;

pub async fn into_entity(db: Arc<DataStore>, model: Model) -> Result<TankEntity> {
    let product = ProductRepository::get_by_id(db.clone(), model.product_id.clone())
        .await
        .ok();

    let res = TankEntity {
        id: Some(model.id),
        device_id: model.device_id,
        name: model.name,
        protocol: model
            .protocol
            .and_then(|p| TankProtocolType::from_str(&p).ok()),
        address: model.address.and_then(|a| a.try_into().ok()),
        server_address: model.server_address,
        server_port: model.server_port.and_then(|p| p.try_into().ok()),
        port_name: model.port_name,
        port_speed: model.port_speed.and_then(|ps| ps.try_into().ok()),
        product_id: model.product_id,
        balance: model.balance,
        volume_max: model.volume_max,
        product,
        created_at: model.created_at,
        updated_at: model.updated_at,
        deleted_at: model.deleted_at,
        version: model.version,
    };
    Ok(res)
}

impl TankRepository {
    /// Get all non-deleted tanks (for normal operations)
    pub async fn get(db: Arc<DataStore>) -> Result<Vec<TankEntity>> {
        let db_raw = db.get_db()?;
        let tanks_list = Entity::find()
            .filter(Column::DeletedAt.is_null())
            .all(db_raw)
            .await?;
        let mut result: Vec<TankEntity> = Vec::new();
        for n in tanks_list {
            let d = into_entity(db.clone(), n).await?;
            result.push(d);
        }
        Ok(result)
    }

    /// Get all tanks including deleted ones (for admin/sync)
    pub async fn get_all(db: Arc<DataStore>) -> Result<Vec<TankEntity>> {
        let db_raw = db.get_db()?;
        let tanks_list = Entity::find().all(db_raw).await?;
        let mut result: Vec<TankEntity> = Vec::new();
        for n in tanks_list {
            let d = into_entity(db.clone(), n).await?;
            result.push(d);
        }
        println!("Found {} tanks (including deleted)", result.len());
        Ok(result)
    }

    /// Get tank by ID (only if not deleted)
    pub async fn get_by_id(db: Arc<DataStore>, id: String) -> Result<TankEntity> {
        let db_raw = db.get_db()?;
        let data = Entity::find()
            .filter(Column::Id.eq(id))
            .filter(Column::DeletedAt.is_null())
            .one(db_raw)
            .await?;
        let tank = data.ok_or(Self::tank_not_found_error())?;
        let tank = into_entity(db.clone(), tank).await?;
        Ok(tank)
    }

    pub async fn save(db: Arc<DataStore>, entity: TankEntity) -> Result<TankEntity> {
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
            protocol: ActiveValue::Set(entity.protocol.map(|p| p.to_string())),
            address: ActiveValue::Set(entity.address.map(|a| a as i8)),
            server_address: ActiveValue::Set(entity.server_address),
            server_port: ActiveValue::Set(entity.server_port.map(|sp| sp as i32)),
            port_name: ActiveValue::Set(entity.port_name),
            port_speed: ActiveValue::Set(entity.port_speed.map(|ps| ps as i32)),
            balance: ActiveValue::Set(entity.balance),
            volume_max: ActiveValue::Set(entity.volume_max),
            product_id: ActiveValue::Set(entity.product_id),
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

    /// Soft delete - marks tank as deleted (for normal operations)
    pub async fn delete(db: Arc<DataStore>, tank_id: String) -> Result<u64> {
        let db_conn = db.get_db()?;
        let now = Utc::now().to_rfc3339();

        let existing = Entity::find()
            .filter(Column::Id.eq(&tank_id))
            .filter(Column::DeletedAt.is_null())
            .one(db_conn)
            .await?
            .ok_or(Self::tank_not_found_error())?;

        let active_model = ActiveModel {
            id: ActiveValue::Unchanged(existing.id),
            device_id: ActiveValue::Unchanged(existing.device_id),
            name: ActiveValue::Unchanged(existing.name),
            protocol: ActiveValue::Unchanged(existing.protocol),
            address: ActiveValue::Unchanged(existing.address),
            server_address: ActiveValue::Unchanged(existing.server_address),
            server_port: ActiveValue::Unchanged(existing.server_port),
            port_name: ActiveValue::Unchanged(existing.port_name),
            port_speed: ActiveValue::Unchanged(existing.port_speed),
            balance: ActiveValue::Unchanged(existing.balance),
            volume_max: ActiveValue::Unchanged(existing.volume_max),
            product_id: ActiveValue::Unchanged(existing.product_id),
            created_at: ActiveValue::Unchanged(existing.created_at),
            updated_at: ActiveValue::Set(now.clone()),
            deleted_at: ActiveValue::Set(Some(now)),
            version: ActiveValue::Set(existing.version + 1),
        };

        active_model.update(db_conn).await?;
        Ok(1)
    }

    /// Permanent delete - completely removes tank from database (for sync/cleanup)
    pub async fn delete_permanent(db: Arc<DataStore>, tank_id: String) -> Result<u64> {
        let db = db.get_db()?;
        let res = Entity::delete_many()
            .filter(Column::Id.eq(tank_id))
            .exec(db)
            .await?;
        Ok(res.rows_affected)
    }

    /// Restore a soft-deleted tank
    pub async fn restore(db: Arc<DataStore>, tank_id: String) -> Result<TankEntity> {
        let db_conn = db.get_db()?;
        let now = Utc::now().to_rfc3339();

        let existing = Entity::find()
            .filter(Column::Id.eq(&tank_id))
            .one(db_conn)
            .await?
            .ok_or(Self::tank_not_found_error())?;

        let active_model = ActiveModel {
            id: ActiveValue::Unchanged(existing.id),
            device_id: ActiveValue::Unchanged(existing.device_id),
            name: ActiveValue::Unchanged(existing.name),
            protocol: ActiveValue::Unchanged(existing.protocol),
            address: ActiveValue::Unchanged(existing.address),
            server_address: ActiveValue::Unchanged(existing.server_address),
            server_port: ActiveValue::Unchanged(existing.server_port),
            port_name: ActiveValue::Unchanged(existing.port_name),
            port_speed: ActiveValue::Unchanged(existing.port_speed),
            balance: ActiveValue::Unchanged(existing.balance),
            volume_max: ActiveValue::Unchanged(existing.volume_max),
            product_id: ActiveValue::Unchanged(existing.product_id),
            created_at: ActiveValue::Unchanged(existing.created_at),
            updated_at: ActiveValue::Set(now),
            deleted_at: ActiveValue::Set(None),
            version: ActiveValue::Set(existing.version + 1),
        };

        let res = active_model.update(db_conn).await?;
        into_entity(db, res).await
    }

    fn tank_not_found_error() -> Error {
        Error::DBDataNotFound("tank_not_found".to_string())
    }
}
