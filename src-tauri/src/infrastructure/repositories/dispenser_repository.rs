use crate::Result;
use crate::domain::repositories::{
    CameraRepository, DispenserPortRepository, DispenserRepository, NozzleRepository,
};
use crate::infrastructure::database::model_store::DataStore;
use crate::shared::types::DispenserState;
use crate::{
    domain::entities::dispenser_entity::DispenserEntity, shared::types::DispenserFuelingState,
};
use chrono::Utc;
use entity::dispensers::{ActiveModel, Column, Entity, Model};
use sea_orm::{ActiveModelTrait, ActiveValue, ColumnTrait, EntityTrait, QueryFilter};
use std::str::FromStr;
use std::sync::Arc;
use uuid::Uuid;

pub async fn into_entity(db: Arc<DataStore>, model: Model) -> Result<DispenserEntity> {
    let port = DispenserPortRepository::get_by_id(db.clone(), model.port_id.clone())
        .await
        .ok();
    let camera = if let Some(ref camera_id) = model.camera_id {
        CameraRepository::get_by_id(db.clone(), camera_id.clone())
            .await
            .ok()
    } else {
        None
    };

    let nozzles = NozzleRepository::dispeser_nozzles(db.clone(), model.id.clone()).await?;

    let res = DispenserEntity {
        id: Some(model.id.clone()),
        device_id: model.device_id,
        name: model.name,
        base_address: model.base_address.try_into().unwrap_or(1),
        port_id: model.port_id,
        port,
        camera_id: model.camera_id,
        camera,
        nozzles,
        selected_nozzle_id: None,
        fueling_state: DispenserFuelingState::default(),
        state: DispenserState::from_str(&model.state).unwrap_or_default(),
        error: None, // Assuming error is not part of the model, set to None
        created_at: model.created_at,
        updated_at: model.updated_at,
        deleted_at: model.deleted_at,
        version: model.version,
    };
    // println!("DispenserEntity: {:?}", res);
    Ok(res)
}

impl DispenserRepository {
    /// Get all non-deleted dispensers (for normal operations)
    pub async fn get(db: Arc<DataStore>) -> Result<Vec<DispenserEntity>> {
        let db_raw = db.get_db()?;
        let dispensers_list = Entity::find()
            .filter(Column::DeletedAt.is_null())
            .all(db_raw)
            .await?;
        let mut result = Vec::<DispenserEntity>::new();
        for g in dispensers_list {
            let d = into_entity(db.clone(), g).await?;
            result.push(d);
        }
        println!(
            "DispenserRepository::get: Found {} dispensers",
            result.len()
        );
        Ok(result)
    }

    /// Get all dispensers including deleted ones (for admin/sync)
    pub async fn get_all(db: Arc<DataStore>) -> Result<Vec<DispenserEntity>> {
        let db_raw = db.get_db()?;
        let dispensers_list = Entity::find().all(db_raw).await?;
        let mut result = Vec::<DispenserEntity>::new();
        for g in dispensers_list {
            let d = into_entity(db.clone(), g).await?;
            result.push(d);
        }
        println!(
            "DispenserRepository::get_all: Found {} dispensers (including deleted)",
            result.len()
        );
        Ok(result)
    }

    // pub async fn get_by_id(db: Arc<DataStore>, id: String) -> Result<DispenserEntity> {
    //     let db_raw = db.get_db()?;
    //     let data = Entity::find().filter(Column::Id.eq(id)).one(db_raw).await?;
    //     let res = data.ok_or(Self::dispenser_not_found_error())?;
    //     let res = into_entity(db.clone(), res).await?;
    //     Ok(res)
    // }

    pub async fn save(db: Arc<DataStore>, entity: DispenserEntity) -> Result<DispenserEntity> {
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
            base_address: ActiveValue::Set(entity.base_address.into()),
            port_id: ActiveValue::Set(entity.port_id),
            camera_id: ActiveValue::Set(entity.camera_id),
            state: ActiveValue::Set(entity.state.to_string()),
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

        println!("Saved dispenser: {:?}", res);
        let res = into_entity(db.clone(), res).await?;
        Ok(res)
    }

    /// Soft delete - marks dispenser as deleted (for normal operations)
    pub async fn delete(db: Arc<DataStore>, dispenser_id: String) -> Result<u64> {
        let db_conn = db.get_db()?;
        let now = Utc::now().to_rfc3339();

        let existing = Entity::find()
            .filter(Column::Id.eq(&dispenser_id))
            .filter(Column::DeletedAt.is_null())
            .one(db_conn)
            .await?
            .ok_or(Self::dispenser_not_found_error())?;

        let active_model = ActiveModel {
            id: ActiveValue::Unchanged(existing.id),
            device_id: ActiveValue::Unchanged(existing.device_id),
            name: ActiveValue::Unchanged(existing.name),
            base_address: ActiveValue::Unchanged(existing.base_address),
            port_id: ActiveValue::Unchanged(existing.port_id),
            camera_id: ActiveValue::Unchanged(existing.camera_id),
            state: ActiveValue::Unchanged(existing.state),
            created_at: ActiveValue::Unchanged(existing.created_at),
            updated_at: ActiveValue::Set(now.clone()),
            deleted_at: ActiveValue::Set(Some(now)),
            version: ActiveValue::Set(existing.version + 1),
        };

        active_model.update(db_conn).await?;
        Ok(1)
    }

    /// Permanent delete - completely removes dispenser from database (for sync/cleanup)
    pub async fn delete_permanent(db: Arc<DataStore>, dispenser_id: String) -> Result<u64> {
        let db = db.get_db()?;
        let res = Entity::delete_many()
            .filter(Column::Id.eq(dispenser_id))
            .exec(db)
            .await?;
        Ok(res.rows_affected)
    }

    /// Restore a soft-deleted dispenser
    pub async fn restore(db: Arc<DataStore>, dispenser_id: String) -> Result<DispenserEntity> {
        let db_conn = db.get_db()?;
        let now = Utc::now().to_rfc3339();

        let existing = Entity::find()
            .filter(Column::Id.eq(&dispenser_id))
            .one(db_conn)
            .await?
            .ok_or(Self::dispenser_not_found_error())?;

        let active_model = ActiveModel {
            id: ActiveValue::Unchanged(existing.id),
            device_id: ActiveValue::Unchanged(existing.device_id),
            name: ActiveValue::Unchanged(existing.name),
            base_address: ActiveValue::Unchanged(existing.base_address),
            port_id: ActiveValue::Unchanged(existing.port_id),
            camera_id: ActiveValue::Unchanged(existing.camera_id),
            state: ActiveValue::Unchanged(existing.state),
            created_at: ActiveValue::Unchanged(existing.created_at),
            updated_at: ActiveValue::Set(now),
            deleted_at: ActiveValue::Set(None),
            version: ActiveValue::Set(existing.version + 1),
        };

        let res = active_model.update(db_conn).await?;
        into_entity(db, res).await
    }

    fn dispenser_not_found_error() -> crate::shared::error::Error {
        crate::shared::error::Error::DBDataNotFound("dispenser_not_found".to_string())
    }
}
