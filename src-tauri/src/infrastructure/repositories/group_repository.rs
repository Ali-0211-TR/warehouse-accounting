use crate::Result;
use crate::domain::entities::group_entity::GroupEntity;
use crate::domain::repositories::{DiscountRepository, GroupRepository, MarkRepository};
use crate::infrastructure::database::model_store::DataStore;
use crate::shared::types::GroupType;
use chrono::Utc;
use entity::groups as group;
use group::Column;
use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, EntityTrait, QueryFilter, TransactionTrait,
};
use std::str::FromStr;
use std::sync::Arc;
use uuid::Uuid;

pub async fn into_entity(db: Arc<DataStore>, model: group::Model) -> Result<GroupEntity> {
    let discounts = DiscountRepository::group_discounts(db.clone(), model.id.clone()).await?;

    let mark = if let Some(mark_id) = model.mark_id {
        MarkRepository::get_by_id(db.clone(), mark_id).await.ok()
    } else {
        None
    };

    let res = GroupEntity {
        id: Some(model.id),
        device_id: model.device_id,
        group_type: GroupType::from_str(&model.group_type).unwrap_or_default(),
        mark,
        name: model.name,
        parent_id: model.parent_id,
        discounts,
        created_at: model.created_at,
        updated_at: model.updated_at,
        deleted_at: model.deleted_at,
        version: model.version,
    };
    Ok(res)
}

impl GroupRepository {
    /// Get all non-deleted groups (for normal operations)
    pub async fn get(db: Arc<DataStore>) -> Result<Vec<GroupEntity>> {
        let db_raw = db.get_db()?;
        let groups_list = group::Entity::find()
            .filter(Column::DeletedAt.is_null())
            .all(db_raw)
            .await?;
        let mut result = Vec::<GroupEntity>::new();
        for g in groups_list {
            let d = into_entity(db.clone(), g).await?;
            result.push(d);
        }
        Ok(result)
    }

    /// Get all groups including deleted ones (for admin/sync)
    pub async fn get_all(db: Arc<DataStore>) -> Result<Vec<GroupEntity>> {
        let db_raw = db.get_db()?;
        let groups_list = group::Entity::find().all(db_raw).await?;
        let mut result = Vec::<GroupEntity>::new();
        for g in groups_list {
            let d = into_entity(db.clone(), g).await?;
            result.push(d);
        }
        println!("Found {} groups (including deleted)", result.len());
        Ok(result)
    }

    /// Batch: получить группы по списку ID
    pub async fn get_by_ids_batch(
        db: Arc<DataStore>,
        group_ids: &[String],
    ) -> Result<std::collections::HashMap<String, GroupEntity>> {
        use std::collections::HashMap;
        let db_raw = db.get_db()?;
        let groups_list = group::Entity::find()
            .filter(Column::Id.is_in(group_ids.to_vec()))
            .all(db_raw)
            .await?;

        let mut groups_map: HashMap<String, GroupEntity> = HashMap::new();
        for g in groups_list {
            let entity = into_entity(db.clone(), g).await?;
            if let Some(id) = entity.id.clone() {
                groups_map.insert(id, entity);
            }
        }
        Ok(groups_map)
    }

    /// Get all groups including deleted ones (for admin/sync)
    pub async fn get_selected(
        db: Arc<DataStore>,
        group_ids: &Vec<String>,
    ) -> Result<Vec<GroupEntity>> {
        let db_raw = db.get_db()?;
        let groups_list = group::Entity::find()
            .filter(Column::Id.is_in(group_ids))
            .all(db_raw)
            .await?;
        let mut result = Vec::<GroupEntity>::new();
        for g in groups_list {
            let d = into_entity(db.clone(), g).await?;
            result.push(d);
        }
        println!("Found {} groups (including deleted)", result.len());
        Ok(result)
    }
    /// Get group by ID (only if not deleted)
    pub async fn get_by_id(db: Arc<DataStore>, id: String) -> Result<GroupEntity> {
        let db_raw = db.get_db()?;
        let data = group::Entity::find()
            .filter(Column::Id.eq(id))
            .filter(Column::DeletedAt.is_null())
            .one(db_raw)
            .await?;
        let data = data.ok_or(Self::group_not_found_error())?;
        let res = into_entity(db, data).await?;
        Ok(res)
    }

    /// Optimized save function with proper transaction handling
    pub async fn save(
        db: Arc<DataStore>,
        entity: GroupEntity,
        mark_id: Option<String>,
        discount_ids: Vec<String>,
    ) -> Result<GroupEntity> {
        let db_raw = db.get_db()?;
        let txn = db_raw.begin().await?;
        let now = Utc::now().to_rfc3339();

        println!("Save GroupEntity: {:?}", entity.id);

        // Determine if this is a new group
        let is_new = entity.id.is_none();
        let id = entity
            .id
            .clone()
            .unwrap_or_else(|| Uuid::new_v4().to_string());

        let existing_version = if !is_new {
            group::Entity::find()
                .filter(Column::Id.eq(&id))
                .one(&txn)
                .await?
                .map(|m| m.version)
                .unwrap_or(0)
        } else {
            0
        };

        // Save the group itself
        let active_model = group::ActiveModel {
            id: ActiveValue::Set(id.clone()),
            device_id: ActiveValue::Set(entity.device_id),
            group_type: ActiveValue::Set(entity.group_type.to_string()),
            mark_id: ActiveValue::Set(mark_id),
            name: ActiveValue::Set(entity.name),
            parent_id: ActiveValue::Set(entity.parent_id),
            created_at: if is_new {
                ActiveValue::Set(now.clone())
            } else {
                ActiveValue::Unchanged(entity.created_at)
            },
            updated_at: ActiveValue::Set(now),
            deleted_at: ActiveValue::Set(None),
            version: ActiveValue::Set(if is_new { 1 } else { existing_version + 1 }),
        };

        let saved = if is_new {
            active_model.insert(&txn).await?
        } else {
            active_model.update(&txn).await?
        };

        println!("Group saved: {:?}", saved.id);

        // Set group discounts using the transaction
        DiscountRepository::set_group_discounts(&txn, id.clone(), &discount_ids).await?;

        // Commit the transaction
        txn.commit().await?;

        // Return the complete entity
        let res = GroupRepository::get_by_id(db, id).await?;
        Ok(res)
    }

    /// Soft delete - marks group as deleted (for normal operations)
    pub async fn delete(db: Arc<DataStore>, group_id: String) -> Result<u64> {
        let db_raw = db.get_db()?;
        let now = Utc::now().to_rfc3339();

        let existing = group::Entity::find()
            .filter(Column::Id.eq(&group_id))
            .filter(Column::DeletedAt.is_null())
            .one(db_raw)
            .await?
            .ok_or(Self::group_not_found_error())?;

        let active_model = group::ActiveModel {
            id: ActiveValue::Unchanged(existing.id),
            device_id: ActiveValue::Unchanged(existing.device_id),
            group_type: ActiveValue::Unchanged(existing.group_type),
            mark_id: ActiveValue::Unchanged(existing.mark_id),
            name: ActiveValue::Unchanged(existing.name),
            parent_id: ActiveValue::Unchanged(existing.parent_id),
            created_at: ActiveValue::Unchanged(existing.created_at),
            updated_at: ActiveValue::Set(now.clone()),
            deleted_at: ActiveValue::Set(Some(now)),
            version: ActiveValue::Set(existing.version + 1),
        };

        active_model.update(db_raw).await?;
        Ok(1)
    }

    /// Permanent delete - completely removes group from database (for sync/cleanup)
    pub async fn delete_permanent(db: Arc<DataStore>, group_id: String) -> Result<u64> {
        let db = db.get_db()?;
        let res = group::Entity::delete_many()
            .filter(Column::Id.eq(group_id))
            .exec(db)
            .await?;
        Ok(res.rows_affected)
    }

    /// Restore a soft-deleted group
    pub async fn restore(db: Arc<DataStore>, group_id: String) -> Result<GroupEntity> {
        let db_raw = db.get_db()?;
        let now = Utc::now().to_rfc3339();

        let existing = group::Entity::find()
            .filter(Column::Id.eq(&group_id))
            .one(db_raw)
            .await?
            .ok_or(Self::group_not_found_error())?;

        let active_model = group::ActiveModel {
            id: ActiveValue::Unchanged(existing.id),
            device_id: ActiveValue::Unchanged(existing.device_id),
            group_type: ActiveValue::Unchanged(existing.group_type),
            mark_id: ActiveValue::Unchanged(existing.mark_id),
            name: ActiveValue::Unchanged(existing.name),
            parent_id: ActiveValue::Unchanged(existing.parent_id),
            created_at: ActiveValue::Unchanged(existing.created_at),
            updated_at: ActiveValue::Set(now),
            deleted_at: ActiveValue::Set(None),
            version: ActiveValue::Set(existing.version + 1),
        };

        let res = active_model.update(db_raw).await?;
        into_entity(db, res).await
    }

    fn group_not_found_error() -> crate::shared::error::Error {
        crate::shared::error::Error::DBDataNotFound("group_not_found".to_string())
    }
}
