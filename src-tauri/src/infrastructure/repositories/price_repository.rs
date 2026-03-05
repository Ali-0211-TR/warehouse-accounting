use crate::Result;
use crate::domain::entities::price_entity::PriceEntity;
use crate::domain::repositories::PriceRepository;
use crate::infrastructure::database::model_store::DataStore;
use crate::shared::types::PriceType;
use chrono::Utc;
use entity::prices::{ActiveModel, Column, Entity, Model};
use sea_orm::{ActiveModelTrait, ActiveValue, EntityTrait, QueryFilter};
use sea_orm::{ColumnTrait, QueryOrder};
use std::collections::HashMap;
use std::str::FromStr;
use std::sync::Arc;
use uuid::Uuid;

impl From<Model> for PriceEntity {
    fn from(model: Model) -> Self {
        PriceEntity {
            id: Some(model.id),
            device_id: model.device_id,
            product_id: model.product_id,
            start_time: model.start_time,
            value: model.value,
            price_type: PriceType::from_str(&model.price_type).unwrap_or_default(),
            created_at: model.created_at,
            updated_at: model.updated_at,
            deleted_at: model.deleted_at,
            version: model.version,
        }
    }
}

impl PriceRepository {
    /// Batch: получить цены для списка продуктов
    pub async fn products_prices_batch(
        db: Arc<DataStore>,
        product_ids: &[String],
    ) -> Result<HashMap<String, Vec<PriceEntity>>> {
        let db_raw = db.get_db()?;
        let prices_list = Entity::find()
            .filter(Column::ProductId.is_in(product_ids.to_vec()))
            .order_by(Column::StartTime, sea_orm::Order::Desc)
            .all(db_raw)
            .await?;

        let mut prices_map: HashMap<String, Vec<PriceEntity>> = HashMap::new();
        for model in prices_list {
            let entity = PriceEntity::from(model);
            prices_map
                .entry(entity.product_id.clone())
                .or_default()
                .push(entity);
        }

        Ok(prices_map)
    }

    pub async fn product_prices(
        db: Arc<DataStore>,
        product_id: String,
    ) -> Result<Vec<PriceEntity>> {
        let db = db.get_db()?;
        let prices_list = Entity::find()
            .filter(Column::ProductId.eq(product_id))
            .order_by(Column::StartTime, sea_orm::Order::Desc)
            .all(db)
            .await?;
        let prices_entities = prices_list.into_iter().map(PriceEntity::from).collect();
        Ok(prices_entities)
    }

    pub async fn save(db: Arc<DataStore>, entity: PriceEntity) -> Result<PriceEntity> {
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
            product_id: ActiveValue::Set(entity.product_id),
            start_time: ActiveValue::Set(entity.start_time),
            value: ActiveValue::Set(entity.value),
            price_type: ActiveValue::Set(entity.price_type.to_string()),
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

    pub async fn delete(db: Arc<DataStore>, price_id: String) -> Result<u64> {
        let db = db.get_db()?;
        let res = Entity::delete_many()
            .filter(Column::Id.eq(price_id))
            .exec(db)
            .await?;
        Ok(res.rows_affected)
    }
}
