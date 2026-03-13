use crate::domain::repositories::PaymentRepository;
use crate::infrastructure::database::model_store::DataStore;
// use crate::shared::error::Error;
use crate::Result;
use crate::{domain::entities::payment_entity::PaymentEntity, shared::types::PaymentType};
use entity::payments::{ActiveModel, Column, Entity, Model};
use sea_orm::{ActiveModelTrait, ActiveValue, ColumnTrait, EntityTrait, QueryFilter};
use std::collections::HashMap;
use std::str::FromStr;
use std::sync::Arc;
use uuid;

impl From<Model> for PaymentEntity {
    fn from(model: Model) -> Self {
        PaymentEntity {
            id: Some(model.id),
            order: None,
            payment_type: PaymentType::from_str(&model.payment_type).unwrap_or_default(),
            summ: model.summ,
            delivery: model.delivery,
            transaction: model.transaction,
            ticket: model.ticket,
            discard: model.discard,
            data: model.data,
            created_at: model.created_at,
            updated_at: model.updated_at,
            deleted_at: model.deleted_at,
            version: model.version,
        }
    }
}

impl From<PaymentEntity> for ActiveModel {
    fn from(entity: PaymentEntity) -> Self {
        ActiveModel {
            id: if entity.id.is_none() {
                // For new records, generate UUID and set it
                ActiveValue::Set(uuid::Uuid::new_v4().to_string())
            } else {
                // For existing records, use the provided ID
                ActiveValue::Set(entity.id.unwrap())
            },
            order_id: ActiveValue::Set(entity.order.and_then(|o| o.id).unwrap_or_default()),
            payment_type: ActiveValue::Set(entity.payment_type.to_string()),
            summ: ActiveValue::Set(entity.summ),
            delivery: ActiveValue::Set(entity.delivery),
            transaction: ActiveValue::Set(entity.transaction),
            ticket: ActiveValue::Set(entity.ticket),
            discard: ActiveValue::Set(entity.discard),
            data: ActiveValue::Set(entity.data),
            card_id: ActiveValue::Set(None),
            created_at: ActiveValue::Set(entity.created_at),
            updated_at: ActiveValue::Set(entity.updated_at),
            deleted_at: ActiveValue::Set(entity.deleted_at),
            version: ActiveValue::Set(entity.version),
        }
    }
}

impl PaymentRepository {
    // pub async fn get(db: Arc<DataStore>) -> Result<Vec<PaymentEntity>> {
    //     let db = db.get_db()?;
    //     let payments_list = Entity::find().all(db).await?;
    //     let payments_entities = payments_list.into_iter().map(PaymentEntity::from).collect();
    //     Ok(payments_entities)
    // }

    // pub async fn get_by_id(db: Arc<DataStore>, id: String) -> Result<PaymentEntity> {
    //     let db = db.get_db()?;
    //     let data = Entity::find().filter(Column::Id.eq(id)).one(db).await?;
    //     let data = data.ok_or(Error::DBDataNotFound(None))?;
    //     Ok(data.into())
    // }

    pub async fn get_order_payments(
        db: Arc<DataStore>,
        order_id: String,
    ) -> Result<Vec<PaymentEntity>> {
        let db = db.get_db()?;
        let payments_list = Entity::find()
            .filter(Column::OrderId.eq(order_id))
            .all(db)
            .await?;
        let payments_entities = payments_list.into_iter().map(PaymentEntity::from).collect();
        Ok(payments_entities)
    }

    /// Batch: получить payments для списка order_ids за один SQL запрос.
    /// Возвращает HashMap<order_id, Vec<PaymentEntity>>.
    pub async fn get_orders_payments_batch(
        db: Arc<DataStore>,
        order_ids: &[String],
    ) -> Result<HashMap<String, Vec<PaymentEntity>>> {
        if order_ids.is_empty() {
            return Ok(HashMap::new());
        }
        let db_conn = db.get_db()?;
        let payments_list = Entity::find()
            .filter(Column::OrderId.is_in(order_ids.to_vec()))
            .all(db_conn)
            .await?;

        let mut result = HashMap::<String, Vec<PaymentEntity>>::new();
        for p in payments_list {
            let order_id = p.order_id.clone();
            let entity: PaymentEntity = p.into();
            result.entry(order_id).or_default().push(entity);
        }
        Ok(result)
    }

    pub async fn save(db: Arc<DataStore>, data: PaymentEntity) -> Result<PaymentEntity> {
        let db_conn = db.get_db()?;
        let is_new = data.id.is_none();
        let active_model: ActiveModel = data.into();

        let res = if is_new {
            active_model.insert(db_conn).await?
        } else {
            active_model.update(db_conn).await?
        };

        Ok(res.into())
    }

    pub async fn delete(db: Arc<DataStore>, payment_id: String) -> Result<u64> {
        let db = db.get_db()?;
        let res = Entity::delete_many()
            .filter(Column::Id.eq(payment_id))
            .exec(db)
            .await?;
        Ok(res.rows_affected)
    }
}
