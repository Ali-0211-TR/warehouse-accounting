use crate::Result;
use crate::domain::entities::tax_entity::TaxEntity;
use crate::domain::repositories::TaxRepository;
use crate::infrastructure::database::model_store::DataStore;
use crate::shared::error::Error;
use crate::shared::types::OrderType;
use chrono::Utc;
use entity::tax_to_product as DiscoutnToProduct;
use entity::taxes::{ActiveModel, Column, Entity, Model};
use sea_orm::{ActiveModelTrait, ActiveValue, EntityTrait, QueryFilter};
use sea_orm::{ColumnTrait, DatabaseTransaction};
use std::str::FromStr;
use std::sync::Arc;
use uuid::Uuid;

pub async fn into_entity(_db: Arc<DataStore>, model: Model) -> Result<TaxEntity> {
    let res = TaxEntity {
        id: Some(model.id),
        device_id: model.device_id,
        name: model.name,
        short_name: model.short_name,
        rate: model.rate,
        is_inclusive: model.is_inclusive,
        d_begin: model.d_begin,
        order_type: OrderType::from_str(&model.order_type).unwrap_or_default(),
        created_at: model.created_at,
        updated_at: model.updated_at,
        deleted_at: model.deleted_at,
        version: model.version,
    };
    Ok(res)
}

impl TaxRepository {
    /// Batch: получить налоги для списка продуктов
    pub async fn products_taxes_batch(
        db: Arc<DataStore>,
        product_ids: &[String],
    ) -> Result<std::collections::HashMap<String, Vec<TaxEntity>>> {
        use std::collections::HashMap;
        let db_raw = db.get_db()?;
        let data = DiscoutnToProduct::Entity::find()
            .filter(DiscoutnToProduct::Column::ProductId.is_in(product_ids.to_vec()))
            .find_also_related(Entity)
            .all(db_raw)
            .await?;

        let mut taxes_map: HashMap<String, Vec<TaxEntity>> = HashMap::new();
        for (relation, tax) in data {
            if let Some(tax) = tax {
                let entity = into_entity(db.clone(), tax).await?;
                taxes_map
                    .entry(relation.product_id)
                    .or_default()
                    .push(entity);
            }
        }
        Ok(taxes_map)
    }

    /// Get all non-deleted taxes (for normal operations)
    pub async fn get(db: Arc<DataStore>) -> Result<Vec<TaxEntity>> {
        let db_raw = db.get_db()?;
        let taxs_list = Entity::find().filter(Column::DeletedAt.is_null());
        let data = taxs_list.all(db_raw).await?;
        let mut result = Vec::<TaxEntity>::new();
        for tax in data {
            let e = into_entity(db.clone(), tax).await?;
            result.push(e);
        }
        Ok(result)
    }

    /// Get all taxes including deleted ones (for admin/sync)
    pub async fn get_all(db: Arc<DataStore>) -> Result<Vec<TaxEntity>> {
        let db_raw = db.get_db()?;
        let taxs_list = Entity::find();
        let data = taxs_list.all(db_raw).await?;
        let mut result = Vec::<TaxEntity>::new();
        for tax in data {
            let e = into_entity(db.clone(), tax).await?;
            result.push(e);
        }
        println!("Found {} taxes (including deleted)", result.len());
        Ok(result)
    }
    pub async fn products_taxes(
        db: Arc<DataStore>,
        product_ids: &Vec<String>,
    ) -> Result<Vec<TaxEntity>> {
        let db_raw = db.get_db()?;
        let data = Entity::find()
            .filter(DiscoutnToProduct::Column::ProductId.is_in(product_ids))
            // .find_also_related(Entity)
            // .find_also_related(Entity)
            .all(db_raw)
            .await?;
        let mut result = Vec::<TaxEntity>::new();
        for tax in data {
            // if let Some(tax) = tax {
            // }
            let e = into_entity(db.clone(), tax).await?;
            result.push(e);
        }
        Ok(result)
    }
    pub async fn product_taxes(db: Arc<DataStore>, product_id: String) -> Result<Vec<TaxEntity>> {
        let db_raw = db.get_db()?;
        let data = DiscoutnToProduct::Entity::find()
            .filter(DiscoutnToProduct::Column::ProductId.eq(product_id))
            .find_also_related(Entity)
            .all(db_raw)
            .await?;
        let mut result = Vec::<TaxEntity>::new();
        for (_, tax) in data {
            if let Some(tax) = tax {
                let e = into_entity(db.clone(), tax).await?;
                result.push(e);
            }
        }
        Ok(result)
    }

    pub async fn save(db: Arc<DataStore>, entity: TaxEntity) -> Result<TaxEntity> {
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
            rate: ActiveValue::Set(entity.rate),
            is_inclusive: ActiveValue::Set(entity.is_inclusive),
            d_begin: ActiveValue::Set(entity.d_begin),
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

    /// Soft delete - marks tax as deleted (for normal operations)
    pub async fn delete(db: Arc<DataStore>, tax_id: String) -> Result<u64> {
        let db_conn = db.get_db()?;
        let now = Utc::now().to_rfc3339();

        let existing = Entity::find()
            .filter(Column::Id.eq(&tax_id))
            .filter(Column::DeletedAt.is_null())
            .one(db_conn)
            .await?
            .ok_or(Self::tax_not_found_error())?;

        let active_model = ActiveModel {
            id: ActiveValue::Unchanged(existing.id),
            device_id: ActiveValue::Unchanged(existing.device_id),
            name: ActiveValue::Unchanged(existing.name),
            short_name: ActiveValue::Unchanged(existing.short_name),
            rate: ActiveValue::Unchanged(existing.rate),
            is_inclusive: ActiveValue::Unchanged(existing.is_inclusive),
            d_begin: ActiveValue::Unchanged(existing.d_begin),
            order_type: ActiveValue::Unchanged(existing.order_type),
            created_at: ActiveValue::Unchanged(existing.created_at),
            updated_at: ActiveValue::Set(now.clone()),
            deleted_at: ActiveValue::Set(Some(now)),
            version: ActiveValue::Set(existing.version + 1),
        };

        active_model.update(db_conn).await?;
        Ok(1)
    }

    /// Permanent delete - completely removes tax from database (for sync/cleanup)
    pub async fn delete_permanent(db: Arc<DataStore>, tax_id: String) -> Result<u64> {
        let db = db.get_db()?;
        let res = Entity::delete_many()
            .filter(Column::Id.eq(tax_id))
            .exec(db)
            .await?;
        Ok(res.rows_affected)
    }

    /// Restore a soft-deleted tax
    pub async fn restore(db: Arc<DataStore>, tax_id: String) -> Result<TaxEntity> {
        let db_conn = db.get_db()?;
        let now = Utc::now().to_rfc3339();

        let existing = Entity::find()
            .filter(Column::Id.eq(&tax_id))
            .one(db_conn)
            .await?
            .ok_or(Self::tax_not_found_error())?;

        let active_model = ActiveModel {
            id: ActiveValue::Unchanged(existing.id),
            device_id: ActiveValue::Unchanged(existing.device_id),
            name: ActiveValue::Unchanged(existing.name),
            short_name: ActiveValue::Unchanged(existing.short_name),
            rate: ActiveValue::Unchanged(existing.rate),
            is_inclusive: ActiveValue::Unchanged(existing.is_inclusive),
            d_begin: ActiveValue::Unchanged(existing.d_begin),
            order_type: ActiveValue::Unchanged(existing.order_type),
            created_at: ActiveValue::Unchanged(existing.created_at),
            updated_at: ActiveValue::Set(now),
            deleted_at: ActiveValue::Set(None),
            version: ActiveValue::Set(existing.version + 1),
        };

        let res = active_model.update(db_conn).await?;
        into_entity(db, res).await
    }

    // TaxRepository
    pub async fn set_product_taxes(
        txn: &DatabaseTransaction,
        product_id: String,
        tax_ids: &[String],
    ) -> Result<()> {
        use entity::tax_to_product::{ActiveModel as TTPModel, Column, Entity};
        use entity::taxes as tax;
        use sea_orm::{ColumnTrait, QueryFilter};

        // Early return if no tax_ids provided
        if tax_ids.is_empty() {
            // Just remove old relations
            Entity::delete_many()
                .filter(Column::ProductId.eq(&product_id))
                .exec(txn)
                .await?;
            return Ok(());
        }

        // Validate that all tax IDs exist and are not deleted
        let existing_taxes = tax::Entity::find()
            .filter(tax::Column::Id.is_in(tax_ids.to_vec()))
            .filter(tax::Column::DeletedAt.is_null())
            .all(txn)
            .await?;

        if existing_taxes.len() != tax_ids.len() {
            let existing_ids: Vec<String> = existing_taxes.iter().map(|t| t.id.clone()).collect();
            let missing_ids: Vec<String> = tax_ids
                .iter()
                .filter(|id| !existing_ids.contains(id))
                .cloned()
                .collect();
            return Err(crate::shared::error::Error::Database(format!(
                "Tax(es) not found or deleted: {:?}",
                missing_ids
            )));
        }

        // Remove old relations
        Entity::delete_many()
            .filter(Column::ProductId.eq(&product_id))
            .exec(txn)
            .await?;

        // Bulk insert new relations
        let models: Vec<TTPModel> = tax_ids
            .iter()
            .map(|tax_id| TTPModel {
                tax_id: ActiveValue::Set(tax_id.clone()),
                product_id: ActiveValue::Set(product_id.clone()),
            })
            .collect();

        Entity::insert_many(models).exec(txn).await?;
        Ok(())
    }

    fn tax_not_found_error() -> Error {
        Error::DBDataNotFound("tax_not_found".to_string())
    }
}
