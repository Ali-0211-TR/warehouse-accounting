use crate::Result;
use crate::domain::repositories::DiscountRepository;
use crate::infrastructure::database::model_store::DataStore;
use crate::shared::types::{DiscountBoundType, DiscountUnitType, OrderType, ProductType};
use crate::{domain::entities::discount_entity::DiscountEntity, shared::types::DiscountType};
use chrono::Utc;
use entity::discount_to_group as DiscoutnToGroup;
use entity::discount_to_product as DiscoutnToProduct;
use entity::discounts::{ActiveModel, Column, Entity, Model};
use sea_orm::{ActiveModelTrait, ActiveValue, EntityTrait, QueryFilter};
use sea_orm::{ColumnTrait, DatabaseTransaction};
use std::str::FromStr;
use std::sync::Arc;
use uuid::Uuid;

pub async fn into_entity(_db: Arc<DataStore>, model: Model) -> Result<DiscountEntity> {
    let res = DiscountEntity {
        id: Some(model.id),
        device_id: model.device_id,
        name: model.name,
        value: model.value,
        discount_type: DiscountType::from_str(&model.discount_type).unwrap_or_default(),
        discount_bound_type: DiscountBoundType::from_str(&model.discount_bound_type)
            .unwrap_or_default(),
        discount_unit_type: DiscountUnitType::from_str(&model.discount_unit_type)
            .unwrap_or_default(),
        product_type: model
            .product_type
            .map(|pt| ProductType::from_str(&pt).unwrap_or_default()),
        bound: model.bound,
        order_type: OrderType::from_str(&model.order_type).unwrap_or_default(),
        created_at: model.created_at,
        updated_at: model.updated_at,
        deleted_at: model.deleted_at,
        version: model.version,
    };
    Ok(res)
}

impl DiscountRepository {
    /// Batch: получить скидки для списка продуктов
    pub async fn products_discounts_batch(
        db: Arc<DataStore>,
        product_ids: &[String],
    ) -> Result<std::collections::HashMap<String, Vec<DiscountEntity>>> {
        use std::collections::HashMap;
        let db_raw = db.get_db()?;
        let data = DiscoutnToProduct::Entity::find()
            .filter(DiscoutnToProduct::Column::ProductId.is_in(product_ids.to_vec()))
            .find_also_related(Entity)
            .all(db_raw)
            .await?;

        let mut discounts_map: HashMap<String, Vec<DiscountEntity>> = HashMap::new();
        for (relation, discount) in data {
            if let Some(discount) = discount {
                let entity = into_entity(db.clone(), discount).await?;
                discounts_map
                    .entry(relation.product_id)
                    .or_default()
                    .push(entity);
            }
        }
        Ok(discounts_map)
    }

    /// Get all non-deleted discounts (for normal operations)
    pub async fn get(db: Arc<DataStore>) -> Result<Vec<DiscountEntity>> {
        let db_raw = db.get_db()?;
        let discounts_list = Entity::find().filter(Column::DeletedAt.is_null());
        let data = discounts_list.all(db_raw).await?;
        let mut result = Vec::<DiscountEntity>::new();
        for discount in data {
            let e = into_entity(db.clone(), discount).await?;
            result.push(e);
        }
        Ok(result)
    }

    /// Get all discounts including deleted ones (for admin/sync)
    pub async fn get_all(db: Arc<DataStore>) -> Result<Vec<DiscountEntity>> {
        let db_raw = db.get_db()?;
        let discounts_list = Entity::find();
        let data = discounts_list.all(db_raw).await?;
        let mut result = Vec::<DiscountEntity>::new();
        for discount in data {
            let e = into_entity(db.clone(), discount).await?;
            result.push(e);
        }
        println!("Found {} discounts (including deleted)", result.len());
        Ok(result)
    }

    pub async fn products_discounts(
        db: Arc<DataStore>,
        product_ids: &Vec<String>,
    ) -> Result<Vec<DiscountEntity>> {
        let db_raw = db.get_db()?;
        let data = DiscoutnToProduct::Entity::find()
            .filter(DiscoutnToProduct::Column::ProductId.is_in(product_ids))
            .find_also_related(Entity)
            .all(db_raw)
            .await?;
        let mut result = Vec::<DiscountEntity>::new();
        for (_, discount) in data {
            if let Some(discount) = discount {
                let e = into_entity(db.clone(), discount).await?;
                result.push(e);
            }
        }
        Ok(result)
    }

    pub async fn product_discounts(
        db: Arc<DataStore>,
        product_id: String,
    ) -> Result<Vec<DiscountEntity>> {
        let db_raw = db.get_db()?;
        let data = DiscoutnToProduct::Entity::find()
            .filter(DiscoutnToProduct::Column::ProductId.eq(product_id))
            .find_also_related(Entity)
            .all(db_raw)
            .await?;
        let mut result = Vec::<DiscountEntity>::new();
        for (_, discount) in data {
            if let Some(discount) = discount {
                let e = into_entity(db.clone(), discount).await?;
                result.push(e);
            }
        }
        Ok(result)
    }

    pub async fn group_discounts(
        db: Arc<DataStore>,
        group_id: String,
    ) -> Result<Vec<DiscountEntity>> {
        let db_raw = db.get_db()?;
        let data = DiscoutnToGroup::Entity::find()
            .filter(DiscoutnToGroup::Column::GroupId.eq(group_id))
            .find_also_related(Entity);
        // info!(
        //     "Query is: {}",
        //     data.build(db_raw.get_database_backend()).to_string()
        // );
        let data = data.all(db_raw).await?;
        let mut result = Vec::<DiscountEntity>::new();
        for (_, discount) in data {
            if let Some(discount) = discount {
                let e = into_entity(db.clone(), discount).await?;
                result.push(e);
            }
        }
        Ok(result)
    }

    // pub async fn get_by_id(db: Arc<DataStore>, id: String) -> Result<DiscountEntity> {
    //     let db_raw = db.get_db()?;
    //     let data = Entity::find().filter(Column::Id.eq(id)).one(db_raw).await?;
    //     let data = data.ok_or(Self::discount_not_found_error())?;
    //     Ok(into_entity(db, data).await?)
    // }

    pub async fn save(db: Arc<DataStore>, entity: DiscountEntity) -> Result<DiscountEntity> {
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
            value: ActiveValue::Set(entity.value),
            discount_type: ActiveValue::Set(entity.discount_type.to_string()),
            discount_bound_type: ActiveValue::Set(entity.discount_bound_type.to_string()),
            discount_unit_type: ActiveValue::Set(entity.discount_unit_type.to_string()),
            product_type: ActiveValue::Set(entity.product_type.map(|pt| pt.to_string())),
            bound: ActiveValue::Set(entity.bound),
            order_type: ActiveValue::Set(entity.order_type.to_string()),
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

        into_entity(db, res).await
    }

    /// Soft delete - marks discount as deleted (for normal operations)
    pub async fn delete(db: Arc<DataStore>, discount_id: String) -> Result<u64> {
        let db_conn = db.get_db()?;
        let now = Utc::now().to_rfc3339();

        let existing = Entity::find()
            .filter(Column::Id.eq(&discount_id))
            .filter(Column::DeletedAt.is_null())
            .one(db_conn)
            .await?
            .ok_or(Self::discount_not_found_error())?;

        let active_model = ActiveModel {
            id: ActiveValue::Unchanged(existing.id),
            device_id: ActiveValue::Unchanged(existing.device_id),
            name: ActiveValue::Unchanged(existing.name),
            value: ActiveValue::Unchanged(existing.value),
            discount_type: ActiveValue::Unchanged(existing.discount_type),
            discount_bound_type: ActiveValue::Unchanged(existing.discount_bound_type),
            discount_unit_type: ActiveValue::Unchanged(existing.discount_unit_type),
            product_type: ActiveValue::Unchanged(existing.product_type),
            bound: ActiveValue::Unchanged(existing.bound),
            order_type: ActiveValue::Unchanged(existing.order_type),
            created_at: ActiveValue::Unchanged(existing.created_at),
            updated_at: ActiveValue::Set(now.clone()),
            deleted_at: ActiveValue::Set(Some(now)),
            version: ActiveValue::Set(existing.version + 1),
        };

        active_model.update(db_conn).await?;
        Ok(1)
    }

    /// Permanent delete - completely removes discount from database (for sync/cleanup)
    pub async fn delete_permanent(db: Arc<DataStore>, discount_id: String) -> Result<u64> {
        let db = db.get_db()?;
        let res = Entity::delete_many()
            .filter(Column::Id.eq(discount_id))
            .exec(db)
            .await?;
        Ok(res.rows_affected)
    }

    /// Restore a soft-deleted discount
    pub async fn restore(db: Arc<DataStore>, discount_id: String) -> Result<DiscountEntity> {
        let db_conn = db.get_db()?;
        let now = Utc::now().to_rfc3339();

        let existing = Entity::find()
            .filter(Column::Id.eq(&discount_id))
            .one(db_conn)
            .await?
            .ok_or(Self::discount_not_found_error())?;

        let active_model = ActiveModel {
            id: ActiveValue::Unchanged(existing.id),
            device_id: ActiveValue::Unchanged(existing.device_id),
            name: ActiveValue::Unchanged(existing.name),
            value: ActiveValue::Unchanged(existing.value),
            discount_type: ActiveValue::Unchanged(existing.discount_type),
            discount_bound_type: ActiveValue::Unchanged(existing.discount_bound_type),
            discount_unit_type: ActiveValue::Unchanged(existing.discount_unit_type),
            product_type: ActiveValue::Unchanged(existing.product_type),
            bound: ActiveValue::Unchanged(existing.bound),
            order_type: ActiveValue::Unchanged(existing.order_type),
            created_at: ActiveValue::Unchanged(existing.created_at),
            updated_at: ActiveValue::Set(now),
            deleted_at: ActiveValue::Set(None),
            version: ActiveValue::Set(existing.version + 1),
        };

        let res = active_model.update(db_conn).await?;
        into_entity(db, res).await
    }

    // DiscountRepository
    pub async fn set_product_discounts(
        txn: &DatabaseTransaction,
        product_id: String,
        discount_ids: &[String],
    ) -> Result<()> {
        use entity::discount_to_product::{ActiveModel as DTPModel, Column, Entity};
        use entity::discounts as disc;
        use entity::products as prod;
        use sea_orm::{ColumnTrait, QueryFilter};

        println!(
            "set_product_discounts called with product_id: {}, discount_ids: {:?}",
            product_id, discount_ids
        );

        // Early return if no discount_ids provided
        if discount_ids.is_empty() {
            // Just remove old relations
            Entity::delete_many()
                .filter(Column::ProductId.eq(&product_id))
                .exec(txn)
                .await?;
            return Ok(());
        }

        // Validate that the product exists
        let product_exists = prod::Entity::find_by_id(&product_id)
            .one(txn)
            .await?
            .is_some();

        if !product_exists {
            return Err(crate::shared::error::Error::Database(format!(
                "Product not found: {}",
                product_id
            )));
        }
        println!("Product exists: {}", product_id);

        // Validate that all discount IDs exist and are not deleted
        let existing_discounts = disc::Entity::find()
            .filter(disc::Column::Id.is_in(discount_ids.to_vec()))
            .filter(disc::Column::DeletedAt.is_null())
            .all(txn)
            .await?;

        println!(
            "Found {} existing discounts out of {} requested",
            existing_discounts.len(),
            discount_ids.len()
        );

        if existing_discounts.len() != discount_ids.len() {
            let existing_ids: Vec<String> =
                existing_discounts.iter().map(|d| d.id.clone()).collect();
            let missing_ids: Vec<String> = discount_ids
                .iter()
                .filter(|id| !existing_ids.contains(id))
                .cloned()
                .collect();
            return Err(crate::shared::error::Error::Database(format!(
                "Discount(s) not found or deleted: {:?}",
                missing_ids
            )));
        }

        // Remove old relations
        Entity::delete_many()
            .filter(Column::ProductId.eq(&product_id))
            .exec(txn)
            .await?;

        println!("Removed old discount relations for product: {}", product_id);

        // Bulk insert new relations
        let product_id_ref = &product_id;
        let models: Vec<DTPModel> = discount_ids
            .iter()
            .map(|discount_id| DTPModel {
                discount_id: ActiveValue::Set(discount_id.clone()),
                product_id: ActiveValue::Set(product_id_ref.clone()),
            })
            .collect();

        println!("Inserting {} discount relations...", models.len());
        // Use bulk insert instead of individual inserts
        Entity::insert_many(models).exec(txn).await?;
        println!("Successfully inserted discount relations");

        Ok(())
    }

    /// Optimized version using bulk insert
    pub async fn set_group_discounts(
        txn: &DatabaseTransaction,
        group_id: String,
        discount_ids: &[String],
    ) -> Result<()> {
        use entity::discount_to_group::{ActiveModel as DTGModel, Column, Entity};
        use sea_orm::{ColumnTrait, QueryFilter};

        // Early return if no discount_ids provided
        if discount_ids.is_empty() {
            // Just remove old relations
            Entity::delete_many()
                .filter(Column::GroupId.eq(&group_id))
                .exec(txn)
                .await?;
            return Ok(());
        }

        // Remove old relations
        Entity::delete_many()
            .filter(Column::GroupId.eq(&group_id))
            .exec(txn)
            .await?;
        // Bulk insert new relations
        let group_id_ref = &group_id;
        let models: Vec<DTGModel> = discount_ids
            .iter()
            .map(|discount_id| DTGModel {
                discount_id: ActiveValue::Set(discount_id.clone()),
                group_id: ActiveValue::Set(group_id_ref.clone()),
            })
            .collect();

        // Use bulk insert instead of individual inserts
        Entity::insert_many(models).exec(txn).await?;

        Ok(())
    }

    fn discount_not_found_error() -> crate::shared::error::Error {
        crate::shared::error::Error::DBDataNotFound("discount_not_found".to_string())
    }
}
