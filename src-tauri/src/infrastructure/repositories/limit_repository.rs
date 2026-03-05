use crate::Result;
use crate::adapters::dtos::LimitDTO;
use crate::domain::entities::limit_entity::LimitEntity;
use crate::domain::repositories::LimitRepository;
use crate::infrastructure::database::model_store::DataStore;
use crate::shared::error::Error;
use crate::shared::types::LimitType;
use chrono::Utc;
use entity::limits::{ActiveModel, Column, Entity, Model};
use sea_orm::{ActiveModelTrait, ActiveValue, ColumnTrait, EntityTrait, QueryFilter, TryIntoModel};
use std::str::FromStr;
use std::sync::Arc;

impl From<Model> for LimitEntity {
    fn from(model: Model) -> Self {
        LimitEntity {
            id: Some(model.id),
            card: None,
            limit_type: LimitType::from_str(&model.limit_type).unwrap_or_default(),
            product: None,
            d_begin: model.d_begin,
            d_end: model.d_end,
            include_holidays: model.include_holidays,
            limit_value: model.limit_value,
            discount: None,
            comment: model.comment,
        }
    }
}

impl From<LimitDTO> for ActiveModel {
    fn from(dto: LimitDTO) -> Self {
        ActiveModel {
            id: dto.id.map_or(ActiveValue::NotSet, ActiveValue::Set),
            device_id: ActiveValue::Set(dto.device_id),
            card_id: ActiveValue::Set(dto.card_id),
            limit_type: ActiveValue::Set(dto.limit_type.to_string()),
            product_id: ActiveValue::Set(dto.product_id),
            d_begin: ActiveValue::Set(dto.d_begin),
            d_end: ActiveValue::Set(dto.d_end),
            include_holidays: ActiveValue::Set(dto.include_holidays),
            limit_value: ActiveValue::Set(dto.limit_value),
            discount_id: ActiveValue::Set(dto.discount_id),
            comment: ActiveValue::Set(dto.comment),
            created_at: ActiveValue::Set(Utc::now().to_rfc3339()),
            updated_at: ActiveValue::Set(Utc::now().to_rfc3339()),
            deleted_at: ActiveValue::NotSet,
            version: ActiveValue::Set(1),
        }
    }
}

impl LimitRepository {
    /// Get all limits for a specific card
    ///
    /// # Arguments
    /// * `db` - Database connection
    /// * `card_id` - The card ID to fetch limits for
    pub async fn get_by_card_id(db: Arc<DataStore>, card_id: String) -> Result<Vec<LimitEntity>> {
        let db_conn = db.get_db()?;
        let limits = Entity::find()
            .filter(Column::CardId.eq(card_id))
            .all(db_conn)
            .await?;
        Ok(limits.into_iter().map(LimitEntity::from).collect())
    }

    /// Get a single limit by ID
    pub async fn get_by_id(db: Arc<DataStore>, id: String) -> Result<LimitEntity> {
        let db_conn = db.get_db()?;
        let limit = Entity::find()
            .filter(Column::Id.eq(id))
            .one(db_conn)
            .await?
            .ok_or(Self::limit_not_found_error())?;
        Ok(limit.into())
    }

    /// Save (insert or update) a limit
    ///
    /// # Validation
    /// Validates that limit dates are within card's validity period
    pub async fn save(db: Arc<DataStore>, data: LimitDTO) -> Result<LimitEntity> {
        let db_conn = db.get_db()?;
        let active_model: ActiveModel = data.into();
        let saved_model = active_model.save(db_conn).await.map_err(|e| {
            // Check if it's a constraint violation
            if e.to_string().contains("chk_limits_within_card_dates") {
                Error::Database("Limit dates must be within card's validity period".to_string())
            } else {
                Error::from(e)
            }
        })?;
        let limit_model = saved_model.try_into_model()?;
        Ok(limit_model.into())
    }

    /// Delete a limit by ID
    ///
    /// # Returns
    /// Number of rows affected (should be 1 if successful, 0 if not found)
    pub async fn delete(db: Arc<DataStore>, limit_id: String) -> Result<u64> {
        let db_conn = db.get_db()?;
        let delete_result = Entity::delete_many()
            .filter(Column::Id.eq(limit_id))
            .exec(db_conn)
            .await?;
        Ok(delete_result.rows_affected)
    }

    fn limit_not_found_error() -> Error {
        Error::DBDataNotFound("limit_not_found".to_string())
    }
}
